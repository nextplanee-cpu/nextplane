/**
 * Anexos das assessorias (PDF ou imagem de bilhetes, vouchers, apólices).
 * Exige login no CRM e acesso à ficha (admin ou responsável).
 *
 * POST   ?a=<assessoria>&nome=<arquivo>&tipo=<mime>  corpo = o arquivo (binário, até 4 MB)
 *        → { id, nome, tipo, tamanho }  (o CRM guarda isso no item da ficha)
 * GET    ?a=&f=&nome=&tipo=  → abre o arquivo
 * DELETE ?a=&f=               → apaga o arquivo
 */
import crypto from 'node:crypto'
import { requireUser } from './_lib/auth.js'
import { clientIp } from './_lib/ratelimit.js'
import { dbConfigured, getAssessoriaOwner, audit } from './_lib/supabase.js'
import { MAX_FILE, TIPOS, isFileId, uploadFile, downloadFile, removeFile, sendFile } from './_lib/storage.js'

export const config = { api: { bodyParser: false } }

function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body)
  return new Promise((resolve, reject) => {
    const parts = []
    let size = 0
    req.on('data', c => {
      size += c.length
      if (size > MAX_FILE) { reject(Object.assign(new Error('too_large'), { code: 413 })); req.destroy() }
      else parts.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(parts)))
    req.on('error', reject)
  })
}

/* Confere a assinatura do arquivo (não confia só no tipo informado pelo navegador) */
function tipoReal(buf) {
  const h = buf.subarray(0, 12)
  if (h.subarray(0, 5).toString() === '%PDF-') return 'application/pdf'
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return 'image/jpeg'
  if (h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  return null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const user = await requireUser(req, res)
  if (!user) return
  const ip = clientIp(req)
  const assId = String(req.query.a || '')
  if (!/^\d+$/.test(assId)) return res.status(400).json({ error: 'bad_request' })

  try {
    const owner = await getAssessoriaOwner(assId)
    if (!owner || (user.role !== 'admin' && owner.responsavel !== user.nome)) return res.status(404).json({ error: 'not_found' })

    if (req.method === 'POST') {
      let buf
      try { buf = await rawBody(req) } catch (e) { return res.status(e.code === 413 ? 413 : 400).json({ error: e.code === 413 ? 'too_large' : 'bad_request' }) }
      if (!buf.length) return res.status(400).json({ error: 'empty' })
      if (buf.length > MAX_FILE) return res.status(413).json({ error: 'too_large' })
      const tipo = tipoReal(buf)
      if (!tipo) return res.status(415).json({ error: 'bad_type' })
      const id = crypto.randomUUID()
      const nome = String(req.query.nome || `anexo.${TIPOS[tipo]}`).replace(/[\\/\r\n"]/g, '_').slice(0, 120)
      await uploadFile(assId, id, buf, tipo)
      audit(user, 'anexar', 'assessoria', assId, ip)
      return res.status(201).json({ id, nome, tipo, tamanho: buf.length })
    }

    const f = String(req.query.f || '')
    if (!isFileId(f)) return res.status(400).json({ error: 'bad_request' })

    if (req.method === 'GET') {
      const buf = await downloadFile(assId, f)
      if (!buf) return res.status(404).json({ error: 'not_found' })
      return sendFile(res, buf, { nome: String(req.query.nome || 'anexo'), tipo: tipoReal(buf), baixar: req.query.baixar === '1' })
    }
    if (req.method === 'DELETE') {
      await removeFile(assId, f)
      audit(user, 'remover_anexo', 'assessoria', assId, ip)
      return res.status(200).json({ ok: true })
    }
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error('[anexos]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
