import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone } from 'lucide-react'
import { WA_FLOAT_OPTIONS, PHONE } from '../lib/whatsapp'

const PHONE_DISPLAY = '(48) 98863-6608'

export default function WhatsAppFloat() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen]       = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

          {/* ── Quick-actions popup ── */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.93 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: 16, scale: 0.93 }}
                transition={{ duration: 0.2, ease: [0.22,1,0.36,1] }}
                className="w-72 bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6 bg-surface">
                  <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm leading-none">Next Plane</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                      <span className="text-gray-400 text-[11px]">Disponível agora · responde rápido</span>
                    </div>
                  </div>
                </div>

                {/* Greeting bubble */}
                <div className="px-4 pt-3 pb-2">
                  <div className="bg-base rounded-xl rounded-tl-sm px-3 py-2.5 inline-block max-w-full">
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Oi! Sou Joseph da Next Plane. Qual destino você tem em mente?
                    </p>
                  </div>
                </div>

                {/* Options */}
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {WA_FLOAT_OPTIONS.map(opt => (
                    <a
                      key={opt.label}
                      href={opt.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        opt.primary
                          ? 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20'
                          : 'bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand'
                      }`}
                    >
                      {opt.label}
                    </a>
                  ))}
                </div>

                {/* Footer phone */}
                <div className="px-4 pb-3 flex items-center justify-center gap-1.5 border-t border-white/5 pt-3">
                  <Phone size={11} className="text-gray-500" />
                  <span className="text-gray-500 text-[10px]">{PHONE_DISPLAY}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main floating button ── */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{    scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setOpen(o => !o)}
            className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] flex items-center justify-center shadow-2xl shadow-green-500/40 transition-colors duration-300"
            aria-label={open ? 'Fechar menu WhatsApp' : 'Abrir WhatsApp'}
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div key="x"  initial={{ rotate:-90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:90,opacity:0 }} transition={{ duration:0.2 }}>
                  <X size={24} className="text-white" />
                </motion.div>
              ) : (
                <motion.div key="wa" initial={{ rotate:90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:-90,opacity:0 }} transition={{ duration:0.2 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            {!open && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand rounded-full border-2 border-base flex items-center justify-center text-[8px] text-white font-bold">1</span>
            )}
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  )
}
