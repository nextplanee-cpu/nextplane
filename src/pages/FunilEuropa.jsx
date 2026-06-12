import { useState } from 'react'

/* ── CONFIG ── */
const WA_ESPECIALISTA = '5548988636608'

/* ── Lógica de qualificação ── */
// Quente = tem orçamento + prazo definido (até 6 meses)
const isQuente = (a) =>
  (a.prazo === 'curto' || a.prazo === 'medio') &&
  (a.investimento === '5a15k' || a.investimento === '15kmais')

// Qualificado = quente + já sabe o destino → vai direto ao WhatsApp
const isQualificado = (a) => isQuente(a) && a.destino !== 'indeciso'

/* ── Mapa investimento → valor estimado ── */
const valorMap = { ate5k: 4000, '5a15k': 10000, '15kmais': 20000, naosei: 0 }

/* ── Temperatura no CRM ── */
const getTemp = (a, qualificado) => {
  if (qualificado || isQuente(a)) return 'Quente'
  if (a.prazo === 'medio') return 'Morno'
  return 'Frio'
}

/* ── Salva lead no localStorage do CRM ── */
function salvarNoCRM({ nome, telefone, answers, labels, qualificado = false }) {
  try {
    const leads  = JSON.parse(localStorage.getItem('crm_leads') || '[]')
    const nextId = parseInt(localStorage.getItem('crm_next_id') || '1')

    const words    = nome.trim().split(' ')
    const initials = words.length >= 2
      ? words[0][0] + words[words.length - 1][0]
      : words[0].slice(0, 2)

    const colors = ['#F97316','#8B5CF6','#3B82F6','#22C55E','#EC4899','#06B6D4','#F59E0B']
    const dest     = [labels.destino, labels.perfil].filter(Boolean).join(' · ')
    const nomeFinal = nome || `${labels.perfil || 'Lead'} — ${labels.destino || 'Funil Europa'}`

    const lead = {
      id:        nextId,
      name:      nomeFinal,
      phone:     telefone || '',
      email:     '',
      cidade:    '',
      dest,
      type:      answers.destino === 'europa'     ? 'Europa'
                : answers.destino === 'eua'       ? 'Internacional'
                : answers.destino === 'caribe'    ? 'Internacional'
                : answers.destino === 'america_sul' ? 'América do Sul'
                : 'Internacional',
      value:     valorMap[answers.investimento] || 0,
      stage:     0,
      temp:      getTemp(answers, qualificado),
      source:    qualificado ? 'Landing Europa · WhatsApp' : 'Landing Europa',
      initials:  initials.toUpperCase(),
      color:     colors[nextId % colors.length],
      date:      new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
      consultor: 'Joseph',
      obs:       `${qualificado ? '🔥 QUALIFICADO — foi para WhatsApp' : '⏳ Nutrição — aguardando contato'} | Prazo: ${labels.prazo} | Investimento: ${labels.investimento} | Campanha Europa Jun/25`,
    }

    leads.push(lead)
    localStorage.setItem('crm_leads', JSON.stringify(leads))
    localStorage.setItem('crm_next_id', String(nextId + 1))
  } catch (e) {
    console.error('Erro ao salvar no CRM:', e)
  }
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
export default function FunilEuropa() {
  const [step,    setStep]    = useState(0)   // 0=hero, 1-4=perguntas, 'q'=qualif, 'n'=nutrir, 'ok'=confirm
  const [answers, setAnswers] = useState({})
  const [labels,  setLabels]  = useState({})
  const [nome,    setNome]    = useState('')
  const [tel,     setTel]     = useState('')

  const answer = (key, val, label, next) => {
    const newA = { ...answers, [key]: val }
    const newL = { ...labels,  [key]: label }
    setAnswers(newA)
    setLabels(newL)
    if (next === 'result') {
      if (isQualificado(newA)) {
        salvarNoCRM({ nome: newL.perfil || 'Lead Qualificado', telefone: '', answers: newA, labels: newL, qualificado: true })
        setStep('q')
      }
      else setStep('n')
    } else {
      setStep(next)
    }
  }

  const buildWALink = () => {
    const msg = encodeURIComponent(
      `Olá! Vim da campanha Europa e quero saber mais sobre minha viagem.\n\n` +
      `📅 Prazo: ${labels.prazo}\n` +
      `👤 Perfil: ${labels.perfil}\n` +
      `🌍 Destino: ${labels.destino}\n` +
      `💰 Investimento: ${labels.investimento}`
    )
    return `https://wa.me/${WA_ESPECIALISTA}?text=${msg}`
  }

  const handleSubmitNurture = (e) => {
    e.preventDefault()
    if (!nome.trim() || !tel.trim()) return
    salvarNoCRM({ nome, telefone: tel, answers, labels })
    setStep('ok')
  }

  const restart = () => {
    setStep(0); setAnswers({}); setLabels({}); setNome(''); setTel('')
  }

  const progress = typeof step === 'number' && step > 0 ? (step / 4) * 100 : 0

  /* ── Estilos inline (sem dependência de Tailwind extra) ── */
  const s = {
    wrap:     { minHeight:'100vh', background:'#0E0A06', color:'#fff', fontFamily:"'Inter',sans-serif",
                display:'flex', flexDirection:'column', WebkitFontSmoothing:'antialiased' },
    header:   { position:'sticky', top:0, zIndex:50, height:64, display:'flex', alignItems:'center',
                justifyContent:'center', background:'rgba(14,10,6,0.92)', backdropFilter:'blur(16px)',
                borderBottom:'1px solid rgba(255,255,255,0.06)' },
    logo:     { fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:22, color:'#fff',
                letterSpacing:'-0.02em', textDecoration:'none' },
    heroBg:   { position:'fixed', inset:0, zIndex:0,
                background:"linear-gradient(to bottom, rgba(14,10,6,0.55) 0%, rgba(14,10,6,0.78) 60%, rgba(14,10,6,1) 100%), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=85&auto=format&fit=crop') center/cover no-repeat" },
    page:     { flex:1, display:'flex', justifyContent:'center', padding:'80px 20px 60px', position:'relative', zIndex:1 },
    quiz:     { width:'100%', maxWidth:520 },
    eyebrow:  { display:'inline-flex', alignItems:'center', gap:8, fontSize:11, fontWeight:600,
                letterSpacing:'0.18em', textTransform:'uppercase', color:'#F97316',
                border:'1px solid rgba(249,115,22,0.25)', borderRadius:99, padding:'6px 16px',
                marginBottom:24, background:'rgba(249,115,22,0.06)' },
    dot:      { width:6, height:6, background:'#F97316', borderRadius:'50%', animation:'pulse 2s infinite' },
    h1:       { fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(38px,9vw,68px)', fontWeight:500,
                lineHeight:1.06, letterSpacing:'-0.01em', marginBottom:18 },
    em:       { fontStyle:'italic', color:'#F97316' },
    sub:      { fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:1.65, marginBottom:36 },
    btnOrange:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%',
                padding:'16px 24px', background:'#F97316', color:'#fff',
                fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:700,
                border:'none', borderRadius:14, cursor:'pointer', letterSpacing:'0.01em',
                transition:'all .2s' },
    btnWA:    { display:'flex', alignItems:'center', justifyContent:'center', gap:9, width:'100%',
                padding:'15px 24px', background:'#22C55E', color:'#fff',
                fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:700,
                border:'none', borderRadius:14, cursor:'pointer', textDecoration:'none',
                transition:'all .2s' },
    btnGhost: { display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%',
                padding:'11px 20px', background:'transparent', color:'rgba(255,255,255,0.3)',
                fontSize:13, border:'1px solid rgba(255,255,255,0.08)', borderRadius:14,
                cursor:'pointer', marginTop:10, fontFamily:"'Inter',sans-serif" },
    progTrack:{ height:2, background:'rgba(255,255,255,0.07)', borderRadius:99, marginBottom:28 },
    progFill: { height:'100%', background:'#F97316', borderRadius:99, transition:'width .5s cubic-bezier(.22,1,.36,1)' },
    qLabel:   { fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#F97316', marginBottom:10 },
    qTitle:   { fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(24px,5vw,36px)', fontWeight:500, lineHeight:1.15, marginBottom:24 },
    option:   { display:'flex', alignItems:'center', gap:12, width:'100%', padding:'14px 16px',
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:14, cursor:'pointer', textAlign:'left', marginBottom:10,
                transition:'all .2s', color:'#fff', fontFamily:"'Inter',sans-serif" },
    optIcon:  { width:38, height:38, borderRadius:10, background:'rgba(249,115,22,0.08)',
                border:'1px solid rgba(249,115,22,0.18)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:17, flexShrink:0 },
    summary:  { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:14, padding:'16px 18px', marginBottom:20 },
    sumLabel: { fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase',
                color:'#F97316', marginBottom:12 },
    sumRow:   { display:'flex', justifyContent:'space-between', padding:'7px 0',
                borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 },
    input:    { width:'100%', padding:'13px 15px', background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, color:'#fff',
                fontFamily:"'Inter',sans-serif", fontSize:15, outline:'none', marginBottom:12 },
    fLabel:   { display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'rgba(255,255,255,0.45)', marginBottom:7 },
    trust:    { display:'flex', gap:16, marginTop:20, flexWrap:'wrap' },
    trustItem:{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,0.3)' },
  }

  const SummaryCard = () => (
    <div style={s.summary}>
      <div style={s.sumLabel}>Seu perfil de viagem</div>
      {[['Prazo', labels.prazo], ['Perfil', labels.perfil], ['Destino', labels.destino], ['Investimento', labels.investimento]].map(([k, v]) => (
        <div key={k} style={s.sumRow}>
          <span style={{ color:'rgba(255,255,255,0.45)' }}>{k}</span>
          <span style={{ fontWeight:600 }}>{v || '—'}</span>
        </div>
      ))}
    </div>
  )

  const Opt = ({ icon, title, sub, onClick }) => (
    <button style={s.option} onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.4)'; e.currentTarget.style.background='rgba(249,115,22,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.03)' }}>
      <div style={s.optIcon}>{icon}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:600 }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{sub}</div>}
      </div>
    </button>
  )

  return (
    <div style={s.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Poppins:wght@800&family=Inter:wght@400;500;600&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input::placeholder { color:rgba(255,255,255,0.2) !important; }
      `}</style>

      <div style={s.heroBg} />

      {/* Header */}
      <header style={s.header}>
        <a href="/" style={s.logo}>Next Plane</a>
      </header>

      <div style={s.page}>
        <div style={s.quiz}>

          {/* ── STEP 0: Hero ── */}
          {step === 0 && (
            <div>
              <div style={s.eyebrow}><span style={s.dot}/> Onde o sonho embarca e a realidade decola</div>
              <h1 style={s.h1}>Descubra sua<br /><em style={s.em}>viagem dos sonhos</em></h1>
              <p style={s.sub}>Responda 4 perguntas rápidas e nossa equipe monta o roteiro perfeito para você — com prioridade de atendimento.</p>
              <button style={s.btnOrange} onClick={() => setStep(1)}>
                ▶ Começar agora — 2 minutos
              </button>
              <div style={s.trust}>
                <span style={s.trustItem}><span style={{ color:'#F97316' }}>★</span> 4.9 no Google</span>
                <span style={s.trustItem}><span style={{ color:'#F97316' }}>✦</span> +500 famílias atendidas</span>
                <span style={s.trustItem}><span style={{ color:'#F97316' }}>✦</span> 50+ destinos</span>
              </div>
            </div>
          )}

          {/* ── PROGRESS ── */}
          {typeof step === 'number' && step >= 1 && step <= 4 && (
            <div style={{ marginBottom:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)' }}>Seu perfil de viagem</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#F97316' }}>{step} / 4</span>
              </div>
              <div style={s.progTrack}><div style={{ ...s.progFill, width:`${progress}%` }} /></div>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <div style={s.qLabel}>Pergunta 1 de 4</div>
              <div style={s.qTitle}>Quando você pretende viajar?</div>
              <Opt icon="⚡" title="Nos próximos 3 meses" sub="Viagem próxima, decisão urgente"    onClick={() => answer('prazo','curto','Nos próximos 3 meses', 2)} />
              <Opt icon="📅" title="De 3 a 6 meses"       sub="Planejando com antecedência"        onClick={() => answer('prazo','medio','De 3 a 6 meses', 2)} />
              <Opt icon="🌙" title="Sem data definida"     sub="Sonhando, explorando possibilidades" onClick={() => answer('prazo','longo','Sem data definida', 2)} />
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <div style={s.qLabel}>Pergunta 2 de 4</div>
              <div style={s.qTitle}>Qual o perfil dessa viagem?</div>
              <Opt icon="💑" title="Casal"            sub="Lua de mel, aniversário ou escapada a dois" onClick={() => answer('perfil','casal','Casal', 3)} />
              <Opt icon="👨‍👩‍👧‍👦" title="Família"          sub="Férias inesquecíveis com filhos"           onClick={() => answer('perfil','familia','Família', 3)} />
              <Opt icon="🎉" title="Grupo de amigos"  sub="Aventura e experiências compartilhadas"     onClick={() => answer('perfil','grupo','Grupo de amigos', 3)} />
              <Opt icon="🌍" title="Sozinho(a)"       sub="Liberdade e autodescoberta"                 onClick={() => answer('perfil','solo','Sozinho(a)', 3)} />
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div>
              <div style={s.qLabel}>Pergunta 3 de 4</div>
              <div style={s.qTitle}>Qual destino te interessa mais?</div>
              <Opt icon="🏰" title="Europa"                  sub="Paris, Roma, Lisboa, Barcelona…"           onClick={() => answer('destino','europa','Europa', 4)} />
              <Opt icon="🗽" title="Estados Unidos"          sub="Orlando, Miami, Nova York, Las Vegas…"     onClick={() => answer('destino','eua','Estados Unidos', 4)} />
              <Opt icon="🌴" title="Caribe / América Central" sub="Cancún, Punta Cana, Costa Rica…"          onClick={() => answer('destino','caribe','Caribe / América Central', 4)} />
              <Opt icon="🏔️" title="América do Sul"          sub="Bariloche, Buenos Aires, Machu Picchu…"   onClick={() => answer('destino','america_sul','América do Sul', 4)} />
              <Opt icon="🗺️" title="Ainda não decidi"        sub="Quero sugestões da equipe"                onClick={() => answer('destino','indeciso','Ainda não decidi', 4)} />
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div>
              <div style={s.qLabel}>Pergunta 4 de 4</div>
              <div style={s.qTitle}>Qual faixa de investimento você tem em mente?</div>
              <Opt icon="💚" title="Até R$ 5 mil"         sub="Por pessoa" onClick={() => answer('investimento','ate5k','Até R$ 5 mil','result')} />
              <Opt icon="✈️" title="R$ 5 mil a R$ 15 mil" sub="Por pessoa" onClick={() => answer('investimento','5a15k','R$ 5 mil a R$ 15 mil','result')} />
              <Opt icon="👑" title="Acima de R$ 15 mil"   sub="Experiência premium sem limites" onClick={() => answer('investimento','15kmais','Acima de R$ 15 mil','result')} />
              <Opt icon="🤔" title="Ainda não pesquisei"  sub="Quero entender as possibilidades" onClick={() => answer('investimento','naosei','Ainda não pesquisei','result')} />
            </div>
          )}

          {/* ── QUALIFICADO ── */}
          {step === 'q' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 20px',
                background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>✓</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,5vw,38px)', fontWeight:600, color:'#22C55E', marginBottom:12 }}>
                Você garantiu prioridade!
              </div>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:24 }}>
                Seu perfil tem prioridade no atendimento. Clique abaixo para falar agora com nosso especialista — sua resposta já vai junto.
              </p>
              <SummaryCard />
              <a href={buildWALink()} style={s.btnWA} target="_blank" rel="noopener noreferrer">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Falar com especialista agora
              </a>
              <button style={s.btnGhost} onClick={restart}>↩ Refazer o quiz</button>
            </div>
          )}

          {/* ── NÃO QUALIFICADO ── */}
          {step === 'n' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 20px',
                background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>⏳</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,5vw,38px)', fontWeight:600, marginBottom:12 }}>
                Recebemos seu interesse!
              </div>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:24 }}>
                Deixe seu nome e WhatsApp abaixo. Nossa equipe entra em contato em até 48 horas com novidades e condições especiais para o seu perfil.
              </p>
              <SummaryCard />
              <form onSubmit={handleSubmitNurture}>
                <div style={{ textAlign:'left' }}>
                  <label style={s.fLabel}>Seu nome</label>
                  <input style={s.input} type="text" placeholder="Como você se chama?" value={nome} onChange={e => setNome(e.target.value)} required />
                  <label style={s.fLabel}>WhatsApp com DDD</label>
                  <input style={s.input} type="tel" placeholder="(48) 99999-9999" value={tel}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g,'').slice(0,11)
                      if      (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`
                      else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`
                      else if (v.length > 0) v = `(${v}`
                      setTel(v)
                    }} required />
                </div>
                <button type="submit" style={s.btnOrange}>Enviar e entrar na lista</button>
              </form>
              <button style={s.btnGhost} onClick={restart}>↩ Refazer o quiz</button>
            </div>
          )}

          {/* ── CONFIRMAÇÃO ── */}
          {step === 'ok' && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, marginBottom:10 }}>
                Tudo certo!
              </div>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:24 }}>
                Recebemos seus dados e você já está no nosso CRM. Em até 48 horas nossa equipe vai te procurar com as melhores opções para sua viagem.
              </p>
              {isQuente(answers) && (
                <>
                  <p style={{ fontSize:13, color:'#F97316', marginBottom:16, fontWeight:600 }}>
                    🔥 Sua viagem é urgente! Quer falar agora com um especialista?
                  </p>
                  <a href={buildWALink()} style={{ ...s.btnWA, marginBottom:12 }}
                    target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Falar com especialista agora
                  </a>
                </>
              )}
              <button style={s.btnGhost} onClick={restart}>↩ Refazer o quiz</button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding:'28px 20px', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.06)', position:'relative', zIndex:1 }}>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>© 2025 Next Plane — Viagens & Experiências · CNPJ 54.108.033/0001-89</p>
      </footer>
    </div>
  )
}
