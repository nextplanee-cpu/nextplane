/**
 * Next Plane — página do cliente para acompanhar a assessoria (somente leitura).
 * Rota: /acompanhar/:token  →  dados vêm de /api/portal?t=<token>, já filtrados no servidor.
 * Visual: mesma linha profissional do CRM (crm/ui.jsx) — navy + dourado, ícones de linha, sem emoji.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plane, Calendar, MapPin, Users, ChevronDown, Check, FileText, Image as ImageIcon, Download, Eye,
  ExternalLink, MessageCircle, Handshake, Compass, TrainFront, Car, BedDouble, ShieldCheck, Ticket,
  Wifi, CalendarDays, ArrowRight, Clock, Lock, FolderOpen,
} from 'lucide-react'
import { T, num, GlobalStyle, Card, Bar } from './crm/ui'
import { PHONE } from '../lib/whatsapp'

const ICON = {
  onboarding:Handshake, rota:Compass, aereo:Plane, trem:TrainFront, aluguel:Car, hotel:BedDouble,
  seguro:ShieldCheck, exp:Ticket, internet:Wifi, roteiro:CalendarDays, previagem:Users,
}
const iconOf = k => ICON[k] || Check

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const fmtLongo = d => (d ? `${Number(d.slice(8, 10))} de ${MESES[Number(d.slice(5, 7)) - 1]} de ${d.slice(0, 4)}` : '')
const fmtCurto = d => (d ? d.split('-').reverse().join('/') : '')
const hoje = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}` }
const diasAte = d => (d ? Math.round((new Date(`${d}T00:00`) - new Date(`${hoje()}T00:00`)) / 864e5) : null)

const Titulo = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>{children}</h2>
    {sub && <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{sub}</div>}
  </div>
)

export default function Acompanhar() {
  const { token } = useParams()
  const [st, setSt] = useState({ loading: true })

  useEffect(() => {
    document.title = 'Acompanhe sua viagem | Next Plane'
    // index.html diz "index, follow" para o site; aqui a página é privada
    const meta = document.querySelector('meta[name="robots"]')
    const antes = meta?.content
    if (meta) meta.content = 'noindex, nofollow'
    return () => { if (meta) meta.content = antes }
  }, [])

  useEffect(() => {
    let vivo = true
    fetch(`/api/portal?t=${encodeURIComponent(token || '')}`, { cache: 'no-store' })
      .then(async r => ({ status: r.status, data: await r.json().catch(() => null) }))
      .then(({ status, data }) => vivo && setSt(status === 200 ? { data } : { erro: status }))
      .catch(() => vivo && setSt({ erro: 0 }))
    return () => { vivo = false }
  }, [token])

  return (
    <div className="crm-root" style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <GlobalStyle/>
      <style>{`
        .np-wrap { max-width: 760px; margin: 0 auto; padding: 0 16px; }
        .np-step:hover { background: rgba(255,255,255,0.03); }
        .np-link:hover { border-color: rgba(255,255,255,0.22) !important; color: ${T.text} !important; }
        .np-gold:hover { filter: brightness(1.08); }
      `}</style>

      <header style={{ borderBottom: `1px solid ${T.line}`, background: T.header }}>
        <div className="np-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, height: 58 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: T.goldSoft, border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={15} color={T.gold}/>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Next Plane</div>
            <div style={{ fontSize: 11, color: T.faint }}>Assessoria de viagem</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: T.faint, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12}/> Acesso exclusivo
          </span>
        </div>
      </header>

      <main className="np-wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {st.loading ? <Aviso titulo="Carregando sua viagem…"/>
          : st.erro === 410 ? <Aviso titulo="Este link expirou" texto="A viagem já terminou. Se precisar de algo, fale com a gente pelo WhatsApp." wa/>
          : st.erro ? <Aviso titulo={st.erro === 404 ? 'Link indisponível' : 'Não foi possível carregar agora'}
              texto={st.erro === 404 ? 'Este link não existe mais ou foi desativado. Peça um novo ao seu consultor.' : 'Tente novamente em alguns instantes.'} wa/>
          : <Viagem v={st.data} token={token}/>}
      </main>

      <footer style={{ borderTop: `1px solid ${T.line}`, padding: '20px 16px', textAlign: 'center', fontSize: 12, color: T.faint }}>
        Página exclusiva e somente para visualização · Next Plane Viagens
      </footer>
    </div>
  )
}

function Aviso({ titulo, texto, wa }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: T.goldSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Plane size={22} color={T.gold}/>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{titulo}</h1>
      {texto && <p style={{ color: T.muted, fontSize: 14, margin: '0 0 22px' }}>{texto}</p>}
      {wa && <WaBtn texto="Olá! Preciso de ajuda com o link de acompanhamento da minha viagem."/>}
    </div>
  )
}

const WaBtn = ({ texto, label = 'Falar no WhatsApp' }) => (
  <a href={`https://wa.me/${PHONE}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className="np-gold"
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.gold, color: '#0B1220', fontWeight: 700,
      fontSize: 14, padding: '11px 20px', borderRadius: 8, textDecoration: 'none' }}>
    <MessageCircle size={16}/> {label}
  </a>
)

function Viagem({ v, token }) {
  const [aberta, setAberta] = useState({})
  const etapas = v.etapas || []
  const feitas = etapas.filter(e => e.estado === 'feito').length
  const pct = etapas.length ? feitas / etapas.length : 0
  const dIda = diasAte(v.inicio)
  const dVolta = diasAte(v.fim)
  const tudoPronto = etapas.length > 0 && feitas === etapas.length

  let contagem = null
  if (dIda !== null && dIda > 1) contagem = { n: dIda, l: 'dias para o embarque' }
  else if (dIda === 1) contagem = { t: 'Seu embarque é amanhã' }
  else if (dIda === 0) contagem = { t: 'Seu embarque é hoje. Boa viagem!' }
  else if (dIda !== null && (dVolta === null || dVolta >= 0)) contagem = { t: 'Boa viagem! Aproveite cada momento.' }
  else if (dVolta !== null && dVolta < 0) contagem = { t: 'Esperamos que a viagem tenha sido incrível.' }

  const docs = etapas.flatMap(e => (e.itens || []).filter(it => it.link || it.anexos?.length).map(it => ({ ...it, etapa: e })))

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Abertura */}
      <section style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 14, color: T.muted }}>Olá{v.cliente ? `, ${v.cliente}` : ''}. Esta é a sua viagem para</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', lineHeight: 1.2, fontWeight: 700, margin: '6px 0 0', letterSpacing: '-0.4px' }}>
          {v.destino || 'seu próximo destino'}
        </h1>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: T.muted, marginTop: 12 }}>
          {v.inicio && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Calendar size={14} color={T.faint}/> {fmtLongo(v.inicio)}{v.fim ? ` a ${fmtLongo(v.fim)}` : ''}</span>}
          {v.origem && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><MapPin size={14} color={T.faint}/> Saindo de {v.origem}</span>}
          {v.viajantes && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Users size={14} color={T.faint}/> {v.viajantes} viajante{v.viajantes > 1 ? 's' : ''}</span>}
        </div>
      </section>

      {/* Contagem + progresso */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Embarque</div>
          {contagem?.n !== undefined
            ? <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: T.gold, letterSpacing: '-0.5px', ...num }}>{contagem.n}</span>
                <span style={{ fontSize: 14, color: T.muted }}>{contagem.l}</span>
              </div>
            : <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600 }}>{contagem?.t || 'Data a definir'}</div>}
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, fontWeight: 500 }}>
            <span>{tudoPronto ? 'Tudo pronto para a viagem' : 'Organização da viagem'}</span>
            <span style={{ color: T.text, fontWeight: 600, ...num }}>{Math.round(pct * 100)}%</span>
          </div>
          <div style={{ margin: '14px 0 10px' }}><Bar pct={pct} color={tudoPronto ? T.success : T.gold} height={6}/></div>
          <div style={{ fontSize: 12, color: T.faint, ...num }}>{feitas} de {etapas.length} etapas concluídas</div>
        </Card>
      </div>

      {/* Próximo passo */}
      {v.proxima && !tudoPronto && (
        <Card style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: T.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowRight size={16} color={T.gold}/>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Próximo passo{v.proxima.etapa ? <> · <span style={{ color: T.gold }}>{v.proxima.etapa}</span></> : null}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{v.proxima.acao}</div>
            {v.proxima.detalhe && <div style={{ fontSize: 12, color: T.faint, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12}/> {v.proxima.detalhe}</div>}
          </div>
        </Card>
      )}

      {/* Etapas */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 18px 6px' }}>
          <Titulo sub="Toque em uma etapa para ver os detalhes.">Etapas da sua assessoria</Titulo>
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {etapas.map((e, i) => {
            const Icon = iconOf(e.k)
            const temItens = (e.itens || []).length > 0
            const open = aberta[e.k]
            const feito = e.estado === 'feito', atual = e.estado === 'atual'
            return (
              <li key={e.k} style={{ borderTop: `1px solid ${T.line}` }}>
                <button type="button" disabled={!temItens} onClick={() => setAberta(p => ({ ...p, [e.k]: !p[e.k] }))} aria-expanded={!!open}
                  className={temItens ? 'np-step' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 18px', background: atual ? 'rgba(212,175,55,0.05)' : 'transparent',
                    border: 'none', color: 'inherit', fontFamily: 'inherit', textAlign: 'left', cursor: temItens ? 'pointer' : 'default',
                    boxShadow: atual ? `inset 2px 0 0 ${T.gold}` : 'none' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: feito ? 'rgba(34,197,94,0.12)' : atual ? T.goldSoft : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${feito ? 'rgba(34,197,94,0.3)' : atual ? 'rgba(212,175,55,0.35)' : T.line}` }}>
                    {feito ? <Check size={16} color="#4ADE80" strokeWidth={2.2}/> : <Icon size={16} color={atual ? T.gold : T.faint} strokeWidth={1.8}/>}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: feito || atual ? 600 : 500, color: feito || atual ? T.text : T.muted }}>{e.nome}</span>
                    <span style={{ display: 'block', fontSize: 12, marginTop: 2, color: feito ? '#4ADE80' : atual ? T.gold : T.faint }}>
                      {feito ? 'Concluída' : atual ? 'Em andamento' : 'A seguir'}
                      {!feito && e.total > 0 && e.done > 0 && <span style={{ color: T.faint, ...num }}> · {e.done}/{e.total} {e.unit}</span>}
                      {temItens && <span style={{ color: T.faint }}> · {e.itens.length} {e.itens.length > 1 ? 'itens' : 'item'}</span>}
                    </span>
                    {atual && e.goal && <span style={{ display: 'block', fontSize: 12, color: T.muted, marginTop: 4 }}>{e.goal}</span>}
                  </span>
                  {temItens && <ChevronDown size={18} color={T.muted} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}/>}
                </button>
                {temItens && open && (
                  <div style={{ display: 'grid', gap: 8, padding: '0 18px 16px 62px' }} className="np-itens">
                    {e.itens.map((it, j) => <ItemCard key={j} it={it} token={token}/>)}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <style>{`@media (max-width: 520px) { .np-itens { padding-left: 18px !important; } }`}</style>
      </Card>

      {/* Bilhetes e vouchers (tudo num lugar só) */}
      {docs.length > 0 && (
        <Card style={{ padding: 18 }}>
          <Titulo sub="Bilhetes, vouchers e apólices disponíveis. Salve no celular antes de viajar.">Seus documentos</Titulo>
          <div style={{ display: 'grid', gap: 8 }}>
            {docs.map((d, i) => {
              const Icon = iconOf(d.etapa.k)
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={16} color={T.faint} strokeWidth={1.8}/>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{d.titulo}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{[d.etapa.nome, d.sub].filter(Boolean).join(' · ')}</div>
                    </div>
                  </div>
                  <Arquivos it={d} token={token}/>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Contato */}
      <Card style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Ficou com alguma dúvida?</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{v.responsavel ? `${v.responsavel} está` : 'Estamos'} à disposição pelo WhatsApp.</div>
        </div>
        <WaBtn label={v.responsavel ? `Falar com ${v.responsavel}` : 'Falar no WhatsApp'}
          texto={`Olá${v.responsavel ? `, ${v.responsavel}` : ''}! Sou ${v.cliente || 'cliente'}, da viagem para ${v.destino || 'meu destino'}, e tenho uma dúvida.`}/>
      </Card>
      {v.atualizado && <div style={{ fontSize: 12, color: T.faint, textAlign: 'center', ...num }}>
        Atualizado em {new Date(v.atualizado).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>}
    </div>
  )
}

/* Um voo, trem, aluguel, hotel, seguro, ingresso ou dia do roteiro */
function ItemCard({ it, token }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.line}`, borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{it.titulo}</div>
          {it.sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{it.sub}</div>}
        </div>
        {it.status && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
          padding: '2px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.line}` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: it.ok ? T.success : T.gold }}/>{it.status}
        </span>}
      </div>
      {(it.campos || []).length > 0 && (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px 14px', margin: '12px 0 0' }}>
          {it.campos.map(c => (
            <div key={c.l} style={{ minWidth: 0 }}>
              <dt style={{ fontSize: 11, color: T.faint, fontWeight: 500 }}>{c.l}</dt>
              <dd style={{ fontSize: 13, margin: '2px 0 0', overflowWrap: 'anywhere', ...num }}>{c.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {it.texto && <p style={{ fontSize: 13, color: T.muted, whiteSpace: 'pre-wrap', margin: '10px 0 0', lineHeight: 1.6 }}>{it.texto}</p>}
      <Arquivos it={it} token={token}/>
    </div>
  )
}

/* Anexos (abrir / baixar pelo link do cliente) e link externo */
function Arquivos({ it, token }) {
  const anexos = it.anexos || []
  if (!anexos.length && !it.link) return null
  const btn = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.muted, textDecoration: 'none',
    padding: '6px 11px', borderRadius: 6, border: `1px solid ${T.lineStrong}`, background: 'transparent', whiteSpace: 'nowrap' }
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
      {anexos.map(x => {
        const url = `/api/portal?t=${encodeURIComponent(token)}&f=${encodeURIComponent(x.id)}`
        const Ic = x.tipo === 'application/pdf' ? FileText : ImageIcon
        return (
          <div key={x.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 180px' }}>
              <Ic size={15} color={T.faint}/>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome}</span>
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <a href={url} target="_blank" rel="noreferrer" className="np-link" style={btn}><Eye size={13}/> Abrir</a>
              <a href={`${url}&baixar=1`} download={x.nome} className="np-gold"
                style={{ ...btn, color: '#0B1220', background: T.gold, border: `1px solid ${T.gold}` }}><Download size={13}/> Baixar</a>
            </span>
          </div>
        )
      })}
      {it.link && (
        <div><a href={it.link} target="_blank" rel="noreferrer noopener" className="np-link" style={btn}><ExternalLink size={13}/> Abrir link</a></div>
      )}
    </div>
  )
}
