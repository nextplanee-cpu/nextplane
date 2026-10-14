/**
 * Next Plane CRM — design system compartilhado (CRM, Assessorias).
 * Linha visual: CRM profissional (referências: Pipedrive, Attio, HubSpot, Linear, Travefy/Tern).
 *  - Paleta da marca (navy + dourado), mas o dourado é só para ação principal e item ativo
 *  - Cor por status vira um ponto pequeno ao lado do texto, não fundo colorido
 *  - Ícones de linha (lucide), sem emoji na interface
 *  - Botões sólidos e planos, cantos de 6–10px, números tabulares
 */
import { X } from 'lucide-react'

export const T = {
  bg: '#0B1220', card: '#111827', header: '#0d1628', raised: '#162033',
  gold: '#D4AF37', goldH: '#E2C25A', goldSoft: 'rgba(212,175,55,0.12)',
  text: '#E8EBF2', muted: 'rgba(232,235,242,0.58)', faint: 'rgba(232,235,242,0.36)',
  line: 'rgba(255,255,255,0.07)', lineStrong: 'rgba(255,255,255,0.12)', hover: 'rgba(255,255,255,0.035)',
  success: '#22C55E', warn: '#F59E0B', err: '#EF4444', info: '#3B82F6',
  border: '1px solid rgba(255,255,255,0.07)',
  borderN: '1px solid rgba(255,255,255,0.07)',
  r: 8, rCard: 10,
}

export const num = { fontVariantNumeric: 'tabular-nums' }

export const inputS = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.lineStrong}`,
  borderRadius: 6, padding: '8px 10px', color: T.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
}

/* Estilos globais (fonte, foco, scroll, hover de linha) — incluir uma vez no topo do CRM */
export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
    .crm-root, .crm-root * { box-sizing:border-box; }
    .crm-root { font-family:'Manrope',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
    .crm-root input::placeholder, .crm-root textarea::placeholder { color:rgba(232,235,242,0.3); }
    .crm-root select option { background:#111827; color:#E8EBF2; }
    .crm-root input:focus, .crm-root select:focus, .crm-root textarea:focus { border-color:rgba(212,175,55,0.55) !important; box-shadow:0 0 0 3px rgba(212,175,55,0.12); }
    .crm-root button:focus-visible, .crm-root a:focus-visible { outline:2px solid rgba(212,175,55,0.6); outline-offset:2px; }
    .crm-scroll, .ass-scroll { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.14) transparent; }
    .crm-scroll::-webkit-scrollbar, .ass-scroll::-webkit-scrollbar { width:8px; height:8px; }
    .crm-scroll::-webkit-scrollbar-thumb, .ass-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:8px; }
    .crm-scroll::-webkit-scrollbar-thumb:hover, .ass-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.22); }
    .crm-row:hover { background:rgba(255,255,255,0.03); }
    .crm-hover:hover { border-color:rgba(255,255,255,0.16) !important; }
    .crm-btn:hover:not(:disabled) { filter:brightness(1.08); }
    .crm-ghost:hover:not(:disabled) { background:rgba(255,255,255,0.05) !important; }
  `}</style>
)

export const Dot = ({ color, size = 7 }) => (
  <span style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }}/>
)

/* Etiqueta neutra com ponto colorido (status, estágio, temperatura) */
export const Badge = ({ children, color = T.muted, small, dot = true }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '1px 7px' : '2px 9px',
    borderRadius: 6, fontSize: small ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: '18px',
    background: 'rgba(255,255,255,0.04)', color: T.text, border: `1px solid ${T.line}` }}>
    {dot && <Dot color={color} size={small ? 6 : 7}/>}{children}
  </span>
)

export const Card = ({ children, style, onClick, className }) => (
  <div onClick={onClick} className={className}
    style={{ background: T.card, borderRadius: T.rCard, border: `1px solid ${T.line}`, padding: 18, ...style }}>
    {children}
  </div>
)

/* Título de seção dentro de um card */
export const CardTitle = ({ icon: Icon, children, right, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: T.text }}>
      {Icon && <Icon size={15} color={T.muted} strokeWidth={1.8}/>}{children}
    </div>
    {right}
  </div>
)

/* Botões: primário (dourado), outline (neutro), ghost, danger */
export const Btn = ({ children, onClick, outline, ghost, danger, small, style, disabled, title, type = 'button' }) => {
  const kind = danger ? 'danger' : outline ? 'outline' : ghost ? 'ghost' : 'primary'
  const base = {
    primary: { background: T.gold, color: '#0B1220', border: `1px solid ${T.gold}` },
    outline: { background: 'transparent', color: T.text, border: `1px solid ${T.lineStrong}` },
    ghost:   { background: 'transparent', color: T.muted, border: '1px solid transparent' },
    danger:  { background: 'transparent', color: '#F87171', border: '1px solid rgba(239,68,68,0.35)' },
  }[kind]
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={kind === 'primary' ? 'crm-btn' : 'crm-ghost'}
      style={{ ...base, padding: small ? '5px 10px' : '7px 14px', borderRadius: 6, fontWeight: 600,
        fontSize: small ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        lineHeight: '18px', transition: 'background .15s, filter .15s', ...style }}>
      {children}
    </button>
  )
}

