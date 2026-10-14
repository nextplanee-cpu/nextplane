/**
 * Porteiro do CRM — nada do CRM é carregado sem sessão válida.
 * Login por e-mail/senha (Supabase Auth) e, se ligado, Google (OAuth2).
 * A sessão é um cookie httpOnly definido pelo servidor; aqui só perguntamos "quem sou eu".
 */
import { useState, useEffect, useCallback } from 'react'
import { Lock, LogIn, ShieldCheck, KeyRound, Mail } from 'lucide-react'
import { sessionMe, login, logout, forgotPassword, resetPassword } from '../../lib/leadsApi'

const T = {
  bg: '#0B1220', card: '#111827', gold: '#D4AF37', text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.5)', err: '#EF4444', borderN: '1px solid rgba(255,255,255,0.07)',
}

const MSG = {
  invalid_credentials: 'E-mail ou senha inválidos.',
  not_allowed: 'Este e-mail não tem acesso ao CRM. Fale com o administrador.',
  nao_autorizado: 'Esta conta Google não tem acesso ao CRM.',
  google: 'Não foi possível entrar com o Google. Tente de novo.',
  too_many_attempts: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
  not_configured: 'O login ainda não foi configurado no servidor.',
  auth_unavailable: 'Serviço de login indisponível agora. Tente em instantes.',
  link_expired: 'Este link de troca de senha expirou ou já foi usado. Peça um novo.',
  weak_password: 'A senha precisa ter pelo menos 10 caracteres.',
  same_password: 'A senha nova precisa ser diferente da atual.',
}

/* A versão anterior guardava uma chave única no navegador — apaga o resquício */
try { localStorage.removeItem('crm_access_key') } catch {}

