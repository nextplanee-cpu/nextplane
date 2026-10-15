/**
 * Acesso aos dados do CRM no PostgreSQL (só no servidor).
 * Telefone/e-mail dos leads e dados de passageiros são gravados criptografados
 * (ver crypto.js) e só são abertos aqui, no servidor, para quem tem acesso.
 */
import { query, dbConfigured } from '../../server/db.js'
import { encrypt, decrypt, encryptJSON, decryptJSON, isEncrypted, encryptionEnabled } from './crypto.js'

export { dbConfigured, query }

/* Monta "col = $n, ..." só com colunas permitidas: nome de coluna nunca vem do cliente sem passar pela lista */
function setClause(row, allowed, jsonCols = [], start = 1) {
  const cols = Object.keys(row).filter(k => allowed.includes(k))
  return {
    cols,
    sql: cols.map((k, i) => `${k} = $${start + i}${jsonCols.includes(k) ? '::jsonb' : ''}`).join(', '),
    vals: cols.map(k => (jsonCols.includes(k) ? JSON.stringify(row[k]) : row[k])),
  }
}

/* ── Leads ── */
const TABLE = 'crm_leads'
const LEAD_COLS = [
  'id', 'name', 'phone', 'email', 'cidade', 'dest', 'type', 'value', 'stage', 'temp', 'score',
  'pessoas', 'dias', 'investimento', 'source', 'consultor', 'obs', 'campaign_name', 'adset_name',
  'ad_name', 'form_name', 'respostas', 'platform', 'created_at', 'updated_at',
  'motivo_perda', 'motivo_perda_obs', 'perdido_em',
]
const LEAD_WRITE = [
  ...LEAD_COLS.filter(c => !['id', 'created_at', 'updated_at'].includes(c)), 'meta_lead_id', 'form_id', 'created_at',
]
const LEAD_SELECT = LEAD_COLS.join(', ')

/* Tudo que identifica o cliente vai criptografado. Ficam abertos só campos de controle
   (estágio, temperatura, score, valor, origem, campanha, datas) — nenhum identifica a pessoa. */
const LEAD_SECRET = ['name', 'phone', 'email', 'cidade', 'dest', 'obs', 'motivo_perda_obs']
const LEAD_SECRET_JSON = ['respostas']
const encLead = row => {
  const out = { ...row }
  for (const k of LEAD_SECRET) if (k in out) out[k] = encrypt(out[k])
  for (const k of LEAD_SECRET_JSON) if (k in out && !isEncrypted(out[k])) out[k] = encryptJSON(out[k])
  return out
}
const decLead = row => {
  if (!row) return row
  const out = { ...row }
  for (const k of LEAD_SECRET) if (k in out) out[k] = decrypt(out[k])
  for (const k of LEAD_SECRET_JSON) if (k in out) out[k] = decryptJSON(out[k], [])
  return out
}
const decRows = rows => (rows || []).map(decLead)

/* consultor: quando informado, traz só os leads dele */
export const listLeads = async consultor => {
  const r = consultor
    ? await query(`select ${LEAD_SELECT} from ${TABLE} where consultor = $1 order by created_at desc limit 2000`, [consultor])
    : await query(`select ${LEAD_SELECT} from ${TABLE} order by created_at desc limit 2000`)
  return decRows(r.rows)
}

export const getLead = async id => (await query(`select id, consultor from ${TABLE} where id = $1`, [id])).rows[0] || null

async function insertRow(table, row, allowed, jsonCols, { ignoreDuplicate = false, returning }) {
  const cols = Object.keys(row).filter(k => allowed.includes(k))
  const vals = cols.map(k => (jsonCols.includes(k) ? JSON.stringify(row[k]) : row[k]))
  const marks = cols.map((k, i) => `$${i + 1}${jsonCols.includes(k) ? '::jsonb' : ''}`)
  const sql = `insert into ${table} (${cols.join(', ')}) values (${marks.join(', ')})` +
    (ignoreDuplicate ? ' on conflict do nothing' : '') + ` returning ${returning}`
  return (await query(sql, vals)).rows
}

export const insertLead = row => insertRow(TABLE, encLead(row), LEAD_WRITE, ['respostas'], { returning: LEAD_SELECT }).then(decRows)

/* Lead da Meta: ignora duplicado (a Meta pode reenviar o mesmo webhook) sem sobrescrever o estágio */
export const insertMetaLead = row => insertRow(TABLE, encLead(row), LEAD_WRITE, ['respostas'], { ignoreDuplicate: true, returning: 'id' })

export const updateLead = async (id, row) => {
  const { sql, vals } = setClause(encLead(row), LEAD_WRITE, ['respostas'])
  if (!sql) return []
  const r = await query(`update ${TABLE} set ${sql}, updated_at = now() where id = $${vals.length + 1} returning ${LEAD_SELECT}`, [...vals, id])
  return decRows(r.rows)
}

export const deleteLead = async id => (await query(`delete from ${TABLE} where id = $1 returning id`, [id])).rows

/* ── Assessorias (gestão operacional das viagens contratadas) ── */
const TABLE_ASS = 'crm_assessorias'
const ASS_COLS = 'id, lead_id, cliente_id, data, created_at'

