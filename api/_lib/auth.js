/**
 * Autenticação — JWT próprio (HS256) assinado com JWT_SECRET.
 *
 * Dois tipos de acesso, com cookies separados (dá para testar os dois no mesmo navegador):
 *   staff   → equipe (admin ou consultor), login por e-mail + senha      → cookie np_at
 *   cliente → cliente da assessoria, login por CPF + senha                → cookie np_ct
 *
 * O JWT vai num cookie httpOnly/Secure/SameSite=Strict (o JavaScript da página não lê → um XSS
 * não rouba a sessão). Também vale se vier em `Authorization: Bearer <jwt>` (apps/integrações futuras).
 *
 * Cada chamada confere no banco se a pessoa continua ativa e se a "versão" do token bate:
 * trocar a senha ou desativar o acesso derruba as sessões antigas na hora (cache de até 30 s).
 * A sessão renova sozinha enquanto a pessoa usa e cai após 12h sem uso.
 */
import crypto from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { query } from './db.js'
import { sameOrigin } from './ratelimit.js'
import { confereSenha, confereFalso, hashSenha, senhaFraca } from './senha.js'

const ISSUER = 'nextplane'
const SESSAO_S = 12 * 60 * 60   // sem uso por 12h → precisa entrar de novo
const RENOVA_S = 15 * 60        // a cada 15 min de uso, emite um JWT novo
const MAX_FALHAS = 5            // erros seguidos → conta bloqueada por 15 min
const BLOQUEIO_MIN = 15

export const COOKIE = { staff: 'np_at', cliente: 'np_ct' }
const TABELA = { staff: 'crm_users', cliente: 'crm_clientes' }
const CHAVE = { staff: 'email', cliente: 'id' }

/* JWT_SECRET (mín. 32 caracteres). Se não existir, deriva uma chave própria da CRM_ENCRYPTION_KEY
   (HMAC com rótulo fixo): mesma força, e dispensa configurar mais uma variável */
function segredo() {
  let s = process.env.JWT_SECRET || ''
  if (!s && process.env.CRM_ENCRYPTION_KEY) {
    s = crypto.createHmac('sha256', process.env.CRM_ENCRYPTION_KEY).update('nextplane-jwt-v1').digest('hex')
  }
  if (s.length < 32) throw new Error('JWT_SECRET ausente ou curto demais (mínimo 32 caracteres)')
  return new TextEncoder().encode(s)
}

