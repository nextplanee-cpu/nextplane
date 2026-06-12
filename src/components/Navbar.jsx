import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, MessageCircle } from 'lucide-react'
import { WA_NAVBAR, COTACAO_LINK } from '../lib/whatsapp'

const links = [
  { label: 'Destinos',     href: '#destinos' },
  { label: 'Quem Somos',   href: '#quem-somos' },
  { label: 'Depoimentos',  href: '#depoimentos' },
  { label: 'FAQ',          href: '#faq' },
]

/**
 * Logo oficial Next Plane — estilo transparente/outline
 * Janela de avião: borda (stroke) sem preenchimento + rosa dos ventos laranja
 */
function NextPlaneLogo({ size = 36, color = '#F97316' }) {
  const h = Math.round(size * 120 / 100)
  return (
    <svg width={size} height={h} viewBox="0 0 100 120" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Janela — só a borda, transparente por dentro */}
      <rect x="6" y="6" width="88" height="108" rx="40"
        stroke={color} strokeWidth="7" fill="none" />
      {/* Rosa dos ventos — laranja sólido */}
      <path
        d="M50,33 L52.8,52 L60,48 L56,57
           L75,60  L56,63 L60,72 L52.8,68
           L50,87  L47.2,68 L40,72 L44,63
           L25,60  L44,57 L40,48 L47.2,52 Z"
        fill={color}
      />
    </svg>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-base/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/60'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex items-center justify-between h-16">

          {/* Marca */}
          <a href="/" className="flex items-center gap-3 group" aria-label="Next Plane">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <NextPlaneLogo size={36} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-poppins font-bold text-[16px] tracking-tight text-white">
                Next <span className="text-brand">Plane</span>
              </span>
              <span className="text-[8px] text-white/35 font-medium tracking-[0.25em] uppercase mt-[2px]">
                Viagens & Experiências
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-0.5">
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href}
                  className="px-4 py-2 text-[13px] text-white/50 hover:text-white rounded-lg
                             hover:bg-white/5 transition-all duration-200 font-medium">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+5548988636608"
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80
                         text-[13px] font-medium transition-colors duration-200">
              <span className="text-brand text-xs">✆</span>
              (48) 98863-6608
            </a>
            <div className="w-px h-4 bg-white/10" />
            <a href={WA_NAVBAR} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand hover:bg-brand-dark
                         text-white text-sm font-bold rounded-xl transition-all duration-200
                         hover:shadow-lg hover:shadow-brand/25">
              <MessageCircle size={14} />
              Falar agora
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)}
            className="md:hidden w-9 h-9 flex items-center justify-center
                       text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-base/98 backdrop-blur-xl
                       border-b border-white/5 md:hidden"
          >
            <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="px-4 py-3 text-white/60 hover:text-white hover:bg-white/5
                             rounded-xl text-sm font-medium transition-all">
                  {l.label}
                </a>
              ))}
              <div className="h-px bg-white/5 my-2" />
              <a href={COTACAO_LINK} target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-5 py-3.5
                           border border-brand/30 text-brand font-bold rounded-xl
                           hover:bg-brand/8 transition-all text-sm">
                Solicitar Cotação
              </a>
              <a href={WA_NAVBAR} target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-5 py-3.5
                           bg-brand text-white font-bold rounded-xl text-sm">
                <MessageCircle size={15} />
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
