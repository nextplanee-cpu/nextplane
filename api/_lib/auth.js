/**
 * Autenticação do CRM — Supabase Auth (JWT) + cookies httpOnly.
 *
 * - Login por e-mail/senha ou Google (OAuth2 + PKCE). O Supabase emite um JWT de 1h
 *   e um refresh token; os dois ficam em cookies httpOnly/Secure/SameSite=Strict
 *   (o JavaScript da página não consegue ler → um XSS não rouba a sessão).
 * - Cada chamada valida o JWT no Supabase e confere o e-mail na tabela crm_users
 *   (lista de acesso + perfil admin/consultor). Sem linha ativa lá = sem acesso,
 *   mesmo com login válido.
 * - JWT vencido: renova sozinho com o refresh token (sessão cai após 12h sem uso).
 */
import crypto from 'node:crypto'
import { sameOrigin } from './ratelimit.js'

const AT = 'np_at', RT = 'np_rt'
const AT_AGE = 60 * 60            // 1h (validade do JWT do Supabase)
const RT_AGE = 12 * 60 * 60       // 12h sem uso → precisa entrar de novo

const authKey = () => process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

export async function gotrue(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: {
      apikey: authKey(),
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch {}
  return { ok: res.ok, status: res.status, data }
}

/* ── Cookies ── */
export function readCookies(req) {
  const out = {}
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

const cookie = (name, value, maxAge, path = '/api') =>
  `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`

export function addCookies(res, list) {
  const prev = res.getHeader('Set-Cookie')
  res.setHeader('Set-Cookie', [...(prev ? [].concat(prev) : []), ...list])
}

export function setSession(res, { access_token, refresh_token }) {
  addCookies(res, [cookie(AT, access_token, AT_AGE), cookie(RT, refresh_token, RT_AGE)])
}

export function clearSession(res) {
  addCookies(res, [cookie(AT, '', 0), cookie(RT, '', 0)])
}

/* ── Lista de acesso (crm_users) ── */
async function loadProfile(email) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/crm_users?select=email,nome,role&ativo=is.true&email=eq.${encodeURIComponent(email.toLowerCase())}`
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(url, {
    headers: { apikey: key, ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }) },
  })
  if (!res.ok) throw new Error(`crm_users → ${res.status}: ${await res.text()}`)
  const [row] = await res.json()
  return row ? { email: row.email, nome: row.nome || row.email, role: row.role === 'admin' ? 'admin' : 'consultor' } : null
}

/* Cache curto (60s) por token para não validar no Supabase a cada chamada */
const cache = new Map()
const hash = t => crypto.createHash('sha256').update(t).digest('hex')

async function userFromToken(token) {
  const h = hash(token)
  const hit = cache.get(h)
  if (hit && hit.until > Date.now()) return hit.user
  const r = await gotrue('user', { token })
  if (!r.ok || !r.data?.email) return null
  const profile = await loadProfile(r.data.email)
  if (profile) {
    cache.set(h, { user: profile, until: Date.now() + 60_000 })
    if (cache.size > 500) cache.clear()
  }
  return profile || { denied: true, email: r.data.email }
}

/**
 * Descobre o usuário da requisição (renovando o JWT se preciso).
 * Retorna { email, nome, role } | { denied, email } | null
 */
export async function getUser(req, res) {
  const c = readCookies(req)
  if (c[AT]) {
    const u = await userFromToken(c[AT])
    if (u) return u
  }
  if (!c[RT]) return null
  const r = await gotrue('token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: c[RT] } })
  if (!r.ok || !r.data?.access_token) { clearSession(res); return null }
  setSession(res, r.data)
  return userFromToken(r.data.access_token)
}

/**
 * Porteiro dos endpoints do CRM. Responde 401/403 e retorna null quando barrar.
 *   const user = await requireUser(req, res, { roles: ['admin'] })
 */
export async function requireUser(req, res, { roles } = {}) {
  if (req.method !== 'GET' && !sameOrigin(req)) {
    res.status(403).json({ error: 'bad_origin' })
    return null
  }
  let user
  try { user = await getUser(req, res) } catch (err) {
    console.error('[auth]', err.message)
    res.status(503).json({ error: 'auth_unavailable' })
    return null
  }
  if (!user) { res.status(401).json({ error: 'unauthorized' }); return null }
  if (user.denied) { res.status(403).json({ error: 'not_allowed' }); return null }
  if (roles && !roles.includes(user.role)) { res.status(403).json({ error: 'forbidden' }); return null }
  return user
}

export { loadProfile }
