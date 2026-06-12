import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Heart, Sparkles, Camera, MessageCircle, ArrowRight, CheckCircle2, Star } from 'lucide-react'
import { WA_EXPERIENCIAS } from '../lib/whatsapp'

const experiences = [
  {
    icon: Users,
    title: 'Viagens em Família',
    desc: 'Roteiros pensados para cada membro da família, com atividades para crianças e adultos. Segurança, conforto e diversão do início ao fim.',
    color: '#FF5C00',
    img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: Heart,
    title: 'Lua de Mel & Casais',
    desc: 'Destinos românticos com hotéis boutique, jantares especiais e experiências únicas para celebrar o amor ao redor do mundo.',
    color: '#EC4899',
    img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: Sparkles,
    title: 'Experiências de Inverno',
    desc: 'Ski, neve e paisagens de tirar o fôlego. Bariloche, Alpes e muito mais — escolha o seu inverno dos sonhos.',
    color: '#3B82F6',
    img: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: Camera,
    title: 'Roteiros Culturais',
    desc: 'Europa, América do Sul e além. Tours com guias especializados, museus, gastronomia local e imersão total na cultura.',
    color: '#8B5CF6',
    img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
  },
]

const highlights = [
  'Atendimento 24h durante toda a viagem',
  'Hotéis selecionados e verificados pela equipe',
  'Transfers privativos e traslados organizados',
  'Seguro viagem e suporte completo',
  'Roteiro personalizado para seu perfil',
]

function ExperienceCard({ exp, i }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-3xl overflow-hidden ring-1 ring-white/5
                 hover:ring-white/15 hover:-translate-y-1
                 transition-all duration-500 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={exp.img}
          alt={exp.title}
          loading="lazy"
          className="w-full h-full object-cover scale-100 group-hover:scale-105
                     transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/30 to-transparent" />

        {/* Colored top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${exp.color}, transparent)` }}
        />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300"
          style={{ background: `${exp.color}18`, border: `1px solid ${exp.color}30` }}
        >
          <exp.icon size={18} style={{ color: exp.color }} />
        </div>
        <h3 className="font-poppins font-bold text-white text-sm mb-1.5 leading-tight">{exp.title}</h3>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 group-hover:text-gray-300 transition-colors">
          {exp.desc}
        </p>
      </div>
    </motion.div>
  )
}

export default function Experiences() {
  const titleRef = useRef(null)
  const titleInView = useInView(titleRef, { once: true, margin: '-60px' })
  const bottomRef = useRef(null)
  const bottomInView = useInView(bottomRef, { once: true, margin: '-80px' })

  return (
    <section id="experiencias" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0A0A0A]" />
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-[#FF5C00]/4 blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={titleRef} className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 20 }} animate={titleInView ? { opacity: 1, y: 0 } : {}}
            className="inline-block text-[#FF5C00] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Experiências Next Plane
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 24 }} animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="font-poppins text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4"
          >
            Viagens feitas para
            <br />
            <span className="text-brand-gradient">criar memórias.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg leading-relaxed"
          >
            Cada roteiro é único. Planejamos cada detalhe para que você viva momentos que ficam para sempre.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {experiences.map((exp, i) => <ExperienceCard key={exp.title} exp={exp} i={i} />)}
        </div>

        {/* Bottom: Why Next Plane */}
        <div ref={bottomRef} className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={bottomInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[#FF5C00] text-sm font-bold tracking-widest uppercase mb-3 block">
              Por que a Next Plane?
            </span>
            <h3 className="font-poppins text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Mais do que vender viagens
              <br />
              — criamos{' '}
              <span className="text-brand-gradient">experiências únicas.</span>
            </h3>
            <ul className="space-y-3.5 mb-9">
              {highlights.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={bottomInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 size={17} className="text-[#FF5C00] flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{h}</span>
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={WA_EXPERIENCIAS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5
                           bg-[#FF5C00] hover:bg-[#CC4900] text-white font-bold rounded-xl
                           transition-all duration-300 hover:scale-105 hover:shadow-lg
                           hover:shadow-orange-500/25 text-sm"
              >
                <MessageCircle size={16} />
                Fale com nossa equipe
              </a>
              <a
                href="#quem-somos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5
                           border border-white/10 text-gray-300 hover:text-white
                           hover:border-white/20 font-semibold rounded-xl
                           transition-all duration-300 text-sm group"
              >
                Conheça nossa história
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={bottomInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="rounded-3xl overflow-hidden ring-1 ring-white/5 shadow-2xl shadow-black/50">
              <img
                src="https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=800&q=85"
                alt="Família em viagem premium"
                className="w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>
            {/* Stat card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-5 -left-5 glass rounded-2xl p-4 shadow-xl w-52"
            >
              <div className="flex items-center gap-2 mb-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#FF5C00" className="text-[#FF5C00]" />)}
                <span className="text-white font-poppins font-extrabold text-lg ml-1">4.9</span>
              </div>
              <div className="text-gray-500 text-xs">Avaliação média no Google</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
