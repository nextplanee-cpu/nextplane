/**
 * Next Plane — fichas de Assessoria na nuvem (via /api/assessorias).
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

/* Anexos (PDF/imagem de bilhetes, vouchers, apólices) — guardados criptografados no servidor */
export const MAX_ANEXO = 4 * 1024 * 1024
export async function uploadAnexo(assId, file) {
  const q = `?a=${encodeURIComponent(assId)}&nome=${encodeURIComponent(file.name)}&tipo=${encodeURIComponent(file.type)}`
  const res = await fetch(`/api/anexos${q}`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream' }, body: file,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) window.dispatchEvent(new Event('crm:unauthorized'))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}
export const anexoUrl = (assId, x) =>
  `/api/anexos?a=${encodeURIComponent(assId)}&f=${encodeURIComponent(x.id)}&nome=${encodeURIComponent(x.nome || 'anexo')}`
export const removeAnexo = (assId, id) =>
  apiFetch(`/api/anexos?a=${encodeURIComponent(assId)}&f=${encodeURIComponent(id)}`, { method: 'DELETE' })

/* Link de acompanhamento do cliente (somente leitura) */
export const portalLink = (id, v) =>
  apiFetch(`/api/portal?id=${encodeURIComponent(id)}&v=${encodeURIComponent(v)}`)
    .then(({ token }) => `${window.location.origin}/acompanhar/${token}`)

/* Acesso do cliente por CPF + senha (a senha provisória só vem na resposta de criar/redefinir) */
const acessoUrl = id => `/api/acesso-cliente?assessoria=${encodeURIComponent(id)}`
export const acessoStatus    = id => apiFetch(acessoUrl(id))
export const acessoCriar     = (id, cpf, nome) => apiFetch('/api/acesso-cliente', { method: 'POST', body: { assessoria: id, cpf, nome } })
export const acessoRedefinir = id => apiFetch('/api/acesso-cliente', { method: 'PUT', body: { assessoria: id } })
export const acessoRemover   = id => apiFetch(acessoUrl(id), { method: 'DELETE' })
export const clienteUrl      = () => `${window.location.origin}/cliente`

/* WhatsApp com texto livre (assume Brasil se vier sem DDI) */
export function waText(phone, text) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits && digits.length <= 11) digits = `55${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
