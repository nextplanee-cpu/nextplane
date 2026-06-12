import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, ExternalLink, Quote } from 'lucide-react'

const GOOGLE_URL = 'https://www.google.com/search?sca_esv=aee332ba488ac271&hl=pt-BR&authuser=0&kgmid=/g/11xkmtrpkn&q=Next+Plane&shndl=30&shem=lcuae,uaasie&source=sh/x/loc/uni/m1/1&kgs=87f0beeff495737c'

// ── AVALIAÇÕES REAIS DOS CLIENTES NO GOOGLE ──────────────────────────────────
const reviews = [
  {
    name: 'Jenifer Soares',
    meta: '5 avaliações',
    date: '8 meses atrás',
    rating: 5,
    text: 'Experiência incrível. Joseph e Maria nos acompanharam durante toda a viagem e estavam sempre à disposição para ajudar no que fosse preciso. Era minha primeira viagem e esse acompanhamento e suporte foi fundamental. Super recomendo!',
    avatar: 'J',
    avatarBg: '#7C3AED',
  },
  {
    name: 'Ana Helen Ferreira',
    meta: '1 avaliação',
    date: '10 meses atrás',
    rating: 5,
    text: 'Uma empresa de confiança e com um atendimento incrível. O suporte deles desde a compra das passagens até o check-in do voo me ganhou demais — a gente não se preocupa com absolutamente NADA, só arruma as malas e embarca, eles desenrolam tudo. Já indiquei para alguns conhecidos que também tiveram uma excelente experiência.',
    avatar: 'A',
    avatarBg: '#B45309',
  },
  {
    name: 'Rosemeri de Fatima Ribeiro',
    meta: '8 avaliações · 3 fotos',
    date: '11 meses atrás',
    rating: 5,
    text: 'Eu super recomendo essa agência! Já fiz a segunda viagem com eles — experiência internacional incrível, tivemos todo o suporte e dicas durante a viagem. O preço é ótimo e acessível. Não troco por outra agência, já estou pensando na próxima! 🙌🙏',
    avatar: 'R',
    avatarBg: '#DC2626',
  },
  {
    name: 'Rebeka Gabriela',
    meta: '2 avaliações · 4 fotos',
    date: '11 meses atrás',
    rating: 5,
    text: 'Sensacional! Eles são muito atenciosos — além de fazer uma viagem incrível, dão suporte, tiram todas as dúvidas, e tudo com muita praticidade pelo WhatsApp ou ligação. Com certeza a melhor agência de viagens!',
    avatar: 'R',
    avatarBg: '#059669',
  },
  {
    name: 'Rick Ramos',
    meta: '2 avaliações · 1 foto',
    date: '10 meses atrás',
    rating: 5,
    text: 'Melhor atendimento, ajudou muito em todo o processo e valores incríveis!!!! Recomendo demais.',
    avatar: 'R',
    avatarBg: '#6D28D9',
  },
  {
    name: 'Felipe Borges',
    meta: '3 avaliações · 1 foto',
    date: '8 meses atrás',
    rating: 5,
    text: 'A minha experiência com a Next foi super tranquila — foram super atenciosos comigo e pacientes. Me deram dicas e recomendações muito legais por ser a primeira vez viajando de avião. Eu indico para todo mundo agora!',
    avatar: 'F',
    avatarBg: '#1D4ED8',
  },
  {
    name: 'Kleber Pereira',
    meta: '4 avaliações · 4 fotos',
    date: '4 meses atrás',
    rating: 5,
    text: 'É uma empresa de Deus! Sou médico missionário e eles me ajudaram a viajar com as passagens aéreas em conta para cumprir a missão de ajudar outras pessoas. Deus derrama bênçãos sem medidas sobre essa empresa e os donos.',
    avatar: 'K',
    avatarBg: '#0891B2',
  },
]

function GoogleStar({ size = 13 }) {
  return <Star size={size} fill="#FBBC04" className="text-[#FBBC04]" />
}

function GoogleLogoSVG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function ReviewCard({ r, i, inView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-[#161616] rounded-2xl p-5 ring-1 ring-white/5 hover:ring-white/10 transition-all duration-300 flex flex-col"
    >
      {/* Quote icon */}
      <div className="absolute top-4 right-4 opacity-[0.06]">
        <Quote size={32} className="text-[#FF5C00]" />
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[1,2,3,4,5].map(s => <GoogleStar key={s} />)}
      </div>

      {/* Review text */}
      <p className="text-gray-300 text-[13px] leading-relaxed flex-1 mb-4">
        "{r.text}"
      </p>

      {/* Reviewer info */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: r.avatarBg }}
        >
          {r.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm truncate">{r.name}</div>
          <div className="text-gray-600 text-[10px]">{r.meta} · {r.date}</div>
        </div>
        {/* Google G mark */}
        <GoogleLogoSVG size={16} />
      </div>
    </motion.div>
  )
}

export default function GoogleReviews() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="avaliacoes" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0D0D0D]" />
      <div className="absolute inset-x-0 top-0 h-px divider-orange" />
      <div className="absolute inset-x-0 bottom-0 h-px divider-orange" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Authority Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          {/* Google badge */}
          <a
            href={GOOGLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/8 hover:border-[#FBBC04]/30 transition-all duration-300 mb-7 group"
          >
            <GoogleLogoSVG size={20} />
            <div className="text-left">
              <div className="text-white font-bold text-sm group-hover:text-[#FBBC04] transition-colors">Next Plane no Google</div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <GoogleStar key={i} />)}
                <span className="text-gray-400 text-xs ml-1">4.9 · Agência de Viagens</span>
              </div>
            </div>
            <ExternalLink size={13} className="text-gray-600 group-hover:text-[#FBBC04] transition-colors" />
          </a>

          <h2 className="font-poppins text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            O que nossos clientes
            <br />
            <span className="text-brand-gradient">realmente dizem.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Avaliações 100% reais de quem viajou com a Next Plane e voltou para contar.
          </p>
        </motion.div>

        {/* ── Trust numbers ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12"
        >
          {[
            { v: '4.9', l: 'no Google', icon: '⭐' },
            { v: '500+', l: 'Famílias atendidas', icon: '👨‍👩‍👧' },
            { v: '98%', l: 'Recomendam', icon: '❤️' },
          ].map(s => (
            <div key={s.l} className="bg-[#161616] rounded-2xl p-4 ring-1 ring-white/5 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-poppins font-extrabold text-white text-2xl">{s.v}</div>
              <div className="text-gray-600 text-[10px] font-medium leading-tight mt-0.5">{s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Review Cards Grid — 7 reviews: 3 + 2 + 2 ───────────────────── */}
        {/* Row 1: 3 cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {reviews.slice(0, 3).map((r, i) => (
            <ReviewCard key={r.name + i} r={r} i={i} inView={inView} />
          ))}
        </div>
        {/* Row 2: 2 cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {reviews.slice(3, 5).map((r, i) => (
            <ReviewCard key={r.name + i} r={r} i={i + 3} inView={inView} />
          ))}
        </div>
        {/* Row 3: 2 cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {reviews.slice(5, 7).map((r, i) => (
            <ReviewCard key={r.name + i} r={r} i={i + 5} inView={inView} />
          ))}
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <a
            href={GOOGLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-[#0A0A0A] font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm"
          >
            <GoogleLogoSVG size={16} />
            Ver todas as avaliações no Google
            <ExternalLink size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
