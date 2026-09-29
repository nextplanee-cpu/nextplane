/**
 * Next Plane CRM — Gestão de Assessorias
 * Cada viagem contratada vira uma ficha com 9 etapas operacionais,
 * checklists, itens (aéreo, hotéis, seguro, ingressos e trem, internet), roteiro dia a dia, alertas e templates.
 * Dados: "Só neste navegador" (localStorage) ou "Nuvem" (/api/assessorias).
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus, X, Search, ArrowLeft, Trash2, MessageCircle, Copy, AlertTriangle,
  Calendar, Users, Plane, CheckCircle2, ExternalLink,
} from 'lucide-react'
import {
  fetchAssessorias, createAssessoria, saveAssessoria, removeAssessoria, waText,
} from '../../lib/assessoriasApi'
import { ORIGENS_BR, DESTINOS } from './cidades'

/* ─── Design tokens (mesmos do CRM) ─────────────────── */
const T = {
  bg: '#0B1220', card: '#111827', header: '#0d1628',
  gold: '#D4AF37', text: '#FFFFFF', muted: 'rgba(255,255,255,0.5)',
  success: '#22C55E', warn: '#F59E0B', err: '#EF4444', info: '#3B82F6',
  border: '1px solid rgba(212,175,55,0.15)',
  borderN: '1px solid rgba(255,255,255,0.07)',
}
const inputS = {
  width:'100%', background:'rgba(255,255,255,0.05)', border:T.borderN, borderRadius:8,
  padding:'8px 10px', color:T.text, fontSize:13, fontFamily:'inherit', outline:'none',
}

/* ─── Etapas ─────────────────────────────────────────── */
const AEREO_ST    = ['Pendente','Em pesquisa','Opções enviadas','Aguardando cliente','Emitido']
const HOTEL_ST    = ['Pendente','Cotado','Aguardando cliente','Reservado','Voucher anexado']
const SEGURO_ST   = ['Pendente','Cotado','Aguardando cliente','Contratado','Apólice enviada']
const EXP_ST      = ['Definido','Cotado','Aprovado','Comprado','Voucher anexado']
const INTERNET_ST = ['Pendente','Cotado','Comprado','Enviado ao cliente']

const STEPS = [
  { k:'onboarding', icon:'🟡', name:'Onboarding', short:'Onboarding', color:'#F59E0B', kind:'check',
    goal:'Entender completamente a viagem.', out:'Briefing completo para começar a montar a viagem.',
    checks:['Reunião realizada','Perfil dos viajantes','Objetivo da viagem','Orçamento','Datas','Destinos desejados','Preferências','Restrições','Documentos e dados dos viajantes'] },
  { k:'rota', icon:'🧭', name:'Definição de roteiro prévio', short:'Roteiro prévio', color:'#8B5CF6', kind:'check',
    goal:'Estruturar a viagem antes das emissões.', out:'Roteiro prévio aprovado pelo cliente.',
    checks:['Destinos definidos','Ordem dos destinos','Datas aproximadas','Deslocamentos entre cidades','Tempo em cada destino','Roteiro prévio aprovado pelo cliente'] },
  { k:'aereo', icon:'✈️', name:'Emissão de passagem aérea', short:'Aéreo', color:'#3B82F6', kind:'items', unit:'trechos emitidos', add:'trecho',
    statuses:AEREO_ST, done:['Emitido'], blank:{ trecho:'', data:'', cia:'', tipo:'Milhas', programa:'', milhas:'', taxas:'', valor:'', localizador:'', link:'', status:'Pendente' },
    fields:[
      { k:'trecho', l:'Trecho', ph:'GRU → LIS', w:2 }, { k:'data', l:'Data', t:'date' }, { k:'cia', l:'Cia', ph:'TAP' },
      { k:'tipo', l:'Pagamento', t:'select', opts:['Milhas','Pagante'] }, { k:'programa', l:'Programa', ph:'Smiles, Azul…' },
      { k:'milhas', l:'Milhas', t:'number' }, { k:'taxas', l:'Taxas R$', t:'number' }, { k:'valor', l:'Valor R$', t:'number' },
      { k:'localizador', l:'Localizador', ph:'ABC123' }, { k:'link', l:'Bilhete (link)', ph:'https://', w:2 },
    ] },
  { k:'hotel', icon:'🏨', name:'Hospedagem', short:'Hospedagem', color:'#06B6D4', kind:'items', unit:'confirmadas', add:'hospedagem',
    statuses:HOTEL_ST, done:['Reservado','Voucher anexado'], blank:{ cidade:'', hotel:'', checkin:'', checkout:'', quarto:'', cafe:false, cancelamento:'', valor:'', confirmacao:'', link:'', status:'Pendente' },
    fields:[
      { k:'cidade', l:'Cidade' }, { k:'hotel', l:'Hotel', w:2 }, { k:'checkin', l:'Check-in', t:'date' }, { k:'checkout', l:'Check-out', t:'date' },
      { k:'quarto', l:'Tipo de quarto' }, { k:'cafe', l:'Café da manhã', t:'check' }, { k:'cancelamento', l:'Cancelamento', ph:'Grátis até…' },
      { k:'valor', l:'Valor R$', t:'number' }, { k:'confirmacao', l:'Nº reserva' }, { k:'link', l:'Voucher (link)', ph:'https://', w:2 },
    ] },
  { k:'seguro', icon:'🛡️', name:'Seguro viagem', short:'Seguro', color:'#10B981', kind:'items', unit:'contratados', add:'seguro',
    statuses:SEGURO_ST, done:['Contratado','Apólice enviada'], blank:{ seguradora:'', plano:'', cobertura:'', inicio:'', fim:'', viajantes:'', valor:'', apolice:'', link:'', status:'Pendente' },
    fields:[
      { k:'seguradora', l:'Seguradora', ph:'Assist Card, GTA…' }, { k:'plano', l:'Plano', ph:'Europa 60 mil €' }, { k:'cobertura', l:'Cobertura médica', ph:'€ 60.000' },
      { k:'inicio', l:'Início', t:'date' }, { k:'fim', l:'Fim', t:'date' }, { k:'viajantes', l:'Viajantes', t:'number' },
      { k:'valor', l:'Valor R$', t:'number' }, { k:'apolice', l:'Nº apólice' }, { k:'link', l:'Apólice (link)', ph:'https://', w:2 },
    ] },
  { k:'exp', icon:'🎟️', name:'Ingressos e trem', short:'Ingressos e trem', color:'#EC4899', kind:'items', unit:'comprados', add:'ingresso ou trem',
    statuses:EXP_ST, done:['Comprado','Voucher anexado'], blank:{ tipo:'Ingresso', nome:'', cidade:'', data:'', hora:'', passageiros:'', valor:'', reserva:'', link:'', status:'Definido' },
    fields:[
      { k:'tipo', l:'Tipo', t:'select', opts:['Ingresso','Trem','Passeio','Tour','Museu','Parque','Evento','Transfer','Ônibus','Outro'] },
      { k:'nome', l:'Nome / trecho', ph:'Louvre · Paris → Londres', w:2 }, { k:'cidade', l:'Cidade' }, { k:'data', l:'Data', t:'date' }, { k:'hora', l:'Horário', t:'time' },
      { k:'passageiros', l:'Pessoas', t:'number' }, { k:'valor', l:'Valor R$', t:'number' }, { k:'reserva', l:'Reserva' }, { k:'link', l:'Voucher (link)', ph:'https://', w:2 },
    ] },
  { k:'internet', icon:'📶', name:'Internet', short:'Internet', color:'#0EA5E9', kind:'items', unit:'comprados', add:'chip / eSIM',
    statuses:INTERNET_ST, done:['Comprado','Enviado ao cliente'], blank:{ tipo:'eSIM', operadora:'', regiao:'', dados:'', inicio:'', dias:'', valor:'', link:'', status:'Pendente' },
    fields:[
      { k:'tipo', l:'Tipo', t:'select', opts:['eSIM','Chip físico','Roaming da operadora','Pocket Wi-Fi'] },
      { k:'operadora', l:'Operadora', ph:'Airalo, Holafly…' }, { k:'regiao', l:'País / região', ph:'Europa' }, { k:'dados', l:'Dados', ph:'10 GB / ilimitado' },
      { k:'inicio', l:'Ativação', t:'date' }, { k:'dias', l:'Dias', t:'number' }, { k:'valor', l:'Valor R$', t:'number' }, { k:'link', l:'QR code / voucher (link)', ph:'https://', w:2 },
    ] },
  { k:'roteiro', icon:'🗓️', name:'Definição de roteiro final (dia a dia)', short:'Roteiro final', color:'#A78BFA', kind:'check', dayByDay:true,
    goal:'Montar a programação completa de cada dia da viagem.', out:'Roteiro dia a dia aprovado e entregue ao cliente.',
    checks:['Roteiro dia a dia montado','Horários e deslocamentos conferidos','Voos, hotéis e ingressos no roteiro','Dicas de restaurantes e passeios','Roteiro enviado ao cliente','Cliente aprovou o roteiro final'] },
  { k:'previagem', icon:'📞', name:'Call prévia à viagem — alinhamentos finais', short:'Call prévia', color:'#F97316', kind:'check',
    goal:'Alinhar tudo com o cliente antes do embarque.', out:'Cliente pronto para viajar.',
    checks:['Call agendada','Roteiro final revisado com o cliente','Voos e check-in','Hospedagens conferidas','Seguro viagem conferido','Ingressos e trens conferidos','Internet / eSIM pronto','Documentação (passaporte / visto)','Bagagem e clima','Dinheiro e cartões','Dúvidas do cliente','Call realizada'] },
]
const STEP = Object.fromEntries(STEPS.map(s => [s.k, s]))
const EMISSAO = ['aereo','hotel','seguro','exp','internet']
const CUSTOS  = ['aereo','hotel','seguro','exp','internet']

