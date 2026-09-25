-- Next Plane CRM — tabela de leads
-- Rodar uma vez no Supabase: SQL Editor → New query → colar → Run

create table if not exists public.crm_leads (
  id            bigserial primary key,
  meta_lead_id  text unique,                 -- id do lead na Meta (evita duplicar)
  name          text not null,
  phone         text default '',
  email         text default '',
  cidade        text default '',
  dest          text default '',             -- Europa | EUA | Ásia | Oceania | texto livre
  type          text default 'Internacional',
  value         numeric default 0,           -- valor estimado (R$)
  stage         int  default 0,              -- 0..12 (estágios do pipeline)
  temp          text default 'Morno',        -- Frio | Morno | Quente | VIP
  score         int  default 0,              -- 0..10
  pessoas       text default '',             -- 1 | 2 | 3-4 | 5+
  dias          text default '',             -- ate10 | 11-15 | 15+
  investimento  text default '',             -- ate20 | 20-30 | 30-40 | 40+
  source        text default 'Manual',
  consultor     text default 'Joseph',
  obs           text default '',
  campaign_name text default '',
  adset_name    text default '',
  ad_name       text default '',
  form_id       text default '',
  form_name     text default '',
  respostas     jsonb default '[]'::jsonb,   -- [{pergunta, resposta}] de qualquer formulário
  platform      text default '',             -- fb | ig
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists crm_leads_created_at_idx on public.crm_leads (created_at desc);

-- Segurança: RLS ligado e SEM políticas → ninguém lê a tabela com a chave pública.
-- Só o servidor (Vercel, com a service role key) acessa os dados.
alter table public.crm_leads enable row level security;
