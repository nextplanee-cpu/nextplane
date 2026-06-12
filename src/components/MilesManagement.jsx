import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  TrendingUp,
  Zap,
  CreditCard,
  Shield,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'

const WA = 'https://wa.me/5511999999999?text=Olá!%20Quero%20saber%20mais%20sobre%20gestão%20de%20milhas.'

const features = [
  {
    icon: TrendingUp,
    title: 'Maximização de Milhas',
    desc: 'Identificamos as melhores formas de acumular e transferir pontos para maximizar o valor de cada milha.',
    color: '#D4AF37',
  },
  {
    icon: Zap,
    title: 'Emissões Inteligentes',
    desc: 'Estratégias avançadas de emissão para voos em classe executiva e primeira classe com muito menos pontos.',
    color: '#2563EB',
  },
  {
    icon: CreditCard,
    title: 'Cartões Ideais',
    desc: 'Consultoria personalizada para escolher os melhores cartões de crédito para seu perfil de gastos.',
    color: '#22C55E',
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    desc: 'Toda a operação realizada com máxima segurança, sem comprometer sua conta ou pontuação.',
    color: '#A78BFA',
  },
]

const results = [
  'Voos internacionais em executiva com até 70% de desconto',
  'Acesso a salas VIP em mais de 1.300 aeroportos no mundo',
  'Upgrades automáticos e tratamento prioritário',
  'Estratégias personalizadas para seu perfil de viagem',
  'Acompanhamento contínuo e suporte dedicado',
]

export default function MilesManagement() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="milhas" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-navy" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#D4AF37]/4 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* ── Left: Feature cards ── */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
                className="relative p-5 rounded-2xl bg-dark ring-1 ring-white/5 hover:ring-white/10 transition-all duration-300 group hover:shadow-xl hover:shadow-black/30"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15` }}
                >
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-manrope font-bold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}05, transparent 70%)` }}
                />
              </motion.div>
            ))}

            {/* Miles card visual */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
              className="sm:col-span-2 relative p-6 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1a1200 0%, #2a1d00 50%, #111827 100%)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase mb-1">
                    Suas Milhas
                  </div>
                  <div className="font-manrope text-3xl font-extrabold text-white">
                    120.000 <span className="text-[#D4AF37]">pts</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs mb-1">Valor estimado</div>
                  <div className="font-manrope text-xl font-bold text-[#22C55E]">R$ 3.600</div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37]/10 to-transparent mb-4" />
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '75%',
                      background: 'linear-gradient(90deg, #D4AF37, #F5D76E)',
                    }}
                  />
                </div>
                <span className="text-[#D4AF37] text-xs font-semibold">75% otimizadas</span>
              </div>
              {/* Shine overlay */}
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#D4AF37]/5 to-transparent pointer-events-none" />
            </motion.div>
          </motion.div>

          {/* ── Right: Content ── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block text-[#D4AF37] text-sm font-semibold tracking-widest uppercase mb-4">
              Gestão de Milhas
            </span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              Transforme seus
              <br />
              pontos em{' '}
              <span className="text-gold-gradient">experiências</span>
              <br />
              premium.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Nossa equipe especializada analisa seu perfil e traça estratégias personalizadas para você viajar mais, melhor e gastando muito menos.
            </p>

            <ul className="space-y-3 mb-10">
              {results.map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 size={18} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-relaxed">{r}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 text-sm"
              >
                <MessageCircle size={18} />
                Falar com Especialista
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 font-semibold rounded-xl transition-all duration-300 text-sm group"
              >
                Ver todos os serviços
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
