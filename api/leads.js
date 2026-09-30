/**
 * API do CRM — lista, cria e atualiza leads no Supabase.
 * Exige login (JWT em cookie — ver _lib/auth.js).
 *   admin     → vê e altera todos os leads, pode excluir
 *   consultor → vê e altera só os leads atribuídos a ele, não exclui nem reatribui
 *
 * GET               → leads visíveis para o usuário
 * POST  {lead}      → cria lead manual
 * PATCH ?id= {...}  → atualiza campos (estágio, temperatura, obs...)
 * DELETE ?id=       → exclui o lead (só admin)
 */
import { requireUser } from './_lib/auth.js'
import { sanitize, STAGE_PERDIDO } from './_lib/leads.js'
import { clientIp } from './_lib/ratelimit.js'
import { dbConfigured, listLeads, getLead, insertLead, updateLead, deleteLead, audit } from './_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const user = await requireUser(req, res)
  if (!user) return
  const isAdmin = user.role === 'admin'
  const ip = clientIp(req)

  /* Consultor só mexe no que é dele */
  const canTouch = async id => {
    if (isAdmin) return true
    const lead = await getLead(id)
    return Boolean(lead && lead.consultor === user.nome)
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await listLeads(isAdmin ? null : user.nome))
    }
    if (req.method === 'POST') {
      const row = sanitize(req.body)
      if (!row.name) return res.status(400).json({ error: 'name_required' })
      if (row.stage === STAGE_PERDIDO && !String(row.motivo_perda || '').trim()) {
        return res.status(400).json({ error: 'motivo_required' })
      }
      if (!isAdmin) row.consultor = user.nome
      const [created] = await insertLead(row)
      audit(user, 'criar', 'lead', created?.id, ip)
      return res.status(201).json(created)
    }
    if (req.method === 'PATCH') {
      const id = req.query.id
      const row = sanitize(req.body)
      if (!isAdmin) delete row.consultor
      if (!id || !Object.keys(row).length) return res.status(400).json({ error: 'bad_request' })
      // Perder um lead exige motivo (base da análise de perdas)
      if (row.stage === STAGE_PERDIDO && !String(row.motivo_perda || '').trim()) {
        return res.status(400).json({ error: 'motivo_required' })
      }
      if (!(await canTouch(id))) return res.status(404).json({ error: 'not_found' })
      const [updated] = await updateLead(id, row)
      audit(user, `editar:${Object.keys(row).join(',')}`, 'lead', id, ip)
      return res.status(200).json(updated)
    }
    if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ error: 'forbidden' })
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'bad_request' })
      const deleted = await deleteLead(id)
      if (!deleted?.length) return res.status(404).json({ error: 'not_found' })
      audit(user, 'excluir', 'lead', id, ip)
      return res.status(200).json({ ok: true })
    }
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error('[leads]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
