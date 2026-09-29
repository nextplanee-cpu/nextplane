/**
 * Next Plane — fichas de Assessoria na nuvem (via /api/assessorias na Vercel).
 * Usa a mesma chave de acesso do CRM.
 */
import { getAccessKey, ApiError } from './leadsApi'

async function call(method, { query = '', body } = {}) {
  const res = await fetch(`/api/assessorias${query}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-crm-key': getAccessKey() },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw new ApiError(res.status, data?.error)
  return data
}

/* Linha do banco → ficha usada na tela */
const rowToAss = r => ({ ...(r.data || {}), id: r.id, createdAt: r.created_at })
/* Ficha → dados salvos (sem campos da linha) */
const assToData = ({ id, createdAt, ...data }) => data

export const fetchAssessorias = () => call('GET').then(rows => rows.map(rowToAss))
export const createAssessoria = a => call('POST', { body: { data: assToData(a) } }).then(rowToAss)
export const saveAssessoria   = a => call('PATCH', { query: `?id=${encodeURIComponent(a.id)}`, body: { data: assToData(a) } }).then(rowToAss)
export const removeAssessoria = id => call('DELETE', { query: `?id=${encodeURIComponent(id)}` })

/* WhatsApp com texto livre (assume Brasil se vier sem DDI) */
export function waText(phone, text) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits && digits.length <= 11) digits = `55${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
