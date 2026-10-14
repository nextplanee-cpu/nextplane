/**
 * Anexos das assessorias (bilhetes, vouchers, apólices) no Supabase Storage.
 * Bucket privado; cada arquivo é criptografado (AES-256-GCM) antes de subir,
 * então nem quem acessar o Storage direto consegue ler. Só o servidor abre.
 * Caminho: <id da assessoria>/<uuid do anexo>
 */
import { encryptBuffer, decryptBuffer } from './crypto.js'

const BUCKET = 'crm-anexos'
export const MAX_FILE = 4 * 1024 * 1024 // a Vercel aceita até ~4,5 MB por requisição
export const TIPOS = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}
export const isFileId = f => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(f || ''))

const base = () => `${process.env.SUPABASE_URL}/storage/v1`
function headers(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { apikey: key, ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }), ...extra }
}
const path = (assId, fileId) => `${encodeURIComponent(assId)}/${encodeURIComponent(fileId)}`

async function createBucket() {
  const res = await fetch(`${base()}/bucket`, {
    method: 'POST', headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  })
  if (!res.ok && res.status !== 409) {
    const t = await res.text()
    if (!/already exists|Duplicate/i.test(t)) throw new Error(`Storage bucket → ${res.status}: ${t}`)
  }
}

export async function uploadFile(assId, fileId, buf, tipo) {
  const send = () => fetch(`${base()}/object/${BUCKET}/${path(assId, fileId)}`, {
    method: 'POST', headers: headers({ 'Content-Type': 'application/octet-stream', 'x-upsert': 'false' }),
    body: encryptBuffer(buf),
  })
  let res = await send()
  if (!res.ok) {
    const t = await res.text()
    if (!/bucket.*not.*found|not_found|404/i.test(`${res.status} ${t}`)) throw new Error(`Storage upload → ${res.status}: ${t}`)
    await createBucket() // primeira vez: cria o bucket privado e tenta de novo
    res = await send()
    if (!res.ok) throw new Error(`Storage upload → ${res.status}: ${await res.text()}`)
  }
  return { tipo }
}

/* Buffer aberto ou null se não existe */
export async function downloadFile(assId, fileId) {
  const res = await fetch(`${base()}/object/${BUCKET}/${path(assId, fileId)}`, { headers: headers() })
  if (res.status === 404 || res.status === 400) return null
  if (!res.ok) throw new Error(`Storage download → ${res.status}: ${await res.text()}`)
  return decryptBuffer(Buffer.from(await res.arrayBuffer()))
}

export async function removeFiles(paths) {
  if (!paths.length) return
  const res = await fetch(`${base()}/object/${BUCKET}`, {
    method: 'DELETE', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: paths }),
  })
  if (!res.ok && res.status !== 404) throw new Error(`Storage delete → ${res.status}: ${await res.text()}`)
}
export const removeFile = (assId, fileId) => removeFiles([`${assId}/${fileId}`])

/* Todos os anexos de uma assessoria (ao excluir a ficha) */
export async function removeFolder(assId) {
  const res = await fetch(`${base()}/object/list/${BUCKET}`, {
    method: 'POST', headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix: `${assId}/`, limit: 1000 }),
  })
  if (!res.ok) return
  const list = await res.json().catch(() => [])
  await removeFiles((list || []).filter(o => o.name).map(o => `${assId}/${o.name}`))
}

/* Resposta HTTP com o arquivo (abre no navegador; PDF no visualizador) */
export function sendFile(res, buf, { nome = 'anexo', tipo, baixar = false }) {
  res.setHeader('Content-Type', TIPOS[tipo] ? tipo : 'application/octet-stream')
  res.setHeader('Content-Length', buf.length)
  res.setHeader('Content-Disposition', `${baixar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nome)}`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).end(buf)
}
