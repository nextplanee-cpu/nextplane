import { useState, useEffect } from 'react'
import {
  LayoutDashboard, GitBranch, Users, FileText,
  Zap, BarChart2, Building2, Plus, X, Search,
  MessageCircle, LogOut, Phone, Mail, MapPin, Calendar,
  TrendingUp, CheckCircle2, AlertCircle, Clock, Filter,
  Megaphone, RefreshCw, Trash2, Briefcase, Plane, Target,
  Radio, Trophy, Inbox, ShieldCheck, Download, ChevronRight, Database, Map as MapIcon,
} from 'lucide-react'
import Assessorias from './crm/Assessorias'
import AuthGate from './crm/AuthGate'
import {
  T, num, GlobalStyle, Badge, Dot, Card, CardTitle, Btn, IconBtn, Label, Avatar, Bar,
  PageHeader, Kpi, KpiGrid, th, td, Empty, Segmented, Modal, Drawer, inputS,
} from './crm/ui'
import {
  fetchLeads, createLead, patchLead, removeLead, waLink,
  metaStatus, metaSubscribe, encryptOld, fetchAudit,
} from '../lib/leadsApi'

const STAGES = [
  { id:0,  name:'Lead Recebido',    color:'#5B8DEF', short:'Recebido'  },
  { id:1,  name:'Primeiro Contato', color:'#8B5CF6', short:'1º Contato'},
  { id:2,  name:'Atendimento',      color:'#A78BFA', short:'Atendimento'},
  { id:5,  name:'Cotação Enviada',  color:'#3B82F6', short:'Cotação'   },
  { id:6,  name:'Follow-up',        color:'#06B6D4', short:'Follow-up' },
  { id:8,  name:'Negociação',       color:'#F97316', short:'Negociação'},
  { id:9,  name:'Aguardando Pgto',  color:'#EAB308', short:'Pgto'      },
  { id:10, name:'Venda Fechada',    color:'#22C55E', short:'Fechada'   },
  { id:11, name:'Pós-Venda',        color:'#10B981', short:'Pós-Venda' },
  { id:12, name:'Perdido',          color:'#EF4444', short:'Perdido'   },
]
// ids mantidos p/ compatibilidade com leads salvos; estágios removidos (Briefing, Pesquisa, Follow-up 2) viram o vizinho
const STAGE_MAP = { 3:2, 4:2, 7:6 }
const stageOf = id => STAGES.find(s => s.id === id) || STAGES[0]
const PERDIDO = 12

/* Motivos de perda — lista fixa para dar para comparar e somar nos relatórios */
const MOTIVOS_PERDA = [
  { k:'preco',       l:'Preço / orçamento acima do esperado', c:'#EF4444' },
  { k:'sem_resposta',l:'Não respondeu / sumiu',               c:'#6B7280' },
  { k:'pesquisando', l:'Só pesquisando / sem data definida',  c:'#F59E0B' },
  { k:'concorrente', l:'Fechou com outra agência',            c:'#F97316' },
  { k:'sozinho',     l:'Comprou por conta própria',           c:'#EAB308' },
  { k:'desistiu',    l:'Desistiu ou adiou a viagem',          c:'#A78BFA' },
  { k:'fora_perfil', l:'Fora do perfil (orçamento baixo)',    c:'#3B82F6' },
  { k:'nao_atende',  l:'Destino ou serviço que não atendemos',c:'#06B6D4' },
  { k:'invalido',    l:'Contato inválido / spam',             c:'#374151' },
  { k:'outro',       l:'Outro (descrever)',                   c:'#9CA3AF' },
]
const motivoOf = k => MOTIVOS_PERDA.find(m => m.k === k)
const normLeads = list => list.map(l => l.stage in STAGE_MAP ? { ...l, stage: STAGE_MAP[l.stage] } : l)

const TIPOS = ['Internacional','Lua de Mel','Disney','Cruzeiro','Corporativo','Nacional','Europa','América do Sul']
const ORIGENS = ['WhatsApp','Instagram','Indicação','Meta Ads','Google Ads','ManyChat','Site','TikTok','Parceiros']
const TEMP_C = { Frio:'#60A5FA', Morno:'#F59E0B', Quente:'#EF4444', VIP:'#D4AF37' }

/* ─── Helpers ────────────────────────────────────────── */
const fmtR = v => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`
const fmtK = v => (v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits:1 })} mi` : v >= 1e4 ? `R$ ${Math.round(v / 1e3)} mil` : fmtR(v))
const Temp = ({ t, small }) => (t ? <Badge color={TEMP_C[t] || T.muted} small={small}>{t}</Badge> : <span style={{ color:T.faint }}>—</span>)
const Stage = ({ id, small, full }) => { const s = stageOf(id); return <Badge color={s.color} small={small}>{full ? s.name : s.short}</Badge> }

/* Inputs dos formulários do CRM (aceitam props nativas) */
const Input = ({ label, ...props }) => (
  <div>
    {label && <Label>{label}</Label>}
    <input {...props} style={{ ...inputS, ...props.style }}/>
  </div>
)
const Sel = ({ label, children, ...props }) => (
  <div>
    {label && <Label>{label}</Label>}
    <select {...props} style={{ ...inputS, background:T.card, cursor:'pointer', ...props.style }}>{children}</select>
  </div>
)

/* ─── Meta Ads · respostas do formulário ─────────────── */
const META_DEST    = [['Europa','Europa'],['EUA','EUA'],['Ásia','Ásia'],['Oceania','Oceania']]
const META_PESSOAS = [['1','1 pessoa'],['2','2 pessoas'],['3-4','3 ou 4 pessoas'],['5+','5 ou mais']]
const META_DIAS    = [['ate10','Até 10 dias'],['11-15','11 a 15 dias'],['15+','Acima de 15 dias']]
const META_INVEST  = [['ate20','Até R$ 20 mil'],['20-30','R$ 20–30 mil'],['30-40','R$ 30–40 mil'],['40+','Acima de R$ 40 mil']]
const labelOf = (opts, v) => (opts.find(o => o[0] === v) || [v, v || '—'])[1]

/* Lista de barras horizontais (rótulo, número, % e barra fina) */
const BarList = ({ rows, color = 'rgba(212,175,55,0.75)', total }) => {
  const sum = total ?? rows.reduce((a, r) => a + r.n, 0)
  return rows.map(r => {
    const pct = sum ? r.n / sum : 0
    return (
      <div key={r.k ?? r.l} style={{ marginBottom:11 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:5, fontSize:12 }}>
          <span style={{ color:T.muted, display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
            {r.c && <Dot color={r.c} size={6}/>}<span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.l}</span>
          </span>
          <span style={{ color:T.text, fontWeight:600, whiteSpace:'nowrap', ...num }}>
            {r.v ?? r.n}{r.v === undefined && <span style={{ color:T.faint, fontWeight:400 }}> · {Math.round(pct * 100)}%</span>}
          </span>
        </div>
        <Bar pct={r.p ?? pct} color={color}/>
      </div>
    )
  })
}

/* Barras horizontais de distribuição (BI) */
const DistBars = ({ title, icon, opts, leads, field, color = T.gold }) => (
  <Card>
    <CardTitle icon={icon}>{title}</CardTitle>
    <BarList color={color} total={leads.length} rows={opts.map(([key, label]) => ({ k:key, l:label, n:leads.filter(l => l[field] === key).length }))}/>
  </Card>
)

/* Leads por dia (colunas) */
const DailyBars = ({ leads, days }) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const cols = Array.from({ length:days }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i))
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const cnt = leads.filter(l => { const c = new Date(l.createdAt || 0); return c >= d && c < next }).length
    return { d, cnt }
  })
  const max = Math.max(1, ...cols.map(c => c.cnt))
  return (
    <Card>
      <CardTitle icon={BarChart2}>Leads por dia · últimos {days} dias</CardTitle>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:130, borderBottom:`1px solid ${T.line}` }}>
        {cols.map(({ d, cnt }, i) => (
          <div key={i} title={`${d.toLocaleDateString('pt-BR')}: ${cnt} lead(s)`}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
            {cnt > 0 && <span style={{ fontSize:10, color:T.muted, marginBottom:3, ...num }}>{cnt}</span>}
            <div style={{ width:'100%', maxWidth:20, height:`${cnt / max * 100}%`, minHeight:cnt ? 3 : 0,
              background: i === cols.length - 1 ? T.gold : 'rgba(212,175,55,0.55)', borderRadius:'3px 3px 0 0' }}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:T.faint }}>
        <span>{cols[0].d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</span>
        <span>hoje</span>
      </div>
    </Card>
  )
}