/* Fichas criadas na versão anterior: transportes passam para "Ingressos e trem" */
const TRANSP_MAP = { 'Pendente':'Definido', 'Cotado':'Cotado', 'Aguardando cliente':'Aprovado', 'Reservado':'Comprado', 'Voucher anexado':'Voucher anexado' }
const migrate = a => {
  if (!a.transp?.length) return a
  const moved = a.transp.map(t => ({ id:t.id, tipo:['Trem','Ônibus','Transfer'].includes(t.tipo) ? t.tipo : 'Outro',
    nome:[t.origem, t.destino].filter(Boolean).join(' → '), cidade:'', data:t.data || '', hora:t.hora || '',
    passageiros:t.passageiros || '', valor:t.valor || '', reserva:t.reserva || '', link:t.link || '', status:TRANSP_MAP[t.status] || 'Definido' }))
  return { ...a, exp:[...(a.exp || []), ...moved], transp:[] }
}

const STATUS = {
  andamento:  { label:'Em andamento',       color:T.info },
  aguardando: { label:'Aguardando cliente', color:T.warn },
  bloqueado:  { label:'Bloqueado',          color:T.err },
  concluida:  { label:'Concluída',          color:T.success },
  cancelada:  { label:'Cancelada',          color:'#6B7280' },
}
const ATIVA = a => a.status !== 'concluida' && a.status !== 'cancelada'

/* ─── Templates por etapa ────────────────────────────── */
const TEMPLATES = {
  onboarding: [
    ['Boas-vindas', 'Olá, {primeiro_nome}! Seja muito bem-vindo(a) à assessoria Next Plane ✈️\n\nSou {responsavel} e vou cuidar de cada detalhe da sua viagem para {destino}. Vamos agendar nossa reunião de onboarding? Me diga o melhor dia e horário.'],
    ['Pedido de dados', '{primeiro_nome}, para começarmos a montar a viagem preciso de:\n\n• Nome completo de todos os viajantes (igual ao passaporte)\n• Data de nascimento\n• Validade dos passaportes\n• Cidade de saída\n• Preferências (assento, tipo de hotel, ritmo da viagem)\n\nPode me enviar por aqui mesmo 😊'],
  ],
  rota: [
    ['Envio do roteiro prévio', '{primeiro_nome}, segue o roteiro prévio da sua viagem para {destino} ({periodo}):\n\n[cole o roteiro aqui]\n\nMe diga se aprova ou se quer ajustar algo antes de começarmos as emissões.'],
  ],
  aereo: [
    ['Solicitação de informações', '{primeiro_nome}, para buscar as melhores opções de voo preciso confirmar: datas flexíveis? Preferência de companhia ou horário? Bagagem despachada para todos?'],
    ['Envio de opções', '{primeiro_nome}, separei as melhores opções de voo para {destino}:\n\n[opções]\n\nQual delas prefere? As tarifas em milhas podem mudar, então o ideal é aprovar o quanto antes.'],
    ['Aprovação da emissão', '{primeiro_nome}, posso seguir com a emissão da opção aprovada? Assim que confirmar eu emito e te envio o localizador.'],
    ['Confirmação de emissão', 'Passagens emitidas com sucesso! ✅ {primeiro_nome}, sua viagem para {destino} está com os voos garantidos.'],
    ['Envio de localizador', '{primeiro_nome}, seguem os localizadores dos seus voos:\n\n{localizadores}\n\nGuarde esta mensagem 😉'],
    ['Orientação de check-in', '{primeiro_nome}, o check-in online abre normalmente 24h a 48h antes do voo. Tenha em mãos o passaporte e o localizador. Qualquer dificuldade é só me chamar que eu faço com você.'],
  ],
  hotel: [
    ['Envio de opções de hotel', '{primeiro_nome}, separei estas opções de hospedagem:\n\n[opções]\n\nQual combina mais com vocês?'],
    ['Confirmação de reservas', '{primeiro_nome}, hospedagens confirmadas ✅\n\n{hoteis}'],
  ],
  seguro: [
    ['Opções de seguro', '{primeiro_nome}, separei as opções de seguro viagem para {destino} ({periodo}):\n\n[opções]\n\nPara a Europa a cobertura mínima exigida é de € 30.000 — recomendo uma cobertura maior para viajar tranquilo.'],
    ['Envio da apólice', '{primeiro_nome}, seguro viagem contratado ✅ Segue a apólice. Salve no celular e anote o telefone de emergência da seguradora.'],
  ],
  exp: [
    ['Sugestões de ingressos', '{primeiro_nome}, separei algumas experiências que combinam com o perfil de vocês em {destino}:\n\n[sugestões]\n\nQuais querem incluir?'],
    ['Confirmação de trens', '{primeiro_nome}, trens reservados ✅ Os bilhetes já estão organizados por data. Chegue à estação com 20 a 30 minutos de antecedência.'],
    ['Confirmação de ingressos', '{primeiro_nome}, ingressos comprados ✅ Os vouchers já estão organizados para a viagem.'],
  ],
  internet: [
    ['Orientação de eSIM', '{primeiro_nome}, seu eSIM para {destino} está pronto 📶\n\n1. Confira se o celular aceita eSIM\n2. Instale pelo QR code ainda no Brasil, com Wi-Fi\n3. Só ative a linha ao chegar\n4. Ligue o roaming de dados no eSIM\n\nQualquer dúvida me chama!'],
  ],
  roteiro: [
    ['Envio do roteiro final', '{primeiro_nome}, segue o roteiro dia a dia da sua viagem para {destino} 🗓️\n\n{roteiro}\n\nMe diga se quer ajustar algo!'],
  ],
  previagem: [
    ['Agendar call prévia', '{primeiro_nome}, faltam {dias} dias para a viagem! Vamos marcar nossa call de alinhamentos finais para revisar roteiro, documentos, seguro, internet e bagagem? Me diga o melhor horário.'],
    ['Checklist de embarque', '{primeiro_nome}, checklist final antes de embarcar:\n\n✅ Passaportes válidos\n✅ Seguro viagem\n✅ Check-in feito\n✅ eSIM instalado\n✅ Vouchers e bilhetes salvos no celular\n✅ Cartão internacional liberado\n\nBoa viagem! Estou à disposição durante toda a viagem.'],
  ],
}

