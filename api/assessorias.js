/**
 * API das Assessorias — cada viagem contratada é uma ficha (JSON em `data`).
 * Protegida pela chave de acesso do CRM (header x-crm-key = CRM_ACCESS_KEY).
 *
 * GET               → todas as fichas
 * POST  {data}      → cria ficha
 * PATCH ?id= {data} → substitui os dados da ficha
 * DELETE ?id=       → exclui a ficha
 */
import { authorized } from './_lib/auth.js'
import { dbConfigured, listAssessorias, insertAssessoria, updateAssessoria, deleteAssessoria } from './_lib/supabase.js'

const MAX_BYTES = 300_000

function clean(body) {
  const data = body?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (JSON.stringify(data).length > MAX_BYTES) return null
  const leadId = Number(data.lead_id)
  return { data, lead_id: Number.isFinite(leadId) && leadId > 0 ? leadId : null }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured() || !process.env.CRM_ACCESS_KEY) {
    return res.status(503).json({ error: 'not_configured' })
  }
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' })

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await listAssessorias())
    }
    if (req.method === 'POST') {
      const row = clean(req.body)
      if (!row) return res.status(400).json({ error: 'bad_request' })
      const [created] = await insertAssessoria(row)
      return res.status(201).json(created)
    }
    if (req.method === 'PATCH') {
      const id = req.query.id
      const row = clean(req.body)
      if (!id || !row) return res.status(400).json({ error: 'bad_request' })
      const [updated] = await updateAssessoria(id, row)
      if (!updated) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json(updated)
    }
    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'bad_request' })
      const deleted = await deleteAssessoria(id)
      if (!deleted?.length) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    }
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error('[assessorias]', err.message)
    // Tabela ainda não criada no Supabase
    if (/crm_assessorias/.test(err.message) && /PGRST205|does not exist|404/.test(err.message)) {
      return res.status(503).json({ error: 'table_missing' })
    }
    return res.status(500).json({ error: 'server_error' })
  }
}
