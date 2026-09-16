# ERLANY FIT — Desktop fullscreen

## Escopo

O cliente usa automaticamente o shell web a partir de **768px**, por media queries de CSS. Não existe seletor de modo, user-agent sniffing ou consulta de viewport durante a renderização. Abaixo desse breakpoint permanece o layout mobile aprovado.

`ClientShell` compõe `DesktopSidebar`, `DesktopHeader`, o conteúdo existente e `BottomNavigation`. O workspace usa `display: contents` no mobile, e os elementos exclusivos de desktop usam `display: none`. As demais declarações do novo `client-desktop.css` estão limitadas a media queries de 768px ou mais. Splash, telas de autenticação, CSS mobile, bottom navigation e páginas mobile não foram redesenhados.

No desktop, o shell ocupa toda a largura e pelo menos a altura da viewport, sem moldura ou card de celular. Sidebar e header são sticky; a sidebar tem rolagem própria para manter todas as ações acessíveis em monitores baixos. O conteúdo mantém rolagem vertical natural e colunas `minmax(0, 1fr)` para evitar overflow horizontal. Tablets usam sidebar de 208px; monitores maiores usam 240px ou 264px. Grids reorganizam conteúdo, sem inventar registros ou indicadores.

## Identidade e dados

- Logo: `public/assets/branding/erlany-fit-logo.png`, usada como imagem independente.
- Referência mobile: `docs/reference/erlany-fit-reference.png`, preservada.
- Ícones: camada SVG existente, com nomes semânticos e links acessíveis.
- Header: contexto da rota, sino, nome real e avatar do usuário autenticado.
- Os dados mínimos do header vêm de `getClientAccount`, serviço server-side existente. Componentes de layout não executam consultas Supabase.
- `ProfileAvatar` e `LogoutButton` são reutilizados sem alterações de lógica.
- Admin continua com seu layout e controle de acesso próprios; não é transformado em cliente.
- Banco, migrations, RLS, Auth, Storage, uploads e serviços/repositories não foram alterados.

O shell é aplicado pelo layout compartilhado a Home, Treinos, Exercício, Evolução, Alimentação, Dicas, Planos, Mais, Perfil/edição, Configurações, Notificações, Conquistas, Ajuda e Contato. Conteúdo inexistente permanece nos estados vazios reais. Não foram adicionados CMS nem recursos administrativos.

## Verificação realizada em 2026-09-16

No navegador integrado, com sessão CLIENT real, foram registradas **238 verificações de geometria**: 14 rotas em 17 viewports.

- Mobile: 320×568, 360×800, 375×812, 390×844, 393×852, 412×915, 430×932, 480×960.
- Tablet: 768×1024, 820×1180, 1024×1366.
- Desktop: 1280×720, 1366×768, 1440×900, 1600×900, 1920×1080, 2560×1080.
- Rotas: início, treinos, evolução, alimentação, dicas, planos, mais, perfil, edição de perfil, configurações, notificações, conquistas, ajuda e contato.

Nenhuma dessas verificações detectou overflow horizontal da página/conteúdo, sobreposição entre sidebar e conteúdo, shell desktop estreito ou troca incorreta entre sidebar e bottom navigation. Foram inspecionadas screenshots reais da Home mobile e desktop, Evolução em colunas e Mais em tablet.

A comparação antes/depois da Home em sete larguras mobile (360–480px) manteve iguais as métricas e estilos registrados de hero, header, card, atalhos, frase e bottom navigation. Em 320px houve diferença de 15px na reserva de scrollbar do navegador entre capturas; a inspeção posterior confirmou layout mobile, sem overflow, mantendo tipografia, alturas e espaçamentos. Isso não equivale a afirmar igualdade pixel a pixel nessa largura.

O navegador emulado retorna safe-area de zero: as regras existentes de `env(safe-area-inset-*)` e reserva de conteúdo acima da bottom navigation foram preservadas, mas notch físico e Safari em dispositivo real não foram testados nesta etapa.

Navegação real do sino e avatar levou às rotas corretas. CLIENT em `/admin` foi redirecionado à Home. Logout pela sidebar levou a `/login`; após logout, `/app/inicio` e `/admin` também redirecionaram a `/login`.

## Testes e limites

`test/client-desktop.test.mjs` adiciona cinco testes de navegação semântica, rotas de detalhe, contexto, isolamento das regras desktop e reutilização dos serviços/componentes existentes. A suíte completa contém 20 testes.

Validação final local: `npm run typecheck`, `npm run lint`, `npm test` (20/20) e `npm run build` concluíram com exit code 0. O build incluiu as rotas do cliente e as rotas administrativas existentes.

Não foi realizado login positivo como ADMIN nesta etapa. Exercício com prescrição/vídeo, gráficos com registros, fotos de evolução e cards de conteúdo dependem de dados reais que não estavam disponíveis na sessão auditada; seus estilos e rotas foram revisados, mas não foram criados dados fictícios para screenshots. Upload, alteração de peso e envio de contato não foram repetidos apenas para validar layout; os testes funcionais existentes permanecem na suíte.

O deploy deve ser feito no projeto Vercel existente `meuapp`, após commit/push para `Erlanyapp/erlanyapp`, branch `main`. A integração Git da Vercel anteriormente apontava para outro repo (`Erlanyapp/meuapp`); esse vínculo não foi alterado nesta etapa. A publicação é feita pela CLI a partir do repositório oficial, com verificação de READY e domínio de produção `https://meuapp-zeta.vercel.app`.
