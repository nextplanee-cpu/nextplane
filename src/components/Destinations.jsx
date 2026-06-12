import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { waDestino } from '../lib/whatsapp'

const destinations = [
  {
    // ✅ Verificado: Cinderella Castle — Magic Kingdom, Walt Disney World Orlando
    name:    'Disney & Orlando',
    country: 'Estados Unidos',
    tag:     'Família & Parques',
    price:   'a partir de R$ 6.000',
    image:   'https://images.unsplash.com/photo-1620563925792-7e08e2be7ef7?auto=format&fit=crop&w=1200&q=90',
  },
  {
    // ✅ Verificado: Overwater Villa — W Hotel, Maldive Islands
    name:    'Maldivas',
    country: 'Oceano Índico',
    tag:     'Praia & Resort',
    price:   'a partir de R$ 12.000',
    image:   'https://images.unsplash.com/photo-1602002418209-55d7a55adf42?auto=format&fit=crop&w=1200&q=90',
  },
  {
    // ✅ Verificado: Torre Eiffel — Paris, France (Anthony Delanoix)
    name:    'Paris',
    country: 'França',
    tag:     'Europa Premium',
    price:   'a partir de R$ 7.500',
    image:   'https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1200&q=90',
  },
  {
    // ✅ Verificado: San Carlos de Bariloche — Río Negro, Argentina
    name:    'Bariloche',
    country: 'Argentina',
    tag:     'Neve & Montanha',
    price:   'a partir de R$ 5.000',
    image:   'https://images.unsplash.com/photo-1589836106091-4d33bb027708?auto=format&fit=crop&w=1200&q=90',
  },
  {
    // ✅ Verificado: Sky Costanera — Santiago, Chile
    name:    'Santiago',
    country: 'Chile',
    tag:     'Cultura & Gastronomia',
    price:   'a partir de R$ 6.000',
    image:   'https://images.unsplash.com/photo-1566079463188-97d2f1352582?auto=format&fit=crop&w=1200&q=90',
  },
  {
    // Coliseu — Roma, Itália
    name:    'Itália',
    country: 'Europa',
    tag:     'Arte & Cultura',
    price:   'a partir de R$ 9.900',
    // ✅ Verificado: Colosseum — Roma, Italia
    image:   'https://images.unsplash.com/photo-1526026697130-3f870884a6e3?auto=format&fit=crop&w=1200&q=90',
  },
  {
    // ✅ Verificado: Burj Khalifa skyline noturno — Dubai, UAE
    name:    'Dubai',
    country: 'Emirados Árabes',
    tag:     'Luxo & Modernidade',
    price:   'a partir de R$ 11.000',
    image:   'https://images.unsplash.com/photo-1753029111752-f12018752cd3?auto=format&fit=crop&w=1200&q=90',
  },
]

const AUTOPLAY_MS = 4000

export default function Destinations() {
  const titleRef  = useRef(null)
  const inView    = useInView(titleRef, { once: true, margin: '-60px' })
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)
  const timerRef  = useRef(null)
  const total     = destinations.length

  const goTo = useCallback((idx) => {
    setCurrent((idx + total) % total)
  }, [total])

  // ── Autoplay ──────────────────────────────────────────────
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => goTo(current + 1), AUTOPLAY_MS)
    return () => clearInterval(timerRef.current)
  }, [current, paused, goTo])

  // ── Drag / swipe ──────────────────────────────────────────
  const dragStart = useRef(0)
  function handleDragStart(e) {
    dragStart.current = e.touches ? e.touches[0].clientX : e.clientX
  }
  function handleDragEnd(e) {
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
    const diff  = dragStart.current - endX
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1)
  }

  const prev = destinations[(current - 1 + total) % total]
  const curr = destinations[current]
  const next = destinations[(current + 1) % total]

  return (
    <section
      id="destinos"
      className="py-20 sm:py-28 bg-base"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div ref={titleRef} className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
            >
              Destinos
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.07 }}
              className="font-poppins text-4xl sm:text-5xl font-bold text-white leading-[1.1]"
            >
              Para onde a Next Plane
              <br />
              <span className="text-brand">pode te levar?</span>
            </motion.h2>
          </div>

          {/* Setas + contador */}
          <motion.div
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => goTo(current - 1)}
              className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-brand hover:bg-brand/10 transition-all duration-200"
              aria-label="Anterior"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => goTo(current + 1)}
              className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-brand hover:bg-brand/10 transition-all duration-200"
              aria-label="Próximo"
            >
              <ArrowRight size={16} />
            </button>
            <span className="text-white/30 text-xs tabular-nums ml-1">
              {String(current + 1).padStart(2,'0')} / {String(total).padStart(2,'0')}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Stage — card central grande + laterais ─────────── */}
      <div
        className="relative w-full overflow-hidden select-none"
        style={{ height: 520 }}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {/* Card esquerdo (preview) */}
        <div
          className="absolute top-0 bottom-0 flex items-center"
          style={{ left: 'calc(50% - 580px)', width: 340, zIndex: 1 }}
        >
          <div className="w-full h-[420px] rounded-2xl overflow-hidden opacity-30 scale-90 origin-right transition-all duration-700 cursor-pointer"
            onClick={() => goTo(current - 1)}>
            <img src={prev.image} alt={prev.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        </div>

        {/* ── Card Central ─── */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center"
          style={{ left: '50%', transform: 'translateX(-50%)', width: 620, zIndex: 10 }}
        >
          <AnimatePresence mode="wait">
            <motion.a
              key={curr.name}
              href={waDestino(curr.name)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="group relative block w-full rounded-3xl overflow-hidden shadow-2xl shadow-black/70"
              style={{ height: 500 }}
              draggable={false}
            >
              <img
                src={curr.image}
                alt={curr.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                draggable={false}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Badge */}
              <div className="absolute top-5 left-5 px-3 py-1 bg-brand rounded-full text-white text-[11px] font-bold tracking-wide">
                {curr.tag}
              </div>

              {/* Ícone canto */}
              <div className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <ArrowUpRight size={16} className="text-white" />
              </div>

              {/* Conteúdo inferior */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-white/50 text-[11px] uppercase tracking-[0.24em] mb-2">{curr.country}</p>
                <h3 className="font-poppins text-[28px] sm:text-[32px] font-bold text-white leading-tight mb-1">
                  {curr.name}
                </h3>
                <p className="text-brand text-sm font-semibold mt-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  {curr.price} · Quero esse roteiro →
                </p>
              </div>

              {/* Barra de progresso autoplay */}
              {!paused && (
                <motion.div
                  key={`bar-${current}`}
                  className="absolute bottom-0 left-0 h-[3px] bg-brand rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                />
              )}
            </motion.a>
          </AnimatePresence>
        </div>

        {/* Card direito (preview) */}
        <div
          className="absolute top-0 bottom-0 flex items-center"
          style={{ left: 'calc(50% + 240px)', width: 340, zIndex: 1 }}
        >
          <div className="w-full h-[420px] rounded-2xl overflow-hidden opacity-30 scale-90 origin-left transition-all duration-700 cursor-pointer"
            onClick={() => goTo(current + 1)}>
            <img src={next.image} alt={next.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        </div>
      </div>

      {/* ── Dots ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {destinations.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'w-8 h-2 bg-brand'
                : 'w-2 h-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Destino ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Rodapé ─────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center text-white/30 text-sm mt-10 px-5"
      >
        Tem um destino em mente que não está aqui?{' '}
        <a
          href={waDestino('personalizado')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-light transition-colors font-semibold underline underline-offset-2"
        >
          A gente chega lá. →
        </a>
      </motion.p>
    </section>
  )
}
