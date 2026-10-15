/**
 * Link de acompanhamento do cliente — página pública /acompanhar/<token>.
 *
 * GET ?t=<token>         → público, somente leitura: andamento da viagem (campos filtrados)
 * GET ?id=<id>&v=<versão> → exige login no CRM: devolve o token assinado para montar o link
 *
 * Não existe escrita aqui: o cliente não consegue alterar nada.
 * O link para de funcionar quando o CRM o desativa, gera um novo (versão),
 * a assessoria é cancelada/excluída ou 7 dias depois da data de volta.
 */
import { requireUser } from './_lib/auth.js'
import { clientIp, rateLimit } from './_lib/ratelimit.js'
import { dbConfigured, getAssessoria, getAssessoriaOwner, audit } from './_lib/db.js'
import { makeToken, readToken, expiraEm, publicView, anexoDoPortal } from './_lib/portal.js'
import { isFileId, downloadFile, sendFile } from './_lib/storage.js'

const today = () => new Date().toISOString().slice(0, 10)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const ip = clientIp(req)

  try {
    /* ── CRM: gerar o token de uma ficha ── */
    if (!req.query.t) {
      const user = await requireUser(req, res)
      if (!user) return
      const id = String(req.query.id || '')
      const v = Number(req.query.v)
      if (!/^\d+$/.test(id) || !Number.isInteger(v) || v < 1) return res.status(400).json({ error: 'bad_request' })
      const owner = await getAssessoriaOwner(id)
      if (!owner || (user.role !== 'admin' && owner.responsavel !== user.nome)) return res.status(404).json({ error: 'not_found' })
      audit(user, 'link_cliente', 'assessoria', id, ip)
      return res.status(200).json({ token: makeToken(id, v) })
    }

    /* ── Cliente: ver o andamento ── */
    if (!rateLimit(`portal:${ip}`, { max: 60, windowMs: 60_000 })) return res.status(429).json({ error: 'too_many' })
    const tk = readToken(req.query.t)
    if (!tk) return res.status(404).json({ error: 'not_found' })
    const row = await getAssessoria(tk.id)
    const a = row?.data
    if (!a || !a.portal?.ativo || Number(a.portal.v) !== tk.v || a.status === 'cancelada' || !a.portal_view) {
      return res.status(404).json({ error: 'not_found' })
    }
    const expira = expiraEm(a.fim)
    if (expira && today() > expira) return res.status(410).json({ error: 'expired' })

    /* Anexo (bilhete, voucher…): só os que aparecem na página do cliente */
    if (req.query.f) {
      const f = String(req.query.f)
      const meta = isFileId(f) && anexoDoPortal(a.portal_view, f)
      if (!meta) return res.status(404).json({ error: 'not_found' })
      const buf = await downloadFile(tk.id, f)
      if (!buf) return res.status(404).json({ error: 'not_found' })
      audit({ email: 'cliente (link)' }, 'baixar_anexo', 'portal', tk.id, ip)
      return sendFile(res, buf, { ...meta, baixar: req.query.baixar === '1' })
    }

    audit({ email: 'cliente (link)' }, 'ver', 'portal', tk.id, ip)
    return res.status(200).json({ ...publicView(a.portal_view, a), expira })
  } catch (err) {
    console.error('[portal]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