/* ─── Helpers ────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9)
const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtD = d => (d ? d.split('-').reverse().slice(0, 2).join('/') : '—')
const fmtR = v => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const fmtMes = d => (d ? `${MESES[Number(d.slice(5, 7)) - 1]}/${d.slice(2, 4)}` : '—')
const periodo = a => (a.inicio ? `${fmtD(a.inicio)} a ${fmtD(a.fim)}` : 'datas a definir')
const daysTo = d => (d ? Math.ceil((new Date(`${d}T00:00`) - new Date(`${todayISO()}T00:00`)) / 864e5) : null)
const addMonths = (d, m) => { const x = new Date(`${d}T00:00`); x.setMonth(x.getMonth() + m); return x.toISOString().slice(0, 10) }

function progress(a, s) {
  if (a.na?.[s.k]) return { na:true, done:0, total:0, pct:1, complete:true }
  if (s.kind === 'check') {
    const done = s.checks.filter(c => a.checks?.[s.k]?.[c]).length
    return { done, total:s.checks.length, pct:done / s.checks.length, complete:done === s.checks.length }
  }
  const items = a[s.k] || []
  const done = items.filter(i => s.done.includes(i.status)).length
  return { done, total:items.length, pct:items.length ? done / items.length : 0, complete:items.length > 0 && done === items.length }
}
const semaforo = p => (p.na ? '➖' : p.complete ? '✅' : p.pct >= 0.5 ? '🟡' : p.pct > 0 ? '🔴' : '⚪')
const currentStep = a => STEPS.find(s => !progress(a, s).complete) || null

function alertas(a) {
  if (!ATIVA(a)) return []
  const out = []
  const dias = daysTo(a.inicio)
  const pend = EMISSAO.filter(k => !progress(a, STEP[k]).complete)
  if (dias !== null && dias >= 0 && dias <= 30 && pend.length)
    out.push(`Embarque em ${dias}d com pendências: ${pend.map(k => STEP[k].short).join(', ')}`)
  if (dias !== null && dias >= 0 && dias <= 7 && !progress(a, STEP.previagem).complete)
    out.push('Call prévia ainda não realizada')
  const volta = a.fim || a.inicio
  if (volta) (a.passageiros || []).forEach(p => {
    if (p.passaporte && p.passaporte < addMonths(volta, 6))
      out.push(`Passaporte de ${p.nome || 'viajante'} vence em menos de 6 meses após a volta`)
  })
  if (a.proxima_data && a.proxima_data < todayISO()) out.push('Próxima ação atrasada')
  if (a.fim && daysTo(a.fim) < 0) out.push('Viagem terminou — marque a assessoria como concluída')
  return out
}

function fillTemplate(txt, a) {
  const vars = {
    cliente: a.cliente || '', primeiro_nome: String(a.cliente || '').trim().split(/\s+/)[0] || '',
    origem: a.origem || '', destino: a.destino || '', periodo: periodo(a), responsavel: a.responsavel || 'Joseph',
    dias: daysTo(a.inicio) ?? '—',
    localizadores: (a.aereo || []).filter(v => v.localizador).map(v => `✈️ ${v.trecho || 'Voo'}${v.data ? ` (${fmtD(v.data)})` : ''}: ${v.localizador}`).join('\n') || '[localizadores]',
    roteiro: (a.roteiro_dias || []).filter(d => d.programacao || d.cidade).map((d, i) => `*Dia ${i + 1}${d.data ? ` — ${fmtD(d.data)}` : ''}${d.cidade ? ` · ${d.cidade}` : ''}*\n${d.programacao || ''}`).join('\n\n') || '[roteiro]',
    hoteis: (a.hotel || []).filter(h => h.hotel).map(h => `🏨 ${h.cidade ? `${h.cidade} — ` : ''}${h.hotel} (${fmtD(h.checkin)} a ${fmtD(h.checkout)})`).join('\n') || '[hotéis]',
  }
  return txt.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
}

/* ─── UI básica ──────────────────────────────────────── */
const Badge = ({ children, color, small }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:small ? '2px 7px' : '3px 10px',
    borderRadius:20, fontSize:small ? 10 : 11, fontWeight:600, whiteSpace:'nowrap',
    background:`${color}20`, color, border:`1px solid ${color}40` }}>{children}</span>
)
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:T.card, borderRadius:12, border:T.borderN, padding:18, ...style }}>{children}</div>
)
const Btn = ({ children, onClick, outline, danger, small, style, disabled, title }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    style={{ background:danger ? 'rgba(239,68,68,0.1)' : outline ? 'transparent' : 'linear-gradient(135deg,#D4AF37,#f0d060)',
      color:danger ? T.err : outline ? T.gold : '#0B1220', padding:small ? '5px 12px' : '9px 18px',
      borderRadius:8, fontWeight:700, fontSize:small ? 12 : 13, cursor:disabled ? 'not-allowed' : 'pointer',
      fontFamily:'inherit', border:danger ? '1px solid rgba(239,68,68,0.3)' : outline ? `1px solid ${T.gold}` : 'none',
      opacity:disabled ? 0.5 : 1, display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap', ...style }}>
    {children}
  </button>
)
const Label = ({ children }) => <label style={{ fontSize:11, color:T.muted, display:'block', marginBottom:4 }}>{children}</label>
const Field = ({ label, value, onChange, type = 'text', ph, list }) => (
  <div>
    {label && <Label>{label}</Label>}
    <input type={type} value={value ?? ''} placeholder={ph} list={list}
      onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      style={{ ...inputS, colorScheme:'dark' }}/>
  </div>
)
const Select = ({ label, value, onChange, opts }) => (
  <div>
    {label && <Label>{label}</Label>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputS, background:'#111827', cursor:'pointer' }}>
      {opts.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>)}
    </select>
  </div>
)
const Bar = ({ pct, color }) => (
  <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
    <div style={{ height:'100%', width:`${Math.round(pct * 100)}%`, background:color, transition:'width .3s' }}/>
  </div>
)

/* ─── Seletor de cidades (busca + lista; destino aceita várias) ── */
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const cidadesDe = a => (a.cidades?.length ? a.cidades : a.destino ? [a.destino] : [])

function CityPicker({ label, value, onChange, groups, multi, ph }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const sel = multi ? (value || []) : (value ? [value] : [])

  useEffect(() => {
    if (!open) return
    const close = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const escolher = nome => {
    const n = nome.trim()
    if (!n) return
    if (multi) { if (!sel.includes(n)) onChange([...sel, n]) }
    else { onChange(n); setOpen(false) }
    setQ('')
  }
  const tirar = nome => onChange(multi ? sel.filter(x => x !== nome) : '')

  const busca = semAcento(q)
  const lista = groups
    .map(g => ({ ...g, cidades: g.cidades.filter(c => !sel.includes(c.nome) &&
      (!busca || semAcento(`${c.nome} ${c.pais} ${g.grupo}`).includes(busca))) }))
    .filter(g => g.cidades.length)
  const primeira = lista[0]?.cidades[0]?.nome

  return (
    <div ref={boxRef} style={{ position:'relative' }}>
      {label && <Label>{label}</Label>}
      <div onClick={() => setOpen(true)} style={{ ...inputS, display:'flex', flexWrap:'wrap', gap:5, alignItems:'center', minHeight:38, padding:'5px 8px', cursor:'text' }}>
        {sel.map(n => (
          <span key={n} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(212,175,55,0.15)',
            color:T.gold, border:'1px solid rgba(212,175,55,0.3)', borderRadius:20, padding:'2px 4px 2px 9px', fontSize:12, fontWeight:600 }}>
            {n}
            <button onClick={e => { e.stopPropagation(); tirar(n) }} title="Remover"
              style={{ background:'transparent', border:'none', color:T.gold, cursor:'pointer', padding:0, display:'flex' }}><X size={12}/></button>
          </span>
        ))}
        {(multi || !sel.length) && (
          <input value={q} placeholder={sel.length ? 'Adicionar cidade…' : ph}
            onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); escolher(primeira && busca ? primeira : q) }
              else if (e.key === 'Backspace' && !q && sel.length) tirar(sel[sel.length - 1])
              else if (e.key === 'Escape') setOpen(false)
            }}
            style={{ flex:1, minWidth:120, background:'transparent', border:'none', outline:'none', color:T.text, fontSize:13, fontFamily:'inherit', padding:'3px 2px' }}/>
        )}
      </div>
      {open && (
        <div className="crm-scroll" style={{ position:'absolute', zIndex:50, left:0, right:0, top:'100%', marginTop:4, maxHeight:260, overflowY:'auto',
          background:'#0d1628', border:T.border, borderRadius:10, boxShadow:'0 12px 30px rgba(0,0,0,0.5)', padding:6 }}>
          {q.trim() && !lista.some(g => g.cidades.some(c => semAcento(c.nome) === busca)) && (
            <div onMouseDown={e => { e.preventDefault(); escolher(q) }}
              style={{ padding:'7px 10px', borderRadius:6, cursor:'pointer', fontSize:13, color:T.gold }}>
              + Usar “{q.trim()}”
            </div>
          )}
          {lista.map(g => (
            <div key={g.grupo}>
              <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.5, padding:'8px 10px 4px' }}>{g.grupo.toUpperCase()}</div>
              {g.cidades.map(c => (
                <div key={c.nome} onMouseDown={e => { e.preventDefault(); escolher(c.nome) }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ padding:'6px 10px', borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', justifyContent:'space-between', gap:8 }}>
                  <span>{c.nome}</span><span style={{ color:T.muted, fontSize:11 }}>{c.pais}</span>
                </div>
              ))}
            </div>
          ))}
          {!lista.length && !q.trim() && <div style={{ padding:10, fontSize:12, color:T.muted }}>Todas as cidades já foram escolhidas.</div>}
        </div>
      )}
    </div>
  )
}


