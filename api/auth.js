/**
 * Login (JWT próprio em cookie httpOnly). Equipe e cliente têm sessões separadas.
 *
 * GET  ?action=me[&tipo=cliente]   → quem está logado (ou 401)
 * POST ?action=login               → equipe: { email, password }
 * POST ?action=cliente-login       → cliente: { cpf, password }
 * POST ?action=senha               → { atual, nova, tipo? } troca a senha (obrigatória no 1º acesso)
 * POST ?action=logout              → { tipo? } encerra a sessão
 * POST ?action=encrypt             → (admin) criptografa registros antigos
 * GET  ?action=audit               → (admin) últimos acessos registrados
 *
 * Nos logins, `retornarToken: true` devolve o JWT no corpo (para apps/integrações; o navegador usa o cookie).
 */
import {
  getPrincipal, requireUser, entrar, trocarSenha, setSession, clearSession,
} from './_lib/auth.js'
import { rateLimit, clientIp, sameOrigin } from './_lib/ratelimit.js'
import { dbConfigured, query, audit, encryptExisting, listAudit } from './_lib/db.js'
import { encryptionEnabled, decrypt } from './_lib/crypto.js'
import { cpfDigitos, cpfValido, cpfHash } from './_lib/senha.js'

const tipoDe = v => (v === 'cliente' ? 'cliente' : 'staff')

/* O que o navegador pode saber sobre quem está logado */
const publico = p => (p.tipo === 'staff'
  ? { tipo: 'staff', email: p.email, nome: p.nome, role: p.role, trocar_senha: p.trocar_senha }
  : { tipo: 'cliente', nome: decrypt(p.nome_enc) || '', trocar_senha: p.trocar_senha })

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const action = req.query.action
  const ip = clientIp(req)

  try {
    if (action === 'me' && req.method === 'GET') {
      const p = await getPrincipal(req, res, tipoDe(req.query.tipo))
      if (!p) return res.status(401).json({ error: 'unauthorized' })
      if (p.denied) { clearSession(res, tipoDe(req.query.tipo)); return res.status(403).json({ error: 'not_allowed' }) }
      return res.status(200).json(publico(p))
    }

    /* ── Login da equipe: e-mail + senha ── */
    if (action === 'login' && req.method === 'POST') {
      if (!sameOrigin(req) && !req.body?.retornarToken) return res.status(403).json({ error: 'bad_origin' })
      const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200)
      const password = String(req.body?.password || '').slice(0, 200)
      if (!email || !password) return res.status(400).json({ error: 'bad_request' })
      // 5 tentativas por e-mail e 20 por IP a cada 15 min (além do bloqueio da conta no banco)
      if (!rateLimit(`login:${email}`, { max: 5, windowMs: 15 * 60_000 }) ||
          !rateLimit(`login-ip:${ip}`, { max: 20, windowMs: 15 * 60_000 })) {
        audit({ email }, 'login_bloqueado', 'auth', null, ip)
        return res.status(429).json({ error: 'too_many_attempts' })
      }
      const r = await entrar('staff', email, password)
      if (r.error) {
        audit({ email }, r.error === 'invalid_credentials' ? 'login_falhou' : `login_${r.error}`, 'auth', null, ip)
        return res.status(r.error === 'invalid_credentials' ? 401 : r.error === 'too_many_attempts' ? 429 : 403).json({ error: r.error })
      }
      setSession(res, 'staff', r.token)
      audit({ email }, 'login', 'auth', null, ip)
      return res.status(200).json({
        ...publico({ tipo: 'staff', ...r.row }),
        ...(req.body?.retornarToken ? { token: r.token } : {}),
      })
    }

    /* ── Login do cliente: CPF + senha ── */
    if (action === 'cliente-login' && req.method === 'POST') {
      if (!sameOrigin(req) && !req.body?.retornarToken) return res.status(403).json({ error: 'bad_origin' })
      const cpf = cpfDigitos(req.body?.cpf).slice(0, 11)
      const password = String(req.body?.password || '').slice(0, 200)
      if (!cpf || !password) return res.status(400).json({ error: 'bad_request' })
      // CPF inválido nem chega ao banco, mas gasta o mesmo limite (não dá para "testar" CPFs de graça)
      const alvo = cpfValido(cpf) ? cpfHash(cpf) : `invalido:${cpf}`
      if (!rateLimit(`cli:${alvo}`, { max: 5, windowMs: 15 * 60_000 }) ||
          !rateLimit(`cli-ip:${ip}`, { max: 20, windowMs: 15 * 60_000 })) {
        audit({ email: 'cliente' }, 'login_bloqueado', 'auth', null, ip)
        return res.status(429).json({ error: 'too_many_attempts' })
      }
      const achado = cpfValido(cpf) ? (await query('select id from crm_clientes where cpf_hash = $1', [alvo])).rows[0] : null
      const r = achado ? await entrar('cliente', achado.id, password) : await entrar('cliente', -1, password)
      if (r.error) {
        audit({ email: achado ? `cliente:${achado.id}` : 'cliente' }, r.error === 'invalid_credentials' ? 'login_falhou' : `login_${r.error}`, 'auth', null, ip)
        // mesma resposta para "CPF não existe" e "senha errada"
        return res.status(r.error === 'too_many_attempts' ? 429 : r.error === 'not_allowed' ? 403 : 401).json({ error: r.error })
      }
      setSession(res, 'cliente', r.token)
      audit({ email: `cliente:${r.row.id}` }, 'login', 'auth', null, ip)
      return res.status(200).json({
        ...publico({ tipo: 'cliente', ...r.row }),
        ...(req.body?.retornarToken ? { token: r.token } : {}),
      })
    }

    /* ── Trocar a senha (no 1º acesso do cliente é obrigatório) ── */
    if (action === 'senha' && req.method === 'POST') {
      if (!sameOrigin(req) && !req.headers.authorization) return res.status(403).json({ error: 'bad_origin' })
      const tipo = tipoDe(req.body?.tipo)
      const p = await getPrincipal(req, null, tipo)
      if (!p || p.denied) return res.status(401).json({ error: 'unauthorized' })
      const quem = tipo === 'staff' ? p.email : `cliente:${p.id}`
      if (!rateLimit(`senha:${quem}`, { max: 8, windowMs: 15 * 60_000 })) return res.status(429).json({ error: 'too_many_attempts' })
      const atual = String(req.body?.atual || '').slice(0, 200)
      const nova = String(req.body?.nova || '').slice(0, 200)
      let cpf = ''
      if (tipo === 'cliente') cpf = cpfDigitos(decrypt((await query('select cpf_enc from crm_clientes where id = $1', [p.id])).rows[0]?.cpf_enc))
      const r = await trocarSenha(tipo, tipo === 'staff' ? p.email : p.id, atual, nova, { cpf })
      if (r.error) {
        audit({ email: quem }, 'senha_troca_falhou', 'auth', null, ip)
        return res.status(r.error === 'unauthorized' ? 401 : 400).json({ error: r.error })
      }
      setSession(res, tipo, r.token)
      audit({ email: quem }, 'senha_trocada', 'auth', null, ip)
      return res.status(200).json({ ok: true, ...(req.body?.retornarToken ? { token: r.token } : {}) })
    }

    if (action === 'logout' && req.method === 'POST') {
      // sem tipo informado, encerra os dois (a sessão só existe no cookie; trocar a senha invalida os JWTs emitidos)
      clearSession(res, req.body?.tipo ? tipoDe(req.body.tipo) : null)
      return res.status(200).json({ ok: true })
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
