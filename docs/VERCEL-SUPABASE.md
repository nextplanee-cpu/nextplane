# Rodar na Vercel usando o Postgres do Supabase

O mesmo código roda na Vercel: as funções de `api/` falam direto com o PostgreSQL do Supabase (conexão pelo *pooler*)
e o login é o JWT próprio (cliente por CPF + equipe por e-mail). O Supabase passa a ser só o banco de dados.

## 1. Atualizar o banco (uma vez)

Supabase → **SQL Editor** → New query → colar o conteúdo de `docs/supabase-atualizar.sql` → **Run**.
Só acrescenta colunas e tabelas (nada é apagado) e fecha as tabelas novas para a API pública. O CRM antigo continua funcionando durante a troca.

Depois, rodar o SQL que define a senha inicial do administrador (`supabase-admin.local.sql`, gerado na máquina de quem fez a configuração).

## 2. Variáveis na Vercel

Vercel → projeto → **Settings → Environment Variables** (Production):

| Nome | Valor |
|---|---|
| `DATABASE_URL` | Supabase → **Connect** → **Transaction pooler** (porta 6543). Troque `[YOUR-PASSWORD]` pela senha do banco. |
| `DB_SSL` | `true` |

Use o **pooler**: a conexão direta do Supabase só tem IPv6 e a Vercel não alcança. Não deixe `?sslmode=` na URL.
`CRM_ENCRYPTION_KEY`, `META_*`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` **continuam como estão** (a chave de criptografia precisa ser a mesma).
`JWT_SECRET` é opcional: sem ele, a chave do JWT é derivada da `CRM_ENCRYPTION_KEY`.

## 3. Publicar

`git push` para a `main` → a Vercel faz o deploy. Depois:

- `/crm` → entra com o e-mail do administrador e a senha inicial → é obrigado a criar uma senha própria.
- Ficha da assessoria → **Visão geral** → **Acesso do cliente por CPF e senha**.
- O cliente entra em `/cliente`.

Anexos enviados antes da mudança (no Storage do Supabase) continuam abrindo enquanto `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estiverem na Vercel. Novos anexos vão para o Postgres.

## Depois de tudo funcionando

- Equipe nova ou senha esquecida: `npm run usuario -- --email ... --nome ... --role admin|consultor` com `DATABASE_URL` no `.env` local.
- O Supabase Auth deixa de ser usado: os logins antigos do painel não valem mais.
