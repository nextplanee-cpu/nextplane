import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { COTACAO_LINK } from '../lib/whatsapp'

const promos = [
  {
    name:    'Punta Cana',
    country: 'República Dominicana',
    image:   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90',
    price:   'R$ 15.000',
    per:     'por casal',
    desc:    'Sete noites em resort all-inclusive 5★, passagens incluídas e transfer. Areia branca, Caribe na frente — e você sem se preocupar com nada.',
  },
]

export default function WeeklyPromos() {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-surface relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-2">
              Oferta da semana
            </p>
            <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-white leading-tight">
              Essa semana, tem uma{' '}
              <span className="font-light font-serif italic text-white/75">oportunidade</span>
            </h2>
          </div>
          <span className="hidden sm:block text-white/20 text-[11px] tracking-wide">Atualizado semanalmente</span>
        </motion.div>

        {promos.map(promo => (
          <motion.div
            key={promo.name}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-2xl overflow-hidden bg-card border border-white/5
                       hover:border-brand/20 transition-all duration-500"
          >
            <div className="flex flex-col lg:flex-row">

              {/* Foto */}
              <div className="relative lg:w-[48%] flex-shrink-0 aspect-[16/10] lg:aspect-auto overflow-hidden">
                <img src={promo.image} alt={promo.name} loading="lazy"
                  className="w-full h-full object-cover img-zoom" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent lg:hidden" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30 hidden lg:block" />
                {/* Badge */}
                <span className="absolute top-5 left-5 px-3 py-1 bg-brand text-white
                                 text-[11px] font-bold rounded-full tracking-wide">
                  Oferta limitada
                </span>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 p-7 lg:p-10 xl:p-14 flex flex-col justify-center">
                <p className="text-white/30 text-xs uppercase tracking-[0.18em] mb-2">
                  {promo.country}
                </p>
                <h3 className="font-poppins text-3xl sm:text-4xl font-bold text-white mb-4">
                  {promo.name}
                </h3>
                <p className="text-white/55 text-[15px] leading-[1.75] mb-8 max-w-sm">
                  {promo.desc}
                </p>

                <div className="mb-8">
                  <p className="text-white/25 text-[11px] uppercase tracking-widest mb-1">A partir de</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-poppins text-4xl font-bold text-white">{promo.price}</span>
                    <span className="text-white/30 text-sm">{promo.per}</span>
                  </div>
                </div>

                <a href={COTACAO_LINK} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-brand hover:bg-brand-dark
                             text-white font-bold rounded-xl transition-all duration-200 text-sm
                             w-fit hover:shadow-lg hover:shadow-brand/25">
                  <MessageCircle size={15} />
                  Quero essa oferta
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
