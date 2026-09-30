/**
 * Next Plane — acesso aos leads na nuvem (via /api/leads na Vercel).
 * A sessão fica num cookie httpOnly (JWT do Supabase) — nenhuma chave ou token
 * é guardado no navegador nem acessível pelo JavaScript da página.
 */

const COLORS = ['#D4AF37','#8B5CF6','#3B82F6','#22C55E','#F97316','#EC4899','#06B6D4']

export class ApiError extends Error {
  constructor(status, code) { super(code || `HTTP ${status}`); this.status = status }
}

/* Chamada autenticada; sessão expirada avisa o CRM para voltar à tela de login */
export async function apiFetch(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch {}
  if (res.status === 401) window.dispatchEvent(new Event('crm:unauthorized'))
  if (!res.ok) throw new ApiError(res.status, data?.error)
  return data
}

const call = (method, { query = '', body } = {}) => apiFetch(`/api/leads${query}`, { method, body })

/* ── Sessão ── */
export const sessionMe   = () => fetch('/api/auth?action=me', { credentials: 'same-origin' })
  .then(async r => ({ status: r.status, data: await r.json().catch(() => ({})) }))
export const login       = (email, password) => apiFetch('/api/auth?action=login', { method: 'POST', body: { email, password } })
export const logout      = () => apiFetch('/api/auth?action=logout', { method: 'POST' }).catch(() => {})
export const encryptOld  = () => apiFetch('/api/auth?action=encrypt', { method: 'POST' })
export const fetchAudit  = () => apiFetch('/api/auth?action=audit')

/* Linha do banco → formato usado pelas telas do CRM */
export function rowToLead(r) {
  const words = String(r.name || '?').trim().split(/\s+/)
  const initials = (words.length >= 2 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase()
  const created = r.created_at ? new Date(r.created_at) : new Date()
  return {
    ...r,
    value: Number(r.value) || 0,
    stage: Number(r.stage) || 0,
    initials,
    color: COLORS[Number(r.id) % COLORS.length],
    date: created.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
    createdAt: created.toISOString(),
  }
}

export const fetchLeads  = () => call('GET').then(rows => rows.map(rowToLead))
export const createLead  = lead => call('POST', { body: lead }).then(rowToLead)
export const patchLead   = (id, fields) => call('PATCH', { query: `?id=${encodeURIComponent(id)}`, body: fields }).then(rowToLead)
export const removeLead  = id => call('DELETE', { query: `?id=${encodeURIComponent(id)}` })

/* Integração Meta: status (GET) e ligar app à Página (POST) */
export const metaStatus    = () => apiFetch('/api/meta-setup')
export const metaSubscribe = () => apiFetch('/api/meta-setup', { method: 'POST' })

/* Funil público → nuvem (não precisa de chave) */
export async function sendFunnelLead(lead) {
  const res = await fetch('/api/funil-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  })
  if (!res.ok) throw new ApiError(res.status)
}

/* Link de WhatsApp a partir do telefone do lead (assume Brasil se vier sem DDI) */
export function waLink(phone, name = '') {
  let digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 11) digits = `55${digits}`
  const first = String(name).trim().split(/\s+/)[0] || ''
  const msg = encodeURIComponent(`Olá${first ? `, ${first}` : ''}! Aqui é da Next Plane ✈️ Recebemos suas respostas sobre a viagem e vamos montar seu planejamento. Podemos conversar?`)
  return `https://wa.me/${digits}?text=${msg}`
}
