/**
 * Anexos das assessorias (bilhetes, vouchers, apólices) no PostgreSQL (tabela crm_anexos).
 * Cada arquivo é criptografado (AES-256-GCM) antes de gravar, então nem quem abrir o banco
 * ou um backup consegue ler. Só o servidor abre. Um backup do banco já leva os anexos junto.
 */
import { query } from './db.js'
import { encryptBuffer, decryptBuffer } from './crypto.js'

export const MAX_FILE = 8 * 1024 * 1024
export const TIPOS = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}
export const isFileId = f => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(f || ''))

/* Confere a assinatura do arquivo (não confia só no tipo informado pelo navegador) */
export function tipoReal(buf) {
  const h = buf.subarray(0, 12)
  if (h.subarray(0, 5).toString() === '%PDF-') return 'application/pdf'
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return 'image/jpeg'
  if (h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  return null
}

export async function uploadFile(assId, fileId, buf, tipo) {
  const dados = encryptBuffer(buf)
  await query('insert into crm_anexos (file_id, assessoria_id, tipo, tamanho, conteudo) values ($1, $2, $3, $4, $5)',
    [fileId, assId, tipo, buf.length, dados])
  return { tipo }
}

/* Anexos enviados antes da mudança ficaram no Supabase Storage (bucket crm-anexos). Enquanto
   SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY existirem no ambiente, continuam abrindo por aqui. */
async function baixarDoStorageAntigo(assId, fileId) {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
  if (!url || !key) return null
  try {
    const res = await fetch(`${url}/storage/v1/object/crm-anexos/${encodeURIComponent(assId)}/${encodeURIComponent(fileId)}`, {
      headers: { apikey: key, ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }) },
    })
    return res.ok ? decryptBuffer(Buffer.from(await res.arrayBuffer())) : null
  } catch { return null }
}

/* Buffer aberto ou null se não existe (ou se não é dessa assessoria) */
export async function downloadFile(assId, fileId) {
  const { rows } = await query('select conteudo from crm_anexos where file_id = $1 and assessoria_id = $2', [fileId, assId])
  if (!rows[0]) return baixarDoStorageAntigo(assId, fileId)
  return decryptBuffer(Buffer.from(rows[0].conteudo))
}

export const removeFile = (assId, fileId) =>
  query('delete from crm_anexos where file_id = $1 and assessoria_id = $2', [fileId, assId])

/* Ao excluir a ficha os anexos saem junto (on delete cascade); mantido para quem chama explicitamente */
export const removeFolder = assId => query('delete from crm_anexos where assessoria_id = $1', [assId])

/* Resposta HTTP com o arquivo (abre no navegador; PDF no visualizador) */
export function sendFile(res, buf, { nome = 'anexo', tipo, baixar = false }) {
  res.setHeader('Content-Type', TIPOS[tipo] ? tipo : 'application/octet-stream')
  res.setHeader('Content-Length', buf.length)
  res.setHeader('Content-Disposition', `${baixar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nome)}`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).end(buf)
}