/* ════════════════════════════════════════════════════ */
/*  COMPONENTE PRINCIPAL                                */
/* ════════════════════════════════════════════════════ */
const LS_KEY = 'crm_assessorias'
const readLocal = () => { try { return (JSON.parse(localStorage.getItem(LS_KEY)) || []).map(migrate) } catch { return [] } }

export default function Assessorias({ mode = 'local' }) {
  const [store,   setStore]   = useState(() => ({ mode:'local', items: readLocal() }))
  const [openId,  setOpenId]  = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [err,     setErr]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const timers   = useRef({})
  const storeRef = useRef(store)
  useEffect(() => { storeRef.current = store }, [store])

  const list = store.items

  /* Carrega conforme o modo (navegador x nuvem) */
  const loadCloud = async () => {
    try { setStore({ mode:'cloud', items: (await fetchAssessorias()).map(migrate) }); setErr('') }
    catch (e) { setErr(e.message === 'table_missing' ? 'table_missing' : e.status === 401 ? 'Chave de acesso inválida.' : 'Não foi possível carregar as assessorias da nuvem.') }
  }
  useEffect(() => {
    if (mode === 'cloud') loadCloud()
    else { setStore({ mode:'local', items: readLocal() }); setErr('') }
  }, [mode])

  /* Modo local: grava no navegador */
  useEffect(() => {
    if (store.mode === 'local') try { localStorage.setItem(LS_KEY, JSON.stringify(store.items)) } catch {}
  }, [store])

  /* Nuvem: atualiza a lista a cada 30s (só na visão geral e sem salvamento pendente) */
  useEffect(() => {
    if (mode !== 'cloud' || openId) return
    const t = setInterval(() => { if (!Object.keys(timers.current).length) loadCloud() }, 30000)
    return () => clearInterval(t)
  }, [mode, openId])

  /* Atualiza uma ficha (registra no histórico as etapas concluídas) e salva */
  const update = (id, fn) => {
    setStore(prev => ({ ...prev, items: prev.items.map(a => {
      if (a.id !== id) return a
      const next = fn(a)
      const log = [...(next.log || [])]
      STEPS.forEach(s => {
        if (!progress(a, s).complete && progress(next, s).complete && !next.na?.[s.k])
          log.unshift({ t: new Date().toISOString(), msg:`${s.icon} ${s.short} concluída` })
      })
      if (a.status !== next.status) log.unshift({ t: new Date().toISOString(), msg:`Status: ${STATUS[next.status]?.label}` })
      return { ...next, log: log.slice(0, 80) }
    }) }))
    if (storeRef.current.mode !== 'cloud') return
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(async () => {
      delete timers.current[id]
      const a = storeRef.current.items.find(x => x.id === id)
      if (!a) return
      setSaving(true)
      try { await saveAssessoria(a) } catch { setErr('Falha ao salvar na nuvem — confira a conexão.') }
      finally { setSaving(false) }
    }, 800)
  }

  const create = async form => {
    const base = {
      ...form, status:'andamento', checks:{}, na:{}, aereo:[], hotel:[], seguro:[], exp:[], internet:[], roteiro_dias:[], passageiros: form.passageiros || [],
      proxima_acao:'Agendar reunião de onboarding', proxima_data:'',
      log:[{ t:new Date().toISOString(), msg:'Assessoria criada' }],
    }
    if (mode === 'cloud') {
      try {
        const created = await createAssessoria(base)
        setStore(p => ({ ...p, items:[created, ...p.items] }))
        setOpenId(created.id)
      } catch (e) { setErr(e.message === 'table_missing' ? 'table_missing' : 'Não foi possível criar na nuvem.') ; return }
    } else {
      const created = { ...base, id: Date.now(), createdAt: new Date().toISOString() }
      setStore(p => ({ ...p, items:[created, ...p.items] }))
      setOpenId(created.id)
    }
    setShowNew(false)
  }

  const remove = async a => {
    if (!window.confirm(`Excluir a assessoria de ${a.cliente}? Esta ação não pode ser desfeita.`)) return
    if (mode === 'cloud') {
      try { await removeAssessoria(a.id) } catch { setErr('Não foi possível excluir na nuvem.'); return }
    }
    setStore(p => ({ ...p, items: p.items.filter(x => x.id !== a.id) }))
    setOpenId(null)
  }

  const open = list.find(a => a.id === openId)

  return (
    <div>
      {err === 'table_missing' ? <TableMissing/> : err && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:T.err,
          borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{err}</div>
      )}
      {open
        ? <Ficha a={open} saving={saving} onBack={() => setOpenId(null)} onDelete={() => remove(open)}
            onChange={fn => update(open.id, fn)}/>
        : <Overview list={list} onOpen={setOpenId} onNew={() => setShowNew(true)} mode={mode}/>}
      {showNew && <NewModal onClose={() => setShowNew(false)} onSave={create}/>}
    </div>
  )
}

/* ─── Aviso: tabela ainda não criada no Supabase ─────── */
const TableMissing = () => (
  <Card style={{ border:T.border, marginBottom:14 }}>
    <div style={{ fontWeight:700, color:T.gold, marginBottom:6 }}>⚙️ Falta criar a tabela de assessorias na nuvem</div>
    <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>
      No Supabase: <b>SQL Editor → New query</b>, cole o trecho abaixo e clique em <b>Run</b>. Depois recarregue esta página.
    </div>
    <pre style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:12, fontSize:11, color:'#9CA3AF', overflowX:'auto', marginTop:10 }}>{`create table if not exists public.crm_assessorias (
  id bigserial primary key,
  lead_id bigint,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.crm_assessorias enable row level security;`}</pre>
  </Card>
)

