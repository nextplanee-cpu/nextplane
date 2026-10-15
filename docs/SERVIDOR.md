# Next Plane em servidor próprio (PostgreSQL + JWT)

Esta versão roda **sem Vercel e sem Supabase**: um servidor Node entrega o site e a API, e os dados ficam num PostgreSQL seu.
O site que está no ar hoje (Vercel + Supabase) continua funcionando como está; isto vive na branch `servidor-postgres`.

## Visão geral

```
Navegador ──HTTPS──► Caddy ──► app (Node/Express) ──► PostgreSQL
                               │  site (dist/) + API (/api/*)    └─ tabelas, anexos e usuários
                               └─ JWT em cookie httpOnly
```

| Peça | Para quê | Arquivo |
|---|---|---|
| `.env` | senhas, chave do JWT e chave de criptografia | `.env.example` (modelo) |
| Banco | tabelas `crm_leads`, `crm_assessorias`, `crm_users`, `crm_clientes`, `crm_anexos`, `crm_audit` | `db/001_schema.sql` |
| Servidor | site + API | `server/index.js` |
| Docker | banco + app + HTTPS automático | `docker-compose.yml`, `Dockerfile`, `Caddyfile` |

## Subir no servidor (Docker)

Precisa de um servidor Linux com Docker e de um domínio apontando para o IP dele.

```bash
git clone <repositório> nextplane && cd nextplane
git checkout servidor-postgres
npm install
npm run gerar-env -- --email voce@exemplo.com --nome "Joseph" --dominio crm.seudominio.com.br
docker compose up -d --build
```

O `gerar-env` cria o `.env` com **senhas e chaves aleatórias** (não mostra nada na tela). Abra o `.env` para ler a
`ADMIN_SENHA_INICIAL`. **Faça uma cópia do `.env` num lugar seguro**, principalmente a `CRM_ENCRYPTION_KEY`: sem ela os dados criptografados não abrem mais.

O `docker compose up` faz, na ordem: sobe o PostgreSQL → roda o `migrate` (cria tabelas, o usuário do banco e o administrador) → sobe o app → o Caddy emite o HTTPS.
Depois é só abrir `https://crm.seudominio.com.br/crm`.

## Os acessos

### Usuários do banco de dados (PostgreSQL)

| Usuário | Variáveis no `.env` | Pode |
|---|---|---|
| **dono** | `POSTGRES_USER` / `POSTGRES_PASSWORD` | criar e alterar tabelas. Só o passo `migrate` usa. |
| **aplicação** | `APP_DB_USER` / `APP_DB_PASSWORD` | só ler e gravar dados. Não apaga nem altera tabelas. É o que o app usa no dia a dia. |

No Docker o banco **não fica exposto na internet**: só a rede interna enxerga a porta 5432.

### Administrador (equipe)

- Criado pelo `migrate` com `ADMIN_EMAIL` + `ADMIN_SENHA_INICIAL` do `.env`.
- Entra em `/crm`. **No primeiro acesso é obrigado a criar uma senha própria.** Depois, apague `ADMIN_SENHA_INICIAL` do `.env`.
- Outros usuários (admin ou consultor) ou redefinir senha — num terminal que enxergue o banco:

```bash
docker compose run --rm app node server/usuario.js --email ana@exemplo.com --nome "Ana" --role consultor
```

(sem Docker: `npm run usuario -- --email ana@exemplo.com --nome "Ana" --role consultor`). A senha é digitada no terminal.
`admin` vê tudo e pode excluir; `consultor` só vê o que é dele.

### Cliente (CPF + senha)

1. No CRM, abra a assessoria → **Visão geral** → **Acesso do cliente por CPF e senha** → informe o CPF → **Criar acesso**.
2. O CRM mostra o CPF e uma **senha provisória, uma única vez** (com botão de copiar e de enviar no WhatsApp).
3. O cliente entra em `https://seu-dominio/cliente` com CPF + senha provisória e **é obrigado a criar a própria senha** antes de ver qualquer coisa.
4. Ele vê o andamento, os documentos e a economia — nunca lucro, valores internos, CPF ou passaporte — e não altera nada.
5. Esqueceu a senha? Na mesma tela: **Gerar nova senha provisória** (derruba a sessão dele e ele cria outra). **Remover acesso** desliga.

O CPF não fica em texto aberto no banco: há um índice HMAC (para achar a conta no login) e o CPF criptografado (AES-256-GCM).

## JWT

- Assinado com HS256 usando `JWT_SECRET` (mín. 32 caracteres). **Quem tiver essa chave consegue forjar logins** — trate como senha.
- Vai num cookie `httpOnly; Secure; SameSite=Strict` (o JavaScript da página não lê, então um XSS não rouba a sessão).
- Equipe e cliente têm tokens e cookies separados (`np_at` / `np_ct`): um token de cliente nunca abre a API da equipe.
- Dura 12 h sem uso e renova sozinho enquanto a pessoa usa. Trocar a senha ou redefinir derruba as sessões antigas.
- Também vale em `Authorization: Bearer <jwt>` (para um app ou integração futura). Nos endpoints de login, `"retornarToken": true` devolve o JWT no corpo.
- Proteções: 5 senhas erradas seguidas bloqueiam a conta por 15 min, limite por IP, resposta igual para "CPF não existe" e "senha errada", hash de senha scrypt, requisições de outra origem são barradas.

## Trazer os dados que já estão no Supabase

1. No `.env`, coloque a **mesma `CRM_ENCRYPTION_KEY` que está na Vercel** (os dados continuam criptografados e só abrem com ela) e preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
2. `npm run migrate` e depois `npm run importar-supabase`. Pode rodar de novo sem duplicar nada.
3. Se a chave de criptografia for diferente, o importador **para antes de copiar** e avisa.

Não copia logins: as pessoas da equipe são criadas de novo com `npm run usuario`.

## Sem Docker

Precisa de Node 22+ e um PostgreSQL 14+ com um banco vazio e um usuário dono.

```bash
npm install && npm run gerar-env && npm run build
npm run migrate     # cria tabelas, usuário da aplicação e administrador
npm start           # porta 3000; ponha um proxy HTTPS na frente
```

Sem proxy na frente, use `TRUST_PROXY=0` no `.env` (e `COOKIE_SECURE=false` só para testar em http puro).
Para experimentar tudo sem instalar banco nenhum: `npm run build && npm run demo` (Postgres em memória; os dados somem ao fechar).

## Backup

Um `pg_dump` leva tudo (inclusive anexos). Guarde junto o `.env`, porque sem a `CRM_ENCRYPTION_KEY` o backup não abre.

```bash
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup-$(date +%F).sql
```

## Testes

`npm test` (login, JWT, troca de senha, CPF, isolamento entre clientes, criptografia) e `node server/test/importar.mjs` (importador). Rodam num Postgres real em memória.

## O que ainda não existe

- **"Esqueci minha senha" por e-mail** da equipe (dependia do Supabase Auth). Hoje o administrador redefine com `npm run usuario`.
- **Login com Google.** Removido junto com o Supabase.
- Os testes automáticos usam o PGlite (Postgres em memória). A subida com Docker e o PostgreSQL de produção precisam ser conferidos no seu servidor.
