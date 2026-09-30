/**
 * Criptografia de campos sensíveis (AES-256-GCM) antes de gravar no banco.
 * Chave: CRM_ENCRYPTION_KEY na Vercel (32 bytes em base64 — gerar com
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
 * Quem copiar o banco vê só "enc:v1:..." — sem a chave, os dados são ilegíveis.
 */
import crypto from 'node:crypto'

const PREFIX = 'enc:v1:'
let warned = false

function key() {
  const raw = process.env.CRM_ENCRYPTION_KEY
  if (!raw) {
    if (!warned) { console.warn('[crypto] CRM_ENCRYPTION_KEY ausente — dados gravados sem criptografia'); warned = true }
    return null
  }
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('CRM_ENCRYPTION_KEY precisa ter 32 bytes em base64')
  return buf
}

export const encryptionEnabled = () => Boolean(process.env.CRM_ENCRYPTION_KEY)
export const isEncrypted = v => typeof v === 'string' && v.startsWith(PREFIX)

export function encrypt(value) {
  if (value == null || value === '' || isEncrypted(value)) return value
  const k = key()
  if (!k) return value
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv)
  const ct = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  return PREFIX + [iv, cipher.getAuthTag(), ct].map(b => b.toString('base64')).join(':')
}

export function decrypt(value) {
  if (!isEncrypted(value)) return value
  const k = key()
  if (!k) return ''
  try {
    const [iv, tag, ct] = value.slice(PREFIX.length).split(':').map(s => Buffer.from(s, 'base64'))
    const decipher = crypto.createDecipheriv('aes-256-gcm', k, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch {
    console.error('[crypto] falha ao descriptografar (chave trocada ou dado corrompido)')
    return ''
  }
}

/* Valores JSON (ex.: lista de passageiros) */
export const encryptJSON = v => (v == null ? v : encrypt(JSON.stringify(v)))
export function decryptJSON(v, fallback) {
  if (!isEncrypted(v)) return v ?? fallback
  try { return JSON.parse(decrypt(v)) } catch { return fallback }
}
