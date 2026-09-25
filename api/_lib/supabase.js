/**
 * Cliente mínimo da REST API do Supabase (PostgREST), só no servidor.
 * Usa a service role key — nunca expor no navegador.
 */

const TABLE = 'crm_leads'

export function dbConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function request(path, { method = 'GET', body, prefer } = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      // chaves novas (sb_secret_...) vão só no apikey; a service_role antiga (JWT) também no Authorization
      ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

export const listLeads = () =>
  request(`${TABLE}?select=*&order=created_at.desc&limit=2000`)

export const insertLead = row =>
  request(TABLE, { method: 'POST', body: row, prefer: 'return=representation' })

/* Lead da Meta: ignora duplicado (a Meta pode reenviar o mesmo webhook) sem sobrescrever o estágio */
export const insertMetaLead = row =>
  request(`${TABLE}?on_conflict=meta_lead_id`, {
    method: 'POST', body: row, prefer: 'resolution=ignore-duplicates,return=representation',
  })

export const updateLead = (id, row) =>
  request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', body: { ...row, updated_at: new Date().toISOString() }, prefer: 'return=representation',
  })