export async function assinar({ tipo, sub, v, role }) {
  return new SignJWT({ tipo, v, ...(role ? { role } : {}) })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(ISSUER)
    .setAudience(tipo)
    .setSubject(String(sub))
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${SESSAO_S}s`)
    .sign(segredo())
}

async function verificar(token, tipo) {
  try {
    const { payload } = await jwtVerify(token, segredo(), { issuer: ISSUER, audience: tipo, algorithms: ['HS256'] })
    return payload.tipo === tipo ? payload : null
  } catch { return null }
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

const secure = () => (process.env.COOKIE_SECURE === 'false' ? '' : '; Secure')
const cookie = (name, value, maxAge) =>
  `${name}=${encodeURIComponent(value)}; Path=/api; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure()}`

export function addCookies(res, list) {
  const prev = res.getHeader('Set-Cookie')
  res.setHeader('Set-Cookie', [...(prev ? [].concat(prev) : []), ...list])
}
export const setSession = (res, tipo, jwt) => addCookies(res, [cookie(COOKIE[tipo], jwt, SESSAO_S)])
export const clearSession = (res, tipo) =>
  addCookies(res, (tipo ? [tipo] : Object.keys(COOKIE)).map(t => cookie(COOKIE[t], '', 0)))

/* ── Quem é a pessoa do token (com cache curto) ── */
const cache = new Map()
export const esquecer = (tipo, sub) => cache.delete(`${tipo}:${sub}`)

async function carregar(tipo, sub) {
  const key = `${tipo}:${sub}`
  const hit = cache.get(key)
  if (hit && hit.ate > Date.now()) return hit.row
  const cols = tipo === 'staff' ? 'email, nome, role, ativo, trocar_senha, token_ver' : 'id, nome_enc, ativo, trocar_senha, token_ver'
  const { rows } = await query(`select ${cols} from ${TABELA[tipo]} where ${CHAVE[tipo]} = $1`, [sub])
  const row = rows[0] || null
  cache.set(key, { row, ate: Date.now() + 30_000 })
  if (cache.size > 1000) cache.clear()
  return row
}

const principalDe = (tipo, row) => (tipo === 'staff'
  ? { tipo, email: row.email, nome: row.nome || row.email, role: row.role === 'admin' ? 'admin' : 'consultor', trocar_senha: row.trocar_senha }
  : { tipo, id: row.id, nome_enc: row.nome_enc, trocar_senha: row.trocar_senha })

const bearer = req => (/^Bearer (.+)$/i.exec(req.headers.authorization || '') || [])[1] || ''

/**
 * Descobre quem fez a requisição. Retorna o principal, { denied } (token ok mas acesso desativado) ou null.
 * Renova o cookie quando o JWT já tem mais de 15 min de uso.
 */
export async function getPrincipal(req, res, tipo = 'staff') {
  const token = bearer(req) || readCookies(req)[COOKIE[tipo]]
  if (!token) return null
  const p = await verificar(token, tipo)
  if (!p) return null
  const row = await carregar(tipo, p.sub)
  if (!row || row.token_ver !== p.v) return null
  if (!row.ativo) return { denied: true }
  if (res && !bearer(req) && Date.now() / 1000 - p.iat > RENOVA_S) {
    setSession(res, tipo, await assinar({ tipo, sub: p.sub, v: row.token_ver, role: p.role }))
  }
  return principalDe(tipo, row)
}

/**
 * Porteiro dos endpoints do CRM (equipe). Responde 401/403 e retorna null quando barrar.
 *   const user = await requireUser(req, res, { roles: ['admin'] })
 */
export async function requireUser(req, res, { roles, tipo = 'staff' } = {}) {
  if (req.method !== 'GET' && !bearer(req) && !sameOrigin(req)) {
    res.status(403).json({ error: 'bad_origin' })
    return null
  }
  let user
  try { user = await getPrincipal(req, res, tipo) } catch (err) {
    console.error('[auth]', err.message)
    res.status(503).json({ error: 'auth_unavailable' })
    return null
  }
  if (!user) { res.status(401).json({ error: 'unauthorized' }); return null }
  if (user.denied) { res.status(403).json({ error: 'not_allowed' }); return null }
  if (user.trocar_senha) { res.status(403).json({ error: 'must_change_password' }); return null }
  if (roles && !roles.includes(user.role)) { res.status(403).json({ error: 'forbidden' }); return null }
  return user
}

/* ── Login (compartilhado entre equipe e cliente) ── */
/**
 * @returns {{ error } | { row, token }}
 *   error: invalid_credentials | too_many_attempts | not_allowed
 */
export async function entrar(tipo, identificador, senha) {
  const tabela = TABELA[tipo], chave = CHAVE[tipo]
  const { rows } = await query(`select * from ${tabela} where ${chave} = $1`, [identificador])
  const row = rows[0]
  if (!row || !row.senha_hash) { await confereFalso(senha); return { error: 'invalid_credentials' } }
  if (row.bloqueado_ate && new Date(row.bloqueado_ate) > new Date()) return { error: 'too_many_attempts' }

  if (!(await confereSenha(senha, row.senha_hash))) {
    const falhas = row.falhas + 1
    if (falhas >= MAX_FALHAS) {
      await query(`update ${tabela} set falhas = 0, bloqueado_ate = now() + make_interval(mins => $2::int) where ${chave} = $1`, [identificador, BLOQUEIO_MIN])
    } else {
      await query(`update ${tabela} set falhas = $2 where ${chave} = $1`, [identificador, falhas])
    }
    return { error: 'invalid_credentials' }
  }
  if (!row.ativo) return { error: 'not_allowed' }
  await query(`update ${tabela} set falhas = 0, bloqueado_ate = null, ultimo_acesso = now() where ${chave} = $1`, [identificador])
  const token = await assinar({ tipo, sub: row[chave], v: row.token_ver, role: tipo === 'staff' ? row.role : undefined })
  return { row, token }
}

/**
 * Troca de senha de quem está logado (obrigatória no primeiro acesso).
 * Sobe token_ver → todas as sessões antigas caem; devolve o JWT novo.
 * @returns {{ error } | { token }}
 */
export async function trocarSenha(tipo, sub, atual, nova, { cpf = '' } = {}) {
  const tabela = TABELA[tipo], chave = CHAVE[tipo]
  const { rows } = await query(`select * from ${tabela} where ${chave} = $1`, [sub])
  const row = rows[0]
  if (!row || !row.ativo) return { error: 'unauthorized' }
  if (!(await confereSenha(atual, row.senha_hash))) return { error: 'invalid_credentials' }
  const fraca = senhaFraca(nova, { cliente: tipo === 'cliente', cpf })
  if (fraca) return { error: fraca }
  if (await confereSenha(nova, row.senha_hash)) return { error: 'same_password' }
  const { rows: [novo] } = await query(
    `update ${tabela} set senha_hash = $1, trocar_senha = false, token_ver = token_ver + 1 where ${chave} = $2 returning token_ver`,
    [await hashSenha(nova), sub])
  esquecer(tipo, sub)
  return { token: await assinar({ tipo, sub: row[chave], v: novo.token_ver, role: tipo === 'staff' ? row.role : undefined }) }
}