/* ════════════════════════════════════════════════════ */
/*  VISÃO GERAL                                         */
/* ════════════════════════════════════════════════════ */
function Overview({ list, onOpen, onNew, mode }) {
  const [q,     setQ]     = useState('')
  const [fSt,   setFSt]   = useState('ativas')
  const [fResp, setFResp] = useState('all')

  const ativas = list.filter(ATIVA)
  const etapaDe = a => currentStep(a)?.k
  const kpis = [
    { label:'Assessorias ativas', val:ativas.length, color:T.gold },
    { label:'Onboardings',        val:ativas.filter(a => etapaDe(a) === 'onboarding').length, color:STEP.onboarding.color },
    { label:'Roteiro prévio',     val:ativas.filter(a => etapaDe(a) === 'rota').length, color:STEP.rota.color },
    { label:'Em emissão',         val:ativas.filter(a => EMISSAO.includes(etapaDe(a))).length, color:STEP.aereo.color },
    { label:'Roteiro final',      val:ativas.filter(a => etapaDe(a) === 'roteiro').length, color:STEP.roteiro.color },
    { label:'Call prévia',        val:ativas.filter(a => etapaDe(a) === 'previagem').length, color:STEP.previagem.color },
    { label:'Embarcam em 30 dias',val:ativas.filter(a => { const d = daysTo(a.inicio); return d !== null && d >= 0 && d <= 30 }).length, color:T.info },
    { label:'Com alerta',         val:ativas.filter(a => alertas(a).length).length, color:T.err },
  ]
  const resps = [...new Set(list.map(a => a.responsavel).filter(Boolean))]

  const rows = list
    .filter(a => fSt === 'all' || (fSt === 'ativas' ? ATIVA(a) : a.status === fSt))
    .filter(a => fResp === 'all' || a.responsavel === fResp)
    .filter(a => !q || `${a.cliente} ${a.origem || ''} ${a.destino}`.toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => (x.inicio || '9999').localeCompare(y.inicio || '9999'))

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:18 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, margin:0 }}>Gestão de Assessorias</h2>
          <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>
            Execução das viagens contratadas · {mode === 'cloud' ? 'dados na nuvem' : 'dados só neste navegador'}
          </p>
        </div>
        <Btn onClick={onNew}><Plus size={14}/> Nova assessoria</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        {kpis.map(k => (
          <Card key={k.label} style={{ padding:14, borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:24, fontWeight:700, color:k.color, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:6 }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', gap:10, padding:14, flexWrap:'wrap', borderBottom:T.borderN }}>
          <div style={{ position:'relative', flex:'1 1 220px' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:10, color:T.muted }}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente, origem ou destino…"
              style={{ ...inputS, paddingLeft:30 }}/>
          </div>
          <select value={fSt} onChange={e => setFSt(e.target.value)} style={{ ...inputS, width:'auto', background:'#111827' }}>
            <option value="ativas">Ativas</option>
            <option value="all">Todas</option>
            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <select value={fResp} onChange={e => setFResp(e.target.value)} style={{ ...inputS, width:'auto', background:'#111827' }}>
            <option value="all">Todos os responsáveis</option>
            {resps.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding:'48px 20px', textAlign:'center', color:T.muted }}>
            <div style={{ fontSize:34, marginBottom:8 }}>🧳</div>
            <div style={{ fontSize:14, marginBottom:14 }}>
              {list.length ? 'Nenhuma assessoria com esses filtros.' : 'Nenhuma assessoria ainda. Crie a primeira quando fechar uma venda.'}
            </div>
            {!list.length && <Btn onClick={onNew} small><Plus size={13}/> Nova assessoria</Btn>}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:820 }}>
              <thead>
                <tr style={{ color:T.muted, fontSize:11, textAlign:'left' }}>
                  {['Cliente','Destino','Período','Etapa atual','Progresso','Responsável','Status',''].map(h => (
                    <th key={h} style={{ padding:'10px 14px', fontWeight:600, borderBottom:T.borderN }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(a => {
                  const st = currentStep(a)
                  const al = alertas(a)
                  const dias = daysTo(a.inicio)
                  return (
                    <tr key={a.id} onClick={() => onOpen(a.id)} style={{ cursor:'pointer', borderBottom:T.borderN }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontWeight:700 }}>{a.cliente}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{a.viajantes || '?'} viajante(s)</div>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div>{a.destino || '—'}</div>
                        {a.origem && <div style={{ fontSize:11, color:T.muted }}>saindo de {a.origem}</div>}
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div>{fmtMes(a.inicio)}</div>
                        {dias !== null && dias >= 0 && ATIVA(a) && <div style={{ fontSize:11, color:dias <= 30 ? T.warn : T.muted }}>em {dias} dias</div>}
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        {st ? <Badge color={st.color}>{st.icon} {st.short}</Badge> : <Badge color={T.success}>🏁 Tudo concluído</Badge>}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:15, letterSpacing:1, whiteSpace:'nowrap' }}
                        title={STEPS.map(s => `${s.short}: ${semaforo(progress(a, s))}`).join('\n')}>
                        {STEPS.map(s => <span key={s.k}>{semaforo(progress(a, s))}</span>)}
                      </td>
                      <td style={{ padding:'12px 14px' }}>{a.responsavel || '—'}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <Badge color={STATUS[a.status]?.color || T.muted} small>{STATUS[a.status]?.label || a.status}</Badge>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        {al.length > 0 && <span title={al.join('\n')} style={{ color:T.err, display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700 }}>
                          <AlertTriangle size={14}/> {al.length}
                        </span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ════════════════════════════════════════════════════ */
/*  FICHA DA ASSESSORIA                                 */
/* ════════════════════════════════════════════════════ */
function Ficha({ a, onChange, onBack, onDelete, saving }) {
  const [tab, setTab] = useState(() => currentStep(a)?.k || 'geral')
  const set = (k, v) => onChange(x => ({ ...x, [k]: v }))
  const al = alertas(a)
  const dias = daysTo(a.inicio)
  const st = currentStep(a)

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:14 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <button onClick={onBack} title="Voltar" style={{ background:'rgba(255,255,255,0.05)', border:T.borderN, borderRadius:8,
            color:T.text, cursor:'pointer', padding:8, display:'flex' }}><ArrowLeft size={16}/></button>
          <div>
            <h2 style={{ fontSize:21, fontWeight:700, margin:0 }}>{a.cliente} <span style={{ color:T.gold }}>— {a.origem ? `${a.origem} → ` : ''}{a.destino || 'destino a definir'}</span></h2>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:T.muted, marginTop:6 }}>
              <span style={{ display:'inline-flex', gap:5, alignItems:'center' }}><Calendar size={12}/> {periodo(a)}</span>
              <span style={{ display:'inline-flex', gap:5, alignItems:'center' }}><Users size={12}/> {a.viajantes || '?'} viajante(s)</span>
              <span>👤 {a.responsavel || '—'}</span>
              {a.contratado_em && <span>Contratado em {fmtD(a.contratado_em)}/{a.contratado_em.slice(0, 4)}</span>}
              {dias !== null && dias >= 0 && <span style={{ color:dias <= 30 ? T.warn : T.gold, fontWeight:700 }}>✈️ Embarque em {dias} dias</span>}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:T.muted }}>{saving ? 'Salvando…' : 'Salvo automaticamente'}</span>
          <select value={a.status} onChange={e => set('status', e.target.value)}
            style={{ ...inputS, width:'auto', background:'#111827', color:STATUS[a.status]?.color, fontWeight:700 }}>
            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          {a.phone && <a href={waText(a.phone, `Olá, ${String(a.cliente).split(' ')[0]}! `)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
            <Btn outline small><MessageCircle size={13}/> WhatsApp</Btn></a>}
          <Btn danger small onClick={onDelete} title="Excluir assessoria"><Trash2 size={13}/></Btn>
        </div>
      </div>

      {al.length > 0 && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
          {al.map(t => <div key={t} style={{ color:'#FCA5A5', fontSize:12, display:'flex', gap:6, alignItems:'center', padding:'2px 0' }}><AlertTriangle size={13}/> {t}</div>)}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'minmax(230px,280px) 1fr', gap:14, alignItems:'start' }} className="ass-grid">
        {/* Checklist operacional */}
        <Card style={{ padding:10 }}>
          <div style={{ fontSize:11, color:T.muted, padding:'4px 8px 8px', fontWeight:700, letterSpacing:0.5 }}>CHECKLIST OPERACIONAL</div>
          <StepBtn active={tab === 'geral'} onClick={() => setTab('geral')} icon="📋" name="Visão geral"/>
          <StepBtn active={tab === 'pax'} onClick={() => setTab('pax')} icon="🛂" name="Passageiros"
            sub={`${(a.passageiros || []).length} de ${a.viajantes || '?'}`}/>
          {STEPS.map((s, i) => {
            const p = progress(a, s)
            return (
              <StepBtn key={s.k} active={tab === s.k} onClick={() => setTab(s.k)} current={st?.k === s.k}
                icon={semaforo(p)} name={`${i + 1}. ${s.short}`}
                sub={p.na ? 'não se aplica' : s.kind === 'items' ? (p.total ? `${p.done}/${p.total} ${s.unit}` : 'nenhum item') : `${p.done}/${p.total}`}
                pct={p.na ? null : p.pct} color={s.color}/>
            )
          })}
        </Card>

        {/* Conteúdo da etapa */}
        <div style={{ minWidth:0 }}>
          {tab === 'geral' ? <Geral a={a} set={set} onChange={onChange}/>
            : tab === 'pax' ? (
              <Card>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>🛂 Passageiros</div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:14 }}>Dados de cada viajante para emissões, seguro e reservas.</div>
                <Passageiros list={a.passageiros || []} setList={fn => onChange(x => ({ ...x, passageiros: fn(x.passageiros || []) }))}/>
              </Card>)
            : <StepPanel s={STEP[tab]} a={a} onChange={onChange}/>}
        </div>
      </div>
      <datalist id="ass-cidades">{cidadesDe(a).map(c => <option key={c} value={c}/>)}</datalist>
      <style>{`@media (max-width: 760px) { .ass-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

const StepBtn = ({ active, onClick, icon, name, sub, pct, color, current }) => (
  <div onClick={onClick} style={{ padding:'9px 10px', borderRadius:8, cursor:'pointer', marginBottom:2,
    background:active ? 'rgba(212,175,55,0.12)' : 'transparent',
    border:active ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent' }}>
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ width:20, textAlign:'center' }}>{icon}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:active ? 700 : 500, color:active ? T.gold : T.text }}>{name}</span>
      {current && <span style={{ fontSize:9, color:T.gold, fontWeight:700 }}>ATUAL</span>}
      {sub && <span style={{ fontSize:11, color:T.muted }}>{sub}</span>}
    </div>
    {pct !== null && pct !== undefined && <div style={{ margin:'6px 0 0 28px' }}><Bar pct={pct} color={color}/></div>}
  </div>
)

/* ─── Passageiros: dados para emissão ────────────────── */
const PAX_FIELDS = [
  { k:'nome', l:'Nome completo (igual ao passaporte)', w:2 },
  { k:'cpf', l:'CPF', ph:'000.000.000-00' },
  { k:'nascimento', l:'Nascimento', t:'date' },
  { k:'sexo', l:'Sexo', t:'select', opts:['','Feminino','Masculino'] },
  { k:'nacionalidade', l:'Nacionalidade' },
  { k:'passaporte_num', l:'Nº do passaporte' },
  { k:'passaporte', l:'Validade do passaporte', t:'date' },
  { k:'telefone', l:'Telefone', ph:'11999999999' },
  { k:'email', l:'E-mail' },
  { k:'fidelidade', l:'Programas de fidelidade', ph:'Smiles 123… · LATAM Pass 456…', w:2 },
  { k:'obs', l:'Observações', ph:'Assento, alimentação, necessidades especiais…', w:2 },
]
const novoPax = () => ({ id:uid(), nome:'', cpf:'', nascimento:'', sexo:'', nacionalidade:'Brasileira', passaporte_num:'', passaporte:'', telefone:'', email:'', fidelidade:'', obs:'' })
const paxTexto = p => [
  `Nome: ${p.nome || '—'}`, p.cpf && `CPF: ${p.cpf}`, p.nascimento && `Nascimento: ${fmtD(p.nascimento)}/${p.nascimento.slice(0, 4)}`,
  p.sexo && `Sexo: ${p.sexo}`, p.nacionalidade && `Nacionalidade: ${p.nacionalidade}`,
  p.passaporte_num && `Passaporte: ${p.passaporte_num}${p.passaporte ? ` (validade ${fmtD(p.passaporte)}/${p.passaporte.slice(0, 4)})` : ''}`,
  p.telefone && `Telefone: ${p.telefone}`, p.email && `E-mail: ${p.email}`, p.fidelidade && `Fidelidade: ${p.fidelidade}`, p.obs && `Obs.: ${p.obs}`,
].filter(Boolean).join('\n')

function Passageiros({ list = [], setList, compact }) {
  const [copied, setCopied] = useState(null)
  const setP = (i, k, v) => setList(prev => prev.map((p, j) => j === i ? { ...p, [k]: v } : p))
  const copiar = async (txt, key) => {
    try { await navigator.clipboard.writeText(txt); setCopied(key); setTimeout(() => setCopied(null), 1500) } catch {}
  }
  return (
    <div style={{ display:'grid', gap:10 }}>
      {list.length === 0 && <div style={{ fontSize:12, color:T.muted }}>
        Cadastre os passageiros com os dados para emissão. O CRM avisa se algum passaporte vencer em menos de 6 meses após a volta.
      </div>}
      {list.map((p, i) => (
        <div key={p.id} style={{ background:'rgba(255,255,255,0.03)', border:T.borderN, borderRadius:10, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, gap:8 }}>
            <div style={{ fontWeight:700, fontSize:13 }}>👤 Passageiro {i + 1}{p.nome ? ` — ${p.nome}` : ''}</div>
            <div style={{ display:'flex', gap:6 }}>
              {!compact && <Btn small outline onClick={() => copiar(paxTexto(p), p.id)}><Copy size={12}/> {copied === p.id ? 'Copiado!' : 'Copiar dados'}</Btn>}
              <button onClick={() => { if (!p.nome || window.confirm(`Remover ${p.nome}?`)) setList(prev => prev.filter((_, j) => j !== i)) }}
                title="Remover" style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}><Trash2 size={14}/></button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8 }}>
            {PAX_FIELDS.map(f => (
              <div key={f.k} style={{ gridColumn:f.w ? `span ${f.w}` : undefined }}>
                {f.t === 'select'
                  ? <Select label={f.l} value={p[f.k] || ''} opts={f.opts.map(o => [o, o || '—'])} onChange={v => setP(i, f.k, v)}/>
                  : <Field label={f.l} type={f.t || 'text'} ph={f.ph} value={p[f.k]} onChange={v => setP(i, f.k, v)}/>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <Btn small outline onClick={() => setList(prev => [...prev, novoPax()])}><Plus size={12}/> Adicionar passageiro</Btn>
        {!compact && list.length > 1 && <Btn small outline onClick={() => copiar(list.map(paxTexto).join('\n\n'), 'all')}>
          <Copy size={12}/> {copied === 'all' ? 'Copiado!' : 'Copiar todos'}</Btn>}
      </div>
    </div>
  )
}

/* ─── Visão geral: dados, viajantes, próxima ação, histórico ── */
function Geral({ a, set, onChange }) {
  const aereo = a.aereo || []
  const milhas = aereo.reduce((s, v) => s + (Number(v.milhas) || 0), 0)
  const taxas  = aereo.reduce((s, v) => s + (Number(v.taxas) || 0), 0)
  const custos = CUSTOS.reduce((s, k) => s + (a[k] || []).reduce((t, i) => t + (Number(i.valor) || 0), 0), 0) + taxas

  return (
    <div style={{ display:'grid', gap:14 }}>
      <Card>
        <div style={{ fontWeight:700, marginBottom:12 }}>🎯 Próxima ação</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 170px', gap:10 }}>
          <Field value={a.proxima_acao} onChange={v => set('proxima_acao', v)} ph="Ex.: enviar opções de voo"/>
          <Field type="date" value={a.proxima_data} onChange={v => set('proxima_data', v)}/>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
        {[['Valor da assessoria', fmtR(a.valor), T.gold], ['Milhas utilizadas', milhas.toLocaleString('pt-BR'), T.info],
          ['Taxas de emissão', fmtR(taxas), T.warn], ['Custos lançados', fmtR(custos), T.muted]].map(([l, v, c]) => (
          <Card key={l} style={{ padding:14 }}>
            <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{l}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontWeight:700, marginBottom:12 }}>📁 Dados da assessoria</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:10 }}>
          <Field label="Cliente" value={a.cliente} onChange={v => set('cliente', v)}/>
          <Field label="WhatsApp" value={a.phone} onChange={v => set('phone', v)} ph="11999999999"/>
          <Field label="E-mail" value={a.email} onChange={v => set('email', v)}/>
          <CityPicker label="Origem" value={a.origem} onChange={v => set('origem', v)} groups={ORIGENS_BR} ph="Cidade de saída"/>
          <div style={{ gridColumn:'span 2' }}><CityPicker multi label="Cidades de destino" value={cidadesDe(a)} groups={DESTINOS} ph="Escolha as cidades"
            onChange={v => onChange(x => ({ ...x, cidades:v, destino:v.join(', ') }))}/></div>
          <Field label="Ida" type="date" value={a.inicio} onChange={v => set('inicio', v)}/>
          <Field label="Volta" type="date" value={a.fim} onChange={v => set('fim', v)}/>
          <Field label="Nº de viajantes" type="number" value={a.viajantes} onChange={v => set('viajantes', v)}/>
          <Field label="Responsável" value={a.responsavel} onChange={v => set('responsavel', v)} list="ass-resp"/>
          <Field label="Contratado em" type="date" value={a.contratado_em} onChange={v => set('contratado_em', v)}/>
          <Field label="Valor da assessoria (R$)" type="number" value={a.valor} onChange={v => set('valor', v)}/>
        </div>
        <datalist id="ass-resp"><option value="Joseph"/></datalist>
      </Card>


      <Card>
        <div style={{ fontWeight:700, marginBottom:10 }}>🕓 Histórico</div>
        {(a.log || []).slice(0, 15).map((l, i) => (
          <div key={i} style={{ display:'flex', gap:10, fontSize:12, padding:'5px 0', borderBottom:T.borderN }}>
            <span style={{ color:T.muted, whiteSpace:'nowrap' }}>{new Date(l.t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
            <span>{l.msg}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

const IconDel = ({ onClick }) => (
  <button onClick={onClick} title="Remover" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
    color:T.err, borderRadius:8, cursor:'pointer', height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <X size={14}/>
  </button>
)

/* ─── Painel de uma etapa ────────────────────────────── */
function StepPanel({ s, a, onChange }) {
  const p = progress(a, s)
  const na = !!a.na?.[s.k]
  return (
    <div style={{ display:'grid', gap:14 }}>
      <Card style={{ borderTop:`3px solid ${s.color}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>{s.icon} {s.name}</div>
            {s.goal && <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Objetivo: {s.goal}</div>}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.muted, cursor:'pointer' }}>
            <input type="checkbox" checked={na} onChange={e => onChange(x => ({ ...x, na:{ ...(x.na || {}), [s.k]: e.target.checked } }))}/>
            Não se aplica a esta viagem
          </label>
        </div>
        {!na && <div style={{ marginTop:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
            <span style={{ color:T.muted }}>{s.kind === 'items' ? `${p.done}/${p.total} ${s.unit}` : `${p.done}/${p.total} itens do checklist`}</span>
            <span style={{ color:s.color, fontWeight:700 }}>{Math.round(p.pct * 100)}%</span>
          </div>
          <Bar pct={p.pct} color={s.color}/>
        </div>}
      </Card>

      {!na && s.dayByDay && <DiaADia a={a} onChange={onChange}/>}
      {!na && (s.kind === 'check' ? <Checklist s={s} a={a} onChange={onChange}/> : <Items s={s} a={a} onChange={onChange}/>)}

      {!na && s.out && (
        <div style={{ fontSize:12, color:p.complete ? T.success : T.muted, display:'flex', gap:6, alignItems:'center' }}>
          <CheckCircle2 size={14}/> Saída da etapa: {s.out}
        </div>
      )}

      <Card>
        <div style={{ fontWeight:700, marginBottom:8 }}>📝 Anotações da etapa</div>
        <textarea value={a.notas?.[s.k] || ''} rows={3} placeholder="Briefing, decisões, combinados com o cliente…"
          onChange={e => onChange(x => ({ ...x, notas:{ ...(x.notas || {}), [s.k]: e.target.value } }))}
          style={{ ...inputS, resize:'vertical' }}/>
      </Card>

      <Templates s={s} a={a}/>
    </div>
  )
}

