# Fase 4.2.1 — CRM funcional

Projeto oficial: `wifnkpezifxoqfqvgjmj`. GitHub: `Erlanyapp/erlanyapp`, branch `main`. Vercel: projeto existente `meuapp`.

## Auditoria e reaproveitamento

A Fase 4.2 já consultava clientes reais: filtros de nome/e-mail, status/plano/período, paginação de 20 itens no banco, ficha, seis indicadores, edição de nome com concorrência otimista e status administrativo. Guardas usam `getUser()` e `app_metadata.role`. Avatares privados usam o proprietário real e assinatura de 900 segundos. Nada disso foi recriado.

Nesta fase, “Adicionar cliente” deixa de ser apenas o link de cadastro e passa a criar acesso CLIENT. As abas Treinos, Alimentação, Evolução, Mídia e Histórico passam de placeholders para consultas reais e somente leitura. Sidebar, header, composição da ficha, Splash e mobile cliente não foram redesenhados.

Paginação fora do intervalo foi exercitada com os três clientes reais. PostgREST retorna `PGRST103` (416), sem contagem, nesse caso. `readAdminPage` faz uma contagem HEAD com exatamente os mesmos filtros/escopos e retorna página vazia somente se o offset for comprovadamente maior ou igual ao total. Outros erros, contagens indisponíveis e resultados inconsistentes continuam sendo erros explícitos. A UI oferece retorno à página anterior. Não foram criados clientes adicionais para preencher paginação de teste.

O teste real encontrou uma diferença entre o período filtrado em UTC e a data de cadastro exibida em São Paulo. Os limites agora correspondem ao calendário `America/Sao_Paulo`, com final inclusivo e respeito ao histórico de horário de verão. Nenhuma data armazenada foi alterada. “Limpar” usa um formulário GET separado e vazio, que também reseta a página e campos sem reenviar os filtros preenchidos.

## Cadastro seguro

UI → Server Action `createAdminClient` → service → validação compartilhada → repository → Edge Function `admin-create-client` → Supabase Auth.

- A Server Action exige ADMIN antes do bloco que captura erros.
- A função publicada mantém a verificação JWT do gateway; também chama `auth.getUser(token)` e exige a role gerenciada atual ADMIN e o e-mail administrativo oficial. `user_metadata` não autoriza nada.
- Nome, e-mail, senha inicial e confirmação explícita são os únicos campos aceitos. Role, IDs, plano e metadata arbitrária são ignorados. O e-mail administrativo não pode ser criado pelo formulário.
- Senha de 12–128 caracteres com maiúscula, minúscula e número. Sem log, persistência no PostgreSQL, retorno em action state ou exposição de chave privilegiada.
- Auth `admin.createUser` recebe role CLIENT em `app_metadata`. O trigger Auth já existente cria Profile (role CLIENT) e Client atomicamente no banco. A função verifica os dois registros depois da criação.
- Este é um fluxo com **senha inicial**, não convite: `email_confirm: true`, com reconhecimento obrigatório de que o Admin validou o e-mail e entregará a senha por canal seguro. Não envia e-mail nem depende de SMTP. Não inventa uma verificação de identidade externa.
- A chave privilegiada é a variável integrada do runtime hospedado Supabase. Não é extraída nem instalada no Next.js/Vercel/browser. Nenhuma chave nova é criada.
- E-mail duplicado não altera a conta existente. Se Auth criar a conta mas a confirmação posterior da ficha falhar, a mensagem orienta revisão sem repetir o envio. Não há exclusão automática de usuários.
- Durante envio, o botão fica desabilitado. Após sucesso, criação fica desabilitada e há link para a ficha; a unicidade do e-mail no Auth evita contas duplicadas em reenvios.

