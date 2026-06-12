import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const clients = [
  { initials: 'AP', color: '#FF5C00', name: 'Ana Paula' },
  { initials: 'CF', color: '#EC4899', name: 'Carlos & Fernanda' },
  { initials: 'RM', color: '#3B82F6', name: 'Rodrigo' },
  { initials: 'JP', color: '#8B5CF6', name: 'Juliana' },
  { initials: 'SO', color: '#10B981', name: 'Sandra' },
]

const GOOGLE_URL = 'https://www.google.com/search?sca_esv=aee332ba488ac271&hl=pt-BR&authuser=0&kgmid=/g/11xkmtrpkn&q=Next+Plane&shndl=30&shem=lcuae,uaasie&source=sh/x/loc/uni/m1/1&kgs=87f0beeff495737c'

export default function SocialProof() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-[#111111] border-y border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-6">

          {/* Avatars + count */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {clients.map(c => (
                <div
                  key={c.name}
                  className="w-9 h-9 rounded-full border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: c.color }}
                  title={c.name}
                >
                  {c.initials}
                </div>
              ))}
            </div>
            <div>
              <div className="text-white font-poppins font-bold text-sm">+500 famílias atendidas</div>
              <div className="text-gray-500 text-xs">em destinos ao redor do mundo</div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/8" />

          {/* Stars + Google */}
          <a
            href={GOOGLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={15} fill="#FF5C00" className="text-[#FF5C00]" />
              ))}
            </div>
            <div>
              <div className="text-white font-bold text-sm group-hover:text-[#FF5C00] transition-colors">
                4.9 no Google
              </div>
              <div className="text-gray-500 text-xs">Ver todas as avaliações →</div>
            </div>
          </a>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/8" />

          {/* Trust message */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF5C00]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-base">🛡️</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Agência verificada</div>
              <div className="text-gray-500 text-xs">Operação 100% segura e transparente</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
