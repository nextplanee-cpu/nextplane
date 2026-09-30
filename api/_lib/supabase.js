/**
 * Cliente mínimo da REST API do Supabase (PostgREST), só no servidor.
 * Usa a service role key — nunca expor no navegador.
 * Telefone/e-mail dos leads e dados de passageiros são gravados criptografados
 * (ver crypto.js) e só são abertos aqui, no servidor, para quem tem acesso.
 */
import { encrypt, decrypt, encryptJSON, decryptJSON } from './crypto.js'

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

/* Só as colunas que as telas usam (ids internos da Meta ficam no servidor) */
const LEAD_COLS = [
  'id', 'name', 'phone', 'email', 'cidade', 'dest', 'type', 'value', 'stage', 'temp', 'score',
  'pessoas', 'dias', 'investimento', 'source', 'consultor', 'obs', 'campaign_name', 'adset_name',
  'ad_name', 'form_name', 'respostas', 'platform', 'created_at', 'updated_at',
].join(',')

const LEAD_SECRET = ['phone', 'email']
const encLead = row => {
  const out = { ...row }
  for (const k of LEAD_SECRET) if (k in out) out[k] = encrypt(out[k])
  return out
}
const decLead = row => {
  if (!row) return row
  const out = { ...row }
  for (const k of LEAD_SECRET) if (k in out) out[k] = decrypt(out[k])
  return out
}
const decRows = rows => (rows || []).map(decLead)

/* consultor: quando informado, traz só os leads dele */
export const listLeads = consultor =>
  request(`${TABLE}?select=${LEAD_COLS}&order=created_at.desc&limit=2000` +
    (consultor ? `&consultor=eq.${encodeURIComponent(consultor)}` : '')).then(decRows)

export const getLead = id =>
  request(`${TABLE}?select=id,consultor&id=eq.${encodeURIComponent(id)}`).then(r => r?.[0] || null)

export const insertLead = row =>
  request(`${TABLE}?select=${LEAD_COLS}`, { method: 'POST', body: encLead(row), prefer: 'return=representation' }).then(decRows)

/* Lead da Meta: ignora duplicado (a Meta pode reenviar o mesmo webhook) sem sobrescrever o estágio */
const upsertMeta = row =>
  request(`${TABLE}?on_conflict=meta_lead_id&select=id`, {
    method: 'POST', body: encLead(row), prefer: 'resolution=ignore-duplicates,return=representation',
  })

export async function insertMetaLead(row) {
  try {
    return await upsertMeta(row)
  } catch (err) {
    // Colunas novas (respostas/form_name) ainda não criadas no banco: salva as respostas nas observações
    if (!/respostas|form_name/.test(err.message)) throw err
    const { respostas = [], form_name, ...rest } = row
    const texto = respostas.map(r => `${r.pergunta}: ${r.resposta}`).join(' | ')
    return upsertMeta({ ...rest, obs: [form_name && `Formulário: ${form_name}`, texto].filter(Boolean).join(' | ') })
  }
}

export const updateLead = (id, row) =>
  request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=${LEAD_COLS}`, {
    method: 'PATCH', body: { ...encLead(row), updated_at: new Date().toISOString() }, prefer: 'return=representation',
  }).then(decRows)

export const deleteLead = id =>
  request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=id`, { method: 'DELETE', prefer: 'return=representation' })

/* ── Assessorias (gestão operacional das viagens contratadas) ── */
const TABLE_ASS = 'crm_assessorias'
const ASS_COLS = 'id,lead_id,data,created_at'

/* Passageiros (CPF, passaporte, nascimento) e contato do cliente vão criptografados */
const encAss = row => {
  const d = { ...(row.data || {}) }
  if ('passageiros' in d) d.passageiros = encryptJSON(d.passageiros)
  for (const k of ['phone', 'email']) if (k in d) d[k] = encrypt(d[k])
  return { ...row, data: d }
}
const decAss = row => {
  if (!row?.data) return row
  const d = { ...row.data }
  if ('passageiros' in d) d.passageiros = decryptJSON(d.passageiros, [])
  for (const k of ['phone', 'email']) if (k in d) d[k] = decrypt(d[k])
  return { ...row, data: d }
}
const decAssRows = rows => (rows || []).map(decAss)

/* responsavel: quando informado, traz só as fichas dele */
export const listAssessorias = responsavel =>
  request(`${TABLE_ASS}?select=${ASS_COLS}&order=created_at.desc&limit=1000` +
    (responsavel ? `&data->>responsavel=eq.${encodeURIComponent(responsavel)}` : '')).then(decAssRows)

export const getAssessoriaOwner = id =>
  request(`${TABLE_ASS}?select=id,responsavel:data->>responsavel&id=eq.${encodeURIComponent(id)}`).then(r => r?.[0] || null)

export const insertAssessoria = row =>
  request(`${TABLE_ASS}?select=${ASS_COLS}`, { method: 'POST', body: encAss(row), prefer: 'return=representation' }).then(decAssRows)

export const updateAssessoria = (id, row) =>
  request(`${TABLE_ASS}?id=eq.${encodeURIComponent(id)}&select=${ASS_COLS}`, {
    method: 'PATCH', body: { ...encAss(row), updated_at: new Date().toISOString() }, prefer: 'return=representation',
  }).then(decAssRows)

export const deleteAssessoria = id =>
  request(`${TABLE_ASS}?id=eq.${encodeURIComponent(id)}&select=id`, { method: 'DELETE', prefer: 'return=representation' })

/* ── Migração: criptografa registros antigos que ainda estão em texto aberto ── */
export async function encryptExisting() {
  let leads = 0, assessorias = 0
  for (const l of await request(`${TABLE}?select=id,phone,email&limit=10000`) || []) {
    const enc = encLead({ phone: l.phone, email: l.email })
    if (enc.phone !== l.phone || enc.email !== l.email) {
      await request(`${TABLE}?id=eq.${l.id}`, { method: 'PATCH', body: enc })
      leads++
    }
  }
  for (const a of await request(`${TABLE_ASS}?select=id,data&limit=10000`) || []) {
    const enc = encAss({ data: a.data })
    if (JSON.stringify(enc.data) !== JSON.stringify(a.data)) {
      await request(`${TABLE_ASS}?id=eq.${a.id}`, { method: 'PATCH', body: { data: enc.data } })
      assessorias++
    }
  }
  return { leads, assessorias }
}

/* ── Registro de acessos (quem fez o quê, quando e de onde) ── */
export function audit(user, action, entity, entityId, ip) {
  return request('crm_audit', {
    method: 'POST',
    body: { user_email: user?.email || 'sistema', action, entity, entity_id: entityId == null ? null : String(entityId), ip: ip || null },
  }).catch(err => console.error('[audit]', err.message))
}

export const listAudit = (limit = 200) =>
  request(`crm_audit?select=*&order=at.desc&limit=${Math.min(Number(limit) || 200, 1000)}`)