Referências: [Auth Admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [segredos integrados das Edge Functions](https://supabase.com/docs/guides/functions/secrets).

## Consultas reais e escopo

As novas consultas ficam em `admin-client-records-repository.ts`, coordenadas pelo serviço existente. Somente a aba selecionada consulta seus registros. Cada seção tem até 20 registros por página, ordenação estável por data e ID, contagem no banco e navegação anterior/próxima.

- Treinos: `workouts.client_id` + scope CLIENT, inclusive rascunhos/inativos identificados como tais. Não disponibiliza montador, séries, carga ou agenda.
- Alimentação: `nutrition_plans.client_id` + scope CLIENT, mais recentemente atualizado primeiro. O schema não tem um campo de vigência; a lista não inventa “plano vigente”.
- Evolução: pesos, medidas, desempenho e metadata de fotos associados ao cliente. Somente leitura; não cria módulo avançado nem uploader de fotos.
- Mídia: `media_assets` e `videos` scope CLIENT do cliente. Arquivos do bucket privado `images` usam assinatura temporária. Falha ao assinar preserva o registro e exibe erro; não é apresentada como ausência de mídia. Vídeos exibem metadata de provedor, sem inventar imagens nem duplicar players.
- Histórico: `audit_logs`, entity `clients`, entity_id da ficha. A UI solicita somente ID, ação e data, sem valores pessoais anteriores/novos, senha, e-mail ou tokens. Eventos antigos inexistentes não são reconstruídos.

## Banco e auditoria

Migration versionada: `20260916174516_admin_crm_functional_history.sql`. Sem novas entidades paralelas, reset, seed, remoção de dados ou bucket novo.

Correção adicional versionada: `20260916180934_admin_client_creation_audit.sql`. O cadastro real revelou que a metadata gerenciada podia não estar disponível no primeiro trigger de criação de Client. A auditoria também acompanha a atualização gerenciada do Auth, com índice de evento único por cliente. Corrige somente cadastros comprovados pela metadata privilegiada `crm_created_by` e role CLIENT, usando a data real de criação do cliente. Não reconstrói eventos de usuários antigos sem essa evidência nem modifica a conta criada.

- Reutiliza `audit_logs`, com RLS ADMIN SELECT e revogação de DML das sessões anon/authenticated/PUBLIC para impedir falsificação e apagamento pelo browser/API.
- Triggers internos em schema `private`, SECURITY DEFINER estritamente para escrita de auditoria protegida, search_path vazio e EXECUTE revogado dos clientes. Não são RPC públicos.
- Captura apenas mudança real de nome e status, na mesma transação da alteração. Salvar nome idêntico não inventa evento.
- Criação atribui o evento ao Admin registrado em `app_metadata.crm_created_by` exclusivamente pela função privilegiada. Confere role/e-mail gerenciados do ator no Auth antes de gravar.
- Auditoria limita old/new_value a nome ou status. Nunca salva senha, e-mail, avatar, JWT ou objeto Auth inteiro. CLIENT não lê o histórico.
- Índices para histórico por entidade/cliente/data e consultas individuais de treinos, alimentação e mídia.
- Guarda de status/plano e policies de isolamento existentes preservadas. Ativo/inativo continua significando cadastro `clients`, não banimento Auth, assinatura ou presença online.
- Foto de terceiros continua somente leitura no Admin, pois o fluxo existente de upload exige proprietário. O upload do próprio cliente não foi alterado.

## Verificação

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

Os testes novos cobrem criação segura/CLIENT fixo, validação, identidade/role, duplicidade sem sobrescrita, ausência de segredo na resposta, queries das cinco abas, isolamento do ID alvo, paginação no banco, vazio real, dados registrados, assinatura privada e erro explícito, histórico minimizado e limpeza por formulário GET vazio. Também checam strict TypeScript da função Edge com os tipos da versão Supabase fixada, sem enfraquecer o projeto Next.js.

Testes SQL reais:

- `test/sql/admin-crm-security.sql`: RLS e regressão de Auth/perfil/status/plano/Storage, com atores reais e ROLLBACK.
- `test/sql/admin-crm-history-security.sql`: captura real de mudança de nome/status, atribuição do ator, histórico imutável, negação CLIENT/anon, isolamento de mídia/treinos/alimentação. Toda mutação e todo evento desse teste são revertidos.

Resultados de navegador, Git e deployment devem ser relatados somente depois de verificados. Não criar uma pessoa fictícia em produção para substituir a validação do cadastro real; o proprietário escolhe e confirma o cliente de teste legítimo no formulário.

### Resultados observados em 16/09/2026

- As duas migrations acima foram aplicadas ao projeto oficial e confirmadas no histórico remoto.
- Edge Function `admin-create-client`: ACTIVE, versão 1, `verify_jwt: true`.
- O cadastro escolhido e realizado pelo proprietário criou Auth, Profile e Client, com ambas as roles CLIENT, e-mail sincronizado e exatamente um evento real de criação no histórico. Nenhuma conta foi recriada ou apagada.
- Os dois scripts SQL reais passaram, com rollback de todas as mutações de teste. O teste do Auth trigger e da idempotência também preservou o evento único.
- TypeScript, lint e build: exit code 0. `npm test`: 48 testes, 48 aprovados, nenhum skip.
- ADMIN existente acessou Dashboard, listagem e fichas. Busca por nome/e-mail, status, plano, período, limpeza, abertura, retorno e paginação fora do intervalo foram exercitados no navegador. As cinco novas abas consultaram registros reais, incluindo o evento de criação; áreas sem registros exibiram vazios honestos. Fotos reais permaneceram disponíveis.
- Tabela, filtros, ficha, abas, formulário, sidebar e header foram inspecionados em 1024, 1280, 1366, 1440 e 1920px, sem overflow horizontal. O formulário de cadastro tem altura limitada e rolagem interna, preservando campos e botão acessíveis em telas mais baixas.
- Aplicação compilada reaberta em localhost e listagem autenticada verificada. A primeira tentativa de bind foi bloqueada por sandbox (`EPERM`); a execução aprovada com permissão de rede local iniciou normalmente. Não há bloqueio atual do servidor.
- **Entrega ainda pendente:** autorização para repetir o salvamento do mesmo nome na ficha e teste de logout/login com o proprietário. Commit, push e deployment desta fase ainda não foram feitos, respeitando a ordem exigida de validação real antes da publicação.
- Consulta aos advisors pelo conector indisponível: `MCP error -32600: You do not have permission to perform this action`. Isso não impediu as validações reais de schema/RLS/triggers pela CLI autenticada.

## Limites e avisos

Não implementa construtores completos, exercícios do treino, dieta/receitas/hidratação, composição avançada, exames/documentos, chat/WhatsApp, checkout ou relatórios avançados. Não inicia a Fase 4.3.

Os advisors anteriores ao início desta fase apontavam três WARN preexistentes: EXECUTE do trigger `handle_new_user` por anon/authenticated e proteção de senhas vazadas desabilitada. A auditoria privada nova não introduz RPC privilegiado público. Esses avisos não devem ser omitidos do relatório; mudanças adicionais na configuração Auth exigem revisão separada.

A integração Git preexistente de `meuapp` aponta para `Erlanyapp/meuapp`, embora o repositório oficial seja `Erlanyapp/erlanyapp`. Deploy deve continuar por CLI no projeto existente, **somente depois** de validação real, commit e push oficial, com hash e alias de produção comprovados. Não alterar essa integração silenciosamente.
