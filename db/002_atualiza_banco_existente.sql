-- Atualiza um banco que JÁ existia (o do Supabase, criado pelas versões antigas do CRM) para o esquema atual.
-- Só acrescenta colunas e tabelas: nada é apagado e o CRM antigo continua funcionando durante a troca.
-- Em um banco novo estas linhas não mudam nada. É seguro rodar mais de uma vez.

-- Leads: colunas que foram sendo adicionadas aos poucos
alter table crm_leads add column if not exists form_id          text default '';
alter table crm_leads add column if not exists form_name        text default '';
alter table crm_leads add column if not exists respostas        jsonb default '[]'::jsonb;
alter table crm_leads add column if not exists motivo_perda     text default '';
alter table crm_leads add column if not exists motivo_perda_obs text default '';
alter table crm_leads add column if not exists perdido_em       timestamptz;
create index if not exists crm_leads_consultor_idx on crm_leads (consultor);

-- Equipe: senha própria (hash scrypt) em vez do Supabase Auth
alter table crm_users add column if not exists senha_hash    text;
alter table crm_users add column if not exists trocar_senha  boolean not null default false;
alter table crm_users add column if not exists token_ver     int not null default 1;
alter table crm_users add column if not exists falhas        int not null default 0;
alter table crm_users add column if not exists bloqueado_ate timestamptz;
alter table crm_users add column if not exists ultimo_acesso timestamptz;

-- Assessorias: ligação com a conta do cliente (acesso por CPF)
alter table crm_assessorias add column if not exists cliente_id bigint references crm_clientes(id) on delete set null;
create index if not exists crm_assessorias_cliente_idx on crm_assessorias (cliente_id);

-- Segurança: estas tabelas guardam hash de senha, CPF criptografado e anexos. No Supabase, tabelas novas
-- nascem abertas para a API pública (chave anon); aqui fechamos: RLS ligado e sem nenhuma permissão para anon/authenticated.
-- O CRM acessa o banco pela conexão direta (usuário postgres), que não passa por essas regras.
alter table crm_leads       enable row level security;
alter table crm_assessorias enable row level security;
alter table crm_users       enable row level security;
alter table crm_clientes    enable row level security;
alter table crm_anexos      enable row level security;
alter table crm_audit       enable row level security;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on crm_leads, crm_assessorias, crm_users, crm_clientes, crm_anexos, crm_audit from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on crm_leads, crm_assessorias, crm_users, crm_clientes, crm_anexos, crm_audit from authenticated;
  end if;
end $$;
