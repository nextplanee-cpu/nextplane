import { useState, useEffect } from 'react'
import {
  LayoutDashboard, GitBranch, Users, FileText,
  Zap, BarChart2, Building2, Plus, X, Search,
  MessageCircle, ChevronRight, LogOut, Bell,
  Phone, Mail, MapPin, Calendar, Star, TrendingUp,
  CheckCircle2, AlertCircle, Clock, Filter,
  Cloud, CloudOff, Megaphone, RefreshCw
} from 'lucide-react'
import {
  getAccessKey, setAccessKey, fetchLeads, createLead, patchLead, waLink,
  metaStatus, metaSubscribe,
} from '../lib/leadsApi'

/* ─── Design tokens ─────────────────────────────────── */
const T = {
  bg: '#0B1220', card: '#111827', header: '#0d1628',
  gold: '#D4AF37', goldH: '#f0d060', text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.5)', success: '#22C55E',
  warn: '#F59E0B', err: '#EF4444', info: '#3B82F6',
  border: '1px solid rgba(212,175,55,0.15)',
  borderN: '1px solid rgba(255,255,255,0.07)',
}

const STAGES = [
  { id:0,  name:'Lead Recebido',    color:'#5B8DEF', short:'Recebido'  },
  { id:1,  name:'Primeiro Contato', color:'#8B5CF6', short:'1º Contato'},
  { id:2,  name:'Atendimento',      color:'#A78BFA', short:'Atendimento'},
  { id:3,  name:'Briefing',         color:'#F59E0B', short:'Briefing'  },
  { id:4,  name:'Pesquisa',         color:'#FB923C', short:'Pesquisa'  },
  { id:5,  name:'Cotação Enviada',  color:'#3B82F6', short:'Cotação'   },
  { id:6,  name:'Follow-up 1',      color:'#06B6D4', short:'Follow 1'  },
  { id:7,  name:'Follow-up 2',      color:'#0EA5E9', short:'Follow 2'  },
  { id:8,  name:'Negociação',       color:'#F97316', short:'Negociação'},
  { id:9,  name:'Aguardando Pgto',  color:'#EAB308', short:'Pgto'      },
  { id:10, name:'Venda Fechada',    color:'#22C55E', short:'Fechada'   },
  { id:11, name:'Pós-Venda',        color:'#10B981', short:'Pós-Venda' },
  { id:12, name:'Perdido',          color:'#EF4444', short:'Perdido'   },
]

const TIPOS = ['Internacional','Lua de Mel','Disney','Cruzeiro','Corporativo','Nacional','Europa','América do Sul']
const ORIGENS = ['WhatsApp','Instagram','Indicação','Meta Ads','Google Ads','ManyChat','Site','TikTok','Parceiros']
const TEMP_C = { Frio:'#3B82F6', Morno:'#F59E0B', Quente:'#EF4444', VIP:'#D4AF37' }
const TEMP_I = { Frio:'❄️', Morno:'🌤️', Quente:'🔥', VIP:'👑' }

const LEADS_INIT = []

/* ─── Helpers ────────────────────────────────────────── */
const fmtR = v => `R$ ${Number(v).toLocaleString('pt-BR')}`
const Avatar = ({ initials, color, size = 36 }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex',
    alignItems:'center', justifyContent:'center', fontSize:size*0.33, fontWeight:700,
    color:'#fff', flexShrink:0, letterSpacing:'-0.5px' }}>
    {initials}
  </div>
)
const Badge = ({ children, color, small }) => (
  <span style={{ display:'inline-flex', alignItems:'center', padding:small?'2px 7px':'3px 10px',
    borderRadius:20, fontSize:small?10:11, fontWeight:600, gap:3,
    background:`${color}20`, color, border:`1px solid ${color}40` }}>
    {children}
  </span>
)
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:T.card, borderRadius:12, border:T.borderN, padding:20, ...style }}>
    {children}
  </div>
)
const Btn = ({ children, onClick, outline, small, style, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ background:outline?'transparent':'linear-gradient(135deg,#D4AF37,#f0d060)',
      color:outline?T.gold:'#0B1220', padding:small?'6px 14px':'9px 18px',
      borderRadius:8, fontWeight:700, fontSize:small?12:13, cursor:disabled?'not-allowed':'pointer',
      fontFamily:'inherit', border:outline?`1px solid ${T.gold}`:'none',
      opacity:disabled?0.5:1, display:'inline-flex', alignItems:'center', gap:6, ...style }}>
    {children}
  </button>
)
const Input = ({ label, ...props }) => (
  <div>
    {label && <label style={{ fontSize:12, color:T.muted, display:'block', marginBottom:4 }}>{label}</label>}
    <input {...props} style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:T.borderN,
      borderRadius:8, padding:'9px 12px', color:T.text, fontSize:13, fontFamily:'inherit',
      outline:'none', ...props.style }} />
  </div>
)
const Sel = ({ label, children, ...props }) => (
  <div>
    {label && <label style={{ fontSize:12, color:T.muted, display:'block', marginBottom:4 }}>{label}</label>}
    <select {...props} style={{ width:'100%', background:'#111827', border:T.borderN,
      borderRadius:8, padding:'9px 12px', color:T.text, fontSize:13, fontFamily:'inherit',
      cursor:'pointer', outline:'none', ...props.style }}>
      {children}
    </select>
  </div>
)

/* ─── Meta Ads · respostas do formulário ─────────────── */
const META_DEST    = [['Europa','Europa'],['EUA','EUA'],['Ásia','Ásia'],['Oceania','Oceania']]
const META_PESSOAS = [['1','1 pessoa'],['2','2 pessoas'],['3-4','3 ou 4 pessoas'],['5+','5 ou mais']]
const META_DIAS    = [['ate10','Até 10 dias'],['11-15','11 a 15 dias'],['15+','Acima de 15 dias']]
const META_INVEST  = [['ate20','Até R$ 20 mil'],['20-30','R$ 20–30 mil'],['30-40','R$ 30–40 mil'],['40+','Acima de R$ 40 mil']]
const labelOf = (opts, v) => (opts.find(o => o[0] === v) || [v, v || '—'])[1]

