'use client';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ThumbsUp, ThumbsDown, Building2, CheckCircle2, CircleHelp, Lightbulb, LoaderCircle, Plus, Search, Sparkles, X, Heart, Users } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, increment, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { demoProposals } from '@/lib/demo';
import { categories, statuses, visibleProposals, isNewProposal } from '@/lib/domain.mjs';
import type { Proposal } from '@/lib/types';

const condoName = process.env.NEXT_PUBLIC_CONDO_NAME || 'Residencial Boa Vizinhança';

function Mascot({ small = false }: { small?: boolean }) {
  return (
    <svg aria-hidden="true" className={small ? 'mascot small' : 'mascot'} viewBox="0 0 180 180">
      <ellipse cx="92" cy="164" rx="61" ry="9" fill="#cee7b0"/>
      <path d="M46 150V41Q46 31 56 31H116Q126 31 126 41V150" fill="#83c144" stroke="#46792c" strokeWidth="3"/>
      <path d="M126 66h19q7 0 7 7v77h-26" fill="#b9dc76" stroke="#46792c" strokeWidth="3"/>
      <path d="M59 31v-9h54v9" fill="#b9dc76" stroke="#46792c" strokeWidth="3"/>
      <rect x="61" y="47" width="18" height="24" rx="5" fill="#f7ffe9"/>
      <rect x="94" y="47" width="18" height="24" rx="5" fill="#f7ffe9"/>
      <path d="M65 91v6m43-6v6" stroke="#284b26" strokeWidth="6" strokeLinecap="round"/>
      <path d="M78 108q9 12 18 0" fill="none" stroke="#284b26" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="60" cy="107" rx="7" ry="4" fill="#e7b484"/>
      <ellipse cx="115" cy="107" rx="7" ry="4" fill="#e7b484"/>
      <path d="M77 150v-20q0-7 7-7h10q7 0 7 7v20" fill="#477b2e"/>
      <path d="M46 111q-22 0-22-21m128 23q17-5 18-24" fill="none" stroke="#46792c" strokeWidth="5" strokeLinecap="round"/>
      <path d="M61 151v10m52-10v10" stroke="#46792c" strokeWidth="6" strokeLinecap="round"/>
      <path d="m19 60 3-8 3 8 8 3-8 3-3 8-3-8-8-3z" fill="#f2b94b"/>
      <path d="m151 29 2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="#f2b94b"/>
    </svg>
  );
}

function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      d?.close();
      document.body.style.overflow = '';
    };
  }, []);
  return (
    <dialog ref={ref} className={`dialog ${wide ? 'wide' : ''}`} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === ref.current) close(); }} aria-labelledby="dialog-title">
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={close}><X size={22}/></button>
      </div>
      {children}
    </dialog>
  );
}