/* Roteiro final: programação de cada dia */
function DiaADia({ a, onChange }) {
  const dias = a.roteiro_dias || []
  const setDia = (i, k, v) => onChange(x => ({ ...x, roteiro_dias: x.roteiro_dias.map((d, j) => j === i ? { ...d, [k]: v } : d) }))
  const add = () => onChange(x => ({ ...x, roteiro_dias:[...(x.roteiro_dias || []), { id:uid(), data:'', cidade:'', programacao:'' }] }))
  const gerar = () => {
    if (!a.inicio || !a.fim) return window.alert('Preencha as datas de ida e volta em "Visão geral" primeiro.')
    const out = []
    for (let d = new Date(`${a.inicio}T12:00`); d <= new Date(`${a.fim}T12:00`); d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10)
      out.push(dias.find(x => x.data === iso) || { id:uid(), data:iso, cidade:cidadeDe(iso), programacao:'' })
    }
    onChange(x => ({ ...x, roteiro_dias: out }))
  }
  const cidadeDe = iso => (a.hotel || []).find(h => h.checkin && h.checkin <= iso && (!h.checkout || iso < h.checkout))?.cidade || ''
  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <div style={{ fontWeight:700 }}>🗓️ Roteiro dia a dia</div>
        <div style={{ display:'flex', gap:6 }}>
          <Btn small outline onClick={gerar}><Calendar size={12}/> Gerar dias pelas datas</Btn>
          <Btn small outline onClick={add}><Plus size={12}/> Dia</Btn>
        </div>
      </div>
      {dias.length === 0 && <div style={{ fontSize:12, color:T.muted }}>Clique em "Gerar dias pelas datas" para criar um dia para cada data da viagem — a cidade vem das hospedagens cadastradas.</div>}
      {dias.map((d, i) => (
        <div key={d.id} className="ass-dia" style={{ display:'grid', gridTemplateColumns:'64px 150px 1fr 34px', gap:8, marginBottom:8, alignItems:'start' }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.gold, paddingTop:8 }}>Dia {i + 1}</div>
          <div style={{ display:'grid', gap:6 }}>
            <Field type="date" value={d.data} onChange={v => setDia(i, 'data', v)}/>
            <Field value={d.cidade} ph="Cidade" onChange={v => setDia(i, 'cidade', v)} list="ass-cidades"/>
          </div>
          <textarea value={d.programacao} rows={3} placeholder="Manhã: …  Tarde: …  Noite: …"
            onChange={e => setDia(i, 'programacao', e.target.value)} style={{ ...inputS, resize:'vertical' }}/>
          <IconDel onClick={() => onChange(x => ({ ...x, roteiro_dias: x.roteiro_dias.filter((_, j) => j !== i) }))}/>
        </div>
      ))}
      <style>{`@media (max-width: 760px) { .ass-dia { grid-template-columns: 1fr !important; } }`}</style>
    </Card>
  )
}

