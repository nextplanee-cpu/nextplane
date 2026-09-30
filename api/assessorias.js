/**
 * API das Assessorias — cada viagem contratada é uma ficha (JSON em `data`).
 * Exige login (JWT em cookie — ver _lib/auth.js).
 *   admin     → todas as fichas, pode excluir
 *   consultor → só as fichas em que é o responsável, não exclui
 * Passageiros e contato do cliente são gravados criptografados.
 *
 * GET               → fichas visíveis para o usuário
 * POST  {data}      → cria ficha
 * PATCH ?id= {data} → substitui os dados da ficha
 * DELETE ?id=       → exclui a ficha (só admin)
 */
import { requireUser } from './_lib/auth.js'
import { clientIp } from './_lib/ratelimit.js'
import {
  dbConfigured, listAssessorias, getAssessoriaOwner, insertAssessoria, updateAssessoria, deleteAssessoria, audit,
} from './_lib/supabase.js'

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
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const user = await requireUser(req, res)
  if (!user) return
  const isAdmin = user.role === 'admin'
  const ip = clientIp(req)

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await listAssessorias(isAdmin ? null : user.nome))
    }
    if (req.method === 'POST') {
      const row = clean(req.body)
      if (!row) return res.status(400).json({ error: 'bad_request' })
      if (!isAdmin) row.data.responsavel = user.nome
      const [created] = await insertAssessoria(row)
      audit(user, 'criar', 'assessoria', created?.id, ip)
      return res.status(201).json(created)
    }
    if (req.method === 'PATCH') {
      const id = req.query.id
      const row = clean(req.body)
      if (!id || !row) return res.status(400).json({ error: 'bad_request' })
      if (!isAdmin) {
        const owner = await getAssessoriaOwner(id)
        if (!owner || owner.responsavel !== user.nome) return res.status(404).json({ error: 'not_found' })
        row.data.responsavel = user.nome
      }
      const [updated] = await updateAssessoria(id, row)
      if (!updated) return res.status(404).json({ error: 'not_found' })
      audit(user, 'editar', 'assessoria', id, ip)
      return res.status(200).json(updated)
    }
    if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ error: 'forbidden' })
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'bad_request' })
      const deleted = await deleteAssessoria(id)
      if (!deleted?.length) return res.status(404).json({ error: 'not_found' })
      audit(user, 'excluir', 'assessoria', id, ip)
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
