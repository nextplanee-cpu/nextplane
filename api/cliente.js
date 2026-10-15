/**
 * Área do cliente (logado por CPF + senha) — somente leitura.
 *
 * GET              → as viagens dele: [{ id, ...retrato filtrado }]  (mesmos campos do link de acompanhamento:
 *                    sem passaporte, CPF, valores de lucro ou anotações internas)
 * GET ?a=&f=       → baixa um anexo (bilhete, voucher…) que aparece na página dele
 *
 * Exige sessão de cliente e que a senha provisória já tenha sido trocada (ver requireUser).
 * O cliente só enxerga fichas ligadas à conta dele (crm_assessorias.cliente_id).
 */
import { requireUser } from './_lib/auth.js'
import { clientIp, rateLimit } from './_lib/ratelimit.js'
import { dbConfigured, audit, listAssessoriasDoCliente } from './_lib/db.js'
import { publicView, anexoDoPortal } from './_lib/portal.js'
import { isFileId, downloadFile, sendFile } from './_lib/storage.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const cliente = await requireUser(req, res, { tipo: 'cliente' })
  if (!cliente) return
  const ip = clientIp(req)
  if (!rateLimit(`cliente:${cliente.id}`, { max: 120, windowMs: 60_000 })) return res.status(429).json({ error: 'too_many' })

  try {
    const fichas = (await listAssessoriasDoCliente(cliente.id)).filter(r => r.data?.status !== 'cancelada')

    if (req.query.f) {
      const f = String(req.query.f)
      const ficha = fichas.find(r => String(r.id) === String(req.query.a))
      const meta = ficha && isFileId(f) && ficha.data.portal_view && anexoDoPortal(ficha.data.portal_view, f)
      if (!meta) return res.status(404).json({ error: 'not_found' })
      const buf = await downloadFile(ficha.id, f)
      if (!buf) return res.status(404).json({ error: 'not_found' })
      audit({ email: `cliente:${cliente.id}` }, 'baixar_anexo', 'assessoria', ficha.id, ip)
      return sendFile(res, buf, { ...meta, baixar: req.query.baixar === '1' })
    }

    audit({ email: `cliente:${cliente.id}` }, 'ver', 'area_cliente', null, ip)
    return res.status(200).json(fichas.map(r => ({
      id: r.id,
      pronta: Boolean(r.data.portal_view),
      ...(r.data.portal_view ? publicView(r.data.portal_view, r.data) : {}),
    })))
  } catch (err) {
    console.error('[cliente]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
