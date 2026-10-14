/**
 * Next Plane CRM — Gestão de Assessorias
 * Cada viagem contratada vira uma ficha com 9 etapas operacionais,
 * checklists, itens (aéreo, hotéis, seguro, ingressos e trem, internet), roteiro dia a dia, alertas e templates.
 * Dados: "Só neste navegador" (localStorage) ou "Nuvem" (/api/assessorias).
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus, X, Search, ArrowLeft, Trash2, MessageCircle, Copy, AlertTriangle,
  Calendar, Users, Plane, CheckCircle2, ExternalLink, Link2, Paperclip, FileText,
  Handshake, Compass, BedDouble, ShieldCheck, Ticket, Wifi, CalendarDays, PhoneCall, TrainFront, Car, Ban, RotateCcw,
  Circle, MinusCircle, Target, FolderOpen, History, NotebookPen, MessageSquareText, Briefcase,
  LayoutList, User, Settings,
} from 'lucide-react'
import {
  fetchAssessorias, createAssessoria, saveAssessoria, removeAssessoria, waText, portalLink,
  uploadAnexo, removeAnexo, anexoUrl, MAX_ANEXO,
} from '../../lib/assessoriasApi'
import { ORIGENS_BR, DESTINOS, AEROPORTOS, CIAS } from './cidades'

/* ─── Design system compartilhado com o CRM (crm/ui.jsx) ─ */
import {
  T, num, inputS, Badge, Dot, Card, CardTitle, Btn, IconBtn, Label, Field, Select, Bar,
  PageHeader, Kpi, KpiGrid, th, td, Empty, Modal,
} from './ui'

/* Ícone de linha de cada etapa (a interface do CRM não usa emoji; o link do cliente usa s.icon) */
const STEP_ICON = {
  onboarding:Handshake, rota:Compass, aereo:Plane, hotel:BedDouble, seguro:ShieldCheck,
  exp:Ticket, internet:Wifi, roteiro:CalendarDays, previagem:Users, trem:TrainFront, aluguel:Car,
}

/* ─── Etapas ─────────────────────────────────────────── */
const AEREO_ST    = ['Pendente','Em pesquisa','Opções enviadas','Aguardando cliente','Emitido']
const HOTEL_ST    = ['Pendente','Cotado','Aguardando cliente','Reservado','Voucher anexado']
const SEGURO_ST   = ['Pendente','Cotado','Aguardando cliente','Contratado','Apólice enviada']
const EXP_ST      = ['Definido','Cotado','Aprovado','Comprado','Voucher anexado']
const INTERNET_ST = ['Pendente','Cotado','Comprado','Enviado ao cliente']
const TREM_ST     = ['Pendente','Cotado','Aguardando cliente','Comprado','Bilhete anexado']
const ALUGUEL_ST  = ['Pendente','Cotado','Aguardando cliente','Reservado','Voucher anexado']