/* Barras horizontais de distribuição (BI) */
const DistBars = ({ title, opts, leads, field, color = T.gold }) => {
  const total = leads.length || 1
  return (
    <Card>
      <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 14px' }}>{title}</h3>
      {opts.map(([key, label]) => {
        const cnt = leads.filter(l => l[field] === key).length
        const pct = Math.round(cnt / total * 100)
        return (
          <div key={key} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:12, color:T.muted }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:700, color }}>{cnt} <span style={{ color:T.muted, fontWeight:400 }}>· {leads.length ? pct : 0}%</span></span>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:4 }}>
              <div style={{ height:'100%', width:`${leads.length ? pct : 0}%`, background:color, borderRadius:4, transition:'width .3s' }}/>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

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
      <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 14px' }}>Leads por dia · últimos {days} dias</h3>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:130 }}>
        {cols.map(({ d, cnt }, i) => (
          <div key={i} title={`${d.toLocaleDateString('pt-BR')}: ${cnt} lead(s)`}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
            {cnt > 0 && <span style={{ fontSize:10, color:T.gold, marginBottom:2 }}>{cnt}</span>}
            <div style={{ width:'100%', maxWidth:22, height:`${cnt / max * 100}%`, minHeight:cnt ? 3 : 1,
              background: cnt ? 'linear-gradient(180deg,#f0d060,#D4AF37)' : 'rgba(255,255,255,0.06)', borderRadius:'3px 3px 0 0' }}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:T.muted }}>
        <span>{cols[0].d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</span>
        <span>hoje</span>
      </div>
    </Card>
  )
}

/* ─── MAIN CRM ───────────────────────────────────────── */
export default function CRM() {
  const [view,       setView]       = useState('dashboard')
  const [leads,      setLeads]      = useState(() => {
    try {
      const saved = localStorage.getItem('crm_leads')
      return saved ? JSON.parse(saved) : LEADS_INIT
    } catch { return LEADS_INIT }
  })
  const [search,     setSearch]     = useState('')
  const [fTemp,      setFTemp]      = useState('all')
  const [fStage,     setFStage]     = useState('all')
  const [selected,   setSelected]   = useState(null)
  const [showNew,    setShowNew]     = useState(false)
  const [newLead,    setNewLead]     = useState({ name:'', dest:'', value:'', type:'Internacional', temp:'Morno', source:'WhatsApp', stage:0, phone:'', email:'', cidade:'', obs:'' })
  const [nextId,     setNextId]     = useState(() => {
    try {
      const saved = localStorage.getItem('crm_next_id')
      return saved ? parseInt(saved) : 13
    } catch { return 13 }
  })

  /* ── Nuvem (Supabase via /api/leads) ──
     mode: 'local' = dados só neste navegador · 'cloud' = dados compartilhados na nuvem */
  const [mode,       setMode]       = useState('local')
  const [cloudMsg,   setCloudMsg]   = useState('')
  const [showCloud,  setShowCloud]  = useState(false)
  const [keyInput,   setKeyInput]   = useState('')
  const [syncing,    setSyncing]    = useState(false)
  const [metaPeriod, setMetaPeriod] = useState('30')
  const [metaInfo,   setMetaInfo]   = useState(null)   // status da integração Meta
  const [metaBusy,   setMetaBusy]   = useState(false)

  const checkMeta = async (subscribe = false) => {
    setMetaBusy(true)
    try { setMetaInfo(await (subscribe ? metaSubscribe() : metaStatus())) }
    catch (err) { setMetaInfo({ ok:false, missing:[], error: err.status === 401 ? 'Chave do CRM inválida.' : 'Não foi possível verificar agora.' }) }
    finally { setMetaBusy(false) }
  }

  // Verifica a integração ao abrir a aba Leads Meta na nuvem
  useEffect(() => { if (view === 'meta' && mode === 'cloud' && !metaInfo) checkMeta() }, [view, mode])

  const loadCloud = async (key = getAccessKey(), { quiet = false } = {}) => {
    if (!key) return false
    if (!quiet) setSyncing(true)
    try {
      const data = await fetchLeads(key)
      setAccessKey(key)
      setLeads(data)
      setMode('cloud')
      setCloudMsg('')
      return true
    } catch (err) {
      if (err.status === 401) { setAccessKey(''); setMode('local'); setCloudMsg('Chave de acesso inválida.') }
      else if (err.status === 503) setCloudMsg('A nuvem ainda não foi configurada na Vercel.')
      else if (!quiet) setCloudMsg('Não foi possível conectar à nuvem agora.')
      return false
    } finally {
      if (!quiet) setSyncing(false)
    }
  }

  // Conecta na nuvem ao abrir, se já houver chave salva
  useEffect(() => { if (getAccessKey()) loadCloud() }, [])

  // Na nuvem: busca leads novos (ex.: Meta Ads) a cada 20s
  useEffect(() => {
    if (mode !== 'cloud') return
    const interval = setInterval(() => loadCloud(undefined, { quiet: true }), 20000)
    return () => clearInterval(interval)
  }, [mode])

  const connectCloud = async () => {
    const ok = await loadCloud(keyInput.trim())
    if (ok) { setShowCloud(false); setKeyInput('') }
  }

  const disconnectCloud = () => {
    setAccessKey('')
    setMode('local')
    try {
      const saved = localStorage.getItem('crm_leads')
      setLeads(saved ? JSON.parse(saved) : LEADS_INIT)
    } catch { setLeads(LEADS_INIT) }
    setShowCloud(false)
  }

  // Modo local: sincroniza leads do localStorage a cada 3s
  useEffect(() => {
    if (mode === 'cloud') return
    const sync = () => {
      try {
        const saved = localStorage.getItem('crm_leads')
        if (saved) {
          const parsed = JSON.parse(saved)
          setLeads(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) return parsed
            return prev
          })
        }
        const savedId = localStorage.getItem('crm_next_id')
        if (savedId) setNextId(parseInt(savedId))
      } catch {}
    }
    sync()
    const interval = setInterval(sync, 3000)
    window.addEventListener('focus', sync)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', sync)
    }
  }, [mode])

  // Modo local: salva automaticamente sempre que leads mudam
  useEffect(() => {
    if (mode === 'cloud') return
    try { localStorage.setItem('crm_leads', JSON.stringify(leads)) } catch {}
  }, [leads, mode])

  useEffect(() => {
    try { localStorage.setItem('crm_next_id', String(nextId)) } catch {}
  }, [nextId])

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
    if (mode === 'cloud') {
      try {
        const created = await createLead({ ...newLead, value: parseInt(newLead.value) || 0, consultor: 'Joseph' })
        setLeads(p => [created, ...p])
        setShowNew(false)
        resetNewLead()
      } catch { alert('Não foi possível salvar o lead na nuvem. Tente de novo.') }
      return
    }
    const words = newLead.name.trim().split(' ')
    const initials = words.length >= 2
      ? words[0][0] + words[words.length - 1][0]
      : words[0].slice(0, 2)
    const colors = ['#D4AF37','#8B5CF6','#3B82F6','#22C55E','#F97316','#EC4899','#06B6D4']
    setLeads(p => [...p, {
      ...newLead,
      id: nextId,
      value: parseInt(newLead.value) || 0,
      initials: initials.toUpperCase(),
      color: colors[nextId % colors.length],
      date: new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.',''),
      consultor: 'Joseph',
    }])
    setNextId(n => n + 1)
    setShowNew(false)
    resetNewLead()
  }

  /* ── Mover estágio ── */
  const moveStage = (id, stage) => {
    const prev = leads.find(l => l.id === id)?.stage
    setLeads(p => p.map(l => l.id === id ? { ...l, stage } : l))
    if (selected?.id === id) setSelected(s => ({ ...s, stage }))
    if (mode === 'cloud') {
      patchLead(id, { stage }).catch(() => {
        setLeads(p => p.map(l => l.id === id ? { ...l, stage: prev } : l))
        if (selected?.id === id) setSelected(s => ({ ...s, stage: prev }))
        alert('Não foi possível salvar a mudança de estágio na nuvem.')
      })
    }
  }

  /* ── Estilos comuns ── */
  const thS = { padding:'10px 12px', textAlign:'left', fontSize:11, color:T.muted,
    fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:T.borderN, whiteSpace:'nowrap' }
  const tdS = { padding:'12px', fontSize:13, color:T.text, borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'middle' }

  const navItems = [
    { id:'dashboard',   icon:<LayoutDashboard size={16}/>, label:'Dashboard'    },
    { id:'pipeline',    icon:<GitBranch       size={16}/>, label:'Pipeline'     },
    { id:'leads',       icon:<Users           size={16}/>, label:'Leads'        },
    { id:'meta',        icon:<Megaphone       size={16}/>, label:'Leads Meta'   },
    { id:'propostas',   icon:<FileText        size={16}/>, label:'Propostas'    },
    { id:'automacoes',  icon:<Zap             size={16}/>, label:'Automações'   },
    { id:'relatorios',  icon:<BarChart2       size={16}/>, label:'Relatórios'   },
    { id:'arquitetura', icon:<Building2       size={16}/>, label:'Arquitetura'  },
  ]

  /* ════════════════════════════════════════════════════ */
  /*  VIEWS                                               */
  /* ════════════════════════════════════════════════════ */

  /* ── DASHBOARD ── */
  const ViewDashboard = () => (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 4px' }}>Dashboard Executivo</h2>
      <p style={{ color:T.muted, fontSize:13, margin:'0 0 20px' }}>Visão geral da operação · {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
        {[
          { icon:<Users size={20}/>,        label:'Total de Leads',    val:leads.length,   color:T.info    },
          { icon:<TrendingUp size={20}/>,   label:'Receita Realizada', val:fmtR(recReal),  color:T.success },
          { icon:<Star size={20}/>,         label:'Receita Potencial', val:fmtR(recPot),   color:T.gold    },
          { icon:<CheckCircle2 size={20}/>, label:'Taxa de Conversão', val:`${conv}%`,     color:T.success },
        ].map((k,i) => (
          <Card key={i}>
            <div style={{ color:k.color, marginBottom:8 }}>{k.icon}</div>
            <div style={{ fontSize:26, fontWeight:700, color:k.color, lineHeight:1, marginBottom:4 }}>{k.val}</div>
            <div style={{ fontSize:12, color:T.muted }}>{k.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { icon:<FileText size={20}/>,    label:'Ticket Médio',      val:fmtR(ticket),         color:T.text    },
          { icon:<Clock size={20}/>,       label:'Em Atendimento',    val:active.length,         color:T.warn    },
          { icon:<AlertCircle size={20}/>, label:'Sem Contato',       val:semCtato,              color:T.err     },
          { icon:<CheckCircle2 size={20}/>,label:'Vendas Fechadas',   val:closed.length,         color:T.success },
        ].map((k,i) => (
          <Card key={i}>
            <div style={{ color:k.color, marginBottom:8 }}>{k.icon}</div>
            <div style={{ fontSize:26, fontWeight:700, color:k.color, lineHeight:1, marginBottom:4 }}>{k.val}</div>
            <div style={{ fontSize:12, color:T.muted }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {/* Pipeline bars */}
        <Card>
          <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 16px' }}>Pipeline por Estágio</h3>
          {STAGES.filter(s => s.id <= 11).map(st => {
            const cnt = leads.filter(l => l.stage === st.id).length
            const pct = leads.length > 0 ? cnt / leads.length * 100 : 0
            return (
              <div key={st.id} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, color:T.muted }}>{st.name}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:st.color }}>{cnt}</span>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:st.color, borderRadius:4, transition:'width .3s' }}/>
                </div>
              </div>
            )
          })}
        </Card>

        {/* Top leads */}
        <Card>
          <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 16px' }}>🏆 Top Oportunidades</h3>
          {[...leads].sort((a,b) => b.value - a.value).slice(0, 7).map(l => (
            <div key={l.id} onClick={() => setSelected(l)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}>
              <Avatar initials={l.initials} color={l.color} size={32}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.name}</div>
                <div style={{ fontSize:11, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.dest}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.gold }}>{fmtR(l.value)}</div>
                <Badge color={STAGES[l.stage].color} small>{STAGES[l.stage].short}</Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Origens */}
      <Card>
        <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 16px' }}>📡 Origem dos Leads</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {ORIGENS.map(src => {
            const cnt = leads.filter(l => l.source === src).length
            const rec = leads.filter(l => l.source === src).reduce((a,b) => a+b.value, 0)
            if (!cnt) return null
            return (
              <div key={src} style={{ background:'rgba(212,175,55,0.06)', borderRadius:10,
                padding:'12px 16px', border:'1px solid rgba(212,175,55,0.12)', minWidth:110 }}>
                <div style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{src}</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.gold, lineHeight:1 }}>{cnt}</div>
                <div style={{ fontSize:11, color:T.success, marginTop:2 }}>{fmtR(rec)}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )

  /* ── PIPELINE ── */
  const ViewPipeline = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>Pipeline Comercial</h2>
          <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>13 estágios · {leads.length} leads</p>
        </div>
        <Btn onClick={() => setShowNew(true)}><Plus size={14}/> Novo Lead</Btn>
      </div>
      <div style={{ overflowX:'auto', paddingBottom:12 }}>
        <div style={{ display:'flex', gap:10, minWidth:'max-content' }}>
          {STAGES.map(stage => {
            const sl = leads.filter(l => l.stage === stage.id)
            const val = sl.reduce((a,b) => a+b.value, 0)
            return (
              <div key={stage.id} style={{ width:215, flexShrink:0 }}>
                <div style={{ background:T.card, borderRadius:'10px 10px 0 0', padding:'10px 12px',
                  borderTop:`3px solid ${stage.color}`, border:T.borderN, borderBottom:'none',
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700 }}>{stage.name}</div>
                    {val > 0 && <div style={{ fontSize:10, color:T.gold, marginTop:1 }}>{fmtR(val)}</div>}
                  </div>
                  <Badge color={stage.color} small>{sl.length}</Badge>
                </div>
                <div style={{ background:'rgba(11,18,32,0.8)', borderRadius:'0 0 10px 10px',
                  minHeight:400, padding:8, border:T.borderN, borderTop:'none' }}>
                  {sl.map(lead => (
                    <div key={lead.id} onClick={() => setSelected(lead)}
                      style={{ background:T.card, borderRadius:8, padding:11, marginBottom:7,
                        border:T.borderN, cursor:'pointer', transition:'border-color .15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(212,175,55,0.35)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                        <Avatar initials={lead.initials} color={lead.color} size={30}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name}</div>
                          <div style={{ fontSize:10, color:T.muted }}>{lead.date}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:T.muted, marginBottom:7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.dest}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:T.gold }}>{fmtR(lead.value)}</span>
                        <Badge color={TEMP_C[lead.temp]} small>{TEMP_I[lead.temp]} {lead.temp}</Badge>
                      </div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:5 }}>📍 {lead.source}</div>
                    </div>
                  ))}
                  {!sl.length && (
                    <div style={{ textAlign:'center', paddingTop:32, color:'rgba(255,255,255,0.12)', fontSize:12 }}>Vazio</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ── LEADS TABLE ── */
  const ViewLeads = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>Gestão de Leads</h2>
          <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>{filtered.length} leads encontrados</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn outline small>Exportar CSV</Btn>
          <Btn onClick={() => setShowNew(true)}><Plus size={14}/> Novo Lead</Btn>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom:14, padding:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.muted }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nome ou destino..."
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:T.borderN, borderRadius:8,
              padding:'8px 12px 8px 32px', color:T.text, fontSize:13, fontFamily:'inherit', outline:'none' }}/>
        </div>
        <select value={fTemp} onChange={e => setFTemp(e.target.value)}
          style={{ background:'#111827', border:T.borderN, borderRadius:8, padding:'8px 12px',
            color:T.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
          <option value="all">Temperatura</option>
          {['Frio','Morno','Quente','VIP'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={fStage} onChange={e => setFStage(e.target.value)}
          style={{ background:'#111827', border:T.borderN, borderRadius:8, padding:'8px 12px',
            color:T.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
          <option value="all">Todos os estágios</option>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:4 }}>
          <Filter size={12}/> {filtered.length} de {leads.length}
        </span>
      </Card>

      <Card style={{ padding:0, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Cliente','Destino','Valor','Temperatura','Estágio','Origem','Consultor','Data','Ações'].map(h => (
              <th key={h} style={thS}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id}
                style={{ cursor:'pointer', transition:'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                onClick={() => setSelected(lead)}>
                <td style={tdS}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar initials={lead.initials} color={lead.color}/>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{lead.name}</div>
                      <div style={{ fontSize:11, color:T.muted }}>#{String(lead.id).padStart(4,'0')}</div>
                    </div>
                  </div>
                </td>
                <td style={tdS}>
                  <div style={{ fontSize:12, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.dest}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{lead.type}</div>
                </td>
                <td style={tdS}><span style={{ fontWeight:700, color:T.gold }}>{fmtR(lead.value)}</span></td>
                <td style={tdS}><Badge color={TEMP_C[lead.temp]}>{TEMP_I[lead.temp]} {lead.temp}</Badge></td>
                <td style={tdS}><Badge color={STAGES[lead.stage].color}>{STAGES[lead.stage].short}</Badge></td>
                <td style={{ ...tdS, fontSize:12, color:T.muted }}>{lead.source}</td>
                <td style={{ ...tdS, fontSize:12 }}>{lead.consultor}</td>
                <td style={{ ...tdS, fontSize:12, color:T.muted }}>{lead.date}</td>
                <td style={tdS} onClick={e => e.stopPropagation()}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => setSelected(lead)}
                      style={{ background:'rgba(212,175,55,0.1)', color:T.gold,
                        border:'1px solid rgba(212,175,55,0.2)', borderRadius:6,
                        padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                      Ver
                    </button>
                    {lead.phone && (
                      <a href={waLink(lead.phone, lead.name)} target="_blank" rel="noreferrer"
                        style={{ background:'#25D36615', color:'#25D366',
                          border:'1px solid #25D36630', borderRadius:6, textDecoration:'none',
                          padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                        WA
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div style={{ textAlign:'center', padding:48, color:T.muted }}>
            <Search size={32} style={{ marginBottom:8, opacity:0.3 }}/>
            <div>Nenhum lead encontrado com esses filtros.</div>
          </div>
        )}
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

    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>Leads Meta Ads</h2>
            <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>Formulário "Assessoria Viagem" · entram sozinhos pelo webhook da Meta</p>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {[['7','7 dias'],['30','30 dias'],['all','Tudo']].map(([k, lbl]) => (
              <button key={k} onClick={() => setMetaPeriod(k)}
                style={{ background: metaPeriod === k ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: metaPeriod === k ? T.gold : T.muted, border: metaPeriod === k ? `1px solid ${T.gold}55` : T.borderN,
                  borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {lbl}
              </button>
            ))}
            {mode === 'cloud' && (
              <Btn outline small onClick={() => loadCloud()} disabled={syncing}>
                <RefreshCw size={12}/> {syncing ? 'Atualizando…' : 'Atualizar'}
              </Btn>
            )}
          </div>
        </div>

        {mode !== 'cloud' && (
          <Card style={{ marginBottom:14, borderLeft:`3px solid ${T.info}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>Conecte o CRM à nuvem</div>
              <div style={{ fontSize:12, color:T.muted }}>Os leads do Meta Ads chegam na nuvem. Conecte para vê-los aqui em tempo real, em qualquer dispositivo.</div>
            </div>
            <Btn onClick={() => setShowCloud(true)}><Cloud size={14}/> Conectar nuvem</Btn>
          </Card>
        )}

        {mode === 'cloud' && (() => {
          const m = metaInfo
          const ready = m?.ok && m.subscribed
          const color = ready ? T.success : m ? T.warn : T.muted
          let text = 'Verificando a integração…'
          if (m && m.missing?.length) text = `Falta configurar na Vercel: ${m.missing.join(', ')}`
          else if (m && !m.ok) text = `Erro: ${m.error}`
          else if (m && !m.subscribed) text = `Página "${m.page}" encontrada, mas ainda não está enviando leads para o CRM.`
          else if (ready) text = `Página "${m.page}" ligada. Os leads do formulário entram aqui automaticamente.`
          return (
            <Card style={{ marginBottom:14, borderLeft:`3px solid ${color}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:3, color }}>
                  {ready ? '✅ Integração Meta ativa' : '⚙️ Integração Meta'}
                </div>
                <div style={{ fontSize:12, color:T.muted }}>{text}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {m?.ok && !m.subscribed && (
                  <Btn onClick={() => checkMeta(true)} disabled={metaBusy}>{metaBusy ? 'Ligando…' : 'Ligar Página ao CRM'}</Btn>
                )}
                <Btn outline small onClick={() => checkMeta()} disabled={metaBusy}>
                  <RefreshCw size={12}/> Verificar
                </Btn>
              </div>
            </Card>
          )
        })()}

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:14 }}>
          {[
            { label:'Leads no período',     val:meta.length,                     color:T.info    },
            { label:'Chegaram hoje',        val:hoje,                            color:T.success },
            { label:'Quentes + VIP',        val:`${hot} · ${meta.length ? Math.round(hot / meta.length * 100) : 0}%`, color:T.err },
            { label:'Aguardando contato',   val:fila.length,                     color:T.warn    },
            { label:'Potencial estimado',   val:fmtR(potencial),                 color:T.gold    },
          ].map((k, i) => (
            <Card key={i}>
              <div style={{ fontSize:24, fontWeight:700, color:k.color, lineHeight:1, marginBottom:6 }}>{k.val}</div>
              <div style={{ fontSize:12, color:T.muted }}>{k.label}</div>
            </Card>
          ))}
        </div>

        <div style={{ marginBottom:14 }}>
          <DailyBars leads={meta} days={metaPeriod === '7' ? 7 : 14}/>
        </div>

        {/* Distribuições */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          <DistBars title="✈️ Destino"            opts={META_DEST}    leads={meta} field="dest"         color="#3B82F6"/>
          <DistBars title="💰 Investimento"        opts={META_INVEST}  leads={meta} field="investimento" color={T.gold}/>
          <DistBars title="👥 Pessoas"             opts={META_PESSOAS} leads={meta} field="pessoas"      color="#8B5CF6"/>
          <DistBars title="📅 Dias de viagem"      opts={META_DIAS}    leads={meta} field="dias"         color="#06B6D4"/>
          <DistBars title="🌡️ Temperatura"        opts={['VIP','Quente','Morno','Frio'].map(t => [t, `${TEMP_I[t]} ${t}`])} leads={meta} field="temp" color={T.err}/>
        </div>

        {/* Fila de atendimento */}
        <Card style={{ marginBottom:14, padding:0 }}>
          <div style={{ padding:'16px 20px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:14, fontWeight:700, margin:0 }}>📞 Fila de atendimento · prioridade por score</h3>
            <span style={{ fontSize:12, color:T.muted }}>Prometido no formulário: contato em até 24h</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Lead','Destino','Pessoas','Dias','Investimento','Temp.','Chegou','Ações'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {fila.map(l => {
                  const horas = Math.floor((Date.now() - new Date(l.createdAt)) / 36e5)
                  const wa = waLink(l.phone, l.name)
                  return (
                    <tr key={l.id} style={{ cursor:'pointer' }} onClick={() => setSelected(l)}>
                      <td style={tdS}>
                        <div style={{ fontWeight:600 }}>{l.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{l.phone || 'sem telefone'}</div>
                      </td>
                      <td style={tdS}>{l.dest || '—'}</td>
                      <td style={tdS}>{labelOf(META_PESSOAS, l.pessoas)}</td>
                      <td style={tdS}>{labelOf(META_DIAS, l.dias)}</td>
                      <td style={{ ...tdS, color:T.gold, fontWeight:600 }}>{labelOf(META_INVEST, l.investimento)}</td>
                      <td style={tdS}><Badge color={TEMP_C[l.temp] || T.muted} small>{TEMP_I[l.temp]} {l.temp}</Badge></td>
                      <td style={{ ...tdS, fontSize:12, color: horas >= 24 ? T.err : horas >= 1 ? T.warn : T.success }}>
                        {horas < 1 ? 'agora' : `há ${horas}h`}
                      </td>
                      <td style={tdS} onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:6 }}>
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer"
                              style={{ background:'#25D36615', color:'#25D366', border:'1px solid #25D36630', borderRadius:6,
                                padding:'4px 10px', fontSize:11, textDecoration:'none', fontWeight:600 }}>
                              WhatsApp
                            </a>
                          )}
                          <button onClick={() => moveStage(l.id, 1)}
                            style={{ background:'rgba(139,92,246,0.12)', color:'#8B5CF6', border:'1px solid rgba(139,92,246,0.3)',
                              borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                            Contatado ✓
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!fila.length && (
              <div style={{ textAlign:'center', padding:36, color:T.muted, fontSize:13 }}>Nenhum lead do Meta aguardando contato. 🎉</div>
            )}
          </div>
        </Card>

        {/* Campanhas */}
        <Card style={{ padding:0 }}>
          <div style={{ padding:'16px 20px 10px' }}>
            <h3 style={{ fontSize:14, fontWeight:700, margin:0 }}>📣 Por campanha e anúncio</h3>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Campanha','Anúncio','Leads','Quentes + VIP','Potencial'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {campanhas.map((c, i) => (
                  <tr key={i}>
                    <td style={tdS}>{c.camp}</td>
                    <td style={{ ...tdS, color:T.muted }}>{c.ad}</td>
                    <td style={{ ...tdS, fontWeight:700 }}>{c.n}</td>
                    <td style={{ ...tdS, color:T.err, fontWeight:600 }}>{c.hot} · {Math.round(c.hot / c.n * 100)}%</td>
                    <td style={{ ...tdS, color:T.gold, fontWeight:600 }}>{fmtR(c.val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!campanhas.length && (
              <div style={{ textAlign:'center', padding:28, color:T.muted, fontSize:13 }}>Sem leads do Meta no período.</div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  /* ── PROPOSTAS ── */
  const ViewPropostas = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>Propostas & Cotações</h2>
          <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>Gestão e geração de propostas</p>
        </div>
        <Btn><Plus size={14}/> Nova Proposta</Btn>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {leads.filter(l => l.stage >= 5 && l.stage !== 12).map(lead => (
          <Card key={lead.id} style={{ borderTop:`3px solid ${STAGES[lead.stage].color}`, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <Avatar initials={lead.initials} color={lead.color}/>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>{lead.name}</div>
                <div style={{ fontSize:11, color:T.muted }}>{lead.date}</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:4 }}>✈️ {lead.dest}</div>
            <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>📁 {lead.type}</div>
            <div style={{ fontSize:20, fontWeight:700, color:T.gold, marginBottom:10 }}>{fmtR(lead.value)}</div>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              <Badge color={STAGES[lead.stage].color}>{STAGES[lead.stage].short}</Badge>
              <Badge color={TEMP_C[lead.temp]}>{TEMP_I[lead.temp]} {lead.temp}</Badge>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn outline small style={{ flex:1, justifyContent:'center' }}>Ver Proposta</Btn>
              <Btn small style={{ flex:1, justifyContent:'center' }}>📄 Gerar PDF</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  /* ── AUTOMAÇÕES ── */
  const ViewAutomacoes = () => (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 6px' }}>Automações</h2>
      <p style={{ color:T.muted, fontSize:13, margin:'0 0 22px' }}>Fluxos automáticos via N8N + WhatsApp Business API</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          { title:'🆕 Lead Novo', color:'#22C55E', steps:['Lead entra pelo formulário / API / Meta Ads','Consultor notificado via WhatsApp Business','Tarefa de primeiro contato criada (SLA 1h)','Mensagem automática de boas-vindas enviada','Lead cadastrado no CRM e distribuído'] },
          { title:'⏰ SLA de Atendimento', color:'#F59E0B', steps:['1h sem contato → Alerta ao consultor','4h sem contato → Alerta urgente (som)','24h sem contato → Escalonamento ao gestor','Lead marcado como prioridade máxima','Relatório de SLA enviado diariamente'] },
          { title:'🔄 Follow-up Automático', color:'#3B82F6', steps:['3 dias sem resposta → Follow-up 1 personalizado','7 dias sem resposta → Follow-up 2 com nova proposta','15 dias → Follow-up 3 com oferta especial','30 dias → Lead marcado como Frio','Mensagens adaptadas por tipo de destino'] },
          { title:'✅ Pós-Venda Premium', color:'#D4AF37', steps:['Venda fechada → Checklist de documentos enviado','7 dias antes → Lembrete de check-in','Dia do embarque → Mensagem e dicas finais','Retorno → Pesquisa NPS automática','15 dias → Solicitar avaliação Google e indicação'] },
          { title:'🤖 IA Score de Leads', color:'#8B5CF6', steps:['Lead novo → Score 0-100 calculado por IA','Classificação automática de temperatura','Sugestão de resposta personalizada','Identificação de leads prioritários por padrão','Previsão de fechamento em dias'] },
          { title:'📲 Meta & Google Ads', color:'#1877F2', steps:['Lead Ads → CRM automático via API','UTMs capturados e salvos (source/medium/campaign)','Consultor notificado em tempo real','Tag de campanha aplicada no lead','ROI por campanha calculado automaticamente'] },
        ].map((a, i) => (
          <Card key={i} style={{ borderLeft:`3px solid ${a.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ fontSize:14, fontWeight:700, margin:0 }}>{a.title}</h3>
              <Badge color={a.color}>Ativo</Badge>
            </div>
            {a.steps.map((step, j) => (
              <div key={j} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color:a.color, fontWeight:700, fontSize:11, marginTop:1, flexShrink:0 }}>{j+1}.</span>
                <span style={{ fontSize:12, color:T.muted, lineHeight:1.4 }}>{step}</span>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <Btn outline small>Editar</Btn>
              <Btn small>Testar</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  /* ── RELATÓRIOS ── */
  const ViewRelatorios = () => {
    const maxVal = Math.max(...TIPOS.map(t => leads.filter(l=>l.type===t).reduce((a,b)=>a+b.value,0)), 1)
    return (
      <div>
        <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 6px' }}>Relatórios</h2>
        <p style={{ color:T.muted, fontSize:13, margin:'0 0 22px' }}>Análise de performance comercial</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <Card>
            <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 16px', color:T.gold }}>Receita por Tipo de Viagem</h3>
            {TIPOS.map(tipo => {
              const val = leads.filter(l=>l.type===tipo).reduce((a,b)=>a+b.value,0)
              if (!val) return null
              return (
                <div key={tipo} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, color:T.muted }}>{tipo}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:T.gold }}>{fmtR(val)}</span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${val/maxVal*100}%`, background:'linear-gradient(90deg,#D4AF37,#f0d060)', borderRadius:4 }}/>
                  </div>
                </div>
              )
            })}
          </Card>
          <Card>
            <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 16px', color:T.gold }}>Motivos de Perda</h3>
            {[
              { m:'Orçamento acima do esperado', p:35, c:'#EF4444' },
              { m:'Escolheu outra agência',       p:25, c:'#F97316' },
              { m:'Adiou a viagem',               p:20, c:'#F59E0B' },
              { m:'Não respondeu mais',           p:15, c:'#6B7280' },
              { m:'Outros',                       p:5,  c:'#374151' },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, color:T.muted }}>{m.m}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:m.c }}>{m.p}%</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${m.p}%`, background:m.c, borderRadius:4 }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Card>
          <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 14px', color:T.gold }}>Conversão por Origem de Lead</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Origem','Leads','Fechados','Conversão','Receita Total','Ticket Médio'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {ORIGENS.map(src => {
                  const sl = leads.filter(l => l.source === src)
                  if (!sl.length) return null
                  const sc  = sl.filter(l => l.stage===10||l.stage===11)
                  const rec = sl.reduce((a,b) => a+b.value, 0)
                  const cv  = Math.round(sc.length/sl.length*100)
                  return (
                    <tr key={src}>
                      <td style={tdS}><span style={{ fontWeight:600 }}>{src}</span></td>
                      <td style={tdS}>{sl.length}</td>
                      <td style={tdS}>{sc.length}</td>
                      <td style={tdS}><span style={{ fontWeight:700, color:cv>50?T.success:cv>25?T.warn:T.err }}>{cv}%</span></td>
                      <td style={tdS}><span style={{ color:T.gold, fontWeight:600 }}>{fmtR(rec)}</span></td>
                      <td style={tdS}>{fmtR(Math.round(rec/sl.length))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  /* ── ARQUITETURA ── */
  const ViewArquitetura = () => (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 6px' }}>Arquitetura do Sistema</h2>
      <p style={{ color:T.muted, fontSize:13, margin:'0 0 22px' }}>Stack técnica, banco de dados e roadmap</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {[
          { t:'Frontend',       icon:'⚛️', c:'#61DAFB', items:['Next.js 14 (App Router)','React + TypeScript','Tailwind CSS','ShadCN UI','React Query','Zustand','React Hook Form + Zod'] },
          { t:'Backend',        icon:'🟢', c:'#68A063', items:['Node.js + NestJS','REST API + GraphQL','JWT + OAuth2','Prisma ORM','Bull Queue','WebSockets','Rate limiting + Helmet'] },
          { t:'Banco & Storage',icon:'🗄️', c:'#336791', items:['PostgreSQL (principal)','Redis (cache)','AWS S3 (arquivos)','ElasticSearch (busca)','Backup automático S3','Migrations Prisma','Multi-tenant RLS'] },
          { t:'IA & Automações',icon:'🤖', c:'#D4AF37', items:['N8N (orquestração)','WhatsApp Business API','OpenAI GPT-4 (score)','Claude API (sugestões)','ManyChat integration','Webhooks receptores','Cron jobs (Bull)'] },
        ].map((tech, i) => (
          <Card key={i}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:22 }}>{tech.icon}</span>
              <h3 style={{ fontSize:15, fontWeight:700, color:tech.c, margin:0 }}>{tech.t}</h3>
            </div>
            {tech.items.map((item, j) => (
              <div key={j} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color:tech.c, fontSize:11 }}>▸</span>
                <span style={{ fontSize:13 }}>{item}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom:14 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:T.gold, margin:'0 0 14px' }}>🗺️ Roadmap de Desenvolvimento</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { phase:'MVP · 30 dias',  color:'#22C55E', items:['Cadastro de leads','Pipeline Kanban','Dashboard KPIs','Auth multi-usuário','WhatsApp básico'] },
            { phase:'V1 · 60 dias',   color:'#3B82F6', items:['Propostas em PDF','Automações N8N','Relatórios completos','UTM tracking','App consultor'] },
            { phase:'V2 · 90 dias',   color:'#8B5CF6', items:['IA Score de leads','Landing pages','Meta/Google Ads','Pós-venda auto','Indicações'] },
            { phase:'V3 · 120 dias',  color:'#D4AF37', items:['Previsão IA','Multi-empresa','API pública','BI avançado','White-label'] },
          ].map((ph, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:14, borderTop:`3px solid ${ph.color}`, border:`1px solid ${ph.color}20` }}>
              <div style={{ fontSize:12, fontWeight:700, color:ph.color, marginBottom:10 }}>{ph.phase}</div>
              {ph.items.map((item, j) => (
                <div key={j} style={{ fontSize:12, color:T.muted, padding:'4px 0', display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:ph.color }}>✓</span>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 style={{ fontSize:14, fontWeight:700, color:T.gold, margin:'0 0 14px' }}>🗄️ Schema PostgreSQL</h3>
        <div style={{ background:'#060c18', borderRadius:8, padding:16, fontFamily:'monospace', fontSize:12, lineHeight:1.9, color:'#A8D8EA', overflowX:'auto' }}>
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');
        .crm-root * { box-sizing:border-box; }
        .crm-root { font-family:'Manrope',sans-serif !important; }
        .crm-root input::placeholder { color:rgba(255,255,255,0.3); }
        .crm-root select option { background:#111827; color:#fff; }
        .crm-scroll::-webkit-scrollbar { width:5px; height:5px; }
        .crm-scroll::-webkit-scrollbar-track { background:transparent; }
        .crm-scroll::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.3); border-radius:3px; }
      `}</style>

      <div className="crm-root" style={{ display:'flex', height:'100vh', background:T.bg, color:T.text, overflow:'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width:228, background:T.header, borderRight:T.border, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'22px 18px 14px', borderBottom:T.border }}>
            <div style={{ fontSize:17, fontWeight:700, color:T.gold }}>✈️ Next Plane</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Joseph Milhas · CRM Pro</div>
          </div>
          <nav className="crm-scroll" style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
            {navItems.map(item => (
              <div key={item.id} onClick={() => setView(item.id)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:8, cursor:'pointer', marginBottom:2,
                  background:view===item.id?'rgba(212,175,55,0.12)':'transparent',
                  color:view===item.id?T.gold:T.muted,
                  fontSize:13, fontWeight:view===item.id?700:400,
                  border:view===item.id?'1px solid rgba(212,175,55,0.2)':'1px solid transparent',
                  transition:'all .15s' }}>
                {item.icon}{item.label}
              </div>
            ))}
          </nav>
          <div style={{ padding:'12px 10px', borderTop:T.borderN }}>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              borderRadius:8, color:T.muted, fontSize:12, textDecoration:'none',
              transition:'color .15s', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.color=T.text}
              onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
              <LogOut size={14}/> Voltar ao Site
            </a>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:8, background:'rgba(212,175,55,0.07)', marginTop:4 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#D4AF37,#f0d060)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700, color:'#0B1220' }}>JM</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700 }}>Joseph Milhas</div>
                <div style={{ fontSize:10, color:T.gold }}>Admin · Consultor</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Topbar */}
          <header style={{ background:T.header, borderBottom:T.borderN, padding:'12px 22px',
            display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ fontSize:13, color:T.muted }}>
              {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {semCtato > 0 && (
                <Badge color={T.err}><AlertCircle size={11}/> {semCtato} sem contato</Badge>
              )}
              <button onClick={() => setShowCloud(true)} title={mode === 'cloud' ? 'Conectado à nuvem' : 'Dados só neste navegador'}
                style={{ background:'transparent', border:'none', padding:0, cursor:'pointer' }}>
                {mode === 'cloud'
                  ? <Badge color={T.success}><Cloud size={11}/> Nuvem</Badge>
                  : <Badge color={T.warn}><CloudOff size={11}/> Só neste navegador</Badge>}
              </button>
              <span style={{ fontSize:12, color:T.muted }}>{leads.length} leads · {fmtR(recReal)} realizados</span>
              <Btn onClick={() => setShowNew(true)} small><Plus size={13}/> Lead</Btn>
              {mode !== 'cloud' && <button onClick={() => {
                if (window.confirm('Zerar todos os leads do CRM? Esta ação não pode ser desfeita.')) {
                  localStorage.removeItem('crm_leads')
                  localStorage.removeItem('crm_next_id')
                  setLeads([])
                  setNextId(1)
                  setSelected(null)
                  setView('dashboard')
                }
              }} style={{ background:'rgba(239,68,68,0.1)', color:'#EF4444',
                border:'1px solid rgba(239,68,68,0.25)', borderRadius:8,
                padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:700,
                fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}>
                🗑 Zerar CRM
              </button>}
            </div>
          </header>

          {/* Content */}
          <main className="crm-scroll" style={{ flex:1, overflowY:'auto', padding:22 }}>
            {VIEWS[view]}
          </main>
        </div>

        {/* ── Modal: Detalhe do Lead ── */}
        {selected && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
            onClick={() => setSelected(null)}>
            <div className="crm-scroll"
              style={{ background:T.card, borderRadius:14, padding:24, width:500,
                maxHeight:'88vh', overflowY:'auto', border:T.borderN,
                borderTop:`3px solid ${STAGES[selected.stage].color}` }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <Avatar initials={selected.initials} color={selected.color} size={52}/>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700 }}>{selected.name}</div>
                    <div style={{ fontSize:12, color:T.muted }}>Lead #{String(selected.id).padStart(4,'0')} · {selected.date}</div>
                    <div style={{ display:'flex', gap:6, marginTop:6 }}>
                      <Badge color={STAGES[selected.stage].color}>{STAGES[selected.stage].name}</Badge>
                      <Badge color={TEMP_C[selected.temp]}>{TEMP_I[selected.temp]} {selected.temp}</Badge>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background:'transparent', border:'none', color:T.muted, fontSize:22, cursor:'pointer', lineHeight:1 }}>
                  <X size={20}/>
                </button>
              </div>

              {/* Info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  [<Phone size={13}/>,     selected.phone || '—'],
                  [<Mail size={13}/>,      selected.email || '—'],
                  [<MapPin size={13}/>,    selected.cidade || '—'],
                  [<Calendar size={13}/>,  selected.date],
                ].map(([icon, val], i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                    background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'8px 12px' }}>
                    <span style={{ color:T.muted }}>{icon}</span>
                    <span style={{ fontSize:12, color:T.muted }}>{val}</span>
                  </div>
                ))}
              </div>

              {[
                ['✈️ Destino',   selected.dest],
                ['📁 Tipo',     selected.type],
                ['💰 Valor',    fmtR(selected.value)],
                ['📲 Origem',   selected.source],
                ['👤 Consultor',selected.consultor],
                ...(selected.source === 'Meta Ads' ? [
                  ['👥 Pessoas',       labelOf(META_PESSOAS, selected.pessoas)],
                  ['📅 Dias',          labelOf(META_DIAS, selected.dias)],
                  ['💎 Investimento',  labelOf(META_INVEST, selected.investimento)],
                  ['⭐ Score',         `${selected.score ?? 0} / 10`],
                  ['📣 Campanha',      selected.campaign_name || '—'],
                  ['🎬 Anúncio',       selected.ad_name || '—'],
                ] : []),
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between',
                  padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize:13, color:T.muted }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{val}</span>
                </div>
              ))}

              {/* Mover estágio */}
              <div style={{ margin:'16px 0 0' }}>
                <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>Mover para estágio:</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {STAGES.filter(s => s.id !== selected.stage).map(s => (
                    <button key={s.id} onClick={() => moveStage(selected.id, s.id)}
                      style={{ background:`${s.color}15`, color:s.color,
                        border:`1px solid ${s.color}30`, borderRadius:6,
                        padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                      {s.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                <Btn style={{ flex:1, justifyContent:'center' }}>
                  <FileText size={14}/> Criar Proposta
                </Btn>
                <a href={waLink(selected.phone, selected.name) || undefined} target="_blank" rel="noreferrer"
                  style={{ background:'#25D36615', color:'#25D366',
                  border:'1px solid #25D36630', borderRadius:8, padding:'9px 16px',
                  cursor:selected.phone ? 'pointer' : 'not-allowed', opacity:selected.phone ? 1 : 0.5,
                  fontWeight:700, fontSize:13, fontFamily:'inherit', textDecoration:'none',
                  display:'flex', alignItems:'center', gap:6 }}>
                  <MessageCircle size={14}/> WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Novo Lead ── */}
        {showNew && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
            onClick={() => setShowNew(false)}>
            <div className="crm-scroll"
              style={{ background:T.card, borderRadius:14, padding:24, width:480,
                maxHeight:'90vh', overflowY:'auto', border:T.borderN,
                borderTop:`3px solid ${T.gold}` }}
              onClick={e => e.stopPropagation()}>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:17, fontWeight:700 }}>Novo Lead</div>
                  <div style={{ fontSize:12, color:T.muted }}>Cadastrar prospect na agência</div>
                </div>
                <button onClick={() => setShowNew(false)}
                  style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}>
                  <X size={20}/>
                </button>
              </div>

              <div style={{ display:'grid', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Input label="Nome completo *" value={newLead.name} onChange={e=>setNewLead(p=>({...p,name:e.target.value}))} placeholder="Ex: João Silva"/>
                  <Input label="WhatsApp" value={newLead.phone} onChange={e=>setNewLead(p=>({...p,phone:e.target.value}))} placeholder="11 9 9999-0000"/>
                </div>
                <Input label="Destino desejado *" value={newLead.dest} onChange={e=>setNewLead(p=>({...p,dest:e.target.value}))} placeholder="Ex: Paris · Roma · Lisboa"/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Input label="E-mail" value={newLead.email} onChange={e=>setNewLead(p=>({...p,email:e.target.value}))} placeholder="email@exemplo.com"/>
                  <Input label="Cidade" value={newLead.cidade} onChange={e=>setNewLead(p=>({...p,cidade:e.target.value}))} placeholder="São Paulo"/>
                </div>
                <Input label="Valor estimado (R$)" type="number" value={newLead.value} onChange={e=>setNewLead(p=>({...p,value:e.target.value}))} placeholder="Ex: 15000"/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Sel label="Tipo de Viagem" value={newLead.type} onChange={e=>setNewLead(p=>({...p,type:e.target.value}))}>
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
                    {STAGES.slice(0,5).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </Sel>
                </div>
                <div>
                  <label style={{ fontSize:12, color:T.muted, display:'block', marginBottom:4 }}>Observações internas</label>
                  <textarea value={newLead.obs} onChange={e=>setNewLead(p=>({...p,obs:e.target.value}))} rows={2}
                    placeholder="Notas sobre o lead..."
                    style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:T.borderN,
                      borderRadius:8, padding:'9px 12px', color:T.text, fontSize:13,
                      fontFamily:'inherit', outline:'none', resize:'vertical' }}/>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, marginTop:18 }}>
                <Btn outline onClick={() => setShowNew(false)} style={{ flex:1, justifyContent:'center' }}>Cancelar</Btn>
                <Btn onClick={addLead} disabled={!newLead.name||!newLead.dest} style={{ flex:1, justifyContent:'center' }}>
                  <CheckCircle2 size={14}/> Cadastrar Lead
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Nuvem ── */}
        {showCloud && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
            onClick={() => setShowCloud(false)}>
            <div style={{ background:T.card, borderRadius:14, padding:24, width:440, maxWidth:'100%',
              border:T.borderN, borderTop:`3px solid ${mode === 'cloud' ? T.success : T.gold}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:17, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                  {mode === 'cloud' ? <Cloud size={18} color={T.success}/> : <CloudOff size={18} color={T.warn}/>}
                  {mode === 'cloud' ? 'Conectado à nuvem' : 'Conectar à nuvem'}
                </div>
                <button onClick={() => setShowCloud(false)}
                  style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}>
                  <X size={20}/>
                </button>
              </div>

              {mode === 'cloud' ? (
                <>
                  <p style={{ fontSize:13, color:T.muted, lineHeight:1.5, margin:'0 0 16px' }}>
                    Os leads ficam salvos na nuvem e aparecem em qualquer dispositivo. Os leads do Meta Ads entram sozinhos e a lista atualiza a cada 20 segundos.
                  </p>
                  <Btn outline onClick={disconnectCloud} style={{ width:'100%', justifyContent:'center' }}>
                    <CloudOff size={14}/> Desconectar deste navegador
                  </Btn>
                </>
              ) : (
                <>
                  <p style={{ fontSize:13, color:T.muted, lineHeight:1.5, margin:'0 0 14px' }}>
                    Hoje os leads estão salvos só neste navegador. Digite a chave de acesso do CRM (a mesma cadastrada como <code>CRM_ACCESS_KEY</code> na Vercel) para usar a nuvem.
                  </p>
                  <Input label="Chave de acesso" type="password" value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && keyInput.trim() && connectCloud()}
                    placeholder="••••••••"/>
                  {cloudMsg && <div style={{ fontSize:12, color:T.err, marginTop:8 }}>{cloudMsg}</div>}
                  <Btn onClick={connectCloud} disabled={!keyInput.trim() || syncing}
                    style={{ width:'100%', justifyContent:'center', marginTop:14 }}>
                    <Cloud size={14}/> {syncing ? 'Conectando…' : 'Conectar'}
                  </Btn>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
