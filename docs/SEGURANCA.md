# Segurança do CRM Next Plane

## Camadas

| # | Camada | O que protege | Onde |
|---|--------|---------------|------|
| 1 | **Login com JWT (Supabase Auth)** — e-mail/senha e, opcional, Google (OAuth2 + PKCE) | Ninguém entra sem conta própria; fim da chave única compartilhada | `api/auth.js`, `api/_lib/auth.js`, `src/pages/crm/AuthGate.jsx` |
| 2 | **Sessão em cookie httpOnly/Secure/SameSite=Strict** — JWT de 1h, renovação automática, cai após 12h sem uso | Token não fica no navegador nem é legível por JavaScript (XSS não rouba sessão) | `api/_lib/auth.js` |
| 3 | **Lista de acesso + perfis** (`crm_users`: admin / consultor) | Login válido não basta: precisa estar ativo na lista. Consultor vê/edita só os próprios leads e assessorias, não exclui, não reatribui, não mexe na integração Meta | `api/leads.js`, `api/assessorias.js`, `api/meta-setup.js` |
| 4 | **Mínimo de dados na tela** — API devolve só as colunas usadas, nunca `select=*`; ids internos da Meta ficam no servidor | Menos dado exposto por tela/sessão | `api/_lib/supabase.js` |
| 5 | **Criptografia AES-256-GCM** — leads: nome, telefone, e-mail, cidade, destino, observações e respostas do formulário; assessorias: a ficha inteira (cliente, contato, passageiros com CPF/passaporte/nascimento, voos, hotéis, reservas, roteiro, histórico). Abertos só campos de controle (estágio, temperatura, score, valor, origem, campanha, datas, consultor/responsável) | Quem copiar o banco (ou acessar o painel do Supabase) vê só `enc:v1:…` | `api/_lib/crypto.js` |
| 6 | **Banco trancado** — RLS ligado sem políticas + `revoke` do anon/authenticated; só o servidor (service role) acessa | Chave pública do Supabase não lê nada | `supabase/003_seguranca.sql` |
| 7 | **Anti-força-bruta e anti-spam** — login: 5 tentativas/e-mail e 20/IP a cada 15 min; funil: 5 envios/IP a cada 10 min; só aceita envios do próprio site | Adivinhação de senha e robôs enchendo o banco | `api/_lib/ratelimit.js` |
| 8 | **Proteção CSRF** — toda escrita exige Origin do próprio site | Outro site não consegue agir em nome de quem está logado | `requireUser` em `api/_lib/auth.js` |
| 9 | **Registro de acessos** (`crm_audit`) — logins (inclusive falhos/bloqueados), criações, edições, exclusões, com IP | Saber quem fez o quê e quando | CRM → selo do usuário no topo → "Ver registro de acessos" |
| 10 | **Cabeçalhos de segurança** — CSP, HSTS, X-Frame-Options, nosniff, Referrer/Permissions-Policy; `/crm` e `/api` fora do Google | Injeção de script, clickjacking, downgrade para http | `vercel.json` |
| 11 | **Sem dados no navegador** — fim do modo "Só neste navegador"; funil não grava mais o lead no navegador do visitante | Vazamento por computador compartilhado/perdido | `src/pages/CRM.jsx`, `src/pages/FunilEuropa.jsx` |

## Ativação (nesta ordem — o login precisa existir antes do deploy)

1. **Supabase → SQL Editor**: abrir `supabase/003_seguranca.sql`, trocar `SEU_EMAIL_AQUI` pelo e-mail do admin (minúsculo) e rodar.
2. **Supabase → Authentication → Users → Add user**: criar o mesmo e-mail com uma senha forte (marcar "Auto confirm").
3. **Supabase → Authentication → Sign In / Providers**: desligar **"Allow new users to sign up"** (só o admin cria contas).
4. **Vercel → Settings → Environment Variables**:
   - `CRM_ENCRYPTION_KEY` = saída de
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
     **Guarde uma cópia num cofre de senhas — se essa chave se perder, os dados criptografados não voltam.**
   - `SUPABASE_ANON_KEY` = chave publicável (Settings → API Keys) — recomendada para as chamadas de login.
5. `git push` (deploy).
6. Entrar em `/crm`, clicar no selo do usuário no topo → **"Criptografar dados antigos"**.
7. Apagar `CRM_ACCESS_KEY` da Vercel (não é mais usada).

### Adicionar consultor
SQL Editor: `insert into crm_users (email, nome, role) values ('ana@exemplo.com', 'Ana', 'consultor');`
e criar o usuário em Authentication → Users. O `nome` deve ser igual ao campo **Consultor** dos leads e **Responsável** das assessorias.
Bloquear alguém: `update crm_users set ativo = false where email = '...';` (efeito em até 1 minuto).

### Login com Google (opcional)
1. Google Cloud Console → APIs e serviços → Credenciais → ID do cliente OAuth (Aplicativo da Web); URI de redirecionamento: `https://yanruudpokfkznkgqbuc.supabase.co/auth/v1/callback`.
2. Supabase → Authentication → Providers → Google: colar Client ID e Secret.
3. Supabase → Authentication → URL Configuration → Redirect URLs: adicionar `https://nextplane.vercel.app/api/auth?action=callback`.
4. Vercel: `AUTH_GOOGLE=on`. O botão "Entrar com Google" aparece; só e-mails da `crm_users` entram.

## Próximos passos recomendados
- **MFA (2 fatores)** no Supabase Auth para o admin.
- **Backups**: plano Pro do Supabase tem backup diário/PITR — no plano grátis, exportar periodicamente.
- Revisar o registro de acessos semanalmente (tentativas falhas/bloqueadas em vermelho).
