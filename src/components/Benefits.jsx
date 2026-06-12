import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  HeartHandshake, Globe2, Clock, Sparkles, ShieldCheck, MapPin
} from 'lucide-react'

const benefits = [
  {
    icon: HeartHandshake,
    title: 'Atendimento Personalizado',
    desc: 'Cada família e casal é único. Seu especialista dedicado conhece seus sonhos e cria a viagem perfeita para você.',
    color: '#FF5C00',
  },
  {
    icon: Globe2,
    title: 'Roteiros Exclusivos',
    desc: 'Acesso a experiências únicas e destinos premium que não estão nos pacotes convencionais de qualquer agência.',
    color: '#3B82F6',
  },
  {
    icon: Clock,
    title: 'Suporte 24h',
    desc: 'Nossa equipe está ao seu lado antes, durante e após a viagem. Qualquer dúvida ou imprevisto, resolveremos juntos.',
    color: '#10B981',
  },
  {
    icon: Sparkles,
    title: 'Experiências Premium',
    desc: 'Hotéis selecionados, restaurantes especiais e momentos únicos curados com carinho para tornar tudo inesquecível.',
    color: '#8B5CF6',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança e Confiança',
    desc: 'Agência verificada, centenas de famílias atendidas e operações 100% transparentes. Você embarca com tranquilidade.',
    color: '#EC4899',
  },
  {
    icon: MapPin,
    title: 'Destinos para Todos',
    desc: 'Do inverno na Patagônia às praias das Maldivas. Montamos roteiros para todos os perfis e orçamentos.',
    color: '#F59E0B',
  },
]

function Card({ b, i }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative p-6 rounded-2xl bg-[#161616] ring-1 ring-white/5 card-hover group"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: `${b.color}12` }}
      >
        <b.icon size={22} style={{ color: b.color }} />
      </div>
      <h3 className="font-poppins font-bold text-white text-base mb-3">{b.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${b.color}60, transparent)` }}
      />
    </motion.div>
  )
}

export default function Benefits() {
  const titleRef = useRef(null)
  const inView = useInView(titleRef, { once: true, margin: '-60px' })

  return (
    <section id="servicos" className="py-24 sm:py-32 relative bg-[#111111]/60">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="inline-block text-[#FF5C00] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Nossos Diferenciais
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="font-poppins text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4"
          >
            A diferença que você
            <br />
            <span className="text-brand-gradient">vai sentir.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Cuidamos de cada detalhe para que você viaje com tranquilidade e viva experiências que marcam para sempre.
          </motion.p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => <Card key={b.title} b={b} i={i} />)}
        </div>
      </div>
    </section>
  )
}
