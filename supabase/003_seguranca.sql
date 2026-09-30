-- Next Plane CRM — camadas de segurança (login, perfis e registro de acessos)
-- Rodar uma vez no Supabase: SQL Editor → New query → colar → Run

-- ─────────────────────────────────────────────────────────────
-- Lista de acesso: só e-mails ativos aqui entram no CRM (mesmo com login válido)
--   role  = 'admin'      → vê tudo, exclui, configura integrações
--           'consultor'  → só os leads/assessorias em que ele é o consultor/responsável
--   nome  = igual ao campo "consultor" dos leads (ex.: 'Joseph')
create table if not exists public.crm_users (
  email       text primary key check (email = lower(email)),
  nome        text not null,
  role        text not null default 'consultor' check (role in ('admin', 'consultor')),
  ativo       boolean not null default true,
  created_at  timestamptz default now()
);
alter table public.crm_users enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Registro de acessos: logins (inclusive falhos), criações, edições e exclusões
create table if not exists public.crm_audit (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  user_email  text not null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  ip          text
);
create index if not exists crm_audit_at_idx on public.crm_audit (at desc);
alter table public.crm_audit enable row level security;

-- RLS ligado e SEM políticas nas 4 tabelas → a chave pública (anon) não lê nada;
-- só o servidor da Vercel (service role) acessa. Garantia extra:
revoke all on public.crm_leads, public.crm_assessorias, public.crm_users, public.crm_audit from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Primeiro admin — troque pelo seu e-mail antes de rodar
-- (depois crie o mesmo e-mail em Authentication → Users → Add user)
insert into public.crm_users (email, nome, role)
values ('SEU_EMAIL_AQUI', 'Joseph', 'admin')
on conflict (email) do nothing;
