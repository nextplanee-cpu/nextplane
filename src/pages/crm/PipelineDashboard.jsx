/**
 * Next Plane CRM — Dashboard do funil (Pipeline/Kanban).
 *
 * Lê os mesmos leads do Kanban (nada é gravado aqui) e mostra a saúde do funil: leads por etapa,
 * valor por etapa, conversão entre etapas, tempo parado, quem está sem contato, origem e perdas.
 *
 * Regras de leitura (ficam escritas na tela também, para ninguém se confundir):
 *  - O filtro de período (7 dias / 30 dias / Tudo) recorta pela DATA DE ENTRADA do lead ("coorte"):
 *    os cartões, o funil e as tabelas mostram onde estão, hoje, os leads que entraram naquele período.
 *  - "Atenção agora" ignora o período: é a fila viva do Kanban inteiro.
 *  - O CRM não guarda o histórico de mudanças de etapa. "Tempo parado" = dias desde a última alteração
 *    do lead (mover de etapa, editar valor, temperatura etc.). Perdido não registra de qual etapa o lead
 *    saiu, então a conversão entre etapas considera só leads ativos e fechados.
 */
import { useState } from 'react'
import {
  GitBranch, Users, TrendingUp, Clock, AlertCircle, Trophy, Radio, Target, Plane, BarChart2,
  RefreshCw, MessageCircle, Flame, Inbox, PauseCircle, Megaphone, Info,
} from 'lucide-react'
import {
  T, num, Dot, Card, CardTitle, Btn, Avatar, Bar, PageHeader, Kpi, KpiGrid, th, td, Empty, Segmented,
} from './ui'
import {
  STAGES, PERDIDO, MOTIVOS_PERDA, TEMP_C, fmtR, fmtK, BarList,
} from './shared'
import { waLink } from '../../lib/leadsApi'

const DAY = 864e5
const STALE_DAYS = 7          // ativo sem nenhuma alteração há mais que isso = parado
const SLA_HORAS = 24          // promessa de primeiro contato
const ORDEM = STAGES.filter(s => s.id !== PERDIDO)   // ordem do funil, sem Perdido

const isWon    = l => l.stage === 10 || l.stage === 11
const isLost   = l => l.stage === PERDIDO
const isActive = l => !isWon(l) && !isLost(l)
const created  = l => new Date(l.createdAt || 0)
const moved    = l => new Date(l.updated_at || l.createdAt || 0)
const daysSince = d => Math.max(0, (Date.now() - d.getTime()) / DAY)
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/* "há 3 h" / "há 5 dias" */
const ago = d => {
  const h = (Date.now() - d.getTime()) / 36e5
  if (h < 1) return 'agora'
  if (h < 48) return `há ${Math.floor(h)} h`
  return `há ${Math.floor(h / 24)} dias`
}

