-- Next Plane CRM — esquema do banco (PostgreSQL 14+)
-- Rodado por `npm run migrate` (server/migrate.js); cada arquivo roda uma vez só.

-- ─── Leads (Meta Lead Ads, funil, manuais) ───────────────────
create table if not exists crm_leads (
  id            bigserial primary key,
  meta_lead_id  text unique,                 -- id do lead na Meta (evita duplicar)
  name          text not null,
  phone         text default '',
  email         text default '',
  cidade        text default '',
  dest          text default '',
  type          text default 'Internacional',
  value         numeric default 0,
  stage         int  default 0,              -- estágios do pipeline
  temp          text default 'Morno',        -- Frio | Morno | Quente | VIP
  score         int  default 0,
  pessoas       text default '',
  dias          text default '',
  investimento  text default '',
  source        text default 'Manual',
  consultor     text default 'Joseph',
  obs           text default '',
  campaign_name text default '',
  adset_name    text default '',
  ad_name       text default '',
  form_id       text default '',
  form_name     text default '',
  respostas     jsonb default '[]'::jsonb,
  platform      text default '',
  motivo_perda      text default '',
  motivo_perda_obs  text default '',
  perdido_em        timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists crm_leads_created_at_idx on crm_leads (created_at desc);
create index if not exists crm_leads_consultor_idx  on crm_leads (consultor);

-- ─── Equipe (admin e consultores) ────────────────────────────
--   role = 'admin'     → vê tudo, exclui, configura integrações
--          'consultor' → só o que é dele
create table if not exists crm_users (
  email         text primary key check (email = lower(email)),
  nome          text not null,
  role          text not null default 'consultor' check (role in ('admin', 'consultor')),
  ativo         boolean not null default true,
  senha_hash    text,                         -- scrypt (nunca a senha em si)
  trocar_senha  boolean not null default false, -- true = precisa criar senha nova no próximo acesso
  token_ver     int not null default 1,       -- sobe ao trocar a senha → derruba sessões antigas
  falhas        int not null default 0,       -- tentativas erradas seguidas
  bloqueado_ate timestamptz,
  ultimo_acesso timestamptz,
  created_at    timestamptz default now()
);

-- ─── Clientes (acesso por CPF + senha) ───────────────────────
-- O CPF não fica em texto aberto: cpf_hash (HMAC) serve para achar a conta no login
-- e cpf_enc (AES-256-GCM) só o servidor abre.
create table if not exists crm_clientes (
  id            bigserial primary key,
  cpf_hash      text not null unique,
  cpf_enc       text,
  nome_enc      text,
  senha_hash    text not null,
  trocar_senha  boolean not null default true, -- 1º acesso: obriga a criar senha nova
  ativo         boolean not null default true,
  token_ver     int not null default 1,
  falhas        int not null default 0,
  bloqueado_ate timestamptz,
  ultimo_acesso timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Assessorias (a ficha inteira fica criptografada em data._enc) ──
create table if not exists crm_assessorias (
  id          bigserial primary key,
  lead_id     bigint,
  cliente_id  bigint references crm_clientes(id) on delete set null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists crm_assessorias_created_at_idx on crm_assessorias (created_at desc);

-- ─── Anexos (bilhetes, vouchers, apólices) — já chegam criptografados ──
create table if not exists crm_anexos (
  file_id        uuid primary key,
  assessoria_id  bigint not null references crm_assessorias(id) on delete cascade,
  tipo           text not null,
  tamanho        int  not null,
  conteudo       bytea not null,
  created_at     timestamptz default now()
);
create index if not exists crm_anexos_assessoria_idx on crm_anexos (assessoria_id);

-- ─── Registro de acessos ─────────────────────────────────────
create table if not exists crm_audit (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  user_email  text not null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  ip          text
);
create index if not exists crm_audit_at_idx on crm_audit (at desc);
