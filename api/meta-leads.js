/**
 * Webhook da Meta (Lead Ads) → Supabase.
 *
 * GET  = verificação do webhook (hub.challenge)
 * POST = evento "leadgen": busca o lead completo na Graph API e salva no CRM
 *
 * Variáveis de ambiente (Vercel):
 *   META_VERIFY_TOKEN        texto qualquer, igual ao configurado no app da Meta
 *   META_APP_SECRET          chave secreta do app (valida a assinatura)
 *   META_PAGE_ACCESS_TOKEN   token do Usuário do sistema (ou da Página) com leads_retrieval
 *   META_API_VERSION         opcional (padrão v23.0)
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */
import crypto from 'node:crypto'
import { metaLeadToRow } from './_lib/leads.js'
import { fetchLead } from './_lib/meta.js'
import { dbConfigured, insertMetaLead } from './_lib/supabase.js'

async function readRaw(req) {
  const chunks = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(chunks)
}

function validSignature(raw, header) {
  const secret = process.env.META_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const got = header.slice(7)
  return got.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query
    if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }
    return res.status(403).send('forbidden')
  }

  if (req.method !== 'POST') return res.status(405).send('method not allowed')

  const raw = await readRaw(req)
  if (!validSignature(raw, req.headers['x-hub-signature-256'])) {
    return res.status(401).send('invalid signature')
  }
  if (!dbConfigured() || !process.env.META_PAGE_ACCESS_TOKEN) {
    console.error('[meta-leads] variáveis de ambiente faltando')
    return res.status(503).send('not configured')
  }

  let payload
  try { payload = JSON.parse(raw.toString('utf8')) } catch { return res.status(400).send('bad json') }

  const ids = []
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) ids.push(change.value.leadgen_id)
    }
  }

  try {
    for (const id of ids) {
      let meta
      try {
        meta = await fetchLead(id)
      } catch (err) {
        // Lead inexistente (ex.: botão "Teste" do painel da Meta manda um ID falso): não adianta reenviar
        if (err.meta?.code === 100) { console.warn(`[meta-leads] lead ${id} ignorado: ${err.message}`); continue }
        throw err
      }
      await insertMetaLead(metaLeadToRow(meta))
      console.log(`[meta-leads] lead ${id} salvo`)
    }
    return res.status(200).json({ ok: true, received: ids.length })
  } catch (err) {
    // status != 200 faz a Meta reenviar depois; duplicados são ignorados no banco
    console.error('[meta-leads]', err.message)
    return res.status(500).json({ ok: false })
  }
}
