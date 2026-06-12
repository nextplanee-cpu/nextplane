import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { WA_HERO } from '../lib/whatsapp'

export default function AboutUs() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="quem-somos" ref={ref} className="py-24 sm:py-32 bg-base overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Foto da equipe */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src="/familia-next-plane.jpg"
                alt="Equipe Next Plane"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>

            {/* Badge laranja */}
            <div className="absolute -bottom-5 -right-3 sm:-bottom-6 sm:-right-6
                            bg-brand rounded-2xl px-5 py-4 shadow-2xl shadow-brand/35">
              <p className="font-poppins text-2xl font-bold text-white leading-none">+500</p>
              <p className="text-white/80 text-xs mt-0.5">famílias atendidas</p>
            </div>

            {/* Brilho laranja */}
            <div className="absolute -inset-8 bg-brand/6 blur-[80px] rounded-full -z-10" />
          </motion.div>

          {/* Conteúdo */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-4">
              Quem somos
            </p>

            <h2 className="font-poppins text-4xl sm:text-5xl font-bold text-white leading-[1.1] mb-7">
              Uma família que<br />
              <span className="text-brand">vive</span>{' '}
              <span className="font-light font-serif italic text-white/75">para viajar.</span>
            </h2>

            <div className="space-y-5 text-white/55 text-[15px] leading-[1.8] mb-9">
              <p>
                A Next Plane não nasceu de um escritório. Nasceu de passaportes carimbados,
                de madrugadas resolvendo imprevisto de cliente, de ver família chegando em
                casa com histórias que vão contar por anos.
              </p>
              <p>
                Joseph e Maria cuidam de cada viagem como se fosse a deles. Passagens,
                hotel, roteiro, documentação — você só arruma a mala.
              </p>
            </div>

            <ul className="space-y-3.5 mb-10">
              {[
                { text: 'Cada cliente atendido pelo WhatsApp — sem chatbot, sem fila' },
                { text: 'Suporte real do planejamento até o retorno para casa' },
                { text: '+500 famílias que confiaram e voltaram' },
                { text: '4.9★ no Google — de clientes reais, com nomes reais' },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-3 text-[14px] text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-[6px]" />
                  {item.text}
                </li>
              ))}
            </ul>

            <a href={WA_HERO} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand hover:bg-brand-dark
                         text-white font-bold rounded-xl text-sm transition-all duration-200
                         hover:shadow-lg hover:shadow-brand/30 active:scale-[0.98]">
              <MessageCircle size={16} />
              Falar com a equipe agora
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
