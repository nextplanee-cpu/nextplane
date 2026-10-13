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
    })),
    proxima: view.proxima?.acao ? { acao: str(view.proxima.acao, 200), data: date(view.proxima.data) } : null,
    documentos: (Array.isArray(view.documentos) ? view.documentos : []).slice(0, 60)
      .map(d => ({ grupo: str(d.grupo, 40), icon: str(d.icon, 8), titulo: str(d.titulo, 120), sub: str(d.sub, 120), link: https(d.link) }))
      .filter(d => d.link),
    atualizado: str(view.atualizado, 30),
  }
}