/* Botão só com ícone */
export const IconBtn = ({ icon: Icon, onClick, title, danger, size = 15, style }) => (
  <button type="button" onClick={onClick} title={title} aria-label={title} className="crm-ghost"
    style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 6, padding: 6, cursor: 'pointer',
      color: danger ? '#F87171' : T.muted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <Icon size={size} strokeWidth={1.8}/>
  </button>
)

export const Label = ({ children }) => (
  <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, display: 'block', marginBottom: 5 }}>{children}</label>
)

export const Field = ({ label, value, onChange, type = 'text', ph, list }) => (
  <div>
    {label && <Label>{label}</Label>}
    <input type={type} value={value ?? ''} placeholder={ph} list={list}
      onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      style={inputS}/>
  </div>
)

export const Select = ({ label, value, onChange, opts }) => (
  <div>
    {label && <Label>{label}</Label>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputS, background: T.card, cursor: 'pointer' }}>
      {opts.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>)}
    </select>
  </div>
)

export const Bar = ({ pct, color = T.gold, height = 4 }) => (
  <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: height, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%`, background: color, borderRadius: height, transition: 'width .3s' }}/>
  </div>
)

/* Iniciais com tom suave da cor do cliente */
export const Avatar = ({ initials, color = '#64748B', size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}26`, color,
    border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.round(size * 0.36), fontWeight: 700, flexShrink: 0, letterSpacing: '-0.3px' }}>
    {initials}
  </div>
)

/* Cabeçalho de página: título, subtítulo e ações à direita */
export const PageHeader = ({ title, sub, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.2px', color: T.text }}>{title}</h1>
      {sub && <p style={{ color: T.muted, fontSize: 13, margin: '4px 0 0' }}>{sub}</p>}
    </div>
    {children && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
  </div>
)

/* Indicador: rótulo em cima, número grande neutro, detalhe embaixo */
export const Kpi = ({ label, value, hint, tone, icon: Icon }) => (
  <Card style={{ padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{label}</span>
      {Icon && <Icon size={15} color={T.faint} strokeWidth={1.8}/>}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: tone || T.text, letterSpacing: '-0.4px', ...num }}>{value}</div>
    {hint && <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>{hint}</div>}
  </Card>
)

export const KpiGrid = ({ children, min = 170, style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12, ...style }}>{children}</div>
)

/* Tabela: cabeçalho discreto, linhas com divisória fina */
export const th = { padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.faint, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${T.line}`, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.015)' }
export const td = { padding: '11px 14px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }

export const Empty = ({ icon: Icon, title, children }) => (
  <div style={{ textAlign: 'center', padding: '44px 20px', color: T.muted }}>
    {Icon && <Icon size={26} color={T.faint} strokeWidth={1.5} style={{ marginBottom: 10 }}/>}
    {title && <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 4 }}>{title}</div>}
    <div style={{ fontSize: 13 }}>{children}</div>
  </div>
)

/* Abas sublinhadas (filtros de período, seções) */
export const Segmented = ({ value, onChange, opts }) => (
  <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.line}`, borderRadius: 7, padding: 2 }}>
    {opts.map(([k, l]) => (
      <button key={k} type="button" onClick={() => onChange(k)}
        style={{ background: value === k ? T.raised : 'transparent', color: value === k ? T.text : T.muted,
          border: 'none', borderRadius: 5, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        {l}
      </button>
    ))}
  </div>
)

/* Janela central */
export const Modal = ({ title, sub, onClose, width = 480, children, footer, busy }) => (
  <div onClick={() => !busy && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,15,0.72)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
    <div onClick={e => e.stopPropagation()} className="crm-scroll" role="dialog" aria-modal="true"
      style={{ background: T.card, borderRadius: 12, width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        border: `1px solid ${T.lineStrong}`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '18px 20px 0' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{sub}</div>}
        </div>
        <IconBtn icon={X} onClick={onClose} title="Fechar"/>
      </div>
      <div style={{ padding: '16px 20px 20px' }}>{children}</div>
      {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${T.line}` }}>{footer}</div>}
    </div>
  </div>
)

/* Painel lateral (detalhe de registro, padrão Pipedrive/Attio) */
export const Drawer = ({ onClose, width = 520, children }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,15,0.55)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
    <div onClick={e => e.stopPropagation()} className="crm-scroll" role="dialog" aria-modal="true"
      style={{ width, maxWidth: '100%', height: '100%', overflowY: 'auto', background: T.card,
        borderLeft: `1px solid ${T.lineStrong}`, boxShadow: '-24px 0 60px rgba(0,0,0,0.45)' }}>
      {children}
    </div>
  </div>
)
