/**
 * Login do CRM (Supabase Auth → JWT em cookie httpOnly).
 *
 * GET  ?action=me         → usuário logado { email, nome, role } (ou 401)
 * POST ?action=login      → { email, password }
 * POST ?action=logout     → encerra a sessão
 * GET  ?action=google     → redireciona para o Google (OAuth2 + PKCE)
 * GET  ?action=callback   → volta do Google, troca o código pela sessão
 * POST ?action=encrypt    → (admin) criptografa registros antigos
 * GET  ?action=audit      → (admin) últimos acessos registrados
 */
import crypto from 'node:crypto'
import {
  gotrue, getUser, requireUser, setSession, clearSession, readCookies, addCookies, loadProfile,
} from './_lib/auth.js'
import { rateLimit, clientIp, sameOrigin } from './_lib/ratelimit.js'
import { dbConfigured, audit, encryptExisting, listAudit } from './_lib/supabase.js'
import { encryptionEnabled } from './_lib/crypto.js'

const PKCE = 'np_pkce'
const b64url = buf => buf.toString('base64url')
const origin = req => `https://${req.headers['x-forwarded-host'] || req.headers.host}`

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const action = req.query.action
  const ip = clientIp(req)

  try {
    if (action === 'me' && req.method === 'GET') {
      const user = await getUser(req, res)
      const google = process.env.AUTH_GOOGLE === 'on'
      if (!user) return res.status(401).json({ error: 'unauthorized', google })
      if (user.denied) { clearSession(res); return res.status(403).json({ error: 'not_allowed', google }) }
      return res.status(200).json({ ...user, google })
    }

    if (action === 'login' && req.method === 'POST') {
      if (!sameOrigin(req)) return res.status(403).json({ error: 'bad_origin' })
      const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200)
      const password = String(req.body?.password || '').slice(0, 200)
      if (!email || !password) return res.status(400).json({ error: 'bad_request' })
      // 5 tentativas por e-mail e 20 por IP a cada 15 min
      if (!rateLimit(`login:${email}`, { max: 5, windowMs: 15 * 60_000 }) ||
          !rateLimit(`login-ip:${ip}`, { max: 20, windowMs: 15 * 60_000 })) {
        audit({ email }, 'login_bloqueado', 'auth', null, ip)
        return res.status(429).json({ error: 'too_many_attempts' })
      }
      const r = await gotrue('token?grant_type=password', { method: 'POST', body: { email, password } })
      if (!r.ok || !r.data?.access_token) {
        audit({ email }, 'login_falhou', 'auth', null, ip)
        return res.status(401).json({ error: 'invalid_credentials' })
      }
      const profile = await loadProfile(email)
      if (!profile) {
        audit({ email }, 'login_negado', 'auth', null, ip)
        return res.status(403).json({ error: 'not_allowed' })
      }
      setSession(res, r.data)
      audit(profile, 'login', 'auth', null, ip)
      return res.status(200).json(profile)
    }

    if (action === 'logout' && req.method === 'POST') {
      const c = readCookies(req)
      if (c.np_at) await gotrue('logout', { method: 'POST', token: c.np_at }).catch(() => {})
      clearSession(res)
      return res.status(200).json({ ok: true })
    }

    if (action === 'google' && req.method === 'GET') {
      if (process.env.AUTH_GOOGLE !== 'on') return res.status(404).json({ error: 'disabled' })
      const verifier = b64url(crypto.randomBytes(32))
      const challenge = b64url(crypto.createHash('sha256').update(verifier).digest())
      addCookies(res, [`${PKCE}=${verifier}; Path=/api/auth; Max-Age=600; HttpOnly; Secure; SameSite=Lax`])
      const url = new URL(`${process.env.SUPABASE_URL}/auth/v1/authorize`)
      url.searchParams.set('provider', 'google')
      url.searchParams.set('redirect_to', `${origin(req)}/api/auth?action=callback`)
      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', 's256')
      res.setHeader('Location', url.toString())
      return res.status(302).end()
    }

    if (action === 'callback' && req.method === 'GET') {
      const verifier = readCookies(req)[PKCE]
      addCookies(res, [`${PKCE}=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax`])
      const back = err => { res.setHeader('Location', `/crm${err ? `?erro=${err}` : ''}`); return res.status(302).end() }
      if (!verifier || !req.query.code) return back('google')
      const r = await gotrue('token?grant_type=pkce', {
        method: 'POST', body: { auth_code: String(req.query.code), code_verifier: verifier },
      })
      if (!r.ok || !r.data?.access_token) return back('google')
      const profile = await loadProfile(r.data.user?.email || '')
      if (!profile) {
        audit({ email: r.data.user?.email }, 'login_negado', 'auth', 'google', ip)
        await gotrue('logout', { method: 'POST', token: r.data.access_token }).catch(() => {})
        return back('nao_autorizado')
      }
      setSession(res, r.data)
      audit(profile, 'login', 'auth', 'google', ip)
      return back()
    }

    if (action === 'encrypt' && req.method === 'POST') {
      const user = await requireUser(req, res, { roles: ['admin'] })
      if (!user) return
      if (!encryptionEnabled()) return res.status(400).json({ error: 'no_encryption_key' })
      const result = await encryptExisting()
      audit(user, 'criptografar_existentes', 'sistema', null, ip)
      return res.status(200).json({ ok: true, ...result })
    }

    if (action === 'audit' && req.method === 'GET') {
      const user = await requireUser(req, res, { roles: ['admin'] })
      if (!user) return
      return res.status(200).json(await listAudit(req.query.limit))
    }

    return res.status(404).json({ error: 'not_found' })
  } catch (err) {
    console.error('[auth]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
