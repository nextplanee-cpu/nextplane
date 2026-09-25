-- Guarda todas as respostas de qualquer formulário de Lead Ads + nome do formulário
-- Rodar uma vez no Supabase: SQL Editor → New query → colar → Run

alter table public.crm_leads add column if not exists form_name text default '';
alter table public.crm_leads add column if not exists respostas jsonb default '[]'::jsonb;
