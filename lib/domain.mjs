export const categories = ['Todas', 'Segurança', 'Áreas comuns', 'Manutenção', 'Convivência'];
export const statuses = { open: 'Em discussão', assembly: 'Na assembleia', done: 'Concluída', archived: 'Arquivada' };
export function visibleProposals(items, { filter = 'popular', category = 'Todas', query = '', admin = false } = {}) {
  const normalize = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return items.filter(p => (admin || p.status !== 'archived') && (filter !== 'assembly' || p.status === 'assembly') && (filter !== 'mine' || p.mine) && (category === 'Todas' || p.category === category) && normalize(p.title + ' ' + p.description).includes(normalize(query.trim())))
    .sort((a, b) => filter === 'recent' ? b.createdAt.localeCompare(a.createdAt) : b.rank - a.rank || b.createdAt.localeCompare(a.createdAt));
}
export function validateProposal(title, description) {
  if (title.trim().length < 4) return 'Escreva um título com pelo menos 4 caracteres.';
  if (title.trim().length > 30) return 'Use até 30 caracteres no título.';
  if (description.trim().length < 10) return 'Conte um pouco mais: use pelo menos 10 caracteres.';
  if (description.trim().length > 1500) return 'Use até 1.500 caracteres na descrição.';
  return null;
}
export function applyVote(p, direction) {
  const previous = p.myVote || 0;
  const next = previous === direction ? 0 : direction;
  const count = p.count - (previous === 1 ? 1 : 0) + (next === 1 ? 1 : 0);
  const down = (p.down || 0) - (previous === -1 ? 1 : 0) + (next === -1 ? 1 : 0);
  return { ...p, count, down, myVote:next, rank:count-down, supported:next === 1 };
}

export function isNewProposal(createdAt, now) {
  const age = now - Date.parse(createdAt);
  return Number.isFinite(age) && age >= 0 && age < 60 * 60 * 1000;
}

export function validateResident(name, apartment, block) {
 if (name.trim().length < 2 || name.trim().length > 60) return 'Informe o nome do morador (2 a 60 caracteres).';
 if (!apartment.trim() || apartment.trim().length > 20) return 'Informe o apartamento (até 20 caracteres).';
 if (!block.trim() || block.trim().length > 20) return 'Informe o bloco (até 20 caracteres).';
 return null;
}
