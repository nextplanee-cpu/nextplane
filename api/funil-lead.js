/**
 * Endpoint público do funil /funil-europa → salva o lead no CRM (Supabase).
 * Só aceita os campos do funil e sempre entra no estágio "Lead Recebido".
 */
import { sanitize } from './_lib/leads.js'
import { dbConfigured, insertLead } from './_lib/supabase.js'

const TEMPS = ['Frio', 'Morno', 'Quente', 'VIP']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })

  const { name, phone, dest, type, value, temp, source, obs } = req.body || {}
  const row = sanitize({ name, phone, dest, type, value, temp, source, obs })
  if (!row.name) return res.status(400).json({ error: 'name_required' })
  row.stage = 0
  row.consultor = 'Joseph'
  if (!TEMPS.includes(row.temp)) row.temp = 'Morno'
  if (!String(row.source || '').startsWith('Landing')) row.source = 'Landing Europa'

  try {
    await insertLead(row)
    return res.status(201).json({ ok: true })
  } catch (err) {
    console.error('[funil-lead]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
