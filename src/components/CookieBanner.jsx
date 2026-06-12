import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('np_cookie_consent')) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const accept  = () => { localStorage.setItem('np_cookie_consent', 'accepted');  setVisible(false) }
  const decline = () => { localStorage.setItem('np_cookie_consent', 'declined');  setVisible(false) }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
        >
          <div className="relative bg-card border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/60">
            <button onClick={decline} aria-label="Fechar"
              className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>

            <p className="text-white font-semibold text-sm mb-2">Cookies & Privacidade</p>
            <p className="text-white/45 text-xs leading-relaxed mb-4">
              Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{' '}
              <Link to="/politica-de-privacidade" className="text-brand hover:underline font-medium">
                Política de Privacidade
              </Link>.
            </p>

            <div className="flex gap-2">
              <button onClick={accept}
                className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg text-xs transition-colors"
              >
                <Check size={12} /> Aceitar
              </button>
              <button onClick={decline}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/8 text-white/40 hover:text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Recusar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