function Checklist({ s, a, onChange }) {
  const checks = a.checks?.[s.k] || {}
  const toggle = c => onChange(x => ({ ...x, checks:{ ...(x.checks || {}), [s.k]:{ ...(x.checks?.[s.k] || {}), [c]: !x.checks?.[s.k]?.[c] } } }))
  return (
    <Card>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:6 }}>
        {s.checks.map(c => (
          <label key={c} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer',
            background:checks[c] ? `${s.color}14` : 'rgba(255,255,255,0.03)', border:`1px solid ${checks[c] ? `${s.color}40` : 'rgba(255,255,255,0.06)'}` }}>
            <input type="checkbox" checked={!!checks[c]} onChange={() => toggle(c)} style={{ accentColor:s.color, width:15, height:15 }}/>
            <span style={{ fontSize:13, color:checks[c] ? T.text : T.muted, textDecoration:checks[c] ? 'none' : 'none' }}>{c}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

function Items({ s, a, onChange }) {
  const items = a[s.k] || []
  const setItem = (i, k, v) => onChange(x => ({ ...x, [s.k]: x[s.k].map((it, j) => j === i ? { ...it, [k]: v } : it) }))
  const add = () => onChange(x => ({ ...x, [s.k]: [...(x[s.k] || []), { id:uid(), ...s.blank }] }))
  const del = i => { if (window.confirm('Remover este item?')) onChange(x => ({ ...x, [s.k]: x[s.k].filter((_, j) => j !== i) })) }

  return (
    <div style={{ display:'grid', gap:10 }}>
      {items.map((it, i) => {
        const done = s.done.includes(it.status)
        const stIdx = s.statuses.indexOf(it.status)
        return (
          <Card key={it.id} style={{ padding:14, borderLeft:`3px solid ${done ? T.success : s.color}` }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
              {s.statuses.map((st, j) => (
                <button key={st} onClick={() => setItem(i, 'status', st)}
                  style={{ fontSize:11, padding:'4px 10px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontWeight:600,
                    background:j <= stIdx ? `${s.done.includes(st) ? T.success : s.color}22` : 'transparent',
                    color:j <= stIdx ? (s.done.includes(st) ? T.success : s.color) : T.muted,
                    border:`1px solid ${j === stIdx ? (s.done.includes(st) ? T.success : s.color) : 'rgba(255,255,255,0.1)'}` }}>
                  {st}
                </button>
              ))}
              <span style={{ flex:1 }}/>
              {it.link && <a href={it.link} target="_blank" rel="noreferrer" style={{ color:T.gold, fontSize:12, display:'inline-flex', gap:4, alignItems:'center' }}>
                <ExternalLink size={12}/> abrir</a>}
              <button onClick={() => del(i)} title="Remover" style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}><Trash2 size={14}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
              {s.fields.map(f => (
                <div key={f.k} style={{ gridColumn:f.w ? `span ${f.w}` : undefined }}>
                  {f.t === 'select' ? <Select label={f.l} value={it[f.k]} opts={f.opts} onChange={v => setItem(i, f.k, v)}/>
                    : f.t === 'check' ? (
                      <div><Label>{f.l}</Label>
                        <label style={{ ...inputS, display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}>
                          <input type="checkbox" checked={!!it[f.k]} onChange={e => setItem(i, f.k, e.target.checked)}/> {it[f.k] ? 'Incluso' : 'Não incluso'}
                        </label></div>)
                    : <Field label={f.l} type={f.t || 'text'} ph={f.ph} value={it[f.k]} onChange={v => setItem(i, f.k, v)} list={f.k === 'cidade' ? 'ass-cidades' : undefined}/>}
                </div>
              ))}
            </div>
          </Card>
        )
      })}
      <div><Btn outline small onClick={add}><Plus size={13}/> Adicionar {s.add || 'item'}</Btn></div>
      {s.k === 'aereo' && items.length > 0 && (
        <div style={{ fontSize:12, color:T.muted }}>
          <Plane size={12} style={{ verticalAlign:-2 }}/> Total: {items.reduce((t, v) => t + (Number(v.milhas) || 0), 0).toLocaleString('pt-BR')} milhas
          · {fmtR(items.reduce((t, v) => t + (Number(v.taxas) || 0), 0))} em taxas
          · {fmtR(items.reduce((t, v) => t + (Number(v.valor) || 0), 0))} pagante
        </div>
      )}
    </div>
  )
}

/* ─── Templates da etapa ─────────────────────────────── */
function Templates({ s, a }) {
  const [sel, setSel] = useState(null)
  const [copied, setCopied] = useState(false)
  const list = TEMPLATES[s.k] || []
  const text = useMemo(() => (sel !== null ? fillTemplate(list[sel][1], a) : ''), [sel, a, list])
  const [draft, setDraft] = useState('')
  useEffect(() => { setDraft(text) }, [text])
  useEffect(() => { setSel(null) }, [s.k])
  if (!list.length) return null

  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <Card>
      <div style={{ fontWeight:700, marginBottom:10 }}>📋 Templates da etapa</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {list.map(([name], i) => (
          <button key={name} onClick={() => setSel(sel === i ? null : i)}
            style={{ fontSize:12, padding:'6px 12px', borderRadius:20, cursor:'pointer', fontFamily:'inherit',
              background:sel === i ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
              color:sel === i ? T.gold : T.text, border:sel === i ? T.border : T.borderN }}>{name}</button>
        ))}
      </div>
      {sel !== null && (
        <div style={{ marginTop:12 }}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={7} style={{ ...inputS, resize:'vertical', lineHeight:1.5 }}/>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <Btn small outline onClick={copy}><Copy size={12}/> {copied ? 'Copiado!' : 'Copiar'}</Btn>
            <a href={waText(a.phone, draft)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
              <Btn small><MessageCircle size={12}/> Enviar no WhatsApp</Btn>
            </a>
            {!a.phone && <span style={{ fontSize:11, color:T.muted, alignSelf:'center' }}>Sem WhatsApp cadastrado — o WhatsApp vai pedir o contato.</span>}
          </div>
        </div>
      )}
    </Card>
  )
}

/* ─── Modal: nova assessoria ─────────────────────────── */
function NewModal({ onClose, onSave }) {
  const [f, setF] = useState({ cliente:'', phone:'', email:'', origem:'', destino:'', cidades:[], inicio:'', fim:'', viajantes:'', responsavel:'Joseph', contratado_em:todayISO(), valor:'', passageiros:[] })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => { setBusy(true); await onSave(f); setBusy(false) }
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} className="crm-scroll"
        style={{ background:T.card, borderRadius:14, padding:24, width:680, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', border:T.border }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:700 }}>🧳 Nova assessoria</div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}><X size={20}/></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ gridColumn:'span 2' }}><Field label="Cliente *" value={f.cliente} onChange={v => set('cliente', v)} ph="João e Família"/></div>
          <Field label="WhatsApp" value={f.phone} onChange={v => set('phone', v)} ph="11999999999"/>
          <Field label="E-mail" value={f.email} onChange={v => set('email', v)}/>
          <div style={{ gridColumn:'span 2' }}><CityPicker label="Origem" value={f.origem} onChange={v => set('origem', v)} groups={ORIGENS_BR} ph="Cidade de saída — ex.: Brasília"/></div>
          <div style={{ gridColumn:'span 2' }}><CityPicker multi label="Cidades de destino" value={f.cidades} groups={DESTINOS} ph="Digite e escolha as cidades — ex.: Lisboa, Paris, Roma"
            onChange={v => setF(p => ({ ...p, cidades:v, destino:v.join(', ') }))}/></div>
          <Field label="Ida" type="date" value={f.inicio} onChange={v => set('inicio', v)}/>
          <Field label="Volta" type="date" value={f.fim} onChange={v => set('fim', v)}/>
          <Field label="Nº de viajantes" type="number" value={f.viajantes} onChange={v => set('viajantes', v)}/>
          <Field label="Responsável" value={f.responsavel} onChange={v => set('responsavel', v)} list="ass-resp-new"/>
          <Field label="Data de contratação" type="date" value={f.contratado_em} onChange={v => set('contratado_em', v)}/>
          <Field label="Valor da assessoria (R$)" type="number" value={f.valor} onChange={v => set('valor', v)}/>
          <datalist id="ass-resp-new"><option value="Joseph"/></datalist>
        </div>
        <div style={{ marginTop:18, paddingTop:14, borderTop:T.borderN }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>🛂 Passageiros</div>
          <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>Opcional agora — dá para completar depois na ficha.</div>
          <Passageiros compact list={f.passageiros} setList={fn => setF(p => ({ ...p, passageiros: fn(p.passageiros) }))}/>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:18 }}>
          <Btn outline onClick={onClose}>Cancelar</Btn>
          <Btn onClick={save} disabled={!f.cliente.trim() || busy}>{busy ? 'Criando…' : 'Criar assessoria'}</Btn>
        </div>
      </div>
    </div>
  )
}
