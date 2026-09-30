-- Motivo da perda do lead (preenchido ao mover para "Perdido")
-- Rodar uma vez no Supabase: SQL Editor → New query → colar → Run
-- IMPORTANTE: rodar ANTES do deploy que usa estas colunas.

alter table public.crm_leads add column if not exists motivo_perda      text default '';  -- categoria (lista fixa do CRM)
alter table public.crm_leads add column if not exists motivo_perda_obs  text default '';  -- comentário livre (gravado criptografado)
alter table public.crm_leads add column if not exists perdido_em        timestamptz;      -- quando foi marcado como perdido

notify pgrst, 'reload schema';