/* Linha "rótulo — valor" da ficha do lead */
const Row = ({ label, children }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'9px 0', borderBottom:`1px solid ${T.line}` }}>
    <span style={{ fontSize:13, color:T.muted }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:500, textAlign:'right' }}>{children}</span>
  </div>
)
const Section = ({ title, children, style }) => (
  <div style={{ padding:'16px 22px', borderTop:`1px solid ${T.line}`, ...style }}>
    <div style={{ fontSize:11, fontWeight:600, color:T.faint, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>{title}</div>
    {children}
  </div>
)

/* ─── MAIN CRM ───────────────────────────────────────── */
/* Só abre o CRM com login válido (ver crm/AuthGate.jsx) */
export default function CRM() {
  return <AuthGate>{(user, onLogout) => <CRMApp user={user} onLogout={onLogout}/>}</AuthGate>
}

function CRMApp({ user, onLogout }) {
  const isAdmin = user.role === 'admin'
  const [view,       setView]       = useState('dashboard')
  const [leads,      setLeads]      = useState([])
  const [search,     setSearch]     = useState('')
  const [fTemp,      setFTemp]      = useState('all')
  const [fStage,     setFStage]     = useState('all')
  const [selected,   setSelected]   = useState(null)
  const [showNew,    setShowNew]     = useState(false)
  const [newLead,    setNewLead]     = useState({ name:'', dest:'', value:'', type:'Internacional', temp:'Morno', source:'WhatsApp', stage:0, phone:'', email:'', cidade:'', obs:'' })
  /* ── Nuvem (Supabase via /api/leads) — única fonte de dados, atrás do login ──
     Nada de lead fica salvo no navegador. */
  const mode = 'cloud'
  const [cloudMsg,   setCloudMsg]   = useState('')
  const [showCloud,  setShowCloud]  = useState(false)
  const [syncing,    setSyncing]    = useState(false)
  const [secInfo,    setSecInfo]    = useState('')     // resultado das ações de segurança (admin)
  const [auditLog,   setAuditLog]   = useState(null)
  const [metaPeriod, setMetaPeriod] = useState('30')
  const [metaInfo,   setMetaInfo]   = useState(null)   // status da integração Meta
  const [metaBusy,   setMetaBusy]   = useState(false)

  const checkMeta = async (subscribe = false) => {
    setMetaBusy(true)
    try { setMetaInfo(await (subscribe ? metaSubscribe() : metaStatus())) }
    catch (err) { setMetaInfo({ ok:false, missing:[], error: err.status === 403 ? 'Só o administrador pode ver a integração.' : 'Não foi possível verificar agora.' }) }
    finally { setMetaBusy(false) }
  }

  // Verifica a integração ao abrir a aba Leads Meta na nuvem
  useEffect(() => { if (view === 'meta' && mode === 'cloud' && !metaInfo) checkMeta() }, [view, mode])

  const loadCloud = async ({ quiet = false } = {}) => {
    if (!quiet) setSyncing(true)
    try {
      setLeads(normLeads(await fetchLeads()))
      setCloudMsg('')
      return true
    } catch (err) {
      if (err.status === 503) setCloudMsg('A nuvem ainda não foi configurada na Vercel.')
      else if (!quiet) setCloudMsg('Não foi possível carregar os leads agora.')
      return false
    } finally {
      if (!quiet) setSyncing(false)
    }
  }

  // Carrega ao abrir e busca leads novos (ex.: Meta Ads) a cada 20s
  useEffect(() => {
    loadCloud()
    const interval = setInterval(() => loadCloud({ quiet: true }), 20000)
    return () => clearInterval(interval)
  }, [])

  /* ── Segurança (admin): criptografar registros antigos e ver acessos ── */
  const runEncrypt = async () => {
    setSecInfo('Criptografando…')
    try {
      const r = await encryptOld()
      setSecInfo(`Pronto: ${r.leads} leads e ${r.assessorias} assessorias criptografados.`)
    } catch (err) {
      setSecInfo(err.message === 'no_encryption_key' ? 'Falta cadastrar CRM_ENCRYPTION_KEY na Vercel.' : 'Não foi possível criptografar agora.')
    }
  }
  const loadAudit = async () => {
    try { setAuditLog(await fetchAudit()) } catch { setSecInfo('Não foi possível carregar o registro de acessos.') }
  }

  /* ── Métricas ── */
  const closed   = leads.filter(l => l.stage === 10 || l.stage === 11)
  const lost     = leads.filter(l => l.stage === 12)
  const active   = leads.filter(l => l.stage < 10 && l.stage !== 12)
  const recReal  = closed.reduce((a, b) => a + b.value, 0)
  const recPot   = active.reduce((a, b) => a + b.value, 0)
  const conv     = closed.length + lost.length > 0 ? Math.round(closed.length / (closed.length + lost.length) * 100) : 0
  const ticket   = leads.length > 0 ? Math.round(leads.reduce((a, b) => a + b.value, 0) / leads.length) : 0
  const semCtato = leads.filter(l => l.stage === 0).length

  /* ── Leads filtrados ── */
  const filtered = leads.filter(l => {
    const ms  = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.dest.toLowerCase().includes(search.toLowerCase())
    const mt  = fTemp  === 'all' || l.temp  === fTemp
    const mst = fStage === 'all' || l.stage === parseInt(fStage)
    return ms && mt && mst
  })

  /* ── Adicionar lead ── */
  const resetNewLead = () =>
    setNewLead({ name:'', dest:'', value:'', type:'Internacional', temp:'Morno', source:'WhatsApp', stage:0, phone:'', email:'', cidade:'', obs:'' })

  const addLead = async () => {
    if (!newLead.name || !newLead.dest) return
    try {
      const created = await createLead({ ...newLead, value: parseInt(newLead.value) || 0, consultor: isAdmin ? 'Joseph' : user.nome })
      setLeads(p => [created, ...p])
      setShowNew(false)
      resetNewLead()
    } catch { alert('Não foi possível salvar o lead na nuvem. Tente de novo.') }
  }

  /* ── Mover estágio ── */
  const applyLead = (id, fields) => {
    setLeads(p => p.map(l => l.id === id ? { ...l, ...fields } : l))
    setSelected(s => s?.id === id ? { ...s, ...fields } : s)
  }

  const moveStage = (id, stage) => {
    const lead = leads.find(l => l.id === id)
    if (!lead) return
    // Perder um lead exige motivo → abre a janela de motivo
    if (stage === PERDIDO) { setLossFor({ id, motivo:'', obs:'' }); return }
    // Reabrir um lead perdido limpa o motivo
    const fields = lead.stage === PERDIDO
      ? { stage, motivo_perda:'', motivo_perda_obs:'', perdido_em:null }
      : { stage }
    const prev = Object.fromEntries(Object.keys(fields).map(k => [k, lead[k]]))
    applyLead(id, fields)
    patchLead(id, fields).catch(() => {
      applyLead(id, prev)
      alert('Não foi possível salvar a mudança de estágio na nuvem.')
    })
  }

  /* ── Motivo da perda ── */
  const [lossFor, setLossFor] = useState(null)   // { id, motivo, obs }
  const [lossBusy, setLossBusy] = useState(false)

  const confirmLoss = async () => {
    const { id, motivo, obs } = lossFor
    if (!motivo || (motivo === 'outro' && !obs.trim())) return
    const lead = leads.find(l => l.id === id)
    const fields = {
      stage: PERDIDO, motivo_perda: motivo, motivo_perda_obs: obs.trim(),
      perdido_em: lead?.stage === PERDIDO && lead.perdido_em ? lead.perdido_em : new Date().toISOString(),
    }
    setLossBusy(true)
    try {
      await patchLead(id, fields)
      applyLead(id, fields)
      setLossFor(null)
    } catch { alert('Não foi possível salvar o motivo da perda. Tente de novo.') }
    finally { setLossBusy(false) }
  }

  /* ── Editar valor do lead ── */
  const saveValue = (id, raw) => {
    const value = Math.max(0, Math.round(Number(raw) || 0))
    const prev = leads.find(l => l.id === id)?.value
    if (value === prev) return
    setLeads(p => p.map(l => l.id === id ? { ...l, value } : l))
    if (selected?.id === id) setSelected(s => ({ ...s, value }))
    if (mode === 'cloud') {
      patchLead(id, { value }).catch(() => {
        setLeads(p => p.map(l => l.id === id ? { ...l, value: prev } : l))
        setSelected(s => s?.id === id ? { ...s, value: prev } : s)
        alert('Não foi possível salvar o valor na nuvem.')
      })
    }
  }

  /* ── Excluir lead ── */
  const deleteLead = async lead => {
    if (!window.confirm(`Excluir o lead "${lead.name}"? Isso não pode ser desfeito.`)) return
    try { await removeLead(lead.id) } catch (err) {
      alert(err.status === 403 ? 'Só o administrador pode excluir leads.' : 'Não foi possível excluir o lead na nuvem.')
      return
    }
    setLeads(p => p.filter(l => l.id !== lead.id))
    setSelected(null)
  }


  const NAV = [
    { grupo:'Vendas', itens:[
      { id:'dashboard',   icon:LayoutDashboard, label:'Visão geral'  },
      { id:'pipeline',    icon:GitBranch,       label:'Pipeline'     },
      { id:'leads',       icon:Users,           label:'Leads'        },
      { id:'meta',        icon:Megaphone,       label:'Leads Meta'   },
    ] },
    { grupo:'Operação', itens:[
      { id:'assessorias', icon:Briefcase,       label:'Assessorias'  },
      { id:'propostas',   icon:FileText,        label:'Propostas'    },
    ] },
    { grupo:'Gestão', itens:[
      { id:'relatorios',  icon:BarChart2,       label:'Relatórios'   },
      { id:'automacoes',  icon:Zap,             label:'Automações'   },
      { id:'arquitetura', icon:Building2,       label:'Arquitetura'  },
    ] },
  ]
  const navLabel = NAV.flatMap(g => g.itens).find(i => i.id === view)?.label
  const iniciais = String(user.nome || user.email || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

  /* ════════════════════════════════════════════════════ */
  /*  VIEWS                                               */
  /* ════════════════════════════════════════════════════ */

  /* ── VISÃO GERAL ── */
  const ViewDashboard = () => (
    <div>
      <PageHeader title="Visão geral" sub={`Operação comercial · ${new Date().toLocaleDateString('pt-BR', { month:'long', year:'numeric' })}`}>
      </PageHeader>

      <KpiGrid min={150} style={{ marginBottom:12 }}>
        <Kpi icon={TrendingUp}   label="Receita realizada" value={fmtR(recReal)} hint={`${closed.length} venda${closed.length === 1 ? '' : 's'} fechada${closed.length === 1 ? '' : 's'}`}/>
        <Kpi icon={Target}       label="Receita em aberto" value={fmtR(recPot)}  hint={`${active.length} em atendimento`}/>
        <Kpi icon={CheckCircle2} label="Taxa de conversão" value={`${conv}%`}    hint="fechados ÷ (fechados + perdidos)"/>
        <Kpi icon={FileText}     label="Ticket médio"      value={fmtR(ticket)}  hint={`${leads.length} leads no total`}/>
      </KpiGrid>
      <KpiGrid min={150} style={{ marginBottom:20 }}>
        <Kpi icon={Users}        label="Total de leads"    value={leads.length}/>
        <Kpi icon={Clock}        label="Em atendimento"    value={active.length}/>
        <Kpi icon={AlertCircle}  label="Sem contato"       value={semCtato} tone={semCtato ? '#F87171' : undefined} hint={semCtato ? 'aguardando primeiro contato' : 'tudo em dia'}/>
        <Kpi icon={Trophy}       label="Vendas fechadas"   value={closed.length}/>
      </KpiGrid>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:12, marginBottom:12 }}>
        <Card>
          <CardTitle icon={GitBranch} right={<Btn ghost small onClick={() => setView('pipeline')}>Abrir pipeline <ChevronRight size={13}/></Btn>}>Pipeline por estágio</CardTitle>
          <BarList total={leads.length} rows={STAGES.filter(s => s.id <= 11).map(st => ({ k:st.id, l:st.name, c:st.color, n:leads.filter(l => l.stage === st.id).length }))}/>
        </Card>

        <Card style={{ padding:0 }}>
          <div style={{ padding:'18px 18px 4px' }}><CardTitle icon={Trophy}>Maiores oportunidades</CardTitle></div>
          {[...leads].sort((a, b) => b.value - a.value).slice(0, 7).map(l => (
            <div key={l.id} onClick={() => setSelected(l)} className="crm-row"
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderTop:`1px solid ${T.line}`, cursor:'pointer' }}>
              <Avatar initials={l.initials} color={l.color} size={30}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.name}</div>
                <div style={{ fontSize:12, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.dest}</div>
              </div>
              <Stage id={l.stage} small/>
              <div style={{ fontSize:13, fontWeight:600, minWidth:96, textAlign:'right', ...num }}>{fmtR(l.value)}</div>
            </div>
          ))}
          {!leads.length && <Empty icon={Inbox}>Nenhum lead ainda.</Empty>}
        </Card>
      </div>

      <Card style={{ padding:0, overflowX:'auto' }}>
        <div style={{ padding:'18px 18px 4px' }}><CardTitle icon={Radio}>Origem dos leads</CardTitle></div>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:520 }}>
          <thead><tr>{['Origem','Leads','Fechados','Receita'].map((h, i) => <th key={h} style={{ ...th, textAlign:i ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {ORIGENS.map(src => {
              const sl = leads.filter(l => l.source === src)
              if (!sl.length) return null
              return (
                <tr key={src} className="crm-row">
                  <td style={td}>{src}</td>
                  <td style={{ ...td, textAlign:'right', ...num }}>{sl.length}</td>
                  <td style={{ ...td, textAlign:'right', ...num }}>{sl.filter(l => l.stage === 10 || l.stage === 11).length}</td>
                  <td style={{ ...td, textAlign:'right', ...num }}>{fmtR(sl.reduce((a, b) => a + b.value, 0))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!leads.length && <Empty>Sem dados ainda.</Empty>}
      </Card>
    </div>
  )

  /* ── PIPELINE ── */
  const ViewPipeline = () => (
    <div>
      <PageHeader title="Pipeline" sub={`${leads.length} leads · ${fmtR(recPot)} em aberto`}>
      </PageHeader>
      <div className="crm-scroll" style={{ overflowX:'auto', paddingBottom:12 }}>
        <div style={{ display:'flex', gap:10, minWidth:'max-content', alignItems:'flex-start' }}>
          {STAGES.map(stage => {
            const sl = leads.filter(l => l.stage === stage.id)
            const val = sl.reduce((a, b) => a + b.value, 0)
            return (
              <div key={stage.id} style={{ width:250, flexShrink:0, background:'rgba(255,255,255,0.02)', border:`1px solid ${T.line}`, borderRadius:10 }}>
                <div style={{ padding:'11px 12px 10px', borderBottom:`1px solid ${T.line}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Dot color={stage.color}/>
                    <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{stage.name}</span>
                    <span style={{ fontSize:12, color:T.muted, ...num }}>{sl.length}</span>
                  </div>
                  <div style={{ fontSize:12, color:T.faint, marginTop:3, marginLeft:15, ...num }}>{fmtR(val)}</div>
                </div>
                <div style={{ padding:8, minHeight:380, display:'grid', gap:7, alignContent:'start' }}>
                  {sl.map(lead => (
                    <div key={lead.id} onClick={() => setSelected(lead)} className="crm-hover"
                      style={{ background:T.card, borderRadius:8, padding:'10px 11px', border:`1px solid ${T.line}`, cursor:'pointer', transition:'border-color .15s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar initials={lead.initials} color={lead.color} size={24}/>
                        <div style={{ fontSize:13, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name}</div>
                      </div>
                      <div style={{ fontSize:12, color:T.muted, margin:'7px 0 9px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.dest || '—'}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:600, ...num }}>{fmtR(lead.value)}</span>
                        <Temp t={lead.temp} small/>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.faint, marginTop:8 }}>
                        <span>{lead.source}</span><span>{lead.date}</span>
                      </div>
                      {lead.stage === PERDIDO && (
                        <div style={{ fontSize:11, marginTop:7, paddingTop:7, borderTop:`1px solid ${T.line}`, color:T.muted, display:'flex', gap:6, alignItems:'center' }}>
                          <Dot color={motivoOf(lead.motivo_perda)?.c || T.err} size={6}/> {motivoOf(lead.motivo_perda)?.l || 'Sem motivo informado'}
                        </div>
                      )}
                    </div>
                  ))}
                  {!sl.length && <div style={{ textAlign:'center', padding:'28px 0', color:T.faint, fontSize:12 }}>Nenhum lead</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ── LEADS TABLE ── */
  const exportCsv = () => {
    const cols = [['Nome','name'],['Telefone','phone'],['E-mail','email'],['Destino','dest'],['Tipo','type'],['Valor','value'],['Temperatura','temp'],['Origem','source'],['Consultor','consultor'],['Data','date']]
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [[...cols.map(c => c[0]), 'Estágio'].join(';'),
      ...filtered.map(l => [...cols.map(c => esc(l[c[1]])), esc(stageOf(l.stage).name)].join(';'))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' }))
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(a.href)
  }
  const ViewLeads = () => (
    <div>
      <PageHeader title="Leads" sub={`${filtered.length} de ${leads.length} leads`}>
        <Btn outline onClick={exportCsv} disabled={!filtered.length}><Download size={14}/> Exportar CSV</Btn>
      </PageHeader>

      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:12, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', borderBottom:`1px solid ${T.line}` }}>
          <div style={{ position:'relative', flex:'1 1 220px' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.faint }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou destino"
              style={{ ...inputS, paddingLeft:32 }}/>
          </div>
          <select value={fTemp} onChange={e => setFTemp(e.target.value)} style={{ ...inputS, width:'auto', background:T.card, cursor:'pointer' }}>
            <option value="all">Todas as temperaturas</option>
            {['Frio','Morno','Quente','VIP'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={fStage} onChange={e => setFStage(e.target.value)} style={{ ...inputS, width:'auto', background:T.card, cursor:'pointer' }}>
            <option value="all">Todos os estágios</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {(search || fTemp !== 'all' || fStage !== 'all') &&
            <Btn ghost small onClick={() => { setSearch(''); setFTemp('all'); setFStage('all') }}><X size={13}/> Limpar</Btn>}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1040 }}>
            <thead>
              <tr>{['Cliente','Destino','Valor','Temperatura','Estágio','Origem','Consultor','Entrada',''].map((h, i) => (
                <th key={i} style={{ ...th, textAlign:h === 'Valor' ? 'right' : 'left' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="crm-row" style={{ cursor:'pointer' }} onClick={() => setSelected(lead)}>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar initials={lead.initials} color={lead.color} size={28}/>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600, whiteSpace:'nowrap' }}>{lead.name}</div>
                        <div style={{ fontSize:11, color:T.faint, ...num }}>#{String(lead.id).padStart(4,'0')}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.dest}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{lead.type}</div>
                  </td>
                  <td style={{ ...td, textAlign:'right', fontWeight:600, whiteSpace:'nowrap', ...num }}>{fmtR(lead.value)}</td>
                  <td style={td}><Temp t={lead.temp}/></td>
                  <td style={td}><Stage id={lead.stage}/></td>
                  <td style={{ ...td, color:T.muted }}>{lead.source}</td>
                  <td style={td}>{lead.consultor}</td>
                  <td style={{ ...td, color:T.muted, whiteSpace:'nowrap', ...num }}>{lead.date}</td>
                  <td style={{ ...td, width:44 }} onClick={e => e.stopPropagation()}>
                    {lead.phone && <a href={waLink(lead.phone, lead.name)} target="_blank" rel="noreferrer" title="WhatsApp" aria-label="WhatsApp"
                      style={{ color:T.muted, display:'inline-flex', padding:6 }}><MessageCircle size={15}/></a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <Empty icon={Search} title="Nenhum lead encontrado">Ajuste a busca ou os filtros.</Empty>}
      </Card>
    </div>
  )

  /* ── LEADS META (BI do formulário de Lead Ads) ── */
  const ViewMeta = () => {
    const metaAll = leads.filter(l => l.source === 'Meta Ads')
    const since = metaPeriod === 'all' ? null : new Date(Date.now() - parseInt(metaPeriod) * 864e5)
    const meta = since ? metaAll.filter(l => new Date(l.createdAt || 0) >= since) : metaAll
    const today0 = new Date(); today0.setHours(0,0,0,0)
    const hoje   = meta.filter(l => new Date(l.createdAt || 0) >= today0).length
    const hot    = meta.filter(l => l.temp === 'Quente' || l.temp === 'VIP').length
    const fila   = metaAll.filter(l => l.stage === 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0) || new Date(a.createdAt) - new Date(b.createdAt))
    const potencial = meta.reduce((a, b) => a + b.value, 0)

    const campanhas = Object.values(meta.reduce((acc, l) => {
      const k = `${l.campaign_name || '—'}||${l.ad_name || '—'}`
      acc[k] = acc[k] || { camp: l.campaign_name || '—', ad: l.ad_name || '—', n: 0, hot: 0, val: 0 }
      acc[k].n++; acc[k].val += l.value
      if (l.temp === 'Quente' || l.temp === 'VIP') acc[k].hot++
      return acc
    }, {})).sort((a, b) => b.n - a.n)

    const m = metaInfo
    const ready = m?.ok && m.subscribed
    let status = 'Verificando a integração…'
    if (m && m.missing?.length) status = `Falta configurar na Vercel: ${m.missing.join(', ')}`
    else if (m && !m.ok) status = `Erro: ${m.error}`
    else if (m && !m.subscribed) status = `Página "${m.page}" encontrada, mas ainda não está enviando leads para o CRM.`
    else if (ready) status = `Página "${m.page}" conectada. Os leads do formulário entram automaticamente.`

    return (
      <div>
        <PageHeader title="Leads Meta Ads" sub='Formulário "Assessoria Viagem" · entrada automática pelo webhook da Meta'>
          <Segmented value={metaPeriod} onChange={setMetaPeriod} opts={[['7','7 dias'],['30','30 dias'],['all','Tudo']]}/>
          <Btn outline onClick={() => loadCloud()} disabled={syncing}><RefreshCw size={13}/> {syncing ? 'Atualizando…' : 'Atualizar'}</Btn>
        </PageHeader>

        <Card style={{ marginBottom:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
            <Dot color={ready ? T.success : m ? T.warn : T.faint} size={8}/>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>{ready ? 'Integração ativa' : 'Integração Meta'}</div>
              <div style={{ fontSize:12, color:T.muted }}>{status}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {m?.ok && !m.subscribed && <Btn onClick={() => checkMeta(true)} disabled={metaBusy}>{metaBusy ? 'Conectando…' : 'Conectar Página ao CRM'}</Btn>}
            <Btn outline small onClick={() => checkMeta()} disabled={metaBusy}><RefreshCw size={12}/> Verificar</Btn>
          </div>
        </Card>

        <KpiGrid min={160} style={{ marginBottom:12 }}>
          <Kpi label="Leads no período"   value={meta.length}/>
          <Kpi label="Chegaram hoje"      value={hoje}/>
          <Kpi label="Quentes + VIP"      value={hot} hint={`${meta.length ? Math.round(hot / meta.length * 100) : 0}% do período`}/>
          <Kpi label="Aguardando contato" value={fila.length} tone={fila.length ? '#FBBF24' : undefined}/>
          <Kpi label="Potencial estimado" value={fmtR(potencial)}/>
        </KpiGrid>

        <div style={{ marginBottom:12 }}><DailyBars leads={meta} days={metaPeriod === '7' ? 7 : 14}/></div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12, marginBottom:12 }}>
          <DistBars title="Destino"        icon={Plane}    opts={META_DEST}    leads={meta} field="dest"/>
          <DistBars title="Investimento"   icon={TrendingUp} opts={META_INVEST} leads={meta} field="investimento"/>
          <DistBars title="Pessoas"        icon={Users}    opts={META_PESSOAS} leads={meta} field="pessoas"/>
          <DistBars title="Dias de viagem" icon={Calendar} opts={META_DIAS}    leads={meta} field="dias"/>
          <Card>
            <CardTitle icon={Target}>Temperatura</CardTitle>
            <BarList total={meta.length} rows={['VIP','Quente','Morno','Frio'].map(t => ({ k:t, l:t, c:TEMP_C[t], n:meta.filter(l => l.temp === t).length }))}/>
          </Card>
        </div>

        <Card style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px 2px' }}>
            <CardTitle icon={Phone} right={<span style={{ fontSize:12, color:T.faint }}>Prometido no formulário: contato em até 24h</span>}>Fila de atendimento · por score</CardTitle>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:820 }}>
              <thead><tr>{['Lead','Destino','Pessoas','Dias','Investimento','Temp.','Chegou',''].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {fila.map(l => {
                  const horas = Math.floor((Date.now() - new Date(l.createdAt)) / 36e5)
                  const wa = waLink(l.phone, l.name)
                  return (
                    <tr key={l.id} className="crm-row" style={{ cursor:'pointer' }} onClick={() => setSelected(l)}>
                      <td style={td}>
                        <div style={{ fontWeight:600 }}>{l.name}</div>
                        <div style={{ fontSize:12, color:T.muted }}>{l.phone || 'sem telefone'}</div>
                      </td>
                      <td style={td}>{l.dest || '—'}</td>
                      <td style={td}>{labelOf(META_PESSOAS, l.pessoas)}</td>
                      <td style={td}>{labelOf(META_DIAS, l.dias)}</td>
                      <td style={td}>{labelOf(META_INVEST, l.investimento)}</td>
                      <td style={td}><Temp t={l.temp} small/></td>
                      <td style={{ ...td, ...num }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                          <Dot color={horas >= 24 ? T.err : horas >= 1 ? T.warn : T.success} size={6}/>{horas < 1 ? 'agora' : `há ${horas}h`}
                        </span>
                      </td>
                      <td style={td} onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}><Btn outline small><MessageCircle size={12}/> WhatsApp</Btn></a>}
                          <Btn outline small onClick={() => moveStage(l.id, 1)}><CheckCircle2 size={12}/> Contatado</Btn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!fila.length && <Empty icon={CheckCircle2}>Nenhum lead do Meta aguardando contato.</Empty>}
          </div>
        </Card>

        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px 2px' }}><CardTitle icon={Megaphone}>Por campanha e anúncio</CardTitle></div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:620 }}>
              <thead><tr>{['Campanha','Anúncio','Leads','Quentes + VIP','Potencial'].map((h, i) => <th key={h} style={{ ...th, textAlign:i > 1 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
              <tbody>
                {campanhas.map((c, i) => (
                  <tr key={i} className="crm-row">
                    <td style={td}>{c.camp}</td>
                    <td style={{ ...td, color:T.muted }}>{c.ad}</td>
                    <td style={{ ...td, textAlign:'right', ...num }}>{c.n}</td>
                    <td style={{ ...td, textAlign:'right', ...num }}>{c.hot} <span style={{ color:T.faint }}>· {Math.round(c.hot / c.n * 100)}%</span></td>
                    <td style={{ ...td, textAlign:'right', ...num }}>{fmtR(c.val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!campanhas.length && <Empty>Sem leads do Meta no período.</Empty>}
          </div>
        </Card>
      </div>
    )
  }

  /* ── PROPOSTAS ── */
  const ViewPropostas = () => {
    const list = leads.filter(l => l.stage >= 5 && l.stage !== 12)
    return (
      <div>
        <PageHeader title="Propostas" sub="Leads com cotação enviada em diante">
          <Btn><Plus size={14}/> Nova proposta</Btn>
        </PageHeader>
        <Card style={{ padding:0, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
            <thead><tr>{['Cliente','Destino','Tipo','Estágio','Temperatura','Valor',''].map((h, i) => <th key={i} style={{ ...th, textAlign:h === 'Valor' ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
            <tbody>
              {list.map(lead => (
                <tr key={lead.id} className="crm-row" style={{ cursor:'pointer' }} onClick={() => setSelected(lead)}>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar initials={lead.initials} color={lead.color} size={28}/>
                      <div><div style={{ fontWeight:600, whiteSpace:'nowrap' }}>{lead.name}</div><div style={{ fontSize:12, color:T.faint }}>{lead.date}</div></div>
                    </div>
                  </td>
                  <td style={td}>{lead.dest}</td>
                  <td style={{ ...td, color:T.muted }}>{lead.type}</td>
                  <td style={td}><Stage id={lead.stage}/></td>
                  <td style={td}><Temp t={lead.temp}/></td>
                  <td style={{ ...td, textAlign:'right', fontWeight:600, whiteSpace:'nowrap', ...num }}>{fmtR(lead.value)}</td>
                  <td style={{ ...td, textAlign:'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <Btn outline small>Ver</Btn>
                      <Btn outline small><Download size={12}/> PDF</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <Empty icon={FileText} title="Nenhuma proposta">Leads aparecem aqui a partir do estágio "Cotação Enviada".</Empty>}
        </Card>
      </div>
    )
  }

  /* ── AUTOMAÇÕES ── */
  const ViewAutomacoes = () => (
    <div>
      <PageHeader title="Automações" sub="Fluxos automáticos via N8N + WhatsApp Business API"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:12 }}>
        {[
          { title:'Lead novo',             icon:Inbox,       steps:['Lead entra pelo formulário / API / Meta Ads','Consultor notificado via WhatsApp Business','Tarefa de primeiro contato criada (SLA 1h)','Mensagem automática de boas-vindas enviada','Lead cadastrado no CRM e distribuído'] },
          { title:'SLA de atendimento',    icon:Clock,       steps:['1h sem contato → alerta ao consultor','4h sem contato → alerta urgente','24h sem contato → escalonamento ao gestor','Lead marcado como prioridade máxima','Relatório de SLA enviado diariamente'] },
          { title:'Follow-up automático',  icon:RefreshCw,   steps:['3 dias sem resposta → follow-up 1 personalizado','7 dias sem resposta → follow-up 2 com nova proposta','15 dias → follow-up 3 com oferta especial','30 dias → lead marcado como Frio','Mensagens adaptadas por tipo de destino'] },
          { title:'Pós-venda',             icon:CheckCircle2,steps:['Venda fechada → checklist de documentos enviado','7 dias antes → lembrete de check-in','Dia do embarque → mensagem e dicas finais','Retorno → pesquisa NPS automática','15 dias → pedir avaliação no Google e indicação'] },
          { title:'Score de leads (IA)',   icon:Target,      steps:['Lead novo → score 0–100 calculado por IA','Classificação automática de temperatura','Sugestão de resposta personalizada','Identificação de leads prioritários','Previsão de fechamento em dias'] },
          { title:'Meta & Google Ads',     icon:Megaphone,   steps:['Lead Ads → CRM automático via API','UTMs capturados (source/medium/campaign)','Consultor notificado em tempo real','Tag de campanha aplicada no lead','ROI por campanha calculado automaticamente'] },
        ].map(a => (
          <Card key={a.title}>
            <CardTitle icon={a.icon} right={<Badge color={T.success} small>Ativo</Badge>}>{a.title}</CardTitle>
            <ol style={{ margin:0, padding:0, listStyle:'none' }}>
              {a.steps.map((step, j) => (
                <li key={j} style={{ display:'flex', gap:10, padding:'7px 0', borderTop:j ? `1px solid ${T.line}` : 'none', fontSize:13 }}>
                  <span style={{ color:T.faint, width:14, flexShrink:0, ...num }}>{j + 1}</span>
                  <span style={{ color:T.muted, lineHeight:1.45 }}>{step}</span>
                </li>
              ))}
            </ol>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <Btn outline small>Editar</Btn>
              <Btn ghost small>Testar</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  /* ── RELATÓRIOS ── */
  /* Motivos de perda reais (leads no estágio Perdido), com recorte Meta Ads x demais origens */
  const ViewMotivosPerda = () => {
    const perdidos = leads.filter(l => l.stage === PERDIDO)
    const rows = [...MOTIVOS_PERDA, { k:'', l:'Sem motivo informado', c:'#4B5563' }]
      .map(m => {
        const sl = perdidos.filter(l => (l.motivo_perda || '') === m.k)
        return { ...m, n: sl.length, meta: sl.filter(l => l.source === 'Meta Ads').length }
      })
      .filter(m => m.n)
      .sort((a, b) => b.n - a.n)
    return (
      <Card>
        <CardTitle icon={AlertCircle} right={<span style={{ fontSize:12, color:T.faint, ...num }}>{perdidos.length} perdido{perdidos.length === 1 ? '' : 's'}</span>}>Motivos de perda</CardTitle>
        {!rows.length && (
          <div style={{ fontSize:13, color:T.muted, lineHeight:1.5 }}>
            Nenhum lead perdido ainda. Ao mover um lead para <b style={{ color:T.text }}>Perdido</b>, o CRM pede o motivo e ele aparece aqui.
          </div>
        )}
        <BarList total={perdidos.length} rows={rows.map(m => ({ k:m.k || 'none', l:m.meta ? `${m.l} (${m.meta} Meta)` : m.l, c:m.c, n:m.n }))}/>
      </Card>
    )
  }

  const ViewRelatorios = () => {
    const porTipo = TIPOS.map(t => ({ k:t, l:t, n:leads.filter(l => l.type === t).reduce((a, b) => a + b.value, 0) })).filter(r => r.n)
    const maxVal = Math.max(1, ...porTipo.map(r => r.n))
    return (
      <div>
        <PageHeader title="Relatórios" sub="Performance comercial"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:12, marginBottom:12 }}>
          <Card>
            <CardTitle icon={TrendingUp}>Receita por tipo de viagem</CardTitle>
            <BarList rows={porTipo.map(r => ({ ...r, v:fmtR(r.n), p:r.n / maxVal }))}/>
            {!porTipo.length && <div style={{ fontSize:13, color:T.muted }}>Sem valores lançados ainda.</div>}
          </Card>
          <ViewMotivosPerda/>
        </div>
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px 2px' }}><CardTitle icon={Radio}>Conversão por origem</CardTitle></div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
              <thead><tr>{['Origem','Leads','Fechados','Conversão','Receita total','Ticket médio'].map((h, i) => (
                <th key={h} style={{ ...th, textAlign:i ? 'right' : 'left' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {ORIGENS.map(src => {
                  const sl = leads.filter(l => l.source === src)
                  if (!sl.length) return null
                  const sc  = sl.filter(l => l.stage === 10 || l.stage === 11)
                  const rec = sl.reduce((a, b) => a + b.value, 0)
                  const cv  = Math.round(sc.length / sl.length * 100)
                  return (
                    <tr key={src} className="crm-row">
                      <td style={{ ...td, fontWeight:600 }}>{src}</td>
                      <td style={{ ...td, textAlign:'right', ...num }}>{sl.length}</td>
                      <td style={{ ...td, textAlign:'right', ...num }}>{sc.length}</td>
                      <td style={{ ...td, textAlign:'right', ...num }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Dot color={cv > 50 ? T.success : cv > 25 ? T.warn : T.err} size={6}/>{cv}%</span>
                      </td>
                      <td style={{ ...td, textAlign:'right', ...num }}>{fmtR(rec)}</td>
                      <td style={{ ...td, textAlign:'right', ...num }}>{fmtR(Math.round(rec / sl.length))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!leads.length && <Empty>Sem dados ainda.</Empty>}
          </div>
        </Card>
      </div>
    )
  }

  /* ── ARQUITETURA ── */
  const ViewArquitetura = () => (
    <div>
      <PageHeader title="Arquitetura do sistema" sub="Stack técnica, banco de dados e roadmap"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:12, marginBottom:12 }}>
        {[
          { t:'Frontend',        icon:LayoutDashboard, items:['Next.js 14 (App Router)','React + TypeScript','Tailwind CSS','ShadCN UI','React Query','Zustand','React Hook Form + Zod'] },
          { t:'Backend',         icon:Building2,       items:['Node.js + NestJS','REST API + GraphQL','JWT + OAuth2','Prisma ORM','Bull Queue','WebSockets','Rate limiting + Helmet'] },
          { t:'Banco e storage', icon:Database,        items:['PostgreSQL (principal)','Redis (cache)','AWS S3 (arquivos)','ElasticSearch (busca)','Backup automático S3','Migrations Prisma','Multi-tenant RLS'] },
          { t:'IA e automações', icon:Zap,             items:['N8N (orquestração)','WhatsApp Business API','OpenAI GPT-4 (score)','Claude API (sugestões)','ManyChat integration','Webhooks receptores','Cron jobs (Bull)'] },
        ].map(tech => (
          <Card key={tech.t}>
            <CardTitle icon={tech.icon}>{tech.t}</CardTitle>
            {tech.items.map((item, j) => (
              <div key={j} style={{ padding:'7px 0', borderTop:j ? `1px solid ${T.line}` : 'none', fontSize:13, color:T.muted }}>{item}</div>
            ))}
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom:12 }}>
        <CardTitle icon={MapIcon}>Roadmap de desenvolvimento</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
          {[
            { phase:'MVP · 30 dias',  items:['Cadastro de leads','Pipeline Kanban','Dashboard KPIs','Auth multi-usuário','WhatsApp básico'] },
            { phase:'V1 · 60 dias',   items:['Propostas em PDF','Automações N8N','Relatórios completos','UTM tracking','App consultor'] },
            { phase:'V2 · 90 dias',   items:['IA Score de leads','Landing pages','Meta/Google Ads','Pós-venda auto','Indicações'] },
            { phase:'V3 · 120 dias',  items:['Previsão IA','Multi-empresa','API pública','BI avançado','White-label'] },
          ].map(ph => (
            <div key={ph.phase} style={{ background:'rgba(255,255,255,0.02)', borderRadius:8, padding:14, border:`1px solid ${T.line}` }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>{ph.phase}</div>
              {ph.items.map((item, j) => (
                <div key={j} style={{ fontSize:13, color:T.muted, padding:'4px 0', display:'flex', alignItems:'center', gap:7 }}>
                  <CheckCircle2 size={13} color={T.faint}/>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle icon={Database}>Schema PostgreSQL</CardTitle>
        <div style={{ background:'#070C17', border:`1px solid ${T.line}`, borderRadius:8, padding:16, fontFamily:'ui-monospace,Consolas,monospace', fontSize:12, lineHeight:1.8, color:'#A9B4C8', overflowX:'auto' }}>
          <pre style={{ margin:0 }}>{`-- LEADS
CREATE TABLE leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL,
  whatsapp     VARCHAR(20),  email VARCHAR(200),
  cidade       VARCHAR(100), estado CHAR(2),
  destino      VARCHAR(300), data_viagem DATE,
  adultos      INT DEFAULT 1, criancas INT DEFAULT 0,
  orcamento    DECIMAL(12,2),
  stage_id     INT DEFAULT 0,
  temperatura  VARCHAR(10),    -- Frio|Morno|Quente|VIP
  source       VARCHAR(50),
  utm_source   VARCHAR(100), utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  consultor_id UUID REFERENCES users(id),
  score_ia     DECIMAL(5,2),   -- 0-100
  created_at   TIMESTAMP DEFAULT NOW()
);

-- PROPOSALS
CREATE TABLE proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES leads(id),
  destino     VARCHAR(300),
  data_saida  DATE, data_retorno DATE,
  hotel       VARCHAR(200), categoria VARCHAR(50),
  voos        JSONB, passeios JSONB,
  valor_total DECIMAL(12,2),
  status      VARCHAR(20) DEFAULT 'draft',
  pdf_url     TEXT, sent_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ACTIVITIES
CREATE TABLE activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID REFERENCES leads(id),
  type       VARCHAR(30), -- call|whatsapp|email|note
  content    TEXT,
  user_id    UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);`}</pre>
        </div>
      </Card>
    </div>
  )

  const VIEWS = {
    dashboard:   <ViewDashboard/>,
    pipeline:    <ViewPipeline/>,
    leads:       <ViewLeads/>,
    meta:        <ViewMeta/>,
    assessorias: <Assessorias mode={mode}/>,
    propostas:   <ViewPropostas/>,
    automacoes:  <ViewAutomacoes/>,
    relatorios:  <ViewRelatorios/>,
    arquitetura: <ViewArquitetura/>,
  }

  /* ════════════════════════════════════════════════════ */
  /*  RENDER PRINCIPAL                                    */
  /* ════════════════════════════════════════════════════ */
  return (
    <>
      <GlobalStyle/>
      <style>{`
        .crm-nav { display:flex; align-items:center; gap:10px; width:100%; padding:7px 10px; border-radius:6px; cursor:pointer;
          font-size:13px; font-weight:500; color:${T.muted}; background:transparent; border:none; font-family:inherit; text-align:left; }
        .crm-nav:hover { background:rgba(255,255,255,0.04); color:${T.text}; }
        .crm-nav[aria-current="page"] { background:rgba(255,255,255,0.06); color:${T.text}; font-weight:600; box-shadow:inset 2px 0 0 ${T.gold}; }
        .crm-nav[aria-current="page"] svg { color:${T.gold}; }
        @media (max-width: 900px) {
          .crm-side { width:60px !important; }
          .crm-side .crm-hide, .crm-top .crm-hide { display:none !important; }
          .crm-nav { justify-content:center; padding:9px 0; }
          .crm-main { padding:16px 14px 32px !important; }
          .crm-top { padding:0 12px !important; }
        }
      `}</style>

      <div className="crm-root" style={{ display:'flex', height:'100vh', background:T.bg, color:T.text, overflow:'hidden' }}>

        {/* ── Sidebar ── */}
        <aside className="crm-side" style={{ width:232, background:T.header, borderRight:`1px solid ${T.line}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ height:56, padding:'0 14px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${T.line}` }}>
            <div style={{ width:30, height:30, borderRadius:7, background:T.goldSoft, border:'1px solid rgba(212,175,55,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Plane size={15} color={T.gold}/>
            </div>
            <div className="crm-hide" style={{ lineHeight:1.2 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>Next Plane</div>
              <div style={{ fontSize:11, color:T.faint }}>CRM</div>
            </div>
          </div>
          <nav className="crm-scroll" style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
            {NAV.map(g => (
              <div key={g.grupo} style={{ marginBottom:14 }}>
                <div className="crm-hide" style={{ fontSize:11, fontWeight:600, color:T.faint, padding:'4px 10px 6px', letterSpacing:'0.3px' }}>{g.grupo}</div>
                {g.itens.map(({ id, icon:Icon, label }) => (
                  <button key={id} className="crm-nav" onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined} title={label}>
                    <Icon size={16} strokeWidth={1.8}/><span className="crm-hide">{label}</span>
                    {id === 'leads' && semCtato > 0 && <span className="crm-hide" style={{ marginLeft:'auto', fontSize:11, color:T.muted, ...num }}>{semCtato}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div style={{ padding:8, borderTop:`1px solid ${T.line}` }}>
            <a href="/" className="crm-nav" style={{ textDecoration:'none' }} title="Voltar ao site">
              <LogOut size={15} strokeWidth={1.8}/><span className="crm-hide">Voltar ao site</span>
            </a>
            <button className="crm-nav" onClick={() => setShowCloud(true)} title="Sessão e segurança" style={{ padding:'8px 10px' }}>
              <Avatar initials={iniciais} color={T.gold} size={26}/>
              <span className="crm-hide" style={{ minWidth:0, lineHeight:1.25 }}>
                <span style={{ display:'block', fontSize:13, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.nome}</span>
                <span style={{ display:'block', fontSize:11, color:T.faint }}>{isAdmin ? 'Administrador' : 'Consultor'}</span>
              </span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* Topbar */}
          <header className="crm-top" style={{ height:56, background:T.bg, borderBottom:`1px solid ${T.line}`, padding:'0 22px',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, minWidth:0 }}>
              <span className="crm-hide" style={{ color:T.faint }}>Next Plane</span>
              <ChevronRight className="crm-hide" size={13} color={T.faint}/>
              <span style={{ fontWeight:600 }}>{navLabel}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {semCtato > 0 && (
                <button onClick={() => { setFStage('0'); setView('leads') }} className="crm-ghost crm-hide"
                  style={{ background:'transparent', border:`1px solid ${T.line}`, borderRadius:6, padding:'5px 10px', cursor:'pointer',
                    color:T.text, fontSize:12, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
                  <Dot color={T.err} size={6}/> {semCtato} sem contato
                </button>
              )}
              {syncing && <span className="crm-hide" style={{ fontSize:12, color:T.faint }}>Sincronizando…</span>}
              <Btn small onClick={() => setShowNew(true)}><Plus size={13}/> Novo lead</Btn>
              <IconBtn icon={ShieldCheck} onClick={() => setShowCloud(true)} title="Sessão e segurança"/>
              <IconBtn icon={LogOut} onClick={onLogout} title="Sair"/>
            </div>
          </header>

          {cloudMsg && (
            <div style={{ padding:'8px 22px', fontSize:12, color:'#FCA5A5', background:'rgba(239,68,68,0.08)', borderBottom:`1px solid rgba(239,68,68,0.2)` }}>{cloudMsg}</div>
          )}

          {/* Content */}
          <main className="crm-scroll crm-main" style={{ flex:1, overflowY:'auto', padding:'24px 24px 40px' }}>
            <div style={{ maxWidth:1440, margin:'0 auto' }}>{VIEWS[view]}</div>
          </main>
        </div>

        {/* ── Painel lateral: detalhe do lead ── */}
        {selected && (
          <Drawer onClose={() => setSelected(null)}>
            <div style={{ padding:'18px 22px 16px', display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start',
              position:'sticky', top:0, background:T.card, zIndex:1, borderBottom:`1px solid ${T.line}` }}>
              <div style={{ display:'flex', gap:12, alignItems:'center', minWidth:0 }}>
                <Avatar initials={selected.initials} color={selected.color} size={42}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:17, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:T.faint, marginTop:2, ...num }}>Lead #{String(selected.id).padStart(4,'0')} · {selected.date}</div>
                  <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                    <Stage id={selected.stage} full/>
                    <Temp t={selected.temp}/>
                  </div>
                </div>
              </div>
              <IconBtn icon={X} onClick={() => setSelected(null)} title="Fechar"/>
            </div>

            <div style={{ padding:'14px 22px', display:'flex', gap:8, flexWrap:'wrap' }}>
              <a href={waLink(selected.phone, selected.name) || undefined} target="_blank" rel="noreferrer" style={{ textDecoration:'none', pointerEvents:selected.phone ? 'auto' : 'none' }}>
                <Btn disabled={!selected.phone}><MessageCircle size={14}/> WhatsApp</Btn>
              </a>
              <Btn outline><FileText size={14}/> Criar proposta</Btn>
            </div>

            <Section title="Estágio">
              <select value={selected.stage} onChange={e => moveStage(selected.id, parseInt(e.target.value))}
                style={{ ...inputS, background:T.card, cursor:'pointer' }}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selected.stage === PERDIDO && (
                <div style={{ marginTop:10, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                    <div>
                      <div style={{ fontSize:11, color:T.faint }}>Motivo da perda</div>
                      <div style={{ fontSize:13, fontWeight:600, marginTop:2 }}>{motivoOf(selected.motivo_perda)?.l || 'Não informado'}</div>
                    </div>
                    <Btn outline small onClick={() => setLossFor({ id:selected.id, motivo:selected.motivo_perda || '', obs:selected.motivo_perda_obs || '' })}>
                      {selected.motivo_perda ? 'Alterar' : 'Informar'}
                    </Btn>
                  </div>
                  {selected.motivo_perda_obs && <div style={{ fontSize:13, color:T.muted, marginTop:6, lineHeight:1.5 }}>{selected.motivo_perda_obs}</div>}
                  {selected.perdido_em && <div style={{ fontSize:11, color:T.faint, marginTop:4 }}>Perdido em {new Date(selected.perdido_em).toLocaleDateString('pt-BR')}</div>}
                </div>
              )}
            </Section>

            <Section title="Contato">
              {[[Phone, selected.phone], [Mail, selected.email], [MapPin, selected.cidade], [Calendar, selected.date]].map(([Icon, val], i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13, color:val ? T.text : T.faint }}>
                  <Icon size={14} color={T.faint}/>{val || '—'}
                </div>
              ))}
            </Section>

            <Section title="Negócio">
              <Row label="Destino">{selected.dest || '—'}</Row>
              <Row label="Tipo">{selected.type || '—'}</Row>
              <Row label="Valor">
                <input key={`${selected.id}-${selected.value}`} type="number" min="0" step="100"
                  defaultValue={selected.value || ''} placeholder="0"
                  onBlur={e => saveValue(selected.id, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                  title="Digite o valor e aperte Enter"
                  style={{ ...inputS, width:140, textAlign:'right', padding:'5px 8px', fontWeight:600, ...num }}/>
              </Row>
              <Row label="Origem">{selected.source || '—'}</Row>
              <Row label="Consultor">{selected.consultor || '—'}</Row>
              {selected.source === 'Meta Ads' && <>
                <Row label="Pessoas">{labelOf(META_PESSOAS, selected.pessoas)}</Row>
                <Row label="Dias">{labelOf(META_DIAS, selected.dias)}</Row>
                <Row label="Investimento">{labelOf(META_INVEST, selected.investimento)}</Row>
                <Row label="Score"><span style={num}>{selected.score ?? 0} / 10</span></Row>
                <Row label="Campanha">{selected.campaign_name || '—'}</Row>
                <Row label="Anúncio">{selected.ad_name || '—'}</Row>
              </>}
            </Section>

            {Array.isArray(selected.respostas) && selected.respostas.length > 0 && (
              <Section title={`Respostas do formulário${selected.form_name ? ` · ${selected.form_name}` : ''}`}>
                {selected.respostas.map((r, i) => (
                  <div key={i} style={{ padding:'8px 0', borderBottom: i < selected.respostas.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                    <div style={{ fontSize:12, color:T.faint }}>{r.pergunta}</div>
                    <div style={{ fontSize:13, fontWeight:500, marginTop:2 }}>{r.resposta || '—'}</div>
                  </div>
                ))}
              </Section>
            )}

            {selected.obs && (
              <Section title="Observações">
                <div style={{ fontSize:13, color:T.muted, lineHeight:1.55, whiteSpace:'pre-wrap' }}>{selected.obs}</div>
              </Section>
            )}

            <Section title="Zona de perigo" style={{ paddingBottom:28 }}>
              <Btn danger small onClick={() => deleteLead(selected)}><Trash2 size={13}/> Excluir lead</Btn>
            </Section>
          </Drawer>
        )}

        {/* ── Modal: Motivo da perda ── */}
        {lossFor && (() => {
          const lead = leads.find(l => l.id === lossFor.id)
          const needObs = lossFor.motivo === 'outro'
          const ok = lossFor.motivo && (!needObs || lossFor.obs.trim())
          return (
            <Modal title="Por que este lead foi perdido?" sub={`${lead?.name || ''} · o motivo alimenta o relatório de perdas por campanha e origem.`}
              onClose={() => setLossFor(null)} busy={lossBusy} width={460}
              footer={<>
                <Btn outline onClick={() => setLossFor(null)} disabled={lossBusy}>Cancelar</Btn>
                <Btn onClick={confirmLoss} disabled={!ok || lossBusy} style={{ background:T.err, borderColor:T.err, color:'#fff' }}>
                  {lossBusy ? 'Salvando…' : 'Marcar como perdido'}
                </Btn>
              </>}>
              <div role="radiogroup" style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {MOTIVOS_PERDA.map(m => {
                  const on = lossFor.motivo === m.k
                  return (
                    <button key={m.k} role="radio" aria-checked={on} onClick={() => setLossFor(f => ({ ...f, motivo:m.k }))}
                      style={{ display:'flex', alignItems:'center', gap:10, textAlign:'left', padding:'8px 10px', borderRadius:6,
                        cursor:'pointer', fontFamily:'inherit', fontSize:13, color:T.text,
                        background: on ? 'rgba(255,255,255,0.06)' : 'transparent', border:`1px solid ${on ? T.lineStrong : 'transparent'}` }}>
                      <span style={{ width:14, height:14, borderRadius:'50%', flexShrink:0, border:`1.5px solid ${on ? T.gold : T.lineStrong}`,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {on && <span style={{ width:6, height:6, borderRadius:'50%', background:T.gold }}/>}
                      </span>
                      {m.l}
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop:14 }}><Label>{`Comentário ${needObs ? '(obrigatório)' : '(opcional)'}`}</Label></div>
              <textarea value={lossFor.obs} onChange={e => setLossFor(f => ({ ...f, obs:e.target.value.slice(0, 1000) }))}
                rows={3} placeholder="Ex.: achou caro o aéreo; vai viajar só em 2027; fechou pacote em outra agência…"
                style={{ ...inputS, resize:'vertical', marginTop:-1 }}/>
            </Modal>
          )
        })()}

        {/* ── Modal: Novo Lead ── */}
        {showNew && (
          <Modal title="Novo lead" sub="Cadastrar prospect na agência" onClose={() => setShowNew(false)} width={520}
            footer={<>
              <Btn outline onClick={() => setShowNew(false)}>Cancelar</Btn>
              <Btn onClick={addLead} disabled={!newLead.name || !newLead.dest}>Cadastrar lead</Btn>
            </>}>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Input label="Nome completo *" value={newLead.name} onChange={e=>setNewLead(p=>({...p,name:e.target.value}))} placeholder="Ex.: João Silva"/>
                <Input label="WhatsApp" value={newLead.phone} onChange={e=>setNewLead(p=>({...p,phone:e.target.value}))} placeholder="11 9 9999-0000"/>
              </div>
              <Input label="Destino desejado *" value={newLead.dest} onChange={e=>setNewLead(p=>({...p,dest:e.target.value}))} placeholder="Ex.: Paris · Roma · Lisboa"/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Input label="E-mail" value={newLead.email} onChange={e=>setNewLead(p=>({...p,email:e.target.value}))} placeholder="email@exemplo.com"/>
                <Input label="Cidade" value={newLead.cidade} onChange={e=>setNewLead(p=>({...p,cidade:e.target.value}))} placeholder="São Paulo"/>
              </div>
              <Input label="Valor estimado (R$)" type="number" value={newLead.value} onChange={e=>setNewLead(p=>({...p,value:e.target.value}))} placeholder="Ex.: 15000"/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Sel label="Tipo de viagem" value={newLead.type} onChange={e=>setNewLead(p=>({...p,type:e.target.value}))}>
                  {TIPOS.map(t=><option key={t}>{t}</option>)}
                </Sel>
                <Sel label="Temperatura" value={newLead.temp} onChange={e=>setNewLead(p=>({...p,temp:e.target.value}))}>
                  {['Frio','Morno','Quente','VIP'].map(t=><option key={t}>{t}</option>)}
                </Sel>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Sel label="Origem" value={newLead.source} onChange={e=>setNewLead(p=>({...p,source:e.target.value}))}>
                  {ORIGENS.map(s=><option key={s}>{s}</option>)}
                </Sel>
                <Sel label="Estágio inicial" value={newLead.stage} onChange={e=>setNewLead(p=>({...p,stage:parseInt(e.target.value)}))}>
                  {STAGES.filter(s => s.id <= 5).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </Sel>
              </div>
              <div>
                <Label>Observações internas</Label>
                <textarea value={newLead.obs} onChange={e=>setNewLead(p=>({...p,obs:e.target.value}))} rows={2}
                  placeholder="Notas sobre o lead…" style={{ ...inputS, resize:'vertical' }}/>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal: Sessão e segurança ── */}
        {showCloud && (
          <Modal title="Sessão e segurança" onClose={() => setShowCloud(false)} width={auditLog ? 680 : 460}
            footer={<Btn outline onClick={onLogout}><LogOut size={14}/> Sair</Btn>}>
            <p style={{ fontSize:13, color:T.muted, lineHeight:1.6, margin:'0 0 14px' }}>
              Conectado como <b style={{ color:T.text }}>{user.email}</b> ({isAdmin ? 'administrador' : 'consultor'}).
              {isAdmin ? ' Você vê todos os leads e assessorias.' : ' Você vê só os leads e assessorias atribuídos a você.'}
              {' '}A sessão expira após 12h sem uso. Os leads do Meta Ads entram sozinhos e a lista atualiza a cada 20 segundos.
            </p>
            {cloudMsg && <div style={{ fontSize:12, color:'#FCA5A5', marginBottom:12 }}>{cloudMsg}</div>}

            {isAdmin && (
              <div style={{ borderTop:`1px solid ${T.line}`, paddingTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                <Btn outline small onClick={runEncrypt} style={{ justifyContent:'center' }}>Criptografar dados antigos (telefones, e-mails, passageiros)</Btn>
                <Btn outline small onClick={loadAudit} style={{ justifyContent:'center' }}>Ver registro de acessos</Btn>
                {secInfo && <div style={{ fontSize:12, color:T.muted }}>{secInfo}</div>}
                {auditLog && (
                  <div className="crm-scroll" style={{ maxHeight:300, overflowY:'auto', border:`1px solid ${T.line}`, borderRadius:8 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr>{['Quando','Quem','Ação','Item','IP'].map(h => <th key={h} style={{ ...th, padding:'7px 10px', position:'sticky', top:0, background:T.card }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {auditLog.map(a => (
                          <tr key={a.id}>
                            <td style={{ ...td, fontSize:12, padding:'7px 10px', whiteSpace:'nowrap', ...num }}>{new Date(a.at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</td>
                            <td style={{ ...td, fontSize:12, padding:'7px 10px' }}>{a.user_email}</td>
                            <td style={{ ...td, fontSize:12, padding:'7px 10px', color: /falhou|negado|bloqueado/.test(a.action) ? '#F87171' : T.text }}>{a.action}</td>
                            <td style={{ ...td, fontSize:12, padding:'7px 10px' }}>{a.entity}{a.entity_id ? ` #${a.entity_id}` : ''}</td>
                            <td style={{ ...td, fontSize:12, padding:'7px 10px', color:T.muted }}>{a.ip || '—'}</td>
                          </tr>
                        ))}
                        {!auditLog.length && <tr><td colSpan={5} style={{ ...td, color:T.muted }}>Nenhum registro ainda.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Modal>
        )}
      </div>
    </>
  )
}
