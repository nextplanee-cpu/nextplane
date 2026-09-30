/**
 * Status e ligação da integração Meta (usado pelo botão no CRM, aba Leads Meta).
 * Só para admin logado.
 *
 * GET  → verifica token, Página e se o app recebe o campo leadgen
 * POST → assina o app na Página (subscribed_apps?subscribed_fields=leadgen)
 */
import { requireUser } from './_lib/auth.js'
import { pageStatus, subscribePage } from './_lib/meta.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!(await requireUser(req, res, { roles: ['admin'] }))) return

  const missing = ['META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_PAGE_ACCESS_TOKEN'].filter(k => !process.env[k])
  if (missing.length) return res.status(200).json({ ok: false, missing })

  try {
    const status = req.method === 'POST' ? await subscribePage() : await pageStatus()
    return res.status(200).json({ ok: true, missing: [], ...status })
  } catch (err) {
    console.error('[meta-setup]', err.message)
    return res.status(200).json({ ok: false, missing: [], error: err.message })
  }
}
