/**
 * Next Plane — página do cliente para acompanhar a assessoria (somente leitura).
 * Rota: /acompanhar/:token  →  dados vêm de /api/portal?t=<token>, já filtrados no servidor.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PHONE } from '../lib/whatsapp'

const C = {
  bg: '#0B1220', card: '#111827', line: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF', muted: 'rgba(255,255,255,0.58)', faint: 'rgba(255,255,255,0.32)',
  brand: '#F5971F', gold: '#D4AF37', ok: '#22C55E',
}
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const fmtLongo = d => (d ? `${Number(d.slice(8, 10))} de ${MESES[Number(d.slice(5, 7)) - 1]} de ${d.slice(0, 4)}` : '')
const fmtCurto = d => (d ? d.split('-').reverse().join('/') : '')
const hoje = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}` }
const diasAte = d => (d ? Math.round((new Date(`${d}T00:00`) - new Date(`${hoje()}T00:00`)) / 864e5) : null)

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
    fetch(`/api/portal?t=${encodeURIComponent(token || '')}`)
      .then(async r => ({ status: r.status, data: await r.json().catch(() => null) }))
      .then(({ status, data }) => vivo && setSt(status === 200 ? { data } : { erro: status }))
      .catch(() => vivo && setSt({ erro: 0 }))
    return () => { vivo = false }
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes np-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(245,151,31,.55) } 50% { box-shadow: 0 0 0 8px rgba(245,151,31,0) } }
        .np-wrap { max-width: 720px; margin: 0 auto; padding: 0 16px; }
        .np-doc:hover { border-color: rgba(245,151,31,.5) !important; }
      `}</style>
      <header style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="np-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, height: 60 }}>
          <img src="/favicon.svg" alt="" width={28} height={28}/>
          <span style={{ ...serif, fontSize: 22, fontWeight: 600, letterSpacing: 0.5 }}>Next <span style={{ color: C.brand }}>Plane</span></span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>Assessoria de viagem</span>
        </div>
      </header>

      <main className="np-wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {st.loading ? <Aviso titulo="Carregando sua viagem…"/>
          : st.erro === 410 ? <Aviso titulo="Este link expirou" texto="A viagem já terminou. Se precisar de algo, fale com a gente pelo WhatsApp." wa/>
          : st.erro ? <Aviso titulo={st.erro === 404 ? 'Link indisponível' : 'Não foi possível carregar agora'}
              texto={st.erro === 404 ? 'Este link não existe mais ou foi desativado. Peça um novo ao seu consultor.' : 'Tente novamente em alguns instantes.'} wa/>
          : <Viagem v={st.data} token={token}/>}
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '20px 0', textAlign: 'center', fontSize: 11, color: C.faint }}>
        Página exclusiva e somente para visualização · Next Plane Viagens
      </footer>
    </div>
  )
}

function Aviso({ titulo, texto, wa }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
      <h1 style={{ ...serif, fontSize: 30, fontWeight: 600, margin: '0 0 8px' }}>{titulo}</h1>
      {texto && <p style={{ color: C.muted, fontSize: 14, margin: '0 0 22px' }}>{texto}</p>}
      {wa && <WaBtn texto="Olá! Preciso de ajuda com o link de acompanhamento da minha viagem."/>}
    </div>
  )
}

const WaBtn = ({ texto, label = 'Falar no WhatsApp' }) => (
  <a href={`https://wa.me/${PHONE}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer"
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#0B1220', fontWeight: 700,
      fontSize: 14, padding: '12px 22px', borderRadius: 999, textDecoration: 'none' }}>
    💬 {label}
  </a>
)

function Viagem({ v, token }) {
  const [aberta, setAberta] = useState({})
  const etapas = v.etapas || []
  const feitas = etapas.filter(e => e.estado === 'feito').length
  const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0
  const dIda = diasAte(v.inicio)
  const dVolta = diasAte(v.fim)
  const tudoPronto = etapas.length > 0 && feitas === etapas.length

  let contagem = null
  if (dIda !== null && dIda > 1) contagem = <><b style={{ fontSize: 34, color: C.brand, ...serif }}>{dIda}</b> dias para o embarque</>
  else if (dIda === 1) contagem = <>Seu embarque é <b style={{ color: C.brand }}>amanhã</b>!</>
  else if (dIda === 0) contagem = <>Seu embarque é <b style={{ color: C.brand }}>hoje</b>! Boa viagem ✈️</>
  else if (dIda !== null && (dVolta === null || dVolta >= 0)) contagem = <>Boa viagem! Aproveite cada momento 🌍</>
  else if (dVolta !== null && dVolta < 0) contagem = <>Esperamos que a viagem tenha sido incrível 💛</>

  const docs = etapas.flatMap(e => (e.itens || []).filter(it => it.link || it.anexos?.length).map(it => ({ ...it, etapa: e })))

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Abertura */}
      <section>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Olá{v.cliente ? `, ${v.cliente}` : ''}! Esta é a sua viagem para</div>
        <h1 style={{ ...serif, fontSize: 'clamp(30px, 7vw, 42px)', lineHeight: 1.1, fontWeight: 600, margin: 0 }}>{v.destino || 'seu próximo destino'}</h1>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: C.muted, marginTop: 10 }}>
          {v.inicio && <span>📅 {fmtLongo(v.inicio)}{v.fim ? ` a ${fmtLongo(v.fim)}` : ''}</span>}
          {v.origem && <span>🛫 saindo de {v.origem}</span>}
          {v.viajantes && <span>👥 {v.viajantes} viajante{v.viajantes > 1 ? 's' : ''}</span>}
        </div>
      </section>

      {/* Contagem + progresso */}
      <Card>
        {contagem && <div style={{ fontSize: 15, marginBottom: 14 }}>{contagem}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 6 }}>
          <span>{tudoPronto ? 'Tudo pronto para a sua viagem!' : 'Organização da viagem'}</span>
          <span style={{ color: C.brand, fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.brand}, ${C.gold})`, borderRadius: 8, transition: 'width .6s' }}/>
        </div>
        <div style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>{feitas} de {etapas.length} etapas concluídas</div>
      </Card>

      {/* Próximo passo */}
      {v.proxima && !tudoPronto && (
        <Card style={{ borderLeft: `3px solid ${C.brand}` }}>
          <div style={{ fontSize: 11, color: C.brand, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Próximo passo</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{v.proxima.acao}</div>
          {v.proxima.data && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Previsto para {fmtCurto(v.proxima.data)}</div>}
        </Card>
      )}

      {/* Etapas */}
      <Card>
        <h2 style={{ ...serif, fontSize: 24, fontWeight: 600, margin: '0 0 4px' }}>Etapas da sua assessoria</h2>
        <div style={{ fontSize: 12, color: C.muted, margin: '0 0 16px' }}>Toque em uma etapa para ver os detalhes.</div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {etapas.map((e, i) => {
            const ult = i === etapas.length - 1
            const cor = e.estado === 'feito' ? C.ok : e.estado === 'atual' ? C.brand : C.faint
            const temItens = (e.itens || []).length > 0
            const open = aberta[e.k]
            return (
              <li key={e.k} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                    background: e.estado === 'feito' ? C.ok : e.estado === 'atual' ? C.brand : 'transparent',
                    color: e.estado === 'pendente' ? C.faint : '#0B1220', border: e.estado === 'pendente' ? `2px solid ${C.line}` : 'none',
                    animation: e.estado === 'atual' ? 'np-pulse 2s infinite' : 'none' }}>
                    {e.estado === 'feito' ? '✓' : i + 1}
                  </div>
                  {!ult && <div style={{ width: 2, flex: 1, minHeight: 18, background: e.estado === 'feito' ? 'rgba(34,197,94,.45)' : C.line }}/>}
                </div>
                <div style={{ paddingBottom: ult ? 0 : 18, paddingTop: 4, minWidth: 0, flex: 1 }}>
                  <button type="button" disabled={!temItens} onClick={() => setAberta(p => ({ ...p, [e.k]: !p[e.k] }))} aria-expanded={!!open}
                    style={{ all: 'unset', cursor: temItens ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: e.estado === 'pendente' ? 500 : 700, color: e.estado === 'pendente' ? C.muted : C.text }}>
                        {e.icon} {e.nome}
                      </div>
                      <div style={{ fontSize: 12, color: cor, marginTop: 2 }}>
                        {e.estado === 'feito' ? 'Concluída' : e.estado === 'atual' ? 'Em andamento agora' : 'Próximas etapas'}
                        {e.estado !== 'feito' && e.total > 0 && e.done > 0 && <span style={{ color: C.muted }}> · {e.done}/{e.total} {e.unit}</span>}
                        {temItens && <span style={{ color: C.muted }}> · {e.itens.length} {e.itens.length > 1 ? 'itens' : 'item'}</span>}
                      </div>
                      {e.estado === 'atual' && e.goal && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{e.goal}</div>}
                    </div>
                    {temItens && <span style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0,
                      border: `1px solid ${C.line}`, color: C.brand, fontSize: 14, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>}
                  </button>
                  {temItens && open && (
                    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                      {e.itens.map((it, j) => <ItemCard key={j} it={it} token={token}/>)}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Bilhetes e vouchers (tudo num lugar só) */}
      {docs.length > 0 && (
        <Card>
          <h2 style={{ ...serif, fontSize: 24, fontWeight: 600, margin: '0 0 4px' }}>Seus documentos</h2>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Bilhetes, vouchers e apólices já disponíveis. Salve no celular antes de viajar.</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {docs.map((d, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.line}` }}>
                <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{d.etapa.icon} {d.etapa.nome}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{d.titulo}</div>
                {d.sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{d.sub}</div>}
                <Arquivos it={d} token={token}/>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contato */}
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 14 }}>
          Ficou com alguma dúvida? {v.responsavel ? `${v.responsavel} está` : 'Estamos'} à disposição.
        </div>
        <WaBtn label={v.responsavel ? `Falar com ${v.responsavel}` : 'Falar no WhatsApp'}
          texto={`Olá${v.responsavel ? `, ${v.responsavel}` : ''}! Sou ${v.cliente || 'cliente'}, da viagem para ${v.destino || 'meu destino'}, e tenho uma dúvida.`}/>
        {v.atualizado && <div style={{ fontSize: 11, color: C.faint, marginTop: 16 }}>
          Atualizado em {new Date(v.atualizado).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>}
      </Card>
    </div>
  )
}