const STEPS = [
  { k:'onboarding', icon:'🟡', name:'Onboarding', short:'Onboarding', color:'#F59E0B', kind:'check',
    goal:'Entender completamente a viagem.', out:'Briefing completo para começar a montar a viagem.',
    checks:['Reunião realizada','Perfil dos viajantes','Objetivo da viagem','Orçamento','Datas','Destinos desejados','Preferências','Restrições','Documentos e dados dos viajantes'] },
  { k:'rota', icon:'🧭', name:'Definição de roteiro prévio', short:'Roteiro prévio', color:'#8B5CF6', kind:'check',
    goal:'Estruturar a viagem antes das emissões.', out:'Roteiro prévio aprovado pelo cliente.',
    checks:['Destinos definidos','Ordem dos destinos','Datas aproximadas','Deslocamentos entre cidades','Tempo em cada destino','Roteiro prévio aprovado pelo cliente'] },
  { k:'aereo', icon:'✈️', name:'Emissão de passagem aérea', short:'Aéreo', color:'#3B82F6', kind:'items', unit:'trechos emitidos', add:'trecho',
    statuses:AEREO_ST, done:['Emitido'], blank:{ tipo:'Só ida', de:'', para:'', data:'', cia:'', voo:'', horario:'', data_volta:'', voo_volta:'', horario_volta:'', valor:'', localizador:'', link:'', status:'Pendente' },
    fields:[
      { k:'de', l:'Origem', t:'airport', ph:'Aeroporto ou sigla — ex.: BSB', w:2 }, { k:'para', l:'Destino', t:'airport', ph:'Aeroporto ou sigla — ex.: LIS', w:2 },
      { k:'data', l:'Data', lIda:'Data da ida', t:'date' }, { k:'cia', l:'Companhia aérea', t:'airline', ph:'Companhia ou sigla — ex.: TAP, TP', w:2 },
      { k:'voo', l:'Nº do voo', lIda:'Nº do voo (ida)', ph:'TP 88' }, { k:'horario', l:'Horário', lIda:'Horário (ida)', t:'time' },
      { k:'_volta', sep:'⇄ Volta', volta:true },
      { k:'data_volta', l:'Data da volta', t:'date', volta:true }, { k:'voo_volta', l:'Nº do voo (volta)', ph:'TP 87', volta:true },
      { k:'horario_volta', l:'Horário (volta)', t:'time', volta:true },
      { k:'_fim_volta', sep:' ', volta:true },
      { k:'valor', l:'Valor R$', t:'number' },
      { k:'localizador', l:'Localizador', ph:'ABC123' }, { k:'link', l:'Bilhete (link)', ph:'https://', w:2 },
    ] },
  { k:'trem', icon:'🚆', name:'Trem', short:'Trem', color:'#14B8A6', kind:'items', unit:'trechos comprados', add:'trecho de trem',
    statuses:TREM_ST, done:['Comprado','Bilhete anexado'], blank:{ tipo:'Trem', de:'', para:'', data:'', hora:'', empresa:'', classe:'', passageiros:'', valor:'', reserva:'', link:'', status:'Pendente' },
    fields:[
      { k:'tipo', l:'Tipo', t:'select', opts:['Trem','Ônibus','Ferry / barco','Transfer'] },
      { k:'de', l:'Saída (cidade / estação)', ph:'Paris — Gare du Nord', w:2 }, { k:'para', l:'Chegada (cidade / estação)', ph:'Londres — St Pancras', w:2 },
      { k:'data', l:'Data', t:'date' }, { k:'hora', l:'Horário', t:'time' },
      { k:'empresa', l:'Empresa', ph:'Eurostar, Trenitalia, Renfe…' }, { k:'classe', l:'Classe', ph:'Standard, 1ª classe…' },
      { k:'passageiros', l:'Pessoas', t:'number' }, { k:'valor', l:'Valor R$', t:'number' }, { k:'reserva', l:'Nº reserva' }, { k:'link', l:'Bilhete (link)', ph:'https://', w:2 },
    ] },
  { k:'aluguel', icon:'🚗', name:'Aluguel de carro ou moto', short:'Aluguel de veículo', color:'#64748B', kind:'items', unit:'reservados', add:'aluguel',
    statuses:ALUGUEL_ST, done:['Reservado','Voucher anexado'], blank:{ tipo:'Carro', locadora:'', categoria:'', retirada_local:'', retirada_data:'', retirada_hora:'', devolucao_local:'', devolucao_data:'', devolucao_hora:'', seguro:'', valor:'', reserva:'', link:'', status:'Pendente' },
    fields:[
      { k:'tipo', l:'Veículo', t:'select', opts:['Carro','Moto','Van','Motorhome'] },
      { k:'locadora', l:'Locadora', ph:'Localiza, Hertz, Europcar…' }, { k:'categoria', l:'Modelo / categoria', ph:'SUV automático', w:2 },
      { k:'_ret', sep:'Retirada' },
      { k:'retirada_local', l:'Local de retirada', ph:'Aeroporto de Lisboa', w:2 }, { k:'retirada_data', l:'Data', t:'date' }, { k:'retirada_hora', l:'Horário', t:'time' },
      { k:'_dev', sep:'Devolução' },
      { k:'devolucao_local', l:'Local de devolução', ph:'Porto — centro', w:2 }, { k:'devolucao_data', l:'Data', t:'date' }, { k:'devolucao_hora', l:'Horário', t:'time' },
      { k:'_fim', sep:' ' },
      { k:'seguro', l:'Seguro / proteção', ph:'Cobertura total' }, { k:'valor', l:'Valor R$', t:'number' }, { k:'reserva', l:'Nº reserva' }, { k:'link', l:'Voucher (link)', ph:'https://', w:2 },
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
  { k:'exp', icon:'🎟️', name:'Ingressos e passeios', short:'Ingressos', color:'#EC4899', kind:'items', unit:'comprados', add:'ingresso ou passeio',
    statuses:EXP_ST, done:['Comprado','Voucher anexado'], blank:{ tipo:'Ingresso', nome:'', cidade:'', data:'', hora:'', passageiros:'', valor:'', reserva:'', link:'', status:'Definido' },
    fields:[
      { k:'tipo', l:'Tipo', t:'select', opts:['Ingresso','Passeio','Tour','Museu','Parque','Evento','Show','Restaurante','Outro'] },
      { k:'nome', l:'Nome', ph:'Museu do Louvre', w:2 }, { k:'cidade', l:'Cidade' }, { k:'data', l:'Data', t:'date' }, { k:'hora', l:'Horário', t:'time' },
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
  { k:'previagem', icon:'🤝', name:'Reunião final — alinhamentos antes da viagem', short:'Reunião final', color:'#F97316', kind:'check',
    goal:'Alinhar tudo com o cliente antes do embarque.', out:'Cliente pronto para viajar.',
    checks:['Reunião agendada','Roteiro final revisado com o cliente','Voos e check-in','Trens e aluguel de veículo conferidos','Hospedagens conferidas','Seguro viagem conferido','Ingressos conferidos','Internet / eSIM pronto','Documentação (passaporte / visto)','Bagagem e clima','Dinheiro e cartões','Dúvidas do cliente','Reunião realizada'] },
]
const STEP = Object.fromEntries(STEPS.map(s => [s.k, s]))
const EMISSAO = ['aereo','trem','aluguel','hotel','seguro','exp','internet']
const CUSTOS  = ['aereo','trem','aluguel','hotel','seguro','exp','internet']

/* Fichas criadas na versão anterior: transportes passam para "Ingressos e trem" */
const TRANSP_MAP = { 'Pendente':'Definido', 'Cotado':'Cotado', 'Aguardando cliente':'Aprovado', 'Reservado':'Comprado', 'Voucher anexado':'Voucher anexado' }
/* "lis" → "Lisboa (LIS)" quando a sigla está na lista */
const aeroporto = x => { const up = String(x || '').trim().toUpperCase(); if (!up) return ''; const hit = AEROPORTOS.flatMap(g => g.cidades).find(c => c.nome.endsWith(`(${up})`)); return hit ? hit.nome : up }
const semAc = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const ciaDe = x => {
  const t = semAc(x); if (!t || /\([a-z0-9]{2}\)$/.test(t)) return x || ''
  const hit = CIAS.flatMap(g => g.cidades).find(c => semAc(c.nome).endsWith(`(${t})`) || semAc(c.nome).startsWith(t))
  return hit ? hit.nome : x
}
const idaVolta = v => v.tipo === 'Ida e volta'
const trechoDe = v => (v.de || v.para ? `${v.de || '?'} ${idaVolta(v) ? '⇄' : '→'} ${v.para || '?'}` : v.trecho || '')
const migrate = a => {
  // trechos antigos em texto livre ("GRU → LIS") viram origem/destino
  // e companhia em texto livre ("tap") vira a companhia da lista
  if ((a.aereo || []).some(v => (v.trecho && !v.de && !v.para) || (v.cia && ciaDe(v.cia) !== v.cia))) a = { ...a, aereo: a.aereo.map(v => {
    let out = { ...v, cia: ciaDe(v.cia) }
    if (v.trecho && !v.de && !v.para) {
      const [de = '', para = ''] = v.trecho.split(/\s*(?:→|->|-|\/|>)\s*/)
      out = { ...out, de: aeroporto(de), para: aeroporto(para) }
    }
    return out
  }) }
  if (a.transp?.length) {
    const moved = a.transp.map(t => ({ id:t.id, tipo:['Trem','Ônibus','Transfer'].includes(t.tipo) ? t.tipo : 'Outro',
      nome:[t.origem, t.destino].filter(Boolean).join(' → '), cidade:'', data:t.data || '', hora:t.hora || '',
      passageiros:t.passageiros || '', valor:t.valor || '', reserva:t.reserva || '', link:t.link || '', status:TRANSP_MAP[t.status] || 'Definido' }))
    a = { ...a, exp:[...(a.exp || []), ...moved], transp:[] }
  }
  const TERRESTRE = ['Trem','Ônibus','Transfer']
  if ((a.exp || []).some(x => TERRESTRE.includes(x.tipo))) {
    const vira = x => {
      const [de = '', para = ''] = String(x.nome || '').split(/\s*(?:→|->|>)\s*/)
      return { id:x.id, tipo:x.tipo, de, para, data:x.data || '', hora:x.hora || '', empresa:'', classe:'', passageiros:x.passageiros || '',
        valor:x.valor || '', reserva:x.reserva || '', link:x.link || '', anexos:x.anexos || [], status:EXP_TREM[x.status] || 'Pendente' }
    }
    a = { ...a, trem:[...(a.trem || []), ...a.exp.filter(x => TERRESTRE.includes(x.tipo)).map(vira)], exp:a.exp.filter(x => !TERRESTRE.includes(x.tipo)) }
  }
  const ch = a.checks?.previagem
  if (ch && ('Call agendada' in ch || 'Call realizada' in ch || 'Ingressos e trens conferidos' in ch)) {
    const { 'Call agendada':ag, 'Call realizada':re, 'Ingressos e trens conferidos':ing, ...resto } = ch
    a = { ...a, checks:{ ...a.checks, previagem:{ ...resto, 'Reunião agendada':!!ag, 'Reunião realizada':!!re, 'Ingressos conferidos':!!ing } } }
  }
  return a
}
const EXP_TREM = { 'Definido':'Pendente', 'Cotado':'Cotado', 'Aprovado':'Aguardando cliente', 'Comprado':'Comprado', 'Voucher anexado':'Bilhete anexado' }

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
    ['Envio de opções', '{primeiro_nome}, separei as melhores opções de voo para {destino}:\n\n[opções]\n\nQual delas prefere? As tarifas podem mudar, então o ideal é aprovar o quanto antes.'],
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
  trem: [
    ['Opções de trem', '{primeiro_nome}, separei as opções de trem para os deslocamentos entre as cidades:\n\n[opções]\n\nQuais horários preferem?'],
    ['Confirmação de trens', '{primeiro_nome}, trens reservados ✅ Os bilhetes já estão organizados por data. Chegue à estação com 20 a 30 minutos de antecedência.'],
  ],
  aluguel: [
    ['Opções de aluguel', '{primeiro_nome}, separei as opções de aluguel de veículo:\n\n[opções]\n\nLembre que na Europa muitas locadoras pedem a CNH + PID (Permissão Internacional para Dirigir) e cartão de crédito no nome do motorista.'],
    ['Confirmação do aluguel', '{primeiro_nome}, aluguel reservado ✅ Na retirada leve CNH, PID, passaporte e o cartão de crédito usado na reserva. O voucher já está salvo para a viagem.'],
  ],
  exp: [
    ['Sugestões de ingressos', '{primeiro_nome}, separei algumas experiências que combinam com o perfil de vocês em {destino}:\n\n[sugestões]\n\nQuais querem incluir?'],
    ['Confirmação de ingressos', '{primeiro_nome}, ingressos comprados ✅ Os vouchers já estão organizados para a viagem.'],
  ],
  internet: [
    ['Orientação de eSIM', '{primeiro_nome}, seu eSIM para {destino} está pronto 📶\n\n1. Confira se o celular aceita eSIM\n2. Instale pelo QR code ainda no Brasil, com Wi-Fi\n3. Só ative a linha ao chegar\n4. Ligue o roaming de dados no eSIM\n\nQualquer dúvida me chama!'],
  ],
  roteiro: [
    ['Envio do roteiro final', '{primeiro_nome}, segue o roteiro dia a dia da sua viagem para {destino} 🗓️\n\n{roteiro}\n\nMe diga se quer ajustar algo!'],
  ],
  previagem: [
    ['Agendar reunião final', '{primeiro_nome}, faltam {dias} dias para a viagem! Vamos marcar nossa reunião final de alinhamentos para revisar roteiro, documentos, seguro, internet e bagagem? Me diga o melhor horário.'],
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
const addDays = (d, n) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
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
/* Situação da etapa: cor do segmento/ícone e texto (sem emoji) */
const situacao = p => (p.na ? { c:'transparent', l:'não se aplica' } : p.complete ? { c:T.success, l:'concluída' }
  : p.pct > 0 ? { c:T.gold, l:'em andamento' } : { c:'rgba(255,255,255,0.12)', l:'não iniciada' })
const StatusIcon = ({ p, current }) => {
  if (p.na) return <MinusCircle size={16} color={T.faint} strokeWidth={1.8}/>
  if (p.complete) return <CheckCircle2 size={16} color={T.success} strokeWidth={2}/>
  const c = current ? T.gold : p.pct > 0 ? T.gold : T.faint
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.6"/>
      {p.pct > 0 && <circle cx="8" cy="8" r="6.5" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"
        strokeDasharray={`${p.pct * 40.8} 40.8`} transform="rotate(-90 8 8)"/>}
      {current && <circle cx="8" cy="8" r="2.4" fill={T.gold}/>}
    </svg>
  )
}
/* Trilha de progresso das 9 etapas (lista de assessorias) */
const StepTrack = ({ a }) => (
  <div style={{ display:'flex', gap:3 }} title={STEPS.map(s => `${s.short}: ${situacao(progress(a, s)).l}`).join('\n')}>
    {STEPS.map(s => {
      const p = progress(a, s)
      return <span key={s.k} style={{ width:14, height:6, borderRadius:2, background:situacao(p).c,
        border:p.na ? `1px dashed ${T.lineStrong}` : 'none' }}/>
    })}
  </div>
)
const currentStep = a => STEPS.find(s => !progress(a, s).complete) || null

function alertas(a) {
  if (!ATIVA(a)) return []
  const out = []
  const dias = daysTo(a.inicio)
  const pend = EMISSAO.filter(k => !progress(a, STEP[k]).complete)
  if (dias !== null && dias >= 0 && dias <= 30 && pend.length)
    out.push(`Embarque em ${dias}d com pendências: ${pend.map(k => STEP[k].short).join(', ')}`)
  if (dias !== null && dias >= 0 && dias <= 7 && !progress(a, STEP.previagem).complete)
    out.push('Reunião final ainda não realizada')
  const volta = a.fim || a.inicio
  if (volta) (a.passageiros || []).forEach(p => {
    if (p.passaporte && p.passaporte < addMonths(volta, 6))
      out.push(`Passaporte de ${p.nome || 'viajante'} vence em menos de 6 meses após a volta`)
  })
  if (a.proxima_data && a.proxima_data < todayISO()) out.push('Próxima ação atrasada')
  if (a.fim && daysTo(a.fim) < 0) out.push('Viagem terminou — marque a assessoria como concluída')
  return out
}

/* ─── Link do cliente: só o que ele pode ver (o servidor filtra de novo) ── */
const fmtDA = d => (d ? d.split('-').reverse().join('/') : '')
const quando = (d, h, voo) => [fmtDA(d), h, voo].filter(Boolean).join(' · ')
/* O que aparece para o cliente em cada item (nunca valores) */
const detalhe = (k, it) => ({
  aereo: () => ({ titulo:trechoDe(it) || 'Voo', sub:ciaDe(it.cia), campos: idaVolta(it)
    ? [{ l:'Ida', v:quando(it.data, it.horario, it.voo) }, { l:'Volta', v:quando(it.data_volta, it.horario_volta, it.voo_volta) }, { l:'Localizador', v:it.localizador }]
    : [{ l:'Data', v:quando(it.data, it.horario) }, { l:'Voo', v:it.voo }, { l:'Localizador', v:it.localizador }] }),
  hotel: () => ({ titulo:it.hotel || 'Hospedagem', sub:it.cidade, campos:[
    { l:'Check-in', v:fmtDA(it.checkin) }, { l:'Check-out', v:fmtDA(it.checkout) }, { l:'Quarto', v:it.quarto },
    { l:'Café da manhã', v:it.hotel ? (it.cafe ? 'Incluso' : 'Não incluso') : '' }, { l:'Cancelamento', v:it.cancelamento }, { l:'Nº da reserva', v:it.confirmacao }] }),
  seguro: () => ({ titulo:it.seguradora || 'Seguro viagem', sub:it.plano, campos:[
    { l:'Cobertura médica', v:it.cobertura }, { l:'Vigência', v:it.inicio ? `${fmtDA(it.inicio)}${it.fim ? ` a ${fmtDA(it.fim)}` : ''}` : '' },
    { l:'Viajantes', v:it.viajantes }, { l:'Nº da apólice', v:it.apolice }] }),
  trem: () => ({ titulo:(it.de || it.para) ? `${it.de || '?'} → ${it.para || '?'}` : (it.tipo || 'Trem'), sub:[it.tipo, it.empresa, it.classe].filter(Boolean).join(' · '), campos:[
    { l:'Data', v:quando(it.data, it.hora) }, { l:'Pessoas', v:it.passageiros }, { l:'Nº da reserva', v:it.reserva }] }),
  aluguel: () => ({ titulo:[it.tipo, it.categoria].filter(Boolean).join(' · ') || 'Aluguel de veículo', sub:it.locadora, campos:[
    { l:'Retirada', v:[it.retirada_local, quando(it.retirada_data, it.retirada_hora)].filter(Boolean).join(' · ') },
    { l:'Devolução', v:[it.devolucao_local, quando(it.devolucao_data, it.devolucao_hora)].filter(Boolean).join(' · ') },
    { l:'Proteção', v:it.seguro }, { l:'Nº da reserva', v:it.reserva }] }),
  exp: () => ({ titulo:it.nome || it.tipo || 'Ingresso', sub:[it.tipo, it.cidade].filter(Boolean).join(' · '), campos:[
    { l:'Data', v:quando(it.data, it.hora) }, { l:'Pessoas', v:it.passageiros }, { l:'Reserva', v:it.reserva }] }),
  internet: () => ({ titulo:[it.tipo, it.operadora].filter(Boolean).join(' · ') || 'Internet', sub:it.regiao, campos:[
    { l:'Dados', v:it.dados }, { l:'Ativação', v:fmtDA(it.inicio) }, { l:'Dias', v:it.dias }] }),
})[k]()
const itensDoPortal = (a, s) => {
  if (s.kind === 'items') return (a[s.k] || []).map(it => ({
    ...detalhe(s.k, it), status:it.status || '', ok:s.done.includes(it.status), link:it.link || '',
    anexos:(it.anexos || []).map(x => ({ id:x.id, nome:x.nome, tipo:x.tipo })),
  }))
  if (s.dayByDay) return (a.roteiro_dias || []).filter(d => d.programacao || d.cidade).map((d, i) => ({
    titulo:`Dia ${i + 1}${d.data ? ` — ${fmtDA(d.data)}` : ''}`, sub:d.cidade || '', texto:d.programacao || '',
  }))
  return []
}
function portalView(a) {
  const atual = currentStep(a)
  return {
    cliente: String(a.cliente || '').trim().split(/\s+/)[0] || '',
    destino: a.destino || '', origem: a.origem || '', inicio: a.inicio || '', fim: a.fim || '', viajantes: a.viajantes || '',
    etapas: STEPS.filter(s => !a.na?.[s.k]).map(s => {
      const p = progress(a, s)
      return { k:s.k, nome:s.short, icon:s.icon, estado:p.complete ? 'feito' : s.k === atual?.k ? 'atual' : 'pendente',
        done:p.done, total:p.total, unit:s.kind === 'items' ? s.unit : 'itens', goal:s.goal || '', itens:itensDoPortal(a, s) }
    }),
    proxima: a.proxima_acao ? { acao:a.proxima_acao, data:a.proxima_data || '' } : null,
    atualizado: new Date().toISOString(),
  }
}

function fillTemplate(txt, a) {
  const vars = {
    cliente: a.cliente || '', primeiro_nome: String(a.cliente || '').trim().split(/\s+/)[0] || '',
    origem: a.origem || '', destino: a.destino || '', periodo: periodo(a), responsavel: a.responsavel || 'Joseph',
    dias: daysTo(a.inicio) ?? '—',
    localizadores: (a.aereo || []).filter(v => v.localizador).map(v => `✈️ ${trechoDe(v) || 'Voo'}${v.voo ? ` · ${v.voo}` : ''}${v.data ? ` (${fmtD(v.data)}${idaVolta(v) && v.data_volta ? ` a ${fmtD(v.data_volta)}` : ''})` : ''}: ${v.localizador}`).join('\n') || '[localizadores]',
    roteiro: (a.roteiro_dias || []).filter(d => d.programacao || d.cidade).map((d, i) => `*Dia ${i + 1}${d.data ? ` — ${fmtD(d.data)}` : ''}${d.cidade ? ` · ${d.cidade}` : ''}*\n${d.programacao || ''}`).join('\n\n') || '[roteiro]',
    hoteis: (a.hotel || []).filter(h => h.hotel).map(h => `🏨 ${h.cidade ? `${h.cidade} — ` : ''}${h.hotel} (${fmtD(h.checkin)} a ${fmtD(h.checkout)})`).join('\n') || '[hotéis]',
  }
  return txt.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
}

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
  // sigla digitada exata ("tp", "lis") vai para o topo
  const sigla = c => busca.length >= 2 && semAcento(c.nome).endsWith(`(${busca})`)
  lista.forEach(g => g.cidades.sort((x, y) => sigla(y) - sigla(x)))
  lista.sort((x, y) => sigla(y.cidades[0]) - sigla(x.cidades[0]))
  const primeira = lista[0]?.cidades[0]?.nome

  return (
    <div ref={boxRef} style={{ position:'relative' }}>
      {label && <Label>{label}</Label>}
      <div onClick={() => setOpen(true)} style={{ ...inputS, display:'flex', flexWrap:'wrap', gap:5, alignItems:'center', minHeight:38, padding:'5px 8px', cursor:'text' }}>
        {sel.map(n => (
          <span key={n} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.06)',
            color:T.text, border:`1px solid ${T.lineStrong}`, borderRadius:5, padding:'1px 3px 1px 8px', fontSize:12, fontWeight:500 }}>
            {n}
            <button onClick={e => { e.stopPropagation(); tirar(n) }} title="Remover"
              style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer', padding:0, display:'flex' }}><X size={12}/></button>
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
        <div className="ass-scroll" style={{ position:'absolute', zIndex:50, left:0, right:0, top:'100%', marginTop:4, maxHeight:260, overflowY:'auto',
          background:T.raised, border:`1px solid ${T.lineStrong}`, borderRadius:8, boxShadow:'0 16px 40px rgba(0,0,0,0.5)', padding:6 }}>
          {q.trim() && !lista.some(g => g.cidades.some(c => semAcento(c.nome) === busca || c.nome.toUpperCase().endsWith(`(${q.trim().toUpperCase()})`))) && (
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
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
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
          log.unshift({ t: new Date().toISOString(), msg:`${s.short} concluída` })
      })
      if (a.status !== next.status) log.unshift({ t: new Date().toISOString(), msg:`Status: ${STATUS[next.status]?.label}` })
      return { ...next, log: log.slice(0, 80), portal_view: next.portal?.ativo ? portalView(next) : undefined }
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
      ...form, status:'andamento', checks:{}, na:{}, aereo:[], trem:[], aluguel:[], hotel:[], seguro:[], exp:[], internet:[], roteiro_dias:[], passageiros: form.passageiros || [],
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
        ? <Ficha a={open} mode={mode} saving={saving} onBack={() => setOpenId(null)} onDelete={() => remove(open)}
            onChange={fn => update(open.id, fn)}/>
        : <Overview list={list} onOpen={setOpenId} onNew={() => setShowNew(true)} mode={mode}/>}
      {showNew && <NewModal onClose={() => setShowNew(false)} onSave={create}/>}
    </div>
  )
}

/* ─── Aviso: tabela ainda não criada no Supabase ─────── */
const TableMissing = () => (
  <Card style={{ border:T.border, marginBottom:14 }}>
    <CardTitle icon={Settings}>Falta criar a tabela de assessorias na nuvem</CardTitle>
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
    { label:'Ativas',              val:ativas.length },
    { label:'Onboarding',          val:ativas.filter(a => etapaDe(a) === 'onboarding').length },
    { label:'Roteiro prévio',      val:ativas.filter(a => etapaDe(a) === 'rota').length },
    { label:'Em emissão',          val:ativas.filter(a => EMISSAO.includes(etapaDe(a))).length },
    { label:'Roteiro final',       val:ativas.filter(a => etapaDe(a) === 'roteiro').length },
    { label:'Reunião final',       val:ativas.filter(a => etapaDe(a) === 'previagem').length },
    { label:'Embarcam em 30 dias', val:ativas.filter(a => { const d = daysTo(a.inicio); return d !== null && d >= 0 && d <= 30 }).length },
    { label:'Com alerta',          val:ativas.filter(a => alertas(a).length).length, tone:'#F87171' },
  ]
  const resps = [...new Set(list.map(a => a.responsavel).filter(Boolean))]

  const rows = list
    .filter(a => fSt === 'all' || (fSt === 'ativas' ? ATIVA(a) : a.status === fSt))
    .filter(a => fResp === 'all' || a.responsavel === fResp)
    .filter(a => !q || `${a.cliente} ${a.origem || ''} ${a.destino}`.toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => (x.inicio || '9999').localeCompare(y.inicio || '9999'))

  return (
    <div>
      <PageHeader title="Assessorias" sub={`Execução das viagens contratadas · ${mode === 'cloud' ? 'dados na nuvem' : 'dados só neste navegador'}`}>
        <Btn onClick={onNew}><Plus size={14}/> Nova assessoria</Btn>
      </PageHeader>

      <KpiGrid min={130} style={{ marginBottom:12 }}>
        {kpis.map(k => <Kpi key={k.label} label={k.label} value={k.val} tone={k.tone}/>)}
      </KpiGrid>

      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', gap:8, padding:12, flexWrap:'wrap', borderBottom:T.borderN }}>
          <div style={{ position:'relative', flex:'1 1 220px' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.faint }}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente, origem ou destino…"
              style={{ ...inputS, paddingLeft:30 }}/>
          </div>
          <select value={fSt} onChange={e => setFSt(e.target.value)} style={{ ...inputS, width:'auto', background:T.card, cursor:'pointer' }}>
            <option value="ativas">Ativas</option>
            <option value="all">Todas</option>
            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <select value={fResp} onChange={e => setFResp(e.target.value)} style={{ ...inputS, width:'auto', background:T.card, cursor:'pointer' }}>
            <option value="all">Todos os responsáveis</option>
            {resps.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <Empty icon={Briefcase} title={list.length ? 'Nenhuma assessoria com esses filtros' : 'Nenhuma assessoria ainda'}>
            {list.length ? 'Ajuste a busca ou os filtros.' : 'Crie a primeira quando fechar uma venda.'}
            {!list.length && <div style={{ marginTop:14 }}><Btn onClick={onNew} small><Plus size={13}/> Nova assessoria</Btn></div>}
          </Empty>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:880 }}>
              <thead>
                <tr>{['Cliente','Destino','Embarque','Etapa atual','Progresso','Responsável','Status',''].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map(a => {
                  const st = currentStep(a)
                  const al = alertas(a)
                  const dias = daysTo(a.inicio)
                  const feitas = STEPS.filter(s => progress(a, s).complete).length
                  return (
                    <tr key={a.id} onClick={() => onOpen(a.id)} className="crm-row" style={{ cursor:'pointer' }}>
                      <td style={td}>
                        <div style={{ fontWeight:600, whiteSpace:'nowrap' }}>{a.cliente}</div>
                        <div style={{ fontSize:12, color:T.muted }}>{a.viajantes || '?'} viajante(s)</div>
                      </td>
                      <td style={td}>
                        <div style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.destino || '—'}</div>
                        {a.origem && <div style={{ fontSize:12, color:T.muted }}>saindo de {a.origem}</div>}
                      </td>
                      <td style={{ ...td, ...num }}>
                        <div>{fmtMes(a.inicio)}</div>
                        {dias !== null && dias >= 0 && ATIVA(a) && <div style={{ fontSize:12, color:dias <= 30 ? '#FBBF24' : T.muted }}>em {dias} dias</div>}
                      </td>
                      <td style={td}>
                        {st ? <span style={{ display:'inline-flex', alignItems:'center', gap:7 }}>
                          {(() => { const I = STEP_ICON[st.k]; return <I size={14} color={T.muted} strokeWidth={1.8}/> })()}{st.short}
                        </span> : <Badge color={T.success}>Tudo concluído</Badge>}
                      </td>
                      <td style={td}>
                        <StepTrack a={a}/>
                        <div style={{ fontSize:11, color:T.faint, marginTop:5, ...num }}>{feitas} de {STEPS.length} etapas</div>
                      </td>
                      <td style={td}>{a.responsavel || '—'}</td>
                      <td style={td}><Badge color={STATUS[a.status]?.color || T.muted} small>{STATUS[a.status]?.label || a.status}</Badge></td>
                      <td style={{ ...td, width:48 }}>
                        {al.length > 0 && <span title={al.join('\n')} style={{ color:'#F87171', display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}>
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
function Ficha({ a, mode, onChange, onBack, onDelete, saving }) {
  const [tab, setTab] = useState(() => currentStep(a)?.k || 'geral')
  const set = (k, v) => onChange(x => ({ ...x, [k]: v }))
  const al = alertas(a)
  const dias = daysTo(a.inicio)
  const st = currentStep(a)
  const feitas = STEPS.filter(s => progress(a, s).complete).length

  return (
    <div>
      {/* Cabeçalho */}
      <button onClick={onBack} className="crm-ghost"
        style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer', padding:'4px 6px', margin:'-4px 0 10px -6px',
          display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontFamily:'inherit', borderRadius:6 }}>
        <ArrowLeft size={14}/> Assessorias
      </button>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        <div style={{ minWidth:0 }}>
          <h1 style={{ fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.2px' }}>{a.cliente}</h1>
          <div style={{ fontSize:14, color:T.muted, marginTop:3 }}>{a.origem ? `${a.origem} → ` : ''}{a.destino || 'destino a definir'}</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:T.muted, marginTop:10 }}>
            <span style={{ display:'inline-flex', gap:6, alignItems:'center' }}><Calendar size={13} color={T.faint}/> {periodo(a)}</span>
            <span style={{ display:'inline-flex', gap:6, alignItems:'center' }}><Users size={13} color={T.faint}/> {a.viajantes || '?'} viajante(s)</span>
            <span style={{ display:'inline-flex', gap:6, alignItems:'center' }}><User size={13} color={T.faint}/> {a.responsavel || '—'}</span>
            {a.contratado_em && <span>Contratado em {fmtD(a.contratado_em)}/{a.contratado_em.slice(0, 4)}</span>}
            {dias !== null && dias >= 0 && <span style={{ display:'inline-flex', gap:6, alignItems:'center', color:dias <= 30 ? '#FBBF24' : T.text, fontWeight:600 }}>
              <Plane size={13}/> Embarque em {dias} dias</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:T.faint }}>{saving ? 'Salvando…' : 'Salvo'}</span>
          <select value={a.status} onChange={e => set('status', e.target.value)} aria-label="Status da assessoria"
            style={{ ...inputS, width:'auto', background:T.card, fontWeight:600, cursor:'pointer' }}>
            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          {a.phone && <a href={waText(a.phone, `Olá, ${String(a.cliente).split(' ')[0]}! `)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
            <Btn outline><MessageCircle size={14}/> WhatsApp</Btn></a>}
          <IconBtn icon={Trash2} onClick={onDelete} title="Excluir assessoria" danger/>
        </div>
      </div>

      {al.length > 0 && (
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, padding:'10px 14px', marginBottom:14 }}>
          {al.map(t => <div key={t} style={{ color:'#FCA5A5', fontSize:13, display:'flex', gap:8, alignItems:'center', padding:'2px 0' }}><AlertTriangle size={14}/> {t}</div>)}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'minmax(240px,280px) 1fr', gap:14, alignItems:'start' }} className="ass-grid">
        {/* Checklist operacional */}
        <Card style={{ padding:8 }}>
          <StepBtn active={tab === 'geral'} onClick={() => setTab('geral')} icon={<LayoutList size={16} color={T.muted} strokeWidth={1.8}/>} name="Visão geral"/>
          <StepBtn active={tab === 'pax'} onClick={() => setTab('pax')} icon={<Users size={16} color={T.muted} strokeWidth={1.8}/>} name="Passageiros"
            sub={`${(a.passageiros || []).length}/${a.viajantes || '?'}`}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 10px 6px', fontSize:11, fontWeight:600, color:T.faint, letterSpacing:'0.4px', textTransform:'uppercase' }}>
            <span>Etapas</span><span style={{ ...num, textTransform:'none', letterSpacing:0 }}>{feitas} de {STEPS.length}</span>
          </div>
          {STEPS.map((s, i) => {
            const p = progress(a, s)
            return (
              <StepBtn key={s.k} active={tab === s.k} onClick={() => setTab(s.k)} current={st?.k === s.k}
                icon={<StatusIcon p={p} current={st?.k === s.k}/>} name={`${i + 1}. ${s.short}`} muted={p.na}
                sub={p.na ? 'n/a' : s.kind === 'items' ? (p.total ? `${p.done}/${p.total}` : '—') : `${p.done}/${p.total}`}/>
            )
          })}
        </Card>

        {/* Conteúdo da etapa */}
        <div style={{ minWidth:0 }}>
          {tab === 'geral' ? <Geral a={a} set={set} onChange={onChange} mode={mode}/>
            : tab === 'pax' ? (
              <Card>
                <CardTitle icon={Users}>Passageiros</CardTitle>
                <div style={{ fontSize:13, color:T.muted, margin:'-6px 0 14px' }}>Dados de cada viajante para emissões, seguro e reservas.</div>
                <Passageiros list={a.passageiros || []} setList={fn => onChange(x => ({ ...x, passageiros: fn(x.passageiros || []) }))}/>
              </Card>)
            : <StepPanel s={STEP[tab]} a={a} onChange={onChange} mode={mode}/>}
        </div>
      </div>
      <datalist id="ass-cidades">{cidadesDe(a).map(c => <option key={c} value={c}/>)}</datalist>
      <style>{`@media (max-width: 760px) { .ass-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

const StepBtn = ({ active, onClick, icon, name, sub, current, muted }) => (
  <button type="button" onClick={onClick} aria-current={active ? 'step' : undefined}
    className={active ? undefined : 'crm-ghost'}
    style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:6, cursor:'pointer', marginBottom:1,
      background:active ? 'rgba(255,255,255,0.06)' : 'transparent', border:'none', fontFamily:'inherit', textAlign:'left',
      boxShadow:active ? `inset 2px 0 0 ${T.gold}` : 'none' }}>
    <span style={{ width:18, display:'flex', justifyContent:'center', flexShrink:0 }}>{icon}</span>
    <span style={{ flex:1, fontSize:13, fontWeight:active ? 600 : 500, color:muted ? T.faint : T.text }}>{name}</span>
    {current && <span style={{ fontSize:10, fontWeight:600, color:T.gold, border:'1px solid rgba(212,175,55,0.35)', borderRadius:4, padding:'0 5px', lineHeight:'16px' }}>atual</span>}
    {sub && <span style={{ fontSize:12, color:T.faint, ...num }}>{sub}</span>}
  </button>
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
  { k:'obs', l:'Observações', ph:'Assento, alimentação, necessidades especiais…', w:2 },
]
const novoPax = () => ({ id:uid(), nome:'', cpf:'', nascimento:'', sexo:'', nacionalidade:'Brasileira', passaporte_num:'', passaporte:'', telefone:'', email:'', obs:'' })
const paxTexto = p => [
  `Nome: ${p.nome || '—'}`, p.cpf && `CPF: ${p.cpf}`, p.nascimento && `Nascimento: ${fmtD(p.nascimento)}/${p.nascimento.slice(0, 4)}`,
  p.sexo && `Sexo: ${p.sexo}`, p.nacionalidade && `Nacionalidade: ${p.nacionalidade}`,
  p.passaporte_num && `Passaporte: ${p.passaporte_num}${p.passaporte ? ` (validade ${fmtD(p.passaporte)}/${p.passaporte.slice(0, 4)})` : ''}`,
  p.telefone && `Telefone: ${p.telefone}`, p.email && `E-mail: ${p.email}`, p.obs && `Obs.: ${p.obs}`,
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
        <div key={p.id} style={{ background:'rgba(255,255,255,0.02)', border:T.borderN, borderRadius:8, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, gap:8 }}>
            <div style={{ fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8 }}><User size={14} color={T.faint}/> Passageiro {i + 1}{p.nome ? ` — ${p.nome}` : ''}</div>
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
function Geral({ a, set, onChange, mode }) {
  const custos = CUSTOS.reduce((s, k) => s + (a[k] || []).reduce((t, i) => t + (Number(i.valor) || 0), 0), 0)

  return (
    <div style={{ display:'grid', gap:14 }}>
      <Card>
        <CardTitle icon={Target}>Próxima ação</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 170px', gap:10 }}>
          <Field value={a.proxima_acao} onChange={v => set('proxima_acao', v)} ph="Ex.: enviar opções de voo"/>
          <Field type="date" value={a.proxima_data} onChange={v => set('proxima_data', v)}/>
        </div>
      </Card>

      <PortalCard a={a} onChange={onChange} mode={mode}/>

      <KpiGrid min={150}>
        <Kpi label="Valor da assessoria" value={fmtR(a.valor)}/>
        <Kpi label="Custos lançados" value={fmtR(custos)}/>
        <Kpi label="Passageiros" value={`${(a.passageiros || []).length} de ${a.viajantes || '?'}`}/>
      </KpiGrid>

      <Card>
        <CardTitle icon={FolderOpen}>Dados da assessoria</CardTitle>
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
        <CardTitle icon={History}>Histórico</CardTitle>
        {(a.log || []).slice(0, 15).map((l, i) => (
          <div key={i} style={{ display:'flex', gap:12, fontSize:13, padding:'7px 0', borderTop:i ? T.borderN : 'none' }}>
            <span style={{ color:T.faint, whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>{new Date(l.t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
            <span>{l.msg}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

/* ─── Link de acompanhamento para o cliente (somente leitura) ── */
function PortalCard({ a, onChange, mode }) {
  const [url,    setUrl]    = useState('')
  const [erro,   setErro]   = useState('')
  const [copied, setCopied] = useState(false)
  const p = a.portal || {}
  const ativo = !!p.ativo && mode === 'cloud'

  useEffect(() => {
    setUrl(''); setErro('')
    if (!ativo || !p.v) return
    let vivo = true
    portalLink(a.id, p.v).then(u => vivo && setUrl(u)).catch(() => vivo && setErro('Não foi possível gerar o link agora.'))
    return () => { vivo = false }
  }, [a.id, ativo, p.v])

  const novoLink = () => {
    if (p.ativo && !window.confirm('Gerar um novo link? O link enviado antes para o cliente deixa de funcionar.')) return
    onChange(x => ({ ...x, portal:{ ativo:true, v:(x.portal?.v || 0) + 1, criado_em:new Date().toISOString() } }))
  }
  const desativar = () => {
    if (!window.confirm('Desativar o link? O cliente não vai mais conseguir abrir a página.')) return
    onChange(x => ({ ...x, portal:{ ...(x.portal || {}), ativo:false } }))
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  const primeiro = String(a.cliente || '').trim().split(/\s+/)[0]
  const msg = `Olá, ${primeiro}! ✈️ Por este link você acompanha, em tempo real, cada etapa da organização da sua viagem${a.destino ? ` para ${a.destino}` : ''}:\n\n${url}\n\nQualquer dúvida é só me chamar por aqui.`
  const expira = a.fim ? addDays(a.fim, 7) : null

  return (
    <Card style={{ border:T.border }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
        <div style={{ fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8 }}><Link2 size={15} color={T.muted} strokeWidth={1.8}/> Link de acompanhamento do cliente</div>
        {ativo ? <Badge color={T.success} small>Ativo</Badge> : <Badge color={T.muted} small>{p.v ? 'Desativado' : 'Não criado'}</Badge>}
      </div>
      <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:12 }}>
        O cliente vê o andamento e os detalhes de cada etapa: voos, hotéis, seguro, ingressos e internet (com localizador e nº da reserva),
        roteiro dia a dia, próxima ação e os anexos e links de bilhetes e vouchers.
        Nada de passaporte, CPF, valores ou anotações internas — e ele não consegue alterar nada.
        {expira && <> O link expira em <b style={{ color:T.text }}>{fmtD(expira)}/{expira.slice(0, 4)}</b> (7 dias após a volta).</>}
      </div>
      {mode !== 'cloud' ? (
        <div style={{ fontSize:12, color:T.warn }}>Disponível apenas com os dados na nuvem.</div>
      ) : !ativo ? (
        <Btn small onClick={novoLink}><Link2 size={13}/> {p.v ? 'Gerar novo link' : 'Gerar link do cliente'}</Btn>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          <input readOnly value={url || (erro ? '' : 'Gerando link…')} onFocus={e => e.target.select()}
            style={{ ...inputS, color:url ? T.text : T.muted, fontSize:12 }}/>
          {erro && <div style={{ fontSize:12, color:T.err }}>{erro}</div>}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Btn small onClick={copiar} disabled={!url}><Copy size={12}/> {copied ? 'Copiado!' : 'Copiar link'}</Btn>
            {a.phone && url && <a href={waText(a.phone, msg)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
              <Btn small outline><MessageCircle size={12}/> Enviar no WhatsApp</Btn></a>}
            {url && <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
              <Btn small outline><ExternalLink size={12}/> Ver como o cliente</Btn></a>}
            <Btn small outline onClick={novoLink} title="O link antigo deixa de funcionar">Gerar novo link</Btn>
            <Btn small danger onClick={desativar}>Desativar</Btn>
          </div>
          <div style={{ fontSize:11, color:T.muted }}>A "Próxima ação" acima também aparece para o cliente — escreva pensando nele.</div>
        </div>
      )}
    </Card>
  )
}

const IconDel = ({ onClick }) => (
  <button onClick={onClick} title="Remover" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
    color:T.err, borderRadius:8, cursor:'pointer', height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <X size={14}/>
  </button>
)

/* ─── Painel de uma etapa ────────────────────────────── */
function StepPanel({ s, a, onChange, mode }) {
  const p = progress(a, s)
  const na = !!a.na?.[s.k]
  return (
    <div style={{ display:'grid', gap:14 }}>
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, display:'flex', alignItems:'center', gap:9 }}>{(() => { const I = STEP_ICON[s.k]; return <I size={17} color={T.muted} strokeWidth={1.8}/> })()} {s.name}</div>
            {s.goal && <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Objetivo: {s.goal}</div>}
          </div>
          {na
            ? <Btn outline small onClick={() => onChange(x => ({ ...x, na:{ ...(x.na || {}), [s.k]: false } }))}><RotateCcw size={13}/> Reativar etapa</Btn>
            : <Btn outline small onClick={() => onChange(x => ({ ...x, na:{ ...(x.na || {}), [s.k]: true } }))} title="Some do progresso e do link do cliente"><Ban size={13}/> Não se aplica</Btn>}
        </div>
        {!na && <div style={{ marginTop:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
            <span style={{ color:T.muted }}>{s.kind === 'items' ? `${p.done}/${p.total} ${s.unit}` : `${p.done}/${p.total} itens do checklist`}</span>
            <span style={{ color:T.text, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{Math.round(p.pct * 100)}%</span>
          </div>
          <Bar pct={p.pct} color={p.complete ? T.success : T.gold}/>
        </div>}
      </Card>

      {na && (
        <Card style={{ textAlign:'center', padding:'28px 18px', borderStyle:'dashed' }}>
          <Ban size={22} color={T.faint} strokeWidth={1.6}/>
          <div style={{ fontSize:14, fontWeight:600, marginTop:8 }}>Esta etapa não se aplica a esta viagem</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>Ela conta como concluída no progresso e não aparece para o cliente.</div>
        </Card>
      )}
      {!na && s.dayByDay && <DiaADia a={a} onChange={onChange}/>}
      {!na && (s.kind === 'check' ? <Checklist s={s} a={a} onChange={onChange}/> : <Items s={s} a={a} onChange={onChange} mode={mode}/>)}

      {!na && s.out && (
        <div style={{ fontSize:12, color:p.complete ? T.success : T.muted, display:'flex', gap:6, alignItems:'center' }}>
          <CheckCircle2 size={14}/> Saída da etapa: {s.out}
        </div>
      )}

      <Card>
        <CardTitle icon={NotebookPen}>Anotações da etapa</CardTitle>
        <textarea value={a.notas?.[s.k] || ''} rows={3} placeholder="Briefing, decisões, combinados com o cliente…"
          onChange={e => onChange(x => ({ ...x, notas:{ ...(x.notas || {}), [s.k]: e.target.value } }))}
          style={{ ...inputS, resize:'vertical' }}/>
      </Card>

      {!na && <Templates s={s} a={a}/>}
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
        <div style={{ fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8 }}><CalendarDays size={15} color={T.muted} strokeWidth={1.8}/> Roteiro dia a dia</div>
        <div style={{ display:'flex', gap:6 }}>
          <Btn small outline onClick={gerar}><Calendar size={12}/> Gerar dias pelas datas</Btn>
          <Btn small outline onClick={add}><Plus size={12}/> Dia</Btn>
        </div>
      </div>
      {dias.length === 0 && <div style={{ fontSize:12, color:T.muted }}>Clique em "Gerar dias pelas datas" para criar um dia para cada data da viagem — a cidade vem das hospedagens cadastradas.</div>}
      {dias.map((d, i) => (
        <div key={d.id} className="ass-dia" style={{ display:'grid', gridTemplateColumns:'64px 150px 1fr 34px', gap:8, marginBottom:8, alignItems:'start' }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.muted, paddingTop:8 }}>Dia {i + 1}</div>
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
            background:checks[c] ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', border:`1px solid ${checks[c] ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
            <input type="checkbox" checked={!!checks[c]} onChange={() => toggle(c)} style={{ accentColor:T.success, width:15, height:15 }}/>
            <span style={{ fontSize:13, color:checks[c] ? T.text : T.muted, textDecoration:checks[c] ? 'none' : 'none' }}>{c}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

function Items({ s, a, onChange, mode }) {
  const items = a[s.k] || []
  const setItem = (i, k, v) => onChange(x => ({ ...x, [s.k]: x[s.k].map((it, j) => j === i ? { ...it, [k]: v } : it) }))
  const add = () => onChange(x => ({ ...x, [s.k]: [...(x[s.k] || []), { id:uid(), ...s.blank }] }))
  const del = i => {
    if (!window.confirm('Remover este item?')) return
    if (mode === 'cloud') (items[i]?.anexos || []).forEach(x => removeAnexo(a.id, x.id).catch(() => {}))
    onChange(x => ({ ...x, [s.k]: x[s.k].filter((_, j) => j !== i) }))
  }
  const setAnexos = (id, fn) => onChange(x => ({ ...x, [s.k]: x[s.k].map(it => it.id === id ? { ...it, anexos: fn(it.anexos || []) } : it) }))

  return (
    <div style={{ display:'grid', gap:10 }}>
      {items.map((it, i) => {
        const done = s.done.includes(it.status)
        const stIdx = s.statuses.indexOf(it.status)
        return (
          <Card key={it.id} style={{ padding:14 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
              {s.statuses.map((st, j) => (
                <button key={st} onClick={() => setItem(i, 'status', st)}
                  style={{ fontSize:12, padding:'3px 10px', borderRadius:5, cursor:'pointer', fontFamily:'inherit', fontWeight:500,
                    background:j === stIdx ? (s.done.includes(st) ? 'rgba(34,197,94,0.12)' : 'rgba(212,175,55,0.12)') : 'transparent',
                    color:j === stIdx ? (s.done.includes(st) ? '#4ADE80' : T.gold) : j < stIdx ? T.text : T.faint,
                    border:`1px solid ${j === stIdx ? (s.done.includes(st) ? 'rgba(34,197,94,0.4)' : 'rgba(212,175,55,0.4)') : 'rgba(255,255,255,0.08)'}` }}>
                  {st}
                </button>
              ))}
              <span style={{ flex:1 }}/>
              {it.link && <a href={it.link} target="_blank" rel="noreferrer" style={{ color:T.muted, fontSize:12, display:'inline-flex', gap:4, alignItems:'center' }}>
                <ExternalLink size={12}/> abrir</a>}
              <button onClick={() => del(i)} title="Remover" style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}><Trash2 size={14}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
              {s.k === 'aereo' && (
                <div style={{ gridColumn:'1 / -1', display:'flex', gap:6, alignItems:'center' }}>
                  {['Só ida', 'Ida e volta'].map(t => {
                    const on = (it.tipo || 'Só ida') === t
                    return (
                      <button key={t} onClick={() => setItem(i, 'tipo', t)}
                        style={{ fontSize:12, padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700,
                          background:on ? 'rgba(255,255,255,0.07)' : 'transparent', color:on ? T.text : T.muted,
                          border:on ? `1px solid ${T.lineStrong}` : T.borderN }}>
                        {t === 'Só ida' ? '→ Só ida' : '⇄ Ida e volta'}
                      </button>
                    )
                  })}
                </div>
              )}
              {s.fields.filter(f => !f.volta || idaVolta(it)).map(f => (idaVolta(it) && f.lIda ? { ...f, l:f.lIda } : f)).map(f => (
                f.sep ? <div key={f.k} style={{ gridColumn:'1 / -1', fontSize:12, fontWeight:600, color:T.muted, borderTop:f.sep.trim() ? T.borderN : 'none', paddingTop:f.sep.trim() ? 10 : 0, marginTop:f.sep.trim() ? 4 : -8 }}>{f.sep}</div> :
                <div key={f.k} style={{ gridColumn:f.w ? `span ${f.w}` : undefined }}>
                  {f.t === 'airport' || f.t === 'airline'
                    ? <CityPicker label={f.l} value={it[f.k]} groups={f.t === 'airport' ? AEROPORTOS : CIAS} ph={f.ph} onChange={v => setItem(i, f.k, v)}/>
                    : f.t === 'select' ? <Select label={f.l} value={it[f.k]} opts={f.opts} onChange={v => setItem(i, f.k, v)}/>
                    : f.t === 'check' ? (
                      <div><Label>{f.l}</Label>
                        <label style={{ ...inputS, display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}>
                          <input type="checkbox" checked={!!it[f.k]} onChange={e => setItem(i, f.k, e.target.checked)}/> {it[f.k] ? 'Incluso' : 'Não incluso'}
                        </label></div>)
                    : <Field label={f.l} type={f.t || 'text'} ph={f.ph} value={it[f.k]} onChange={v => setItem(i, f.k, v)} list={f.k === 'cidade' ? 'ass-cidades' : undefined}/>}
                </div>
              ))}
            </div>
            <Anexos assId={a.id} list={it.anexos || []} mode={mode} setList={fn => setAnexos(it.id, fn)}/>
          </Card>
        )
      })}
      <div><Btn outline small onClick={add}><Plus size={13}/> Adicionar {s.add || 'item'}</Btn></div>
      {s.k === 'aereo' && items.length > 0 && (
        <div style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:6 }}>
          <Plane size={12}/> Total das passagens: {fmtR(items.reduce((t, v) => t + (Number(v.valor) || 0), 0))}
        </div>
      )}
    </div>
  )
}

/* ─── Templates da etapa ─────────────────────────────── */
/* Anexos do item (bilhete, voucher, apólice) — aparecem também no link do cliente */
const ERRO_ANEXO = { too_large:'Arquivo maior que 4 MB.', bad_type:'Envie PDF, JPG, PNG ou WEBP.', empty:'Arquivo vazio.' }
const fmtKB = n => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function Anexos({ assId, list, setList, mode }) {
  const [busy, setBusy] = useState('')
  const [erro, setErro] = useState('')
  const input = useRef(null)
  const cloud = mode === 'cloud'

  const enviar = async files => {
    setErro('')
    for (const file of files) {
      if (file.size > MAX_ANEXO) { setErro(`${file.name}: ${ERRO_ANEXO.too_large}`); continue }
      setBusy(file.name)
      try {
        const x = await uploadAnexo(assId, file)
        setList(prev => [...prev, x])
      } catch (e) { setErro(`${file.name}: ${ERRO_ANEXO[e.message] || 'não foi possível enviar.'}`) }
    }
    setBusy('')
    if (input.current) input.current.value = ''
  }
  const remover = async x => {
    if (!window.confirm(`Remover o anexo "${x.nome}"? O cliente também deixa de vê-lo.`)) return
    try { await removeAnexo(assId, x.id) } catch { setErro('Não foi possível remover agora.'); return }
    setList(prev => prev.filter(y => y.id !== x.id))
  }

  return (
    <div style={{ marginTop:12, paddingTop:10, borderTop:T.borderN }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {list.map(x => (
          <span key={x.id} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)',
            border:`1px solid ${T.lineStrong}`, borderRadius:6, padding:'4px 6px 4px 10px', fontSize:12, maxWidth:'100%' }}>
            <FileText size={13} color={T.muted}/>
            <a href={cloud ? anexoUrl(assId, x) : undefined} target="_blank" rel="noreferrer"
              style={{ color:T.text, textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>{x.nome}</a>
            {x.tamanho > 0 && <span style={{ color:T.muted, fontSize:11 }}>{fmtKB(x.tamanho)}</span>}
            {cloud && <button onClick={() => remover(x)} title="Remover anexo"
              style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer', display:'flex', padding:2 }}><X size={12}/></button>}
          </span>
        ))}
        {cloud ? <>
          <Btn small outline onClick={() => input.current?.click()} disabled={!!busy}>
            <Paperclip size={12}/> {busy ? `Enviando ${busy.length > 24 ? `${busy.slice(0, 22)}…` : busy}` : 'Anexar PDF ou imagem'}
          </Btn>
          <input ref={input} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" style={{ display:'none' }}
            onChange={e => enviar([...e.target.files])}/>
        </> : <span style={{ fontSize:11, color:T.muted }}>Anexos disponíveis só com os dados na nuvem.</span>}
      </div>
      {erro && <div style={{ fontSize:12, color:T.err, marginTop:6 }}>{erro}</div>}
    </div>
  )
}

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
      <CardTitle icon={MessageSquareText}>Mensagens prontas da etapa</CardTitle>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {list.map(([name], i) => (
          <button key={name} onClick={() => setSel(sel === i ? null : i)}
            style={{ fontSize:12, padding:'5px 11px', borderRadius:6, cursor:'pointer', fontFamily:'inherit',
              background:sel === i ? 'rgba(255,255,255,0.08)' : 'transparent',
              color:sel === i ? T.text : T.muted, border:`1px solid ${sel === i ? T.lineStrong : T.line}` }}>{name}</button>
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
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(3,7,15,0.72)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} className="ass-scroll"
        style={{ background:T.card, borderRadius:12, padding:22, width:680, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', border:`1px solid ${T.lineStrong}`, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Nova assessoria</div>
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
          <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>Passageiros</div>
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
