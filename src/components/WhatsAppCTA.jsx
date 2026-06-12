import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { COTACAO_LINK, WA_HERO } from '../lib/whatsapp'

export default function WhatsAppCTA() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-brand relative overflow-hidden">

      {/* Textura de grade sutil */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Brilho central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[700px] h-[400px] bg-white/8 blur-[140px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Label */}
          <p className="text-white/65 text-[11px] font-bold tracking-[0.28em] uppercase mb-7">
            Fale com a nossa equipe
          </p>

          {/* Headline */}
          <h2 className="font-poppins text-4xl sm:text-5xl lg:text-[58px] font-bold text-white
                         leading-[1.06] tracking-tight mb-5">
            Sua próxima viagem<br />
            <span className="font-light font-serif italic text-white/85">começa numa mensagem.</span>
          </h2>

          {/* Subtítulo */}
          <p className="text-white/80 text-base sm:text-[17px] leading-[1.75] mb-10 max-w-[480px] mx-auto">
            Sem formulário, sem espera. Você manda uma mensagem,
            a gente responde com um roteiro pensado pra você —
            de graça, sem compromisso.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a href={COTACAO_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4
                         bg-white text-brand hover:bg-white/92 font-bold rounded-2xl
                         text-sm transition-all duration-200 hover:shadow-xl hover:shadow-black/20
                         active:scale-[0.98]">
              <MessageCircle size={17} />
              Quero minha cotação grátis
              <ArrowRight size={15} />
            </a>
            <a href={WA_HERO} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4
                         border-2 border-white/35 hover:border-white/65 hover:bg-white/8
                         text-white font-semibold rounded-2xl text-sm transition-all duration-200">
              Falar agora no WhatsApp
            </a>
          </div>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/65 text-[12px] font-medium">
            <span>✓ Resposta em até 1 hora</span>
            <span>✓ Sem taxa de consultoria</span>
            <span>✓ Atendimento 100% humano</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
