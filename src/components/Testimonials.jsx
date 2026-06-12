import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    text: 'Experiência incrível. Joseph e Maria nos acompanharam durante toda a viagem. Era minha primeira viagem e esse suporte foi fundamental. Super recomendo!',
    name: 'Jenifer Soares',
    role: 'Primeira viagem internacional',
    avatar: 'J',
    color: '#7C3AED',
  },
  {
    text: 'Sensacional! Eles são muito atenciosos — além de uma viagem incrível, dão suporte e tiram todas as dúvidas pelo WhatsApp. Com certeza a melhor agência!',
    name: 'Rebeka Gabriela',
    role: 'Cliente fiel',
    avatar: 'R',
    color: '#059669',
  },
  {
    text: 'Já fiz a segunda viagem com eles — experiência internacional incrível, suporte total durante a viagem. Preço justo e acessível. Não troco por outra agência!',
    name: 'Rosemeri de Fatima Ribeiro',
    role: 'Segunda viagem com a Next Plane',
    avatar: 'R',
    color: '#DC2626',
  },
  {
    text: 'Foi super tranquilo — muito atenciosos e pacientes. Me deram dicas incríveis por ser a primeira vez viajando de avião. Indico para todo mundo!',
    name: 'Felipe Borges',
    role: 'Primeira viagem de avião',
    avatar: 'F',
    color: '#1D4ED8',
  },
  {
    text: 'É uma empresa de Deus! Me ajudaram a viajar com passagens em conta para cumprir minha missão de ajudar outras pessoas. Bênçãos sobre essa empresa!',
    name: 'Kleber Pereira',
    role: 'Médico Missionário',
    avatar: 'K',
    color: '#0891B2',
  },
  {
    text: 'Atendimento incrível desde a compra até o check-in — a gente não se preocupa com NADA, só arruma as malas e embarca. Eles desenrolam tudo!',
    name: 'Ana Helen Ferreira',
    role: 'Viagem internacional',
    avatar: 'A',
    color: '#B45309',
  },
  {
    text: 'Melhor atendimento — ajudou muito em todo o processo e valores incríveis! Recomendo demais.',
    name: 'Rick Ramos',
    role: 'Buenos Aires, Argentina',
    avatar: 'R',
    color: '#6D28D9',
  },
  {
    text: 'Recomendo — fui muito bem atendido, tive todo suporte até a viagem.',
    name: 'Edenilsom Borges',
    role: 'Passagens Aéreas',
    avatar: 'E',
    color: '#0F766E',
  },
  {
    text: 'Minha experiência foi maravilhosa. 😍👏',
    name: 'Mara Brasil',
    role: 'Destino Internacional',
    avatar: 'M',
    color: '#BE185D',
  },
]

function Stars() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[1,2,3,4,5].map(i => <Star key={i} size={11} fill="#F97316" className="text-brand" />)}
    </div>
  )
}

function Card({ t, i }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col p-6 rounded-2xl bg-card border border-white/5
                 hover:border-white/10 transition-all duration-300"
    >
      <Stars />
      <p className="text-white/60 text-[14px] leading-[1.75] flex-1 mb-5">"{t.text}"</p>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}25` }}
        >
          {t.avatar}
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{t.name}</p>
          <p className="text-white/30 text-xs mt-0.5">{t.role}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  const titleRef = useRef(null)
  const inView   = useInView(titleRef, { once: true, margin: '-60px' })

  return (
    <section id="depoimentos" className="py-24 sm:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

        {/* Header */}
        <div ref={titleRef} className="mb-14 max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
          >
            Depoimentos reais
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.07 }}
            className="font-poppins text-4xl sm:text-5xl font-bold text-white leading-[1.1]"
          >
            Quem viajou com a Next Plane,
            <br />
            <span className="text-brand">voltou.</span>{' '}
            <span className="font-light font-serif italic text-white/50 text-3xl sm:text-4xl">E contou.</span>
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => <Card key={t.name + i} t={t} i={i} />)}
        </div>
      </div>
    </section>
  )
}
