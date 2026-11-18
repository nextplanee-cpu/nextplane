import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    text: 'Era minha primeira viagem internacional e eu tava com muito medo de contratar online. Joseph me atendeu no WhatsApp, tirou todas as dúvidas e organizou tudo. Voltei sem nenhum problema.',
    name: 'Jenifer Soares',
    dest: 'Europa — primeira viagem',
    avatar: 'J',
    color: '#F97316',
  },
  {
    text: 'Já fizemos a segunda viagem com eles. Preço justo, atendimento rápido e o roteiro exatamente do jeito que a gente pediu. Não troco por outra agência.',
    name: 'Rosemeri Ribeiro',
    dest: 'Maldivas & Dubai',
    avatar: 'R',
    color: '#F97316',
  },
  {
    text: 'Viajei com minha família pra Disney — 5 pessoas, criança pequena, tudo. Eles resolveram passagem, hotel, ingresso e transfer. A gente só foi aproveitar.',
    name: 'Felipe Borges',
    dest: 'Disney & Orlando',
    avatar: 'F',
    color: '#F97316',
  },
  {
    text: 'Precisei de visto com urgência e a Next Plane me ajudou do zero. Me ensinaram tudo, me acompanharam no processo e deu certo. Gratidão enorme.',
    name: 'Kleber Pereira',
    dest: 'Missão internacional',
    avatar: 'K',
    color: '#F97316',
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
        <div className="w-9 h-9 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
          {t.avatar}
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{t.name}</p>
          <p className="text-white/30 text-xs mt-0.5">{t.dest}</p>
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
        <div ref={titleRef} className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="font-poppins text-3xl sm:text-4xl font-bold text-white leading-[1.1]"
          >
            O que nossos clientes falam
          </motion.h2>
          <motion.a
            href="https://g.page/r/nextplane/review"
            target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="text-brand text-sm font-semibold hover:underline flex-shrink-0"
          >
            4.9★ no Google · Ver todos →
          </motion.a>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {testimonials.map((t, i) => <Card key={t.name + i} t={t} i={i} />)}
        </div>
      </div>
    </section>
  )
}
