# Fase 4.2 — CRM administrativo

Projeto oficial: GitHub `Erlanyapp/erlanyapp`, branch `main`; Supabase `wifnkpezifxoqfqvgjmj`. Não iniciar a Fase 4.3 automaticamente.

## Entrega

- Shell exclusivo do Admin, desktop-first, sidebar completa, contexto/breadcrumb e identidade real do administrador. O cliente mobile e seus assets não foram reconstruídos nesta fase.
- `/admin/clientes`: busca por nome/e-mail, status do cadastro, plano, período de cadastro; paginação no banco de 20 registros, ordenação estável e estados de carregamento, vazio, erro e cliente inexistente.
- `/admin/clientes/[id]`: foto privada real, identidade, plano e resumo dos registros reais. Visão geral e Perfil funcionais; Treinos, Alimentação, Evolução, Mídia e Histórico são seções preparadas, explicitamente sem gestão completa.
- Edição de nome com controle de concorrência por `profiles.updated_at`. E-mail é somente leitura, sincronizado pelo Auth. Foto de terceiros é somente leitura no Admin; o fluxo existente de upload pelo próprio cliente permanece disponível.
- Status ativo/inativo é apenas `clients.status`: não suspende Auth, não altera assinatura e não representa presença online.
- “Adicionar cliente” apresenta o link oficial de cadastro. O cadastro existente cria Auth/profile/client. Não há convite administrativo, criação privilegiada de contas nem service-role nesta fase.
- Campos telefone, nascimento, gênero e observações não existem no schema; não foram simulados. Métricas vazias permanecem honestas. Treino/plano alimentar são os registros individuais mais recentes, não uma atribuição com validade inventada.

## Banco e segurança

Migration versionada `20260916145818_admin_client_crm.sql`, aplicada no projeto oficial em 16/09/2026 após autorização explícita. Sem reset, exclusão de dados ou novo projeto/bucket.

- `profiles.email`: espelho de Auth, preenchimento dos registros existentes e triggers de INSERT/UPDATE de e-mail. Não participa de autorização.
- FK `clients.user_id → profiles.id`, reutilizando as identidades existentes; índices para paginação/filtros.
- ADMIN UPDATE de perfil autorizado por JWT **app_metadata** gerenciado. Server Actions verificam `auth.getUser()` e ADMIN antes de qualquer operação; `user_metadata` não concede privilégios.
- Guardas impedem CLIENT de alterar identidade, role, e-mail, plano e status administrativo. Nenhuma chave privilegiada é enviada ao browser.
- Storage privado `images`: ADMIN pode ler avatars de clientes, mas as policies restritivas de INSERT/UPDATE/DELETE continuam exigindo o proprietário. URLs assinadas são temporárias e nunca devem ser registradas em logs ou Git.
- UI → serviços → domínio/repositório → Supabase. Busca/paginação no banco; assinaturas de fotos em lote apenas para a página atual. Mutação busca somente a identidade/versão necessária, sem recarregar todo o histórico.

## Verificação reproduzível

`test/admin-crm.test.mjs` executa os módulos TypeScript reais para validar filtros, paginação, assinatura, identidade, concorrência e guards. Fixtures existem somente em testes, nunca no CRM.

`supabase db query --linked --file test/sql/admin-crm-security.sql` testa RLS com contas reais ADMIN/CLIENT/anon, isolamento, negação de escalada, proteção de plano/status/e-mail, edição ADMIN e avatar de terceiros somente leitura. Atualizações são transacionais e terminam com **ROLLBACK**. Requer contas reais ADMIN e CLIENT e avatar real; falha explicitamente sem essas condições.

Não implementado: builders de conteúdo, novos planos/assinaturas, convites, chat, pagamentos, notificações, automações e relatórios avançados.

## Resultado da validação — 16/09/2026

- Histórico remoto confirmou `20260916145818`; FK, coluna, triggers, policies e RLS verificados em produção. Teste SQL transacional passou com ADMIN, CLIENT e anon.
- Navegador local: conta ADMIN real, lista com nome/e-mail e foto do cliente, busca por e-mail, filtro de status, vazio verdadeiro, skeleton durante carregamento e ficha/perfil. Server Action salvou exatamente o nome existente, com autorização do proprietário, retornou sucesso e os dados permaneceram após reload. Não foram alterados status, e-mail, foto ou permissões de usuários reais.
- Geometria do Admin verificada em 1024×768, 1280×800, 1366×768, 1440×900 e 1920×1080, sem overflow da página. Lista e ficha inspecionadas visualmente. Home cliente verificada em 390×844 com navegação inferior correta e sem sidebar Admin. Console sem erros nas telas verificadas.
- Sem sessão, `/admin/clientes` respondeu HTTP 307 para `/login`. Guards automatizados negam CLIENT, ausência de usuário e ADMIN forjado em user_metadata.
- TypeScript, lint e build aprovados; 32 testes automatizados, nenhum omitido. Paginação de segunda página testada no repositório com fixture: a produção possui apenas dois clientes, portanto não foi simulada uma segunda página visual nem criado cadastro fictício.
- Advisors oficiais de segurança: nenhum ERROR; três WARN anteriores ao CRM — EXECUTE de `public.handle_new_user()` para anon/authenticated e proteção de senha vazada desativada no Auth. O CRM não adicionou esses grants nem alterou configuração Auth. Hardening adicional exige revisão/autorização própria; não confundir warnings com teste RLS aprovado.
- A validação do build local detectou dois placeholders `[SENSITIVE]` no arquivo ignorado `.env.production.local`. A configuração funcional estava em `.env.development.local`, não em `.env.local`. Os dois placeholders foram substituídos pela configuração pública oficial existente, validando projeto e role `anon`/publishable antes da cópia. Nenhuma chave privilegiada foi utilizada, nenhum valor foi exibido ou versionado; o ambiente de produção Vercel não foi alterado. Supabase Realtime também emite warnings de APIs Node no middleware Edge, sem falha no build; o CRM não utiliza Realtime nessa camada.
- Boundary de erro exercitado com data inválida: mantém o shell, mostra erro honesto e permite tentar novamente. “Limpar filtros e voltar” usa intencionalmente navegação de documento para reinicializar o boundary que o React retém entre mudanças de query string.