const Card = ({ children, style }) => (
  <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, ...style }}>{children}</section>
)

/* Um voo, hotel, seguro, ingresso ou dia do roteiro */
function ItemCard({ it, token }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{it.titulo}</div>
          {it.sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{it.sub}</div>}
        </div>
        {it.status && <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', padding: '3px 9px', borderRadius: 999,
          color: it.ok ? C.ok : C.brand, background: it.ok ? 'rgba(34,197,94,.12)' : 'rgba(245,151,31,.12)' }}>{it.status}</span>}
      </div>
      {(it.campos || []).length > 0 && (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '8px 12px', margin: '10px 0 0' }}>
          {it.campos.map(c => (
            <div key={c.l} style={{ minWidth: 0 }}>
              <dt style={{ fontSize: 11, color: C.faint }}>{c.l}</dt>
              <dd style={{ fontSize: 13, margin: '2px 0 0', overflowWrap: 'anywhere' }}>{c.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {it.texto && <p style={{ fontSize: 13, color: C.muted, whiteSpace: 'pre-wrap', margin: '8px 0 0', lineHeight: 1.55 }}>{it.texto}</p>}
      <Arquivos it={it} token={token}/>
    </div>
  )
}

/* Botões dos anexos (baixados pelo link do cliente) e do link externo */
function Arquivos({ it, token }) {
  const anexos = it.anexos || []
  if (!anexos.length && !it.link) return null
  const btn = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.brand, textDecoration: 'none',
    padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(245,151,31,.35)', background: 'rgba(245,151,31,.06)', maxWidth: '100%' }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      {anexos.map(x => {
        const url = `/api/portal?t=${encodeURIComponent(token)}&f=${encodeURIComponent(x.id)}`
        return (
          <div key={x.id} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: 13, display: 'flex', gap: 6, minWidth: 0, flex: '1 1 100%' }}>
              <span>{x.tipo === 'application/pdf' ? '📄' : '🖼️'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome}</span>
            </span>
            <a href={url} target="_blank" rel="noreferrer" style={btn}>👁 Abrir</a>
            <a href={`${url}&baixar=1`} download={x.nome} style={{ ...btn, color: '#0B1220', background: C.brand, border: `1px solid ${C.brand}` }}>⬇ Baixar</a>
          </div>
        )
      })}
      {it.link && <a href={it.link} target="_blank" rel="noreferrer noopener" style={btn}>🔗 Abrir link ↗</a>}
    </div>
  )
}