/* A ficha inteira vai criptografada num único bloco (`_enc`): cliente, contato, passageiros
   (CPF, passaporte, nascimento), voos, hotéis, reservas, roteiro, observações, histórico.
   Só `responsavel` fica aberto — o servidor precisa dele para saber quem pode ver a ficha. */
const legacyOpen = d => {
  const out = { ...d }
  if ('passageiros' in out) out.passageiros = decryptJSON(out.passageiros, [])
  for (const k of ['phone', 'email']) if (k in out) out[k] = decrypt(out[k])
  return out
}
const encAss = row => {
  const d = row.data || {}
  if (isEncrypted(d._enc) || !encryptionEnabled()) return row
  const { responsavel = '', ...rest } = legacyOpen(d)
  return { ...row, data: { responsavel, _enc: encryptJSON(rest) } }
}
const decAss = row => {
  if (!row?.data) return row
  const { _enc, responsavel, ...rest } = row.data
  const body = _enc ? decryptJSON(_enc, {}) : legacyOpen(rest)
  return { ...row, data: { ...body, responsavel } }
}
const decAssRows = rows => (rows || []).map(decAss)

/* responsavel: quando informado, traz só as fichas dele */
export const listAssessorias = async responsavel => {
  const r = responsavel
    ? await query(`select ${ASS_COLS} from ${TABLE_ASS} where data->>'responsavel' = $1 order by created_at desc limit 1000`, [responsavel])
    : await query(`select ${ASS_COLS} from ${TABLE_ASS} order by created_at desc limit 1000`)
  return decAssRows(r.rows)
}

export const getAssessoriaOwner = async id =>
  (await query(`select id, cliente_id, data->>'responsavel' as responsavel from ${TABLE_ASS} where id = $1`, [id])).rows[0] || null

/* Ficha completa (aberta) — usada pelo portal do cliente, que filtra o que sai */
export const getAssessoria = async id =>
  decAss((await query(`select ${ASS_COLS}, updated_at from ${TABLE_ASS} where id = $1`, [id])).rows[0] || null)

/* Fichas ligadas a um cliente (acesso por CPF) */
export const listAssessoriasDoCliente = async clienteId =>
  decAssRows((await query(`select ${ASS_COLS}, updated_at from ${TABLE_ASS} where cliente_id = $1 order by created_at desc`, [clienteId])).rows)

export const insertAssessoria = async row => {
  const e = encAss(row)
  const r = await query(`insert into ${TABLE_ASS} (lead_id, data) values ($1, $2::jsonb) returning ${ASS_COLS}`, [e.lead_id ?? null, JSON.stringify(e.data)])
  return decAssRows(r.rows)
}

export const updateAssessoria = async (id, row) => {
  const e = encAss(row)
  const r = await query(
    `update ${TABLE_ASS} set data = $1::jsonb, lead_id = $2, updated_at = now() where id = $3 returning ${ASS_COLS}`,
    [JSON.stringify(e.data), e.lead_id ?? null, id])
  return decAssRows(r.rows)
}

export const deleteAssessoria = async id => (await query(`delete from ${TABLE_ASS} where id = $1 returning id`, [id])).rows

export const setAssessoriaCliente = (id, clienteId) =>
  query(`update ${TABLE_ASS} set cliente_id = $1 where id = $2`, [clienteId, id])

/* ── Criptografa registros antigos que ainda estão em texto aberto ── */
export async function encryptExisting() {
  let leads = 0, assessorias = 0
  const fields = [...LEAD_SECRET, ...LEAD_SECRET_JSON]
  for (const l of (await query(`select id, ${fields.join(', ')} from ${TABLE} limit 10000`)).rows) {
    const { id, ...orig } = l
    const enc = encLead(orig)
    if (JSON.stringify(enc) !== JSON.stringify(orig)) {
      const { sql, vals } = setClause(enc, fields, LEAD_SECRET_JSON)
      await query(`update ${TABLE} set ${sql} where id = $${vals.length + 1}`, [...vals, id])
      leads++
    }
  }
  for (const a of (await query(`select id, data from ${TABLE_ASS} limit 10000`)).rows) {
    const enc = encAss({ data: a.data })
    if (JSON.stringify(enc.data) !== JSON.stringify(a.data)) {
      await query(`update ${TABLE_ASS} set data = $1::jsonb where id = $2`, [JSON.stringify(enc.data), a.id])
      assessorias++
    }
  }
  return { leads, assessorias }
}

/* ── Registro de acessos (quem fez o quê, quando e de onde) ── */
export function audit(user, action, entity, entityId, ip) {
  return query('insert into crm_audit (user_email, action, entity, entity_id, ip) values ($1, $2, $3, $4, $5)',
    [user?.email || 'sistema', action, entity, entityId == null ? null : String(entityId), ip || null])
    .catch(err => console.error('[audit]', err.message))
}

export const listAudit = async (limit = 200) =>
  (await query('select * from crm_audit order by at desc limit $1', [Math.min(Number(limit) || 200, 1000)])).rows
