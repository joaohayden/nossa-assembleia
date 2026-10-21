# Verificação do MVP

Verificado em 21/10/2026.

## Checks executados

- Compilação de produção Next.js e verificação TypeScript concluídas.
- Cinco testes de domínio aprovados: exclusão de arquivadas para moradores, reordenação por votos, filtros combinados, busca sem acentos e rejeição de entradas inválidas.
- SQL executado em PostgreSQL embarcado (PGlite), com schema `auth` e papéis simulados. Verificados: criação automática de perfil, publicação por morador aprovado, bloqueio de elevação de privilégio, atualização de situação restrita à administração, adicionar/retirar apoio, bloqueio de morador pendente, aprovação por administrador, bloqueio de apoio em pauta encerrada, visibilidade de arquivadas e bloqueio de acesso anônimo.
- Navegador: apoio registrado e mantido após recarga; publicação de uma sugestão; mudança para “Na assembleia” com atualização da administração.
- Inspeção visual em leiautes de 390 px (celular), 548 px e 1366 px (desktop). Os leiautes de 390/1366 foram inspecionados em iframe com largura fixa; não equivalem a teste em aparelhos físicos.

## Limites

O ambiente atual está em demonstração local. Supabase hospedado, PostgREST, envio/recebimento de e-mails, confirmação de cadastro, recuperação de senha entre dispositivos e publicação Vercel ainda dependem da configuração das contas externas. Os testes PostgreSQL simulados não substituem o teste final nesses serviços. Não foi realizada auditoria completa WCAG nem teste em Safari/iPhone/Android físicos.

## Checklist após conectar Supabase

1. Criar e confirmar duas contas de teste: administrador e morador.
2. Verificar que o morador pendente não lê nem publica pautas.
3. Aprovar o morador pela conta administradora.
4. Publicar uma pauta e confirmar a visualização na outra conta/dispositivo.
5. Apoiar, recarregar e retirar apoio; conferir a contagem nas duas contas.
6. Marcar pauta como concluída e confirmar o bloqueio de novos apoios.
7. Arquivar e confirmar que só a administração vê a pauta.
8. Sair, entrar novamente e recuperar a senha pelo e-mail no domínio de produção.
9. Testar o link no navegador do WhatsApp e no navegador principal do celular.

Não há sincronização instantânea por WebSocket nesta versão. Outros usuários veem mudanças ao recarregar a página; operações da própria conta atualizam a tela imediatamente após confirmação do banco.

Revisão: interface simplificada em duas colunas, positivo/negativo com troca e remoção. Compilação, cinco testes de domínio e testes PostgreSQL passaram. Troca positivo → negativo → positivo confirmada no navegador.
