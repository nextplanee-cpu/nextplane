/**
 * Porteiro do CRM — nada do CRM é carregado sem sessão válida.
 * Login por e-mail e senha; a sessão é um JWT em cookie httpOnly definido pelo servidor,
 * aqui só perguntamos "quem sou eu". No primeiro acesso (senha inicial) a troca de senha é obrigatória.
 */
import { useState, useEffect, useCallback } from 'react'
import { Lock, LogIn, ShieldCheck, KeyRound } from 'lucide-react'
import { sessionMe, login, logout, changePassword } from '../../lib/leadsApi'

const T = {
  bg: '#0B1220', card: '#111827', gold: '#D4AF37', text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.5)', err: '#EF4444', borderN: '1px solid rgba(255,255,255,0.07)',
}

const MSG = {
  invalid_credentials: 'E-mail ou senha inválidos.',
  not_allowed: 'Este e-mail não tem acesso ao CRM. Fale com o administrador.',
  too_many_attempts: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
  not_configured: 'O login ainda não foi configurado no servidor.',
  auth_unavailable: 'Serviço de login indisponível agora. Tente em instantes.',
  weak_password: 'A senha precisa ter pelo menos 10 caracteres.',
  same_password: 'A senha nova precisa ser diferente da atual.',
}

/* A versão anterior guardava uma chave única no navegador — apaga o resquício */
try { localStorage.removeItem('crm_access_key') } catch {}

const input = { width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.04)', border:T.borderN, borderRadius:8,
  padding:'11px 12px', color:T.text, fontSize:14, fontFamily:'inherit', outline:'none' }
const cardStyle = { background:T.card, border:T.borderN, borderTop:`3px solid ${T.gold}`, borderRadius:14, padding:28, width:380, maxWidth:'100%' }
const page = { minHeight:'100vh', background:T.bg, color:T.text, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Inter, sans-serif' }

export default function AuthGate({ children }) {
  const [state, setState] = useState({ loading: true, user: null })
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [nova,  setNova]  = useState('')
  const [nova2, setNova2] = useState('')
  const [busy,  setBusy]  = useState(false)
  const [err,   setErr]   = useState('')

  const check = useCallback(async () => {
    try {
      const { status, data } = await sessionMe()
      const ok = status === 200 && typeof data?.email === 'string' && ['admin', 'consultor'].includes(data?.role)
      setState({ loading: false, user: ok ? data : null })
      if (status === 403) setErr(MSG.not_allowed)
      if (status === 503) setErr(MSG.not_configured)
    } catch { setState({ loading: false, user: null }) }
  }, [])

  useEffect(() => { check() }, [check])

  /* Qualquer chamada que volte 401 derruba a sessão na tela */
  useEffect(() => {
    const onExpired = () => setState(s => (s.user ? { ...s, user: null } : s))
    window.addEventListener('crm:unauthorized', onExpired)
    return () => window.removeEventListener('crm:unauthorized', onExpired)
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (!email.trim() || !pass) return
    setBusy(true); setErr('')
    try {
      const user = await login(email.trim(), pass)
      setState(s => ({ ...s, user }))
      if (!user.trocar_senha) setPass('') // com troca obrigatória, a senha atual é reaproveitada na próxima tela
    } catch (e2) {
      setErr(MSG[e2.message] || 'Não foi possível entrar agora.')
    } finally { setBusy(false) }
  }

  const trocar = async e => {
    e.preventDefault()
    if (nova.length < 10) return setErr(MSG.weak_password)
    if (nova !== nova2) return setErr('As duas senhas não são iguais.')
    setBusy(true); setErr('')
    try {
      await changePassword(pass, nova)
      setPass(''); setNova(''); setNova2('')
      await check()
    } catch (e2) {
      setErr(MSG[e2.message] || 'Não foi possível salvar a senha agora.')
    } finally { setBusy(false) }
  }

  const signOut = async () => {
    await logout()
    setPass(''); setNova(''); setNova2('')
    setState(s => ({ ...s, user: null }))
  }

  if (state.loading) {
    return <div style={{ minHeight:'100vh', background:T.bg, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }}>Verificando acesso…</div>
  }
  if (state.user && !state.user.trocar_senha) return children(state.user, signOut)

  const botao = (rotulo, desabilitado, icone) => (
    <button type="submit" disabled={busy || desabilitado}
      style={{ width:'100%', marginTop:18, background:T.gold, color:'#0B1220', border:'none', borderRadius:8, padding:'11px',
        fontSize:14, fontWeight:700, cursor: busy ? 'wait' : 'pointer', opacity: busy || desabilitado ? 0.6 : 1,
        display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
      {icone}{busy ? 'Aguarde…' : rotulo}
    </button>
  )

  /* Senha inicial: obrigatório criar uma senha própria antes de usar o CRM */
  if (state.user?.trocar_senha) {
    return (
      <div style={page}>
        <form onSubmit={trocar} style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <KeyRound size={20} color={T.gold}/>
            <div style={{ fontSize:19, fontWeight:700 }}>Crie sua senha</div>
          </div>
          <p style={{ fontSize:13, color:T.muted, margin:'0 0 20px' }}>
            Olá, {state.user.nome}. Este é seu primeiro acesso: escolha uma senha só sua, com pelo menos 10 caracteres.
          </p>
          <label style={{ fontSize:12, color:T.muted }}>Senha atual (a inicial)</label>
          <input type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} style={{ ...input, margin:'6px 0 14px' }}/>
          <label style={{ fontSize:12, color:T.muted }}>Nova senha</label>
          <input type="password" autoComplete="new-password" value={nova} onChange={e => setNova(e.target.value)} style={{ ...input, margin:'6px 0 14px' }} autoFocus/>
          <label style={{ fontSize:12, color:T.muted }}>Repita a nova senha</label>
          <input type="password" autoComplete="new-password" value={nova2} onChange={e => setNova2(e.target.value)} style={{ ...input, marginTop:6 }}/>
          {err && <div role="alert" style={{ fontSize:12, color:T.err, marginTop:12 }}>{err}</div>}
          {botao('Salvar e entrar', !pass || !nova || !nova2)}
          <button type="button" onClick={signOut}
            style={{ background:'none', border:'none', color:T.muted, fontSize:12, cursor:'pointer', padding:0, marginTop:14, fontFamily:'inherit' }}>
            Sair
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={page}>
      <form onSubmit={submit} style={cardStyle}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <Lock size={20} color={T.gold}/>
          <div style={{ fontSize:19, fontWeight:700 }}>CRM Next Plane</div>
        </div>
        <p style={{ fontSize:13, color:T.muted, margin:'0 0 20px' }}>Acesso restrito à equipe. Entre com sua conta.</p>

        <label style={{ fontSize:12, color:T.muted }}>E-mail</label>
        <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}
          style={{ ...input, margin:'6px 0 14px' }} autoFocus/>
        <label style={{ fontSize:12, color:T.muted }}>Senha</label>
        <input type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)}
          style={{ ...input, marginTop:6 }}/>

        {err && <div role="alert" style={{ fontSize:12, color:T.err, marginTop:12 }}>{err}</div>}

        {botao('Entrar', !email.trim() || !pass, <LogIn size={15}/>)}

        <div style={{ fontSize:11, color:T.muted, marginTop:14 }}>Esqueceu a senha? Peça ao administrador para redefinir.</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:T.muted, marginTop:10 }}>
          <ShieldCheck size={12}/> Sessão protegida · expira após 12h sem uso
        </div>
      </form>
    </div>
  )
}
