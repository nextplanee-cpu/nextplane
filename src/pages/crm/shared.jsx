/**
 * Next Plane CRM — constantes e pequenos componentes compartilhados entre CRM.jsx e o dashboard do funil.
 * (Movidos de CRM.jsx sem mudar comportamento, para o dashboard poder usar sem import circular.)
 */
import { T, num, Badge, Dot, Bar } from './ui'

export const STAGES = [
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
export const STAGE_MAP = { 3:2, 4:2, 7:6 }
export const stageOf = id => STAGES.find(s => s.id === id) || STAGES[0]
export const PERDIDO = 12

/* Motivos de perda — lista fixa para dar para comparar e somar nos relatórios */
export const MOTIVOS_PERDA = [
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
export const motivoOf = k => MOTIVOS_PERDA.find(m => m.k === k)

export const TEMP_C = { Frio:'#60A5FA', Morno:'#F59E0B', Quente:'#EF4444', VIP:'#D4AF37' }

export const fmtR = v => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`
export const fmtK = v => (v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits:1 })} mi` : v >= 1e4 ? `R$ ${Math.round(v / 1e3)} mil` : fmtR(v))

export const Temp = ({ t, small }) => (t ? <Badge color={TEMP_C[t] || T.muted} small={small}>{t}</Badge> : <span style={{ color:T.faint }}>—</span>)
export const Stage = ({ id, small, full }) => { const s = stageOf(id); return <Badge color={s.color} small={small}>{full ? s.name : s.short}</Badge> }

/* Lista de barras horizontais (rótulo, número, % e barra fina) */
export const BarList = ({ rows, color = 'rgba(212,175,55,0.75)', total }) => {
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
