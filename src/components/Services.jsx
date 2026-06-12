import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Heart, Briefcase, Globe } from 'lucide-react'

const PHONE = '5548988636608'

const services = [
  {
    icon: Users,
    title: 'Viagem em Família',
    desc: 'Roteiros pensados para todas as idades — desde a escolha do hotel até os parques temáticos. Você relaxa, nós organizamos tudo.',
    tag: 'Disney · Cancún · Europa',
    color: '#F97316',
    msg: 'Olá! Vim pelo site da Next Plane e quero planejar uma viagem em família. 👨‍👩‍👧✈️',
    bg: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=800&q=85',
  },
  {
    icon: Heart,
    title: 'Lua de Mel & Casais',
    desc: 'Experiências únicas e românticas — Maldivas, Paris, Santorini. Cada detalhe pensado para o momento mais especial da vida.',
    tag: 'Maldivas · Paris · Santorini',
    color: '#EC4899',
    msg: 'Olá! Vim pelo site da Next Plane e quero planejar minha lua de mel. 💑✈️',
    bg: 'https://images.unsplash.com/photo-1602002418209-55d7a55adf42?auto=format&fit=crop&w=800&q=85',
  },
  {
    icon: Briefcase,
    title: 'Viagem Corporativa',
    desc: 'Passagens, hospedagem e transfers para executivos e equipes. Agilidade, relatórios e custo-benefício sem burocracia.',
    tag: 'Nacionais · Internacionais',
    color: '#3B82F6',
    msg: 'Olá! Vim pelo site da Next Plane e preciso de suporte para viagens corporativas. 💼✈️',
    bg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=85',
  },
  {
    icon: Globe,
    title: 'Grupos & Vistos',
    desc: 'Organizamos viagens em grupo e assessoramos na documentação para vistos. Do passaporte ao embarque, cuidamos de tudo.',
    tag: 'Grupos · Vistos · Documentação',
    color: '#10B981',
    msg: 'Olá! Vim pelo site da Next Plane e preciso de ajuda com viagem em grupo ou visto. 🌍✈️',
    bg: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=85',
  },
]

function ServiceCard({ s, i }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const link   = `https://wa.me/${PHONE}?text=${encodeURIComponent(s.msg)}`

  return (
    <motion.a
      ref={ref}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer block"
      style={{ minHeight: 280 }}
    >
      {/* Foto de fundo */}
      <img
        src={s.bg}
        alt={s.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20
                      group-hover:from-black/95 transition-all duration-500" />
      {/* Cor da categoria no topo */}
      <div className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: s.color }} />

      {/* Conteúdo */}
      <div className="relative h-full flex flex-col justify-end p-6 sm:p-7">
        {/* Ícone */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${s.color}20`, border: `1px solid ${s.color}30` }}
        >
          <s.icon size={20} style={{ color: s.color }} />
        </div>

        <h3 className="font-poppins text-xl font-bold text-white mb-2 leading-tight">
          {s.title}
        </h3>
        <p className="text-white/55 text-[13px] leading-relaxed mb-4">
          {s.desc}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}25` }}>
            {s.tag}
          </span>
          <span className="text-white/0 group-hover:text-white/70 text-xs font-medium
                           translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            Solicitar →
          </span>
        </div>
      </div>
    </motion.a>
  )
}

export default function Services() {
  const titleRef = useRef(null)
  const inView   = useInView(titleRef, { once: true, margin: '-60px' })

  return (
    <section id="servicos" className="py-20 sm:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

        {/* Header */}
        <div ref={titleRef} className="mb-12">
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
          >
            O que a gente faz
          </motion.p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.07 }}
              className="font-poppins text-4xl sm:text-5xl font-bold text-white leading-[1.1]"
            >
              Para cada tipo de viajante,
              <br />
              <span className="text-brand">uma experiência única.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.15 }}
              className="text-white/35 text-sm max-w-[200px] sm:text-right leading-[1.7]"
            >
              Clique no seu perfil e receba uma proposta personalizada.
            </motion.p>
          </div>
        </div>

        {/* Grid 2x2 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <ServiceCard key={s.title} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