/* ── Colunas por dia ── */
function Daily({ leads, days }) {
  const today = startOfDay(new Date())
  const cols = Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i))
    const next = new Date(d); next.setDate(d.getDate() + 1)
    return { d, cnt: leads.filter(l => created(l) >= d && created(l) < next).length }
  })
  const max = Math.max(1, ...cols.map(c => c.cnt))
  const gap = days > 14 ? 2 : 4
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap, height: 130, borderBottom: `1px solid ${T.line}` }}>
        {cols.map(({ d, cnt }, i) => (
          <div key={i} title={`${d.toLocaleDateString('pt-BR')}: ${plural(cnt, 'lead', 'leads')}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            {cnt > 0 && days <= 14 && <span style={{ fontSize: 10, color: T.muted, marginBottom: 3, ...num }}>{cnt}</span>}
            <div style={{ width: '100%', maxWidth: 20, height: `${(cnt / max) * 100}%`, minHeight: cnt ? 3 : 0,
              background: i === cols.length - 1 ? T.gold : 'rgba(212,175,55,0.55)', borderRadius: '3px 3px 0 0' }}/>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: T.faint }}>
        <span>{cols[0].d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
        <span>hoje</span>
      </div>
    </>
  )
}

/* ── Colunas por semana (8 semanas, segunda a domingo) ── */
function Weekly({ leads, weeks = 8 }) {
  const today = startOfDay(new Date())
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const cols = Array.from({ length: weeks }, (_, i) => {
    const a = new Date(monday); a.setDate(monday.getDate() - 7 * (weeks - 1 - i))
    const b = new Date(a); b.setDate(a.getDate() + 7)
    return { a, cnt: leads.filter(l => created(l) >= a && created(l) < b).length }
  })
  const max = Math.max(1, ...cols.map(c => c.cnt))
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, borderBottom: `1px solid ${T.line}` }}>
        {cols.map(({ a, cnt }, i) => (
          <div key={i} title={`Semana de ${a.toLocaleDateString('pt-BR')}: ${plural(cnt, 'lead', 'leads')}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            {cnt > 0 && <span style={{ fontSize: 10, color: T.muted, marginBottom: 3, ...num }}>{cnt}</span>}
            <div style={{ width: '100%', maxWidth: 34, height: `${(cnt / max) * 100}%`, minHeight: cnt ? 3 : 0,
              background: i === cols.length - 1 ? T.gold : 'rgba(212,175,55,0.55)', borderRadius: '3px 3px 0 0' }}/>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: T.faint }}>
        {cols.map(({ a }, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center', ...num }}>
            {i === cols.length - 1 ? 'esta' : a.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        ))}
      </div>
    </>
  )
}

/* ── Linha de lead nas listas de "Atenção agora" ── */
function LeadRow({ lead, tag, tagColor, onOpen }) {
  const wa = lead.phone ? waLink(lead.phone, lead.name) : ''
  return (
    <div onClick={() => onOpen(lead)} className="crm-row"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderTop: `1px solid ${T.line}`, cursor: 'pointer' }}>
      <Avatar initials={lead.initials} color={lead.color} size={28}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
        <div style={{ fontSize: 12, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.dest || '—'}{lead.value ? ` · ${fmtR(lead.value)}` : ''}
        </div>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, whiteSpace: 'nowrap', ...num }}>
        <Dot color={tagColor} size={6}/>{tag}
      </span>
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="Chamar no WhatsApp" aria-label="Chamar no WhatsApp"
          style={{ color: T.muted, display: 'inline-flex', padding: 5 }}>
          <MessageCircle size={15}/>
        </a>
      )}
    </div>
  )
}

function AttentionCard({ icon, title, hint, rows, total, emptyText, onOpen, render }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 10px' }}>
        <CardTitle icon={icon} style={{ marginBottom: 2 }}
          right={<span style={{ fontSize: 12, color: total ? T.text : T.faint, fontWeight: 600, ...num }}>{total}</span>}>{title}</CardTitle>
        <div style={{ fontSize: 12, color: T.faint }}>{hint}</div>
      </div>
      {rows.map(l => <LeadRow key={l.id} lead={l} onOpen={onOpen} {...render(l)}/>)}
      {!rows.length && <Empty icon={Inbox}>{emptyText}</Empty>}
      {total > rows.length && (
        <div style={{ padding: '9px 18px', borderTop: `1px solid ${T.line}`, fontSize: 12, color: T.faint }}>
          + {total - rows.length} a mais — filtre em Leads para ver todos
        </div>
      )}
    </Card>
  )
}

