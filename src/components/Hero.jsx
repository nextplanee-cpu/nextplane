import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { COTACAO_LINK } from '../lib/whatsapp'

const fade = (delay = 0) => ({
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] } },
})

// Logo — marca d'água decorativa no hero (sutil, outline)
function CompassWatermark() {
  return (
    <svg
      className="absolute right-[3%] top-1/2 -translate-y-1/2 w-[300px] h-auto
                 opacity-[0.045] pointer-events-none select-none hidden lg:block"
      viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="6" width="88" height="108" rx="40"
        stroke="white" strokeWidth="6" fill="none" />
      <path
        d="M50,33 L52.8,52 L60,48 L56,57
           L75,60  L56,63 L60,72 L52.8,68
           L50,87  L47.2,68 L40,72 L44,63
           L25,60  L44,57 L40,48 L47.2,52 Z"
        fill="white"
      />
    </svg>
  )
}

const stats = [
  { value: '+500',  label: 'famílias atendidas' },
  { value: '4.9★',  label: 'no Google' },
  { value: '50+',   label: 'destinos' },
]

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[640px] overflow-hidden" aria-label="Hero">

      {/* ── Foto: janela de avião ao pôr do sol ── */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=90"
          alt="Vista da janela do avião — Next Plane"
          className="w-full h-full object-cover"
          loading="eager"
        />

        {/* Camada 1 — escurece esquerda para leitura */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

        {/* Camada 2 — laranja quente dominante vindo de baixo e da esquerda */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#C05A00]/70 via-[#8B3F00]/30 to-transparent" />

        {/* Camada 3 — fade escuro no topo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Camada 4 — escurece base para a stats bar */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Marca d'água */}
      <CompassWatermark />

      {/* ── Conteúdo principal — bottom-aligned ── */}
      <div className="absolute bottom-0 left-0 right-0 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="max-w-xl">

            {/* Label laranja */}
            <motion.p
              variants={fade(0)} initial="hidden" animate="visible"
              className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-6"
            >
              Agência de Viagens · Santa Catarina
            </motion.p>

            {/* Headline */}
            <motion.h1
              variants={fade(0.1)} initial="hidden" animate="visible"
              className="font-poppins text-[42px] sm:text-[58px] lg:text-[68px] font-bold
                         text-white leading-[1.06] tracking-tight mb-5"
            >
              Onde o sonho<br />
              <span className="text-brand">embarca</span>{' '}
              <span className="font-light font-serif italic text-white/80">e a</span><br />
              realidade decola.
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              variants={fade(0.18)} initial="hidden" animate="visible"
              className="text-white/65 text-base sm:text-lg leading-[1.7] mb-8 max-w-[420px]"
            >
              Da primeira mensagem até o check-in, você tem uma equipe real
              do seu lado — que conhece cada destino, cada detalhe e cada
              cliente pelo nome.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fade(0.26)} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row gap-3"
            >
              <a href={COTACAO_LINK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4
                           bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl
                           text-sm transition-all duration-200 hover:shadow-xl hover:shadow-brand/40
                           active:scale-[0.98]">
                <MessageCircle size={17} />
                Planejar minha viagem
                <ArrowRight size={15} />
              </a>
              <a href="#destinos"
                className="inline-flex items-center justify-center px-7 py-4
                           border border-white/20 hover:border-white/40
                           text-white/70 hover:text-white font-medium rounded-2xl
                           text-sm transition-all duration-200 backdrop-blur-sm">
                Explorar destinos
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Stats bar — laranja sólido ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 bg-brand"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-3.5
                        flex items-center gap-8 sm:gap-16">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span className="font-poppins text-lg sm:text-xl font-bold text-white">{s.value}</span>
              <span className="text-white/70 text-xs">{s.label}</span>
              {i < stats.length - 1 && (
                <span className="hidden sm:block w-px h-3 bg-white/20 ml-5" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
