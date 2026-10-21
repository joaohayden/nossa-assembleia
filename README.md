# Nossa Assembleia

Mural de pautas para um condomínio, feito primeiro para celular. Next.js + TypeScript + CSS + Supabase. Hospedagem preparada para Vercel.

## Rodar agora

Requer Node.js 22 ou superior.

```bash
npm ci
npm run dev
```

Abra http://localhost:3000. Sem variáveis de Supabase, abre uma **demonstração local**, com conteúdo fictício e alterações salvas somente no navegador. Não é um banco compartilhado. O botão “Testar administração” só existe nesse modo.

## Funcionalidades

- Criar pautas com título, descrição e categoria.
- Votar a favor ou contra, trocar e retirar o voto. Pautas concluídas/arquivadas não recebem novos apoios.
- Buscar sem depender de acentos, filtrar por categoria e ver mais apoiadas, recentes, pautas da assembleia ou próprias ideias.
- O ranking atualiza imediatamente pelo saldo de votos: positivos menos negativos. Empates usam a data mais recente.
- Abrir detalhes, ver atualizações da administração.
- Administração: aprovar moradores, alterar situação, registrar encaminhamento, arquivar duplicadas e restaurar pelo seletor de situação. Pautas arquivadas só aparecem para administradores.
- Modo conectado: cadastro por e-mail/senha, confirmação de e-mail, aprovação, entrada, saída e recuperação de senha.
- Diálogos com foco contido, navegação por teclado, feedback de carregamento/erro, suporte a movimento reduzido e leiaute responsivo.

## Ativar o banco compartilhado

1. Crie um projeto Supabase e execute **uma única vez**, em banco novo, `supabase/schema.sql` no SQL Editor. O script cria tabelas, índices, trigger, permissões e funções.
2. Copie `.env.example` para `.env.local` e preencha:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON_OU_PUBLISHABLE
NEXT_PUBLIC_CONDO_NAME=Nome do seu condomínio
```

Use somente a chave pública/anon; nunca coloque `service_role` no frontend.

3. Em Authentication, mantenha a confirmação de e-mail ativada. Configure Site URL e Redirect URLs com o domínio da aplicação e `http://localhost:3000` durante desenvolvimento. Configure SMTP para entregar confirmação e recuperação aos moradores, usando os limites do provedor escolhido.
4. Reinicie o servidor. Cadastre e confirme o e-mail do administrador pela própria aplicação.
5. No SQL Editor, promova **somente a conta responsável**, substituindo o endereço:

```sql
update public.profiles
set role = 'admin', approved = true
where id = (select id from auth.users where email = 'seu-email@exemplo.com');
```

6. Entre novamente. O botão de administração no cabeçalho mostra os cadastros pendentes. Os dados do cadastro devem ser conferidos com o condomínio antes da aprovação.

Cada conta aprovada recebe um voto (positivo ou negativo) por pauta, garantido pela chave composta no banco. Isso não confirma sozinho a identidade de uma pessoa: a administração precisa evitar contas duplicadas ao aprovar moradores. A aprovação e o papel de administrador não são editáveis pelo cliente. RLS protege leitura e escrita; somente as funções autorizadas alteram apoios e aprovações.

## Publicar na Vercel

1. Envie **o conteúdo desta pasta** para um repositório Git seu.
2. Importe o repositório na Vercel. Framework: Next.js. Se enviar a pasta dentro de outro repositório, escolha esta pasta como Root Directory.
3. Cadastre as três variáveis de ambiente acima na Vercel antes da compilação. Sem as duas variáveis de Supabase, a publicação continuará em modo demonstração.
4. Publique; inclua o domínio final nas URLs permitidas do Supabase.
5. Teste cadastro, confirmação, aprovação, apoio e recuperação de senha com duas contas de teste antes de compartilhar com todos.

Nenhuma conta externa foi criada nem publicação foi feita automaticamente. A configuração de Supabase/Vercel depende das contas do responsável.

## Verificar

```bash
npm test
npm run typecheck
npm run test:db
npm run build
```

`tests/domain.test.mjs` cobre busca, ranking por saldo, filtros compostos, arquivamento e validação de conteúdo. `npm run test:db` executa o SQL em PostgreSQL embarcado (PGlite) com usuários e papéis simulados, verificando RLS, aprovações e apoios. O arquivo `VERIFICACAO.md` registra as verificações realizadas e os limites.

## Organização

- `app/page.tsx`: telas e interações do MVP.
- `app/globals.css`: identidade visual, estados e responsividade.
- `lib/domain.mjs`: filtros, ordenação e validação compartilhada.
- `lib/supabase.ts`: cliente público do Supabase.
- `lib/demo.ts`: conteúdo de demonstração.
- `supabase/schema.sql`: banco, RLS e funções transacionais.

A versão inicial atende um condomínio por instalação. Os apoios priorizam assuntos e não substituem deliberações da assembleia. Comentários, anexos, notificações, múltiplos condomínios e edição de sugestões já publicadas ficaram fora deste MVP. Para moderar conteúdo, arquive a pauta.

## Atualização de votação

Se você já executou o schema antigo, execute `supabase/votes-migration.sql` para habilitar votos positivos e negativos. Instalações novas só precisam do `schema.sql`, que já inclui a atualização. Os apoios anteriores são preservados como votos positivos.

Pautas recém-criadas exibem o selo “Pauta nova” durante uma hora, com expiração automática mesmo com a página aberta. A faixa explicativa compacta mantém o mascote acima dos cards.

## Identificação obrigatória nas pautas

Toda nova publicação exige nome do morador, apartamento e bloco, com validação no formulário e no banco. A identificação aparece nos detalhes da pauta. Para bancos já existentes, execute uma vez `supabase/resident-details-migration.sql`. Instalações novas já recebem isso no `schema.sql`. Pautas antigas continuam disponíveis e editáveis pela administração.
