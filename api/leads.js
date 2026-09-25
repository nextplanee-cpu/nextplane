/**
 * API do CRM — lista, cria e atualiza leads no Supabase.
 * Protegida pela chave de acesso do CRM (header x-crm-key = CRM_ACCESS_KEY).
 *
 * GET               → todos os leads
 * POST  {lead}      → cria lead manual
 * PATCH ?id= {...}  → atualiza campos (estágio, temperatura, obs...)
 */
import { authorized } from './_lib/auth.js'
import { sanitize } from './_lib/leads.js'
import { dbConfigured, listLeads, insertLead, updateLead } from './_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured() || !process.env.CRM_ACCESS_KEY) {
    return res.status(503).json({ error: 'not_configured' })
  }
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' })

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await listLeads())
    }
    if (req.method === 'POST') {
      const row = sanitize(req.body)
      if (!row.name) return res.status(400).json({ error: 'name_required' })
      const [created] = await insertLead(row)
      return res.status(201).json(created)
    }
    if (req.method === 'PATCH') {
      const id = req.query.id
      const row = sanitize(req.body)
      if (!id || !Object.keys(row).length) return res.status(400).json({ error: 'bad_request' })
      const [updated] = await updateLead(id, row)
      return res.status(200).json(updated)
    }
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error('[leads]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
