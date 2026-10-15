/**
 * Next Plane — área do cliente: entra com CPF + senha e acompanha a viagem (somente leitura).
 * Rota: /cliente. No primeiro acesso a senha provisória precisa ser trocada antes de ver qualquer coisa.
 * A sessão é um JWT em cookie httpOnly; os dados vêm de /api/cliente, já filtrados no servidor.
 */
import { useEffect, useState, useCallback } from 'react'
import { LogIn, KeyRound, ShieldCheck } from 'lucide-react'
import { T, inputS, Card } from './crm/ui'
import { Casca, Aviso, Viagem } from './Acompanhar'
import { clienteMe, clienteLogin, clienteLogout, clienteSenha, clienteViagens } from '../lib/leadsApi'

const MSG = {
  invalid_credentials: 'CPF ou senha incorretos.',
  not_allowed: 'Este acesso está desativado. Fale com o seu consultor.',
  too_many_attempts: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
  not_configured: 'O acesso ainda não está disponível. Tente mais tarde.',
  weak_password: 'A senha precisa ter pelo menos 8 caracteres, com letras e números, e não pode conter o seu CPF.',
  same_password: 'A senha nova precisa ser diferente da atual.',
}

/* 12345678900 → 123.456.789-00 enquanto digita */
const mascara = v => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
}

const Titulo = ({ icon: Icon, children, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 34, height: 34, borderRadius: 8, background: T.goldSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} color={T.gold}/>
      </span>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>{children}</h1>
    </div>
    {sub && <p style={{ fontSize: 13, color: T.muted, margin: '10px 0 0', lineHeight: 1.6 }}>{sub}</p>}
  </div>
)

const Campo = ({ label, ...props }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <span style={{ display: 'block', fontSize: 12, color: T.muted, marginBottom: 6, fontWeight: 500 }}>{label}</span>
    <input {...props} style={{ ...inputS, padding: '11px 12px', fontSize: 15 }}/>
  </label>
)

