/**
 * Senhas (scrypt), CPF e senha provisória.
 * A senha nunca é guardada: só o hash scrypt com sal próprio de cada pessoa.
 */
import crypto from 'node:crypto'

const N_LOG2 = 15 // custo 2^15 (~100 ms por tentativa) — torna força bruta offline cara
const R = 8
const P = 1
const KEYLEN = 64
const maxmem = 128 * (2 ** N_LOG2) * R * 2

const scryptAsync = (pass, salt, n) => new Promise((resolve, reject) => {
  crypto.scrypt(pass.normalize('NFKC'), salt, KEYLEN, { N: n, r: R, p: P, maxmem }, (err, key) => (err ? reject(err) : resolve(key)))
})

/* "scrypt$15$8$1$<sal>$<hash>" — os parâmetros vão junto, então dá para aumentar o custo no futuro */
export async function hashSenha(senha) {
  const salt = crypto.randomBytes(16)
  const key = await scryptAsync(senha, salt, 2 ** N_LOG2)
  return `scrypt$${N_LOG2}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function confereSenha(senha, hash) {
  const [alg, log2, , , salt, key] = String(hash || '').split('$')
  if (alg !== 'scrypt' || !salt || !key) return false
  const esperado = Buffer.from(key, 'base64')
  const got = await scryptAsync(String(senha), Buffer.from(salt, 'base64'), 2 ** Number(log2))
  return got.length === esperado.length && crypto.timingSafeEqual(got, esperado)
}

/* Quando a pessoa não existe, confere contra um hash falso: o tempo de resposta não revela quem tem conta */
let falso
export async function confereFalso(senha) {
  falso ||= await hashSenha(crypto.randomBytes(16).toString('hex'))
  await confereSenha(senha, falso)
  return false
}

/* Regras de senha: equipe ≥ 10 caracteres; cliente ≥ 8 com letra e número */
export function senhaFraca(senha, { cliente = false, cpf = '' } = {}) {
  const s = String(senha || '')
  if (s.length > 200) return 'weak_password'
  if (cliente) {
    if (s.length < 8 || !/[a-zA-Z]/.test(s) || !/\d/.test(s)) return 'weak_password'
    if (cpf && s.replace(/\D/g, '').includes(cpf)) return 'weak_password'
  } else if (s.length < 10) return 'weak_password'
  if (/^(.)\1+$/.test(s)) return 'weak_password'
  return null
}

/* Senha provisória legível (sem 0/O, 1/l/I): o cliente troca no primeiro acesso */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
export function senhaProvisoria(tam = 10) {
  let s = ''
  while (s.length < tam) s += ALFABETO[crypto.randomInt(ALFABETO.length)]
  // garante letra e número, para já atender à regra de senha
  return /\d/.test(s) && /[a-zA-Z]/.test(s) ? s : senhaProvisoria(tam)
}

/* ── CPF ── */
export const cpfDigitos = v => String(v || '').replace(/\D/g, '')

export function cpfValido(v) {
  const d = cpfDigitos(v)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  for (const t of [9, 10]) {
    let soma = 0
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i)
    const dv = ((soma * 10) % 11) % 10
    if (dv !== Number(d[t])) return false
  }
  return true
}

export const cpfMascara = v => {
  const d = cpfDigitos(v)
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : d
}
export const cpfOculto = v => {
  const d = cpfDigitos(v)
  return d.length === 11 ? `***.***.${d.slice(6, 9)}-${d.slice(9)}` : ''
}

/* Índice para achar o cliente pelo CPF sem guardar o CPF aberto (HMAC com chave só do servidor) */
export function cpfHash(v) {
  const base = process.env.CPF_HASH_KEY || process.env.CRM_ENCRYPTION_KEY
  if (!base) throw new Error('sem CRM_ENCRYPTION_KEY (ou CPF_HASH_KEY) para indexar o CPF')
  const key = crypto.createHmac('sha256', base).update('nextplane-cpf-index-v1').digest()
  return crypto.createHmac('sha256', key).update(cpfDigitos(v)).digest('hex')
}
