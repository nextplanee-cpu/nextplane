/**
 * Link de acompanhamento do cliente (somente leitura).
 *
 * Token = "<id>-<versão>-<assinatura HMAC>". A assinatura usa uma chave do servidor,
 * então ninguém consegue montar um link válido trocando o número da assessoria.
 * Para invalidar um link, o CRM sobe a versão (portal.v) ou desativa (portal.ativo=false)
 * dentro da ficha — o servidor confere os dois antes de mostrar qualquer coisa.
 */
import crypto from 'node:crypto'

const SIG_LEN = 32 // 192 bits em base64url
const EXPIRA_DIAS = 7 // link deixa de funcionar 7 dias depois da volta

function secret() {
  const base = process.env.PORTAL_SECRET || process.env.CRM_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base) throw new Error('sem chave para assinar links do portal')
  return crypto.createHmac('sha256', base).update('nextplane-portal-v1').digest()
}

const sign = (id, v) =>
  crypto.createHmac('sha256', secret()).update(`${id}.${v}`).digest('base64url').slice(0, SIG_LEN)

export const makeToken = (id, v) => `${id}-${v}-${sign(id, v)}`

/* { id, v } se a assinatura confere; null caso contrário */
export function readToken(token) {
  const m = /^(\d{1,12})-(\d{1,6})-([A-Za-z0-9_-]{32})$/.exec(String(token || ''))
  if (!m) return null
  const [, id, v, sig] = m
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(id, v)))
  return ok ? { id, v: Number(v) } : null
}

/* Data a partir da qual o link expira (ISO yyyy-mm-dd) ou null se a viagem não tem volta definida */
export function expiraEm(fim) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fim || ''))) return null
  const d = new Date(`${fim}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + EXPIRA_DIAS)
  return d.toISOString().slice(0, 10)
}

/* ── O que o cliente pode ver: lista fechada de campos, nada além disso ── */
const str = (v, max = 200) => (v == null ? '' : String(v).slice(0, max))
const date = v => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : '')
const https = v => {
  try { const u = new URL(String(v)); return u.protocol === 'https:' ? u.href : '' } catch { return '' }
}
const ESTADOS = ['feito', 'atual', 'pendente']
const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : [])

/* Detalhes de cada item da etapa (voo, hotel, seguro…): campos já escolhidos pelo CRM, sem valores */
const item = it => ({
  titulo: str(it.titulo, 160),
  sub:    str(it.sub, 160),
  status: str(it.status, 40),
  ok:     !!it.ok,
  campos: arr(it.campos, 16).map(c => ({ l: str(c.l, 40), v: str(c.v, 200) })).filter(c => c.v),
  texto:  str(it.texto, 4000),
  link:   https(it.link),
  anexos: arr(it.anexos, 10).filter(x => FILE_ID.test(x?.id)).map(x => ({ id: x.id, nome: str(x.nome, 120), tipo: str(x.tipo, 40) })),
})

/* Ids dos anexos que o cliente pode baixar (só os que estão no retrato do link) */
export const anexoDoPortal = (view, fileId) => {
  for (const e of arr(view?.etapas, 20)) for (const it of arr(e.itens, 60)) {
    const hit = arr(it.anexos, 10).find(x => x?.id === fileId)
    if (hit) return { nome: str(hit.nome, 120) || 'anexo', tipo: str(hit.tipo, 40) }
  }
  return null
}

export function publicView(view = {}, { status, responsavel } = {}) {
  return {
    cliente:     str(view.cliente, 60),
    destino:     str(view.destino, 300),
    origem:      str(view.origem, 80),
    inicio:      date(view.inicio),
    fim:         date(view.fim),
    viajantes:   Number(view.viajantes) || null,
    responsavel: str(responsavel, 60),
    status:      ['concluida'].includes(status) ? 'concluida' : 'andamento',
    etapas: (Array.isArray(view.etapas) ? view.etapas : []).slice(0, 20).map(e => ({
      k:      str(e.k, 30),
      nome:   str(e.nome, 60),
      icon:   str(e.icon, 8),
      estado: ESTADOS.includes(e.estado) ? e.estado : 'pendente',
      done:   Number(e.done) || 0,
      total:  Number(e.total) || 0,
      unit:   str(e.unit, 40),
      goal:   str(e.goal, 200),
      itens:  arr(e.itens, 60).map(item),
    })),
    proxima: view.proxima?.acao ? { etapa: str(view.proxima.etapa, 60), acao: str(view.proxima.acao, 200), detalhe: str(view.proxima.detalhe, 200) } : null,
    atualizado: str(view.atualizado, 30),
  }
}