const Botao = ({ children, busy, disabled }) => (
  <button type="submit" disabled={busy || disabled} className="np-gold"
    style={{ width: '100%', marginTop: 6, background: T.gold, color: '#0B1220', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 700,
      cursor: busy ? 'wait' : 'pointer', opacity: busy || disabled ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
    {busy ? 'Aguarde…' : children}
  </button>
)

export default function Cliente() {
  const [fase, setFase] = useState('carregando') // carregando | login | trocar | viagens
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [nova, setNova] = useState('')
  const [nova2, setNova2] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const [viagens, setViagens] = useState(null) // null = carregando
  const [atual, setAtual] = useState(0)

  useEffect(() => {
    document.title = 'Minha viagem | Next Plane'
    // index.html diz "index, follow" para o site; aqui a página é privada
    const meta = document.querySelector('meta[name="robots"]')
    const antes = meta?.content
    if (meta) meta.content = 'noindex, nofollow'
    return () => { if (meta) meta.content = antes }
  }, [])

  const carregarViagens = useCallback(async () => {
    setViagens(null)
    try { setViagens(await clienteViagens()); setFase('viagens') }
    catch (e) { if (e.status === 401 || e.status === 403) setFase('login'); else { setViagens([]); setFase('viagens') } }
  }, [])

  const verificar = useCallback(async () => {
    try {
      const { status, data } = await clienteMe()
      if (status !== 200) { setFase('login'); if (status === 403) setErro(MSG.not_allowed); return }
      setNome(String(data.nome || '').split(/\s+/)[0] || '')
      if (data.trocar_senha) setFase('trocar'); else carregarViagens()
    } catch { setFase('login') }
  }, [carregarViagens])

  useEffect(() => { verificar() }, [verificar])

  const entrar = async e => {
    e.preventDefault()
    setBusy(true); setErro('')
    try {
      const u = await clienteLogin(cpf, senha)
      setNome(String(u.nome || '').split(/\s+/)[0] || '')
      if (u.trocar_senha) setFase('trocar')
      else { setSenha(''); carregarViagens() }
    } catch (e2) { setErro(MSG[e2.message] || 'Não foi possível entrar agora.') }
    finally { setBusy(false) }
  }

  const trocar = async e => {
    e.preventDefault()
    if (nova !== nova2) return setErro('As duas senhas não são iguais.')
    setBusy(true); setErro('')
    try {
      await clienteSenha(senha, nova)
      setSenha(''); setNova(''); setNova2('')
      carregarViagens()
    } catch (e2) { setErro(MSG[e2.message] || 'Não foi possível salvar a senha agora.') }
    finally { setBusy(false) }
  }

  const sair = async () => {
    await clienteLogout()
    setSenha(''); setNova(''); setNova2(''); setViagens(null); setErro(''); setFase('login')
  }

  if (fase === 'carregando') return <Casca><Aviso titulo="Carregando…"/></Casca>

  if (fase === 'login') {
    return (
      <Casca>
        <Card style={{ padding: 26, maxWidth: 420, margin: '24px auto 0' }}>
          <form onSubmit={entrar}>
            <Titulo icon={LogIn} sub="Entre com o seu CPF e a senha que você recebeu do seu consultor para acompanhar a sua viagem.">Acompanhe sua viagem</Titulo>
            <Campo label="CPF" inputMode="numeric" autoComplete="username" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(mascara(e.target.value))} autoFocus/>
            <Campo label="Senha" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)}/>
            {erro && <div role="alert" style={{ fontSize: 13, color: T.err, margin: '0 0 12px' }}>{erro}</div>}
            <Botao busy={busy} disabled={cpf.replace(/\D/g, '').length !== 11 || !senha}><LogIn size={16}/> Entrar</Botao>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.faint, marginTop: 16 }}>
              <ShieldCheck size={13}/> Conexão protegida · Esqueceu a senha? Peça uma nova ao seu consultor.
            </div>
          </form>
        </Card>
      </Casca>
    )
  }

  if (fase === 'trocar') {
    return (
      <Casca sair={sair}>
        <Card style={{ padding: 26, maxWidth: 420, margin: '24px auto 0' }}>
          <form onSubmit={trocar}>
            <Titulo icon={KeyRound} sub={`${nome ? `Olá, ${nome}. ` : ''}Este é o seu primeiro acesso: crie uma senha só sua para continuar. Use pelo menos 8 caracteres, com letras e números.`}>Crie sua senha</Titulo>
            <Campo label="Senha provisória (a que você recebeu)" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)}/>
            <Campo label="Nova senha" type="password" autoComplete="new-password" value={nova} onChange={e => setNova(e.target.value)} autoFocus/>
            <Campo label="Repita a nova senha" type="password" autoComplete="new-password" value={nova2} onChange={e => setNova2(e.target.value)}/>
            {erro && <div role="alert" style={{ fontSize: 13, color: T.err, margin: '0 0 12px' }}>{erro}</div>}
            <Botao busy={busy} disabled={!senha || !nova || !nova2}><KeyRound size={16}/> Salvar e continuar</Botao>
          </form>
        </Card>
      </Casca>
    )
  }

  /* viagens */
  if (viagens === null) return <Casca sair={sair}><Aviso titulo="Carregando sua viagem…"/></Casca>
  if (!viagens.length) {
    return <Casca sair={sair}><Aviso titulo="Nenhuma viagem por aqui ainda" texto="Assim que o seu consultor liberar, ela aparece nesta página." wa/></Casca>
  }
  const v = viagens[Math.min(atual, viagens.length - 1)]
  return (
    <Casca sair={sair}>
      {viagens.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {viagens.map((x, i) => (
            <button key={x.id} type="button" onClick={() => setAtual(i)}
              style={{ background: i === atual ? T.goldSoft : 'transparent', color: i === atual ? T.gold : T.muted, fontFamily: 'inherit', cursor: 'pointer',
                border: `1px solid ${i === atual ? 'rgba(212,175,55,0.4)' : T.lineStrong}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600 }}>
              {x.destino || `Viagem ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      {v.pronta
        ? <Viagem key={v.id} v={v} fileUrl={fid => `/api/cliente?a=${encodeURIComponent(v.id)}&f=${encodeURIComponent(fid)}`}/>
        : <Aviso titulo="Estamos preparando a sua página" texto="Os detalhes da sua viagem aparecem aqui em breve." wa/>}
    </Casca>
  )
}