export default function PipelineDashboard({ leads, onOpenLead, onGoPipeline, onRefresh, syncing }) {
  const [period, setPeriod] = useState('30')
  const now = Date.now()

  /* Coorte: leads que entraram no período */
  const since = period === 'all' ? null : new Date(now - parseInt(period) * DAY)
  const cohort = since ? leads.filter(l => created(l) >= since) : leads
  const today0 = startOfDay(new Date())
  const hoje = leads.filter(l => created(l) >= today0).length

  const won = cohort.filter(isWon)
  const lost = cohort.filter(isLost)
  const open = cohort.filter(isActive)
  const valorAberto = open.reduce((a, l) => a + l.value, 0)
  const receita = won.reduce((a, l) => a + l.value, 0)

  /* Fila viva (todo o Kanban, ignora o período) */
  const aguardando = leads.filter(l => l.stage === 0)
    .sort((a, b) => created(a) - created(b))
  const aguardandoAtrasados = aguardando.filter(l => (now - created(l)) / 36e5 >= SLA_HORAS).length
  const parados = leads.filter(l => isActive(l) && l.stage !== 0 && daysSince(moved(l)) > STALE_DAYS)
    .sort((a, b) => moved(a) - moved(b))
  const quentes = leads.filter(l => isActive(l) && (l.temp === 'Quente' || l.temp === 'VIP'))
    .sort((a, b) => b.value - a.value || created(a) - created(b))

  /* Funil: agora na etapa × chegaram até a etapa (só ativos + fechados, ver nota) */
  const progressao = cohort.filter(l => !isLost(l))
  const ordem = l => ORDEM.findIndex(s => s.id === l.stage)
  const reached = ORDEM.map((_, i) => progressao.filter(l => ordem(l) >= i).length)
  const funil = ORDEM.map((st, i) => {
    const naEtapa = cohort.filter(l => l.stage === st.id)
    const ativosAqui = naEtapa.filter(isActive)
    const mediaParado = ativosAqui.length ? ativosAqui.reduce((a, l) => a + daysSince(moved(l)), 0) / ativosAqui.length : null
    return {
      st, n: naEtapa.length, valor: naEtapa.reduce((a, l) => a + l.value, 0),
      chegaram: reached[i], conv: i ? pct(reached[i], reached[i - 1]) : null,
      paradosN: ativosAqui.filter(l => daysSince(moved(l)) > STALE_DAYS).length, mediaParado,
    }
  })
  const maxN = Math.max(1, ...funil.map(f => f.n))

  /* Origem */
  const origens = Object.values(cohort.reduce((acc, l) => {
    const k = l.source || 'Sem origem'
    acc[k] = acc[k] || { k, n: 0, hot: 0, abertos: 0, fechados: 0, perdidos: 0, valorAberto: 0 }
    const o = acc[k]; o.n++
    if (l.temp === 'Quente' || l.temp === 'VIP') o.hot++
    if (isActive(l)) { o.abertos++; o.valorAberto += l.value }
    if (isWon(l)) o.fechados++
    if (isLost(l)) o.perdidos++
    return acc
  }, {})).sort((a, b) => b.n - a.n)

  const campanhas = Object.values(cohort.filter(l => l.campaign_name).reduce((acc, l) => {
    const k = `${l.campaign_name}||${l.ad_name || ''}`
    acc[k] = acc[k] || { camp: l.campaign_name, ad: l.ad_name || '—', n: 0, hot: 0, fechados: 0 }
    acc[k].n++
    if (l.temp === 'Quente' || l.temp === 'VIP') acc[k].hot++
    if (isWon(l)) acc[k].fechados++
    return acc
  }, {})).sort((a, b) => b.n - a.n)

  /* Temperatura, destino e perdas */
  const temps = ['VIP', 'Quente', 'Morno', 'Frio'].map(t => ({ k: t, l: t, c: TEMP_C[t], n: cohort.filter(l => l.temp === t).length }))
  const destinos = Object.entries(cohort.reduce((acc, l) => {
    const d = (l.dest || '').trim() || 'Não informado'
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1])
  const destTop = destinos.slice(0, 6).map(([l, n]) => ({ k: l, l, n }))
  const destResto = destinos.slice(6).reduce((a, [, n]) => a + n, 0)
  if (destResto) destTop.push({ k: '__outros', l: 'Outros destinos', n: destResto })

  const motivos = [...MOTIVOS_PERDA, { k: '', l: 'Sem motivo informado', c: '#4B5563' }]
    .map(m => ({ k: m.k || 'none', l: m.l, c: m.c, n: lost.filter(l => (l.motivo_perda || '') === m.k).length }))
    .filter(m => m.n).sort((a, b) => b.n - a.n).slice(0, 6)

  const dias = period === '7' ? 7 : 30
  const periodoTxt = period === 'all' ? 'todos os leads' : `leads que entraram nos últimos ${period} dias`

  return (
    <div>
      <PageHeader title="Dashboard do funil" sub={`Saúde do Pipeline · ${periodoTxt}`}>
        <Segmented value={period} onChange={setPeriod} opts={[['7', '7 dias'], ['30', '30 dias'], ['all', 'Tudo']]}/>
        <Btn outline onClick={onRefresh} disabled={syncing}><RefreshCw size={13}/> {syncing ? 'Atualizando…' : 'Atualizar'}</Btn>
        <Btn outline onClick={onGoPipeline}><GitBranch size={14}/> Abrir Kanban</Btn>
      </PageHeader>

      <KpiGrid min={150} style={{ marginBottom: 12 }}>
        <Kpi icon={Users} label="Leads no período" value={cohort.length} hint={`${hoje} chegaram hoje`}/>
        <Kpi icon={Target} label="Em aberto no funil" value={open.length} hint={`${fmtK(valorAberto)} em valor`}/>
        <Kpi icon={Trophy} label="Vendas fechadas" value={won.length} hint={receita ? `${fmtK(receita)} em receita` : 'sem valor lançado'}/>
        <Kpi icon={TrendingUp} label="Lead → venda" value={`${pct(won.length, cohort.length)}%`}
          hint={`${won.length} de ${plural(cohort.length, 'lead', 'leads')} · ${lost.length} perdido${lost.length === 1 ? '' : 's'}`}/>
        <Kpi icon={Clock} label="Sem contato" value={aguardando.length} tone={aguardandoAtrasados ? '#F87171' : undefined}
          hint={aguardandoAtrasados ? `${aguardandoAtrasados} há mais de ${SLA_HORAS} h` : 'tudo dentro do prazo'}/>
        <Kpi icon={PauseCircle} label={`Parados +${STALE_DAYS} dias`} value={parados.length} tone={parados.length ? '#FBBF24' : undefined}
          hint="ativos sem nenhuma alteração"/>
      </KpiGrid>

      {/* ── Funil ── */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '16px 18px 4px' }}>
          <CardTitle icon={GitBranch} right={<Btn ghost small onClick={onGoPipeline}>Ver Kanban</Btn>}>Funil por etapa</CardTitle>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                <th style={th}>Etapa</th>
                <th style={{ ...th, width: '26%' }}>Leads agora</th>
                <th style={{ ...th, textAlign: 'right' }}>Valor na etapa</th>
                <th style={{ ...th, textAlign: 'right' }} title="Leads ativos ou fechados que chegaram a esta etapa ou além">Chegaram até aqui</th>
                <th style={{ ...th, textAlign: 'right' }} title="% dos que chegaram à etapa anterior e chegaram a esta">Conv. da anterior</th>
                <th style={{ ...th, textAlign: 'right' }}>Tempo médio parado</th>
                <th style={{ ...th, textAlign: 'right' }}>Parados +{STALE_DAYS}d</th>
              </tr>
            </thead>
            <tbody>
              {funil.map(f => (
                <tr key={f.st.id} className="crm-row">
                  <td style={td}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Dot color={f.st.color}/>{f.st.name}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 26, fontWeight: 600, ...num }}>{f.n}</span>
                      <div style={{ flex: 1 }}><Bar pct={f.n / maxN} color={f.st.color} height={6}/></div>
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{fmtR(f.valor)}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{f.chegaram}</td>
                  <td style={{ ...td, textAlign: 'right', color: f.conv === null ? T.faint : T.text, ...num }}>
                    {f.conv === null ? '—' : `${f.conv}%`}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: f.mediaParado === null ? T.faint : T.text, ...num }}>
                    {f.mediaParado === null ? '—' : f.mediaParado < 1 ? 'menos de 1 dia' : `${Math.round(f.mediaParado)} ${Math.round(f.mediaParado) === 1 ? 'dia' : 'dias'}`}
                  </td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>
                    {f.paradosN ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Dot color={T.warn} size={6}/>{f.paradosN}</span> : <span style={{ color: T.faint }}>0</span>}
                  </td>
                </tr>
              ))}
              <tr className="crm-row">
                <td style={td}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Dot color={STAGES[STAGES.length - 1].color}/>Perdido</span></td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 26, fontWeight: 600, ...num }}>{lost.length}</span>
                    <div style={{ flex: 1 }}><Bar pct={lost.length / maxN} color={STAGES[STAGES.length - 1].color} height={6}/></div>
                  </div>
                </td>
                <td style={{ ...td, textAlign: 'right', ...num }}>{fmtR(lost.reduce((a, l) => a + l.value, 0))}</td>
                <td style={{ ...td, textAlign: 'right', color: T.faint }}>—</td>
                <td style={{ ...td, textAlign: 'right', color: T.faint }}>—</td>
                <td style={{ ...td, textAlign: 'right', color: T.faint }}>—</td>
                <td style={{ ...td, textAlign: 'right', color: T.faint }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 18px 14px', fontSize: 12, color: T.faint, display: 'flex', gap: 8, lineHeight: 1.5 }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
          <span>
            O CRM não registra o histórico de etapas. “Tempo parado” conta os dias desde a última alteração no lead (mover de etapa, mudar valor ou temperatura).
            “Chegaram até aqui” soma os leads que estão nesta etapa ou além — Perdido fica de fora porque não informa de qual etapa o lead saiu.
          </span>
        </div>
      </Card>

      {/* ── Atenção agora ── */}
      <div style={{ fontSize: 12, fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '20px 0 10px' }}>
        Atenção agora · todo o Kanban, não muda com o período
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 12, marginBottom: 12 }}>
        <AttentionCard icon={AlertCircle} title="Aguardando primeiro contato" hint={`Etapa “Lead Recebido” · prazo prometido: ${SLA_HORAS} h`}
          rows={aguardando.slice(0, 6)} total={aguardando.length} emptyText="Nenhum lead esperando contato." onOpen={onOpenLead}
          render={l => { const h = (now - created(l)) / 36e5; return { tag: ago(created(l)), tagColor: h >= SLA_HORAS ? T.err : h >= 1 ? T.warn : T.success } }}/>
        <AttentionCard icon={PauseCircle} title={`Parados há mais de ${STALE_DAYS} dias`} hint="Leads ativos (de 1º contato a Pgto) sem nenhuma alteração"
          rows={parados.slice(0, 6)} total={parados.length} emptyText="Nenhum lead parado. Funil andando." onOpen={onOpenLead}
          render={l => ({ tag: `${Math.floor(daysSince(moved(l)))} dias · ${stageNome(l.stage)}`, tagColor: T.warn })}/>
        <AttentionCard icon={Flame} title="Quentes e VIP em aberto" hint="Ordenados por valor"
          rows={quentes.slice(0, 6)} total={quentes.length} emptyText="Nenhum lead quente em aberto." onOpen={onOpenLead}
          render={l => ({ tag: stageNome(l.stage), tagColor: TEMP_C[l.temp] || T.muted })}/>
      </div>

      {/* ── Entrada de leads ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <CardTitle icon={BarChart2} right={<span style={{ fontSize: 12, color: T.faint }}>últimos {dias} dias</span>}>Leads novos por dia</CardTitle>
          <Daily leads={leads} days={dias}/>
        </Card>
        <Card>
          <CardTitle icon={BarChart2} right={<span style={{ fontSize: 12, color: T.faint }}>últimas 8 semanas</span>}>Leads novos por semana</CardTitle>
          <Weekly leads={leads}/>
        </Card>
      </div>

      {/* ── Origem, temperatura, destino, perdas ── */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '16px 18px 2px' }}><CardTitle icon={Radio}>Origem dos leads</CardTitle></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead><tr>{['Origem', 'Leads', 'Quentes + VIP', 'Em aberto', 'Valor em aberto', 'Fechados', 'Perdidos', 'Lead → venda'].map((h, i) => (
              <th key={h} style={{ ...th, textAlign: i ? 'right' : 'left' }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {origens.map(o => (
                <tr key={o.k} className="crm-row">
                  <td style={{ ...td, fontWeight: 600 }}>{o.k}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{o.n}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{o.hot} <span style={{ color: T.faint }}>· {pct(o.hot, o.n)}%</span></td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{o.abertos}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{fmtR(o.valorAberto)}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{o.fechados}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>{o.perdidos}</td>
                  <td style={{ ...td, textAlign: 'right', ...num }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Dot color={pct(o.fechados, o.n) > 20 ? T.success : pct(o.fechados, o.n) > 8 ? T.warn : T.faint} size={6}/>{pct(o.fechados, o.n)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!origens.length && <Empty icon={Inbox}>Nenhum lead no período.</Empty>}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <CardTitle icon={Flame}>Temperatura</CardTitle>
          <BarList total={cohort.length} rows={temps}/>
          {!cohort.length && <div style={{ fontSize: 13, color: T.muted }}>Sem leads no período.</div>}
        </Card>
        <Card>
          <CardTitle icon={Plane}>Destinos mais pedidos</CardTitle>
          <BarList total={cohort.length} rows={destTop}/>
          {!cohort.length && <div style={{ fontSize: 13, color: T.muted }}>Sem leads no período.</div>}
        </Card>
        <Card>
          <CardTitle icon={AlertCircle} right={<span style={{ fontSize: 12, color: T.faint, ...num }}>{plural(lost.length, 'perdido', 'perdidos')}</span>}>Motivos de perda</CardTitle>
          {motivos.length
            ? <BarList total={lost.length} color="rgba(239,68,68,0.7)" rows={motivos}/>
            : <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>Nenhum lead perdido no período. Ao mover um lead para <b style={{ color: T.text }}>Perdido</b>, o CRM pede o motivo e ele aparece aqui.</div>}
        </Card>
      </div>

      {campanhas.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 2px' }}><CardTitle icon={Megaphone}>Por campanha e anúncio</CardTitle></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead><tr>{['Campanha', 'Anúncio', 'Leads', 'Quentes + VIP', 'Fechados'].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 1 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
              <tbody>
                {campanhas.map((c, i) => (
                  <tr key={i} className="crm-row">
                    <td style={td}>{c.camp}</td>
                    <td style={{ ...td, color: T.muted }}>{c.ad}</td>
                    <td style={{ ...td, textAlign: 'right', ...num }}>{c.n}</td>
                    <td style={{ ...td, textAlign: 'right', ...num }}>{c.hot} <span style={{ color: T.faint }}>· {pct(c.hot, c.n)}%</span></td>
                    <td style={{ ...td, textAlign: 'right', ...num }}>{c.fechados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

const stageNome = id => STAGES.find(s => s.id === id)?.short || '—'
