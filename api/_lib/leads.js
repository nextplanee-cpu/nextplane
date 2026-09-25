/**
 * Regras de negócio dos leads — compartilhadas pelos endpoints /api.
 * Converte respostas do formulário da Meta em lead do CRM e calcula a temperatura.
 */

const norm = s => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/_/g, ' ').replace(/\s+/g, ' ')
  .trim().toLowerCase()

/* ── Normalização das respostas do formulário "Assessoria Viagem" ── */
export function parseDestino(v) {
  const s = norm(v)
  if (s.includes('europa')) return 'Europa'
  if (s.includes('eua') || s.includes('estados unidos')) return 'EUA'
  if (s.includes('asia')) return 'Ásia'
  if (s.includes('oceania')) return 'Oceania'
  return v ? String(v) : ''
}

export function parsePessoas(v) {
  const s = norm(v)
  if (!s) return ''
  if (s.includes('5') || s.includes('mais')) return '5+'
  if (s.includes('3') || s.includes('4')) return '3-4'
  if (s.includes('2')) return '2'
  if (s.includes('1')) return '1'
  return String(v)
}

export function parseDias(v) {
  const s = norm(v)
  if (!s) return ''
  if (s.includes('acima') || s.includes('mais')) return '15+'
  if (s.includes('11')) return '11-15'
  if (s.includes('10')) return 'ate10'
  return String(v)
}

export function parseInvestimento(v) {
  const s = norm(v)
  if (!s) return ''
  if (s.includes('acima')) return '40+'
  if (s.includes('30') && s.includes('40')) return '30-40'
  if (s.includes('20') && s.includes('30')) return '20-30'
  if (s.includes('ate') || s.includes('20')) return 'ate20'
  return String(v)
}

/* Valor estimado (R$) usado no pipeline — ponto médio de cada faixa */
const VALOR_INVEST = { 'ate20': 15000, '20-30': 25000, '30-40': 35000, '40+': 45000 }

/* ── Score 0-10 e temperatura ── */
export function scoreLead({ investimento, dias, pessoas, dest }) {
  let score = 0
  score += { 'ate20': 0, '20-30': 2, '30-40': 3, '40+': 4 }[investimento] ?? 0
  score += { 'ate10': 0, '11-15': 1, '15+': 2 }[dias] ?? 0
  score += { '1': 0, '2': 1, '3-4': 2, '5+': 2 }[pessoas] ?? 0
  if (['Europa', 'Ásia', 'Oceania'].includes(dest)) score += 1
  if (dest === 'EUA') score += 1
  let temp = 'Frio'
  if (investimento === '40+' && score >= 7) temp = 'VIP'
  else if (score >= 6) temp = 'Quente'
  else if (score >= 3) temp = 'Morno'
  return { score, temp }
}

/* ── field_data da Graph API → objeto { chave: valor } ── */
function fieldMap(fieldData = []) {
  const out = {}
  for (const f of fieldData) out[norm(f.name)] = Array.isArray(f.values) ? f.values[0] : f.values
  return out
}

function pick(map, ...keywords) {
  const key = Object.keys(map).find(k => keywords.some(w => k.includes(w)))
  return key ? map[key] : ''
}

/**
 * Lead da Graph API (GET /{leadgen_id}) → linha da tabela crm_leads.
 */
export function metaLeadToRow(meta) {
  const f = fieldMap(meta.field_data)
  const dest         = parseDestino(pick(f, 'destino'))
  const pessoas      = parsePessoas(pick(f, 'pessoas'))
  const dias         = parseDias(pick(f, 'dias'))
  const investimento = parseInvestimento(pick(f, 'investimento', 'valor'))
  const { score, temp } = scoreLead({ investimento, dias, pessoas, dest })

  return {
    meta_lead_id:  String(meta.id),
    name:          pick(f, 'full name', 'nome') || 'Lead Meta Ads',
    phone:         pick(f, 'phone', 'telefone'),
    email:         pick(f, 'email', 'e-mail'),
    dest,
    type:          dest === 'Europa' ? 'Europa' : 'Internacional',
    value:         VALOR_INVEST[investimento] ?? 0,
    stage:         0,
    temp,
    score,
    pessoas,
    dias,
    investimento,
    source:        'Meta Ads',
    consultor:     'Joseph',
    campaign_name: meta.campaign_name || '',
    adset_name:    meta.adset_name || '',
    ad_name:       meta.ad_name || '',
    form_id:       meta.form_id ? String(meta.form_id) : '',
    platform:      meta.platform || '',
    created_at:    meta.created_time ? new Date(meta.created_time).toISOString() : new Date().toISOString(),
  }
}

/* Campos que o CRM pode criar/alterar manualmente */
export const EDITABLE = [
  'name', 'phone', 'email', 'cidade', 'dest', 'type', 'value', 'stage', 'temp',
  'source', 'consultor', 'obs', 'pessoas', 'dias', 'investimento',
]

export function sanitize(body = {}) {
  const row = {}
  for (const k of EDITABLE) {
    if (body[k] === undefined) continue
    if (k === 'value' || k === 'stage') {
      const n = Number(body[k])
      if (Number.isFinite(n)) row[k] = n
    } else {
      row[k] = String(body[k]).slice(0, 2000)
    }
  }
  return row
}
