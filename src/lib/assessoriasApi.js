/**
 * Next Plane — fichas de Assessoria na nuvem (via /api/assessorias na Vercel).
 * Usa a mesma sessão (login) do CRM.
 */
import { apiFetch } from './leadsApi'

const call = (method, { query = '', body } = {}) => apiFetch(`/api/assessorias${query}`, { method, body })

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