export default function AuthGate({ children }) {
  const [state, setState] = useState({ loading: true, user: null, google: false })
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [busy,  setBusy]  = useState(false)
  const [err,   setErr]   = useState(() => {
    const e = new URLSearchParams(window.location.search).get('erro')
    if (e) return MSG[e] || 'Não foi possível entrar.'
    return /error_code=|error=/.test(window.location.hash) ? MSG.link_expired : ''
  })
  /* Link do e-mail de troca de senha chega como /crm#access_token=…&type=recovery */
  const [recovery] = useState(() => {
    const h = new URLSearchParams(window.location.hash.slice(1))
    return h.get('type') === 'recovery' && h.get('access_token') ? h.get('access_token') : ''
  })
  const [mode,  setMode]  = useState(recovery ? 'reset' : 'login') // login | forgot | sent | reset | done
  const [pass2, setPass2] = useState('')
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, '', '/crm') }, [])

  const check = useCallback(async () => {
    try {
      const { status, data } = await sessionMe()
      const ok = status === 200 && typeof data?.email === 'string' && ['admin', 'consultor'].includes(data?.role)
      setState({ loading: false, user: ok ? data : null, google: Boolean(data?.google) })
      if (status === 403) setErr(MSG.not_allowed)
      if (status === 503) setErr(MSG.not_configured)
    } catch { setState({ loading: false, user: null, google: false }) }
  }, [])

  useEffect(() => {
    check()
    if (window.location.search.includes('erro=')) window.history.replaceState(null, '', '/crm')
  }, [check])

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
      setPass('')
      setState(s => ({ ...s, user }))
    } catch (e2) {
      setErr(MSG[e2.message] || 'Não foi possível entrar agora.')
    } finally { setBusy(false) }
  }

  const signOut = async () => {
    await logout()
    setState(s => ({ ...s, user: null }))
  }

  if (state.loading) {
    return <div style={{ minHeight:'100vh', background:T.bg, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }}>Verificando acesso…</div>
  }
  if (state.user && mode !== 'reset') return children(state.user, signOut)

  const input = { width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.04)', border:T.borderN, borderRadius:8,
    padding:'11px 12px', color:T.text, fontSize:14, fontFamily:'inherit', outline:'none' }

  if (mode !== 'login') {
    const pedir = async e => {
      e.preventDefault()
      if (!email.trim()) return
      setBusy(true); setErr('')
      try { await forgotPassword(email.trim()); setMode('sent') }
      catch (e2) { setErr(MSG[e2.message] || 'Não foi possível enviar agora. Tente em instantes.') }
      finally { setBusy(false) }
    }
    const salvar = async e => {
      e.preventDefault()
      if (pass.length < 10) return setErr(MSG.weak_password)
      if (pass !== pass2) return setErr('As duas senhas não são iguais.')
      setBusy(true); setErr('')
      try { await resetPassword(recovery, pass); setPass(''); setPass2(''); setMode('done') }
      catch (e2) { setErr(MSG[e2.message] || 'Não foi possível salvar a senha agora.') }
      finally { setBusy(false) }
    }
    const voltar = () => { setMode('login'); setErr(''); setPass(''); setPass2('') }
    const link = { background:'none', border:'none', color:T.gold, fontSize:12, cursor:'pointer', padding:0, fontFamily:'inherit', marginTop:16 }
    const btn = (label, disabled) => (
      <button type="submit" disabled={busy || disabled}
        style={{ width:'100%', marginTop:18, background:T.gold, color:'#0B1220', border:'none', borderRadius:8, padding:'11px',
          fontSize:14, fontWeight:700, cursor: busy ? 'wait' : 'pointer', opacity: busy || disabled ? 0.6 : 1, fontFamily:'inherit' }}>
        {busy ? 'Aguarde…' : label}
      </button>
    )
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, fontFamily:'Inter, sans-serif' }}>
        <form onSubmit={mode === 'forgot' ? pedir : mode === 'reset' ? salvar : e => { e.preventDefault(); voltar() }}
          style={{ background:T.card, border:T.borderN, borderTop:`3px solid ${T.gold}`, borderRadius:14, padding:28, width:380, maxWidth:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            {mode === 'sent' ? <Mail size={20} color={T.gold}/> : <KeyRound size={20} color={T.gold}/>}
            <div style={{ fontSize:19, fontWeight:700 }}>
              {mode === 'forgot' ? 'Esqueci minha senha' : mode === 'sent' ? 'Confira seu e-mail' : mode === 'reset' ? 'Criar nova senha' : 'Senha alterada'}
            </div>
          </div>

          {mode === 'forgot' && <>
            <p style={{ fontSize:13, color:T.muted, margin:'0 0 20px' }}>Digite o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.</p>
            <label style={{ fontSize:12, color:T.muted }}>E-mail</label>
            <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} style={{ ...input, marginTop:6 }} autoFocus/>
            {err && <div role="alert" style={{ fontSize:12, color:T.err, marginTop:12 }}>{err}</div>}
            {btn('Enviar link', !email.trim())}
          </>}

          {mode === 'sent' && <>
            <p style={{ fontSize:13, color:T.muted, margin:'0 0 8px', lineHeight:1.6 }}>
              Se <b style={{ color:T.text }}>{email.trim()}</b> tiver acesso ao CRM, o link chega em alguns minutos.
              Abra o e-mail <b style={{ color:T.text }}>neste mesmo aparelho</b> e clique no link. Confira também o spam.
            </p>
            <p style={{ fontSize:12, color:T.muted, margin:0 }}>O link vale por 1 hora e só pode ser usado uma vez.</p>
            {btn('Voltar para o login')}
          </>}

          {mode === 'reset' && <>
            <p style={{ fontSize:13, color:T.muted, margin:'0 0 20px' }}>Escolha uma senha forte, com pelo menos 10 caracteres.</p>
            <label style={{ fontSize:12, color:T.muted }}>Nova senha</label>
            <input type="password" autoComplete="new-password" value={pass} onChange={e => setPass(e.target.value)} style={{ ...input, margin:'6px 0 14px' }} autoFocus/>
            <label style={{ fontSize:12, color:T.muted }}>Repita a nova senha</label>
            <input type="password" autoComplete="new-password" value={pass2} onChange={e => setPass2(e.target.value)} style={{ ...input, marginTop:6 }}/>
            {err && <div role="alert" style={{ fontSize:12, color:T.err, marginTop:12 }}>{err}</div>}
            {btn('Salvar nova senha', !pass || !pass2)}
          </>}

          {mode === 'done' && <>
            <p style={{ fontSize:13, color:T.muted, margin:0 }}>Pronto! Agora entre no CRM com a senha nova.</p>
            {btn('Ir para o login')}
          </>}

          {(mode === 'forgot' || (mode === 'reset' && err === MSG.link_expired)) &&
            <button type="button" onClick={mode === 'forgot' ? voltar : () => { setErr(''); setMode('forgot') }} style={link}>
              {mode === 'forgot' ? '← Voltar para o login' : 'Pedir um novo link'}
            </button>}
        </form>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, fontFamily:'Inter, sans-serif' }}>
      <form onSubmit={submit} style={{ background:T.card, border:T.borderN, borderTop:`3px solid ${T.gold}`, borderRadius:14,
        padding:28, width:380, maxWidth:'100%' }}>
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

        <button type="button" onClick={() => { setErr(''); setMode('forgot') }}
          style={{ background:'none', border:'none', color:T.gold, fontSize:12, cursor:'pointer', padding:0, marginTop:8, fontFamily:'inherit' }}>
          Esqueci minha senha
        </button>

        {err && <div role="alert" style={{ fontSize:12, color:T.err, marginTop:12 }}>{err}</div>}

        <button type="submit" disabled={busy || !email.trim() || !pass}
          style={{ width:'100%', marginTop:18, background:T.gold, color:'#0B1220', border:'none', borderRadius:8, padding:'11px',
            fontSize:14, fontWeight:700, cursor: busy ? 'wait' : 'pointer', opacity: busy || !email.trim() || !pass ? 0.6 : 1,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
          <LogIn size={15}/> {busy ? 'Entrando…' : 'Entrar'}
        </button>

        {state.google && (
          <a href="/api/auth?action=google"
            style={{ width:'100%', boxSizing:'border-box', marginTop:10, background:'transparent', color:T.text, border:T.borderN,
              borderRadius:8, padding:'11px', fontSize:14, fontWeight:600, textDecoration:'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            Entrar com Google
          </a>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:T.muted, marginTop:18 }}>
          <ShieldCheck size={12}/> Sessão protegida · expira após 12h sem uso
        </div>
      </form>
    </div>
  )
}