export default function Home() {
  const [now, setNow] = useState(0);
  const [items, setItems] = useState<Proposal[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('popular');
  const [category, setCategory] = useState('Todas');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'new' | 'about' | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Áreas comuns');

  const notify = (message: string) => setToast(message);
  const close = () => { if (!busy) { setModal(null); setSelected(null); setError(''); setFieldErrors({}); } };
  const open = (value: typeof modal) => { setError(''); setFieldErrors({}); setModal(value); };

  useEffect(() => {
    let voterId = localStorage.getItem('nossa-voter-id');
    if (!voterId) {
      voterId = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('nossa-voter-id', voterId);
    }
    setUserId(voterId);

    const getLocalVotes = (): Record<string, number> => {
      try {
        const v = localStorage.getItem('nossa-user-votes');
        return v ? JSON.parse(v) : {};
      } catch { return {}; }
    };

    const q = firestoreQuery(collection(db, 'proposals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const localVotes = getLocalVotes();
      if (snapshot.empty) {
        demoProposals.forEach(p => {
          setDoc(doc(db, 'proposals', p.id), {
            title: p.title,
            description: p.description,
            category: p.category,
            status: p.status,
            author: p.author,
            createdAt: p.createdAt,
            count: p.count,
            down: p.down || 0,
            note: p.note || ''
          }, { merge: true });
        });
      }
      const loaded: Proposal[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        const count = d.count || 0;
        const down = d.down || 0;
        const myVote = localVotes[docSnap.id] || 0;
        return {
          id: docSnap.id,
          title: d.title || '',
          description: d.description || '',
          category: d.category || 'Áreas comuns',
          status: d.status || 'open',
          author: d.author || 'Morador',
          apartment: d.apartment,
          block: d.block,
          createdAt: d.createdAt || new Date().toISOString(),
          count,
          down,
          myVote,
          rank: count - down,
          supported: myVote === 1,
          mine: d.authorId === voterId,
          note: d.note || ''
        };
      });
      setItems(loaded);
      setLoading(false);
    }, (err) => {
      console.error('Firestore listener error:', err);
      setLoadError('Não foi possível conectar ao mural em tempo real. Verifique a conexão.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      const boundaries = items.flatMap(p => {
        const created = Date.parse(p.createdAt);
        return [created, created + 60 * 60 * 1000];
      }).filter(t => Number.isFinite(t) && t > current);
      if (boundaries.length) timer = setTimeout(tick, Math.min(Math.min(...boundaries) - current, 2147483647));
    };
    tick();
    window.addEventListener('focus', tick);
    return () => { clearTimeout(timer); window.removeEventListener('focus', tick); };
  }, [items]);

  const changeFilter = (f: string) => {
    setFilter(f);
  };

  async function vote(p: Proposal, direction: 1 | -1) {
    if (voting.includes(p.id) || p.status === 'done' || p.status === 'archived') return;
    setVoting(v => [...v, p.id]);
    try {
      const prevVote = p.myVote || 0;
      const nextVote = prevVote === direction ? 0 : direction;
      const countDiff = (nextVote === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0);
      const downDiff = (nextVote === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0);

      const localVotesStr = localStorage.getItem('nossa-user-votes');
      const localVotes = localVotesStr ? JSON.parse(localVotesStr) : {};
      if (nextVote === 0) delete localVotes[p.id];
      else localVotes[p.id] = nextVote;
      localStorage.setItem('nossa-user-votes', JSON.stringify(localVotes));

      const proposalRef = doc(db, 'proposals', p.id);
      await updateDoc(proposalRef, {
        count: increment(countDiff),
        down: increment(downDiff)
      });
    } catch (e) {
      console.error(e);
      notify('Não conseguimos registrar seu voto. Tente novamente.');
    } finally {
      setVoting(v => v.filter(id => id !== p.id));
    }
  }

  function voteButtons(p: Proposal) {
    return (
      <div className="vote-buttons">
        {([1, -1] as const).map(direction => (
          <button
            key={direction}
            className={`vote-button ${direction === 1 ? 'positive' : 'negative'} ${p.myVote === direction ? 'chosen' : ''}`}
            aria-label={`${direction === 1 ? 'Votar a favor de' : 'Votar contra'} ${p.title}`}
            aria-pressed={p.myVote === direction}
            disabled={voting.includes(p.id) || p.status === 'done' || p.status === 'archived'}
            onClick={() => vote(p, direction)}
          >
            {direction === 1 ? <ThumbsUp size={20}/> : <ThumbsDown size={20}/>}
            <strong>{direction === 1 ? p.count : p.down}</strong>
          </button>
        ))}
      </div>
    );
  }

  async function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const residentName = String(fields.get('residentName') || '').trim();
    const apartment = String(fields.get('apartment') || '').trim();
    const block = String(fields.get('block') || '').trim();

    const errs: Record<string, string> = {};
    if (!residentName) errs.residentName = 'Informe o seu nome.';
    else if (residentName.length < 2) errs.residentName = 'Nome muito curto (mínimo 2 letras).';
    if (!apartment) errs.apartment = 'Informe o apartamento.';
    if (!block) errs.block = 'Informe o bloco.';
    if (!title.trim()) errs.title = 'Escreva o título da pauta.';
    else if (title.trim().length < 4) errs.title = 'Título com pelo menos 4 caracteres.';
    else if (title.trim().length > 30) errs.title = 'Máximo de 30 caracteres.';
    if (!description.trim()) errs.description = 'Conte um pouco mais sobre sua ideia.';
    else if (description.trim().length < 10) errs.description = 'Descreva com pelo menos 10 caracteres.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setBusy(true);
    setError('');

    try {
      const newDocRef = doc(collection(db, 'proposals'));
      await setDoc(newDocRef, {
        title: title.trim(),
        description: description.trim(),
        category: newCategory,
        status: 'open',
        author: residentName,
        apartment,
        block,
        authorId: userId,
        createdAt: new Date().toISOString(),
        count: 0,
        down: 0,
        note: ''
      });
      setModal(null);
      setTitle('');
      setDescription('');
      setCategory('Todas');
      setQuery('');
      setFilter('popular');
      notify('Ideia publicada! Agora os vizinhos podem votar.');
    } catch (e) {
      console.error(e);
      setError('Não foi possível publicar. Sua ideia continua aqui. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const shown = visibleProposals(items, { filter, category, query, admin: false });
  const detail = items.find(p => p.id === selected);

  return (
    <>
      <a href="#pautas" className="skip-link">Pular para as pautas</a>
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Nossa Assembleia, início">
            <span className="brand-icon"><Building2 size={24} strokeWidth={2.5}/></span>
            <span className="brand-name">nossa<br/>assembleia</span>
          </a>
          <div className="condo">
            <span className="condo-divider"/>
            <Building2 size={15}/>
            <span>{condoName}</span>
          </div>
          <div className="header-actions">
            <button className="icon-button help-button" aria-label="Como funciona" onClick={() => open('about')}>
              <CircleHelp size={21}/>
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="content-grid">
          <section id="pautas" className="feed" aria-labelledby="feed-title">
            <div className="feed-heading">
              <div><h1 id="feed-title">O que é prioridade?</h1></div>
            </div>

            <section className="mini-explainer" aria-label="Como participar">
              <Mascot small/>
              <div>
                <h2>Sua ideia pode virar uma boa mudança.</h2>
                <p>Sugira uma pauta, vote nas ideias dos vizinhos e veja as mais votadas subirem.</p>
              </div>
            </section>

            <div className="compact-filters">
              <label>
                <span className="sr-only">Ordenar pautas</span>
                <select aria-label="Ordenar pautas" value={filter} onChange={e => changeFilter(e.target.value)}>
                  <option value="popular">Mais votadas</option>
                  <option value="recent">Recentes</option>
                  <option value="assembly">Na assembleia</option>
                  <option value="mine">Minhas pautas</option>
                </select>
              </label>
              <label className="compact-search">
                <Search size={17}/>
                <input aria-label="Buscar pautas" placeholder="Buscar" value={query} onChange={e => setQuery(e.target.value)}/>
              </label>
            </div>

            {loadError && (
              <div className="error-box" role="alert">
                {loadError}
                <button className="text-button" onClick={() => window.location.reload()}>Tentar novamente</button>
              </div>
            )}

            {loading ? (
              <div className="loading" role="status">
                <LoaderCircle className="spin"/> Carregando as ideias...
              </div>
            ) : shown.length === 0 ? (
              <div className="empty">
                <Lightbulb size={35}/>
                <h3>{query || category !== 'Todas' ? 'Nenhuma ideia encontrada' : filter === 'assembly' ? 'As próximas pautas aparecem aqui' : filter === 'mine' ? 'Qual vai ser sua primeira ideia?' : 'O mural começa com uma ideia'}</h3>
                <p>{query || category !== 'Todas' ? 'Tente outra palavra ou escolha todas as categorias.' : filter === 'assembly' ? 'A administração ainda não selecionou pautas para a assembleia.' : 'Compartilhe algo que pode melhorar o dia a dia por aqui.'}</p>
                <button className="button secondary" onClick={() => query || category !== 'Todas' ? (setQuery(''), setCategory('Todas')) : open('new')}>
                  {query || category !== 'Todas' ? 'Limpar filtros' : 'Sugerir uma pauta'}
                </button>
              </div>
            ) : (
              <div className="cards">
                {shown.map((p: Proposal, index: number) => (
                  <article className={`card ${p.myVote === 1 ? 'is-supported' : ''} ${isNewProposal(p.createdAt, now) ? 'is-new' : ''}`} key={p.id}>
                    <div className="card-top">
                      <span className="rank-label">{filter === 'popular' ? `${index + 1}º` : p.category}</span>
                      {isNewProposal(p.createdAt, now) && (
                        <span className="new-badge" title="Publicada há menos de uma hora" aria-label="Pauta nova">
                          <Sparkles size={13}/><span>NOVA</span>
                        </span>
                      )}
                      <span className="score" title="Votos positivos menos negativos">{p.rank > 0 ? '+' : ''}{p.rank}</span>
                    </div>
                    <button className="card-body" onClick={() => { setError(''); setSelected(p.id); }}>
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                    </button>
                    {p.status !== 'open' && <span className={`status status-${p.status}`}>{statuses[p.status]}</span>}
                    {voteButtons(p)}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="mobile-cta">
        <button className="button primary pulse-focus" onClick={() => open('new')}>
          <Plus size={24}/> Sugerir pauta
        </button>
      </div>

      <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">
        {toast && <><CheckCircle2 size={18}/>{toast}</>}
      </div>

      {modal === 'new' && (
        <Modal title="Qual é a sua ideia?" close={close}>
          <p className="dialog-intro">Uma sugestão simples pode melhorar o dia de muita gente.</p>
          <form onSubmit={publish} noValidate>
            <fieldset className="resident-fields">
              <legend>Quem está sugerindo?</legend>
              <p className="field-hint">Todos os campos são obrigatórios.</p>
              <label className="field">
                Nome do morador
                <input
                  name="residentName"
                  autoComplete="name"
                  maxLength={60}
                  placeholder="Seu nome"
                  className={fieldErrors.residentName ? 'has-error' : ''}
                  onChange={() => setFieldErrors(prev => ({ ...prev, residentName: '' }))}
                />
                {fieldErrors.residentName && <span className="field-error-text">{fieldErrors.residentName}</span>}
              </label>
              <div className="unit-fields">
                <label className="field">
                  Apartamento
                  <input
                    name="apartment"
                    maxLength={20}
                    placeholder="Ex.: 204"
                    className={fieldErrors.apartment ? 'has-error' : ''}
                    onChange={() => setFieldErrors(prev => ({ ...prev, apartment: '' }))}
                  />
                  {fieldErrors.apartment && <span className="field-error-text">{fieldErrors.apartment}</span>}
                </label>
                <label className="field">
                  Bloco
                  <input
                    name="block"
                    maxLength={20}
                    placeholder="Ex.: A"
                    className={fieldErrors.block ? 'has-error' : ''}
                    onChange={() => setFieldErrors(prev => ({ ...prev, block: '' }))}
                  />
                  {fieldErrors.block && <span className="field-error-text">{fieldErrors.block}</span>}
                </label>
              </div>
            </fieldset>

            <label className="field">
              Título da pauta
              <input
                autoFocus
                maxLength={30}
                placeholder="Ex.: Mais iluminação"
                value={title}
                className={fieldErrors.title ? 'has-error' : ''}
                onChange={e => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: '' }));
                }}
              />
              {fieldErrors.title && <span className="field-error-text">{fieldErrors.title}</span>}
              <span className="field-hint">Máximo de 30 caracteres. {title.length}/30</span>
            </label>

            <label className="field">
              Categoria
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                {categories.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>

            <label className="field">
              Conta um pouco mais
              <textarea
                maxLength={1500}
                rows={5}
                placeholder="O que você sugere e como isso ajuda os moradores?"
                value={description}
                className={fieldErrors.description ? 'has-error' : ''}
                onChange={e => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: '' }));
                }}
              />
              {fieldErrors.description && <span className="field-error-text">{fieldErrors.description}</span>}
              <span className="field-hint">Não inclua dados pessoais de outros moradores.</span>
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="button primary full" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={18}/> : <Plus size={18}/>}
              {busy ? 'Publicando...' : 'Publicar ideia'}
            </button>
            <p className="form-footnote">Sua ideia ficará visível para os moradores.</p>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title="Uma ideia para o condomínio" close={close}>
          <div className="detail-heading">
            <span className="category-tag">{detail.category}</span>
            <span className={`status status-${detail.status}`}>{statuses[detail.status]}</span>
          </div>
          <h3 className="detail-title">{detail.title}</h3>
          <p className="detail-author">
            Sugerida por {detail.author}{detail.apartment && detail.block ? ` · Apto ${detail.apartment} · Bloco ${detail.block}` : ''} · {new Date(detail.createdAt).toLocaleDateString('pt-BR')}
          </p>
          <p className="detail-description">{detail.description}</p>
          {voteButtons(detail)}
        </Modal>
      )}

      {modal === 'about' && (
        <Modal title="Como funciona" close={close}>
          <div className="about-mascot"><Mascot small/></div>
          <p className="dialog-intro">Este é o mural de ideias do seu condomínio. Um lugar para transformar sugestões em conversas que fazem diferença.</p>
          <div className="about-points">
            <p><Lightbulb size={20}/><span><strong>Sugira uma melhoria.</strong> Explique o que pode mudar e como isso ajuda a comunidade.</span></p>
            <p><Heart size={20}/><span><strong>Vote nas pautas.</strong> Use positivo ou negativo. Toque de novo para retirar o voto. O ranking usa positivos menos negativos.</span></p>
            <p><Users size={20}/><span><strong>Acompanhe os próximos passos.</strong> As mais votadas são levadas para a assembleia.</span></p>
          </div>
          <div className="admin-note">
            <p>Os votos mostram o interesse real dos moradores e ajudam a organizar a pauta da assembleia.</p>
          </div>
        </Modal>
      )}
    </>
  );
}
