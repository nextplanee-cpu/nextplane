import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Crown, Sofa, Star, Plane, Gem, ArrowRight, MessageCircle } from 'lucide-react'

const WA = 'https://wa.me/5511999999999?text=Olá!%20Tenho%20interesse%20nos%20serviços%20premium%20e%20cartões%20black.'

const perks = [
  {
    icon: Crown,
    title: 'Cartões Black & Infinite',
    desc: 'Consultoria para os melhores cartões com acúmulo acelerado de pontos e benefícios exclusivos.',
  },
  {
    icon: Sofa,
    title: 'Salas VIP em Todo Mundo',
    desc: 'Acesso às melhores salas VIP com open bar, gastronomia premium, showers e internet de alta velocidade.',
  },
  {
    icon: Plane,
    title: 'Classe Executiva',
    desc: 'Emissões em business e primeira classe utilizando milhas, economizando até 90% do valor.',
  },
  {
    icon: Star,
    title: 'Hotéis Premium',
    desc: 'Seleção de propriedades five-star com early check-in, late check-out e upgrades automáticos.',
  },
  {
    icon: Gem,
    title: 'Experiências Exclusivas',
    desc: 'Jantares em restaurantes Michelin, tours privados e experiências únicas no destino.',
  },
]

export default function Premium() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      className="py-24 sm:py-32 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0B1220 0%, #0d1526 50%, #0B1220 100%)' }}
    >
      {/* Gold glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-2 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">

          {/* ── Left: Content ── */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block text-[#D4AF37] text-sm font-semibold tracking-widest uppercase mb-4">
              Nível Premium
            </span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              A viagem que você
              <br />
              merece começa{' '}
              <span className="text-gold-gradient">aqui.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Para quem não aceita menos que o melhor. Acesso a uma camada exclusiva de privilégios, benefícios e experiências que só os viajantes mais preparados conhecem.
            </p>

            <div className="space-y-5 mb-10">
              {perks.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/15 transition-colors">
                    <perk.icon size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">{perk.title}</div>
                    <div className="text-gray-500 text-sm leading-relaxed">{perk.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 50%, #D4AF37 100%)',
                color: '#0B1220',
              }}
            >
              <Crown size={18} />
              Quero Acesso Premium
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>

          {/* ── Right: Premium card visual ── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:flex flex-col gap-5"
          >
            {/* VIP Lounge card */}
            <div
              className="relative rounded-3xl overflow-hidden p-8"
              style={{
                background: 'linear-gradient(135deg, #1a1200 0%, #2d2000 40%, #0f0d00 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 0 80px rgba(212, 175, 55, 0.08)',
              }}
            >
              {/* Shine */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center">
                    <Crown size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="text-white font-manrope font-bold text-sm">Next Plane</div>
                    <div className="text-[#D4AF37]/60 text-xs">Premium Member</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] font-manrope font-extrabold text-2xl">BLACK</div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ['Salas VIP', '1.300+ aeroportos'],
                  ['Lounge acesso', 'Ilimitado'],
                  ['Status', 'Elite Platinum'],
                  ['Upgrades', 'Automáticos'],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#D4AF37]/8 last:border-0">
                    <span className="text-gray-500 text-sm">{label}</span>
                    <span className="text-white font-medium text-sm">{val}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Small card: savings this year */}
            <div className="glass rounded-2xl p-5 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <Gem size={22} className="text-[#22C55E]" />
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Economia acumulada em 2024</div>
                <div className="font-manrope text-2xl font-extrabold text-white">
                  R$ 48.000 <span className="text-[#22C55E] text-base">economizados</span>
                </div>
                <div className="text-gray-500 text-xs mt-0.5">por clientes da Next Plane</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent pointer-events-none" />
    </section>
  )
}
