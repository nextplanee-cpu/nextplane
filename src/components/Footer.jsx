import { Link } from 'react-router-dom'
import { MessageCircle, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import { BASE } from '../lib/whatsapp'

const GOOGLE = 'https://www.google.com/search?kgmid=/g/11xkmtrpkn&q=Next+Plane'
const INSTAGRAM = 'https://www.instagram.com/nextplane_?igsh=NjA1ZWN6cm12aWNo&utm_source=qr'

function NextPlaneLogo({ size = 32, color = '#F97316' }) {
  const h = Math.round(size * 120 / 100)
  return (
    <svg width={size} height={h} viewBox="0 0 100 120" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="6" width="88" height="108" rx="40"
        stroke={color} strokeWidth="7" fill="none" />
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

const navLinks = [
  { label: 'Destinos',    href: '#destinos' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'FAQ',         href: '#faq' },
]

const services = [
  'Passagens Aéreas',
  'Roteiros Personalizados',
  'Viagens em Família',
  'Lua de Mel & Casais',
  'Disney & Parques Temáticos',
  'Grupos & Vistos',
]

export default function Footer() {
  return (
    <footer className="relative bg-[#080808] border-t border-white/5 overflow-hidden">
      {/* Linha laranja topo */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r
                      from-transparent via-brand/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Marca */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-3 mb-5 w-fit group" aria-label="Next Plane">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <NextPlaneLogo size={30} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-poppins font-bold text-[16px] text-white">
                  Next <span className="text-brand">Plane</span>
                </span>
                <span className="text-[8px] text-white/20 font-medium tracking-[0.22em] uppercase mt-[2px]">
                  Viagens & Experiências
                </span>
              </div>
            </a>

            <p className="text-white/35 text-[13px] leading-[1.75] mb-5 max-w-[220px]">
              Roteiros reais, atendimento humano. Cuidamos de cada detalhe para você só precisar embarcar.
            </p>

            {/* Google Reviews */}
            <a href={GOOGLE} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl
                         bg-white/4 border border-white/6 hover:border-brand/30
                         transition-all duration-300 mb-5 group">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-white/35 group-hover:text-white/60 text-xs font-medium transition-colors">
                4.9 ★ no Google
              </span>
            </a>

            {/* Instagram */}
            <div className="flex gap-2.5">
              <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-white/4 hover:bg-brand/15 border border-white/5
                           hover:border-brand/30 flex items-center justify-center
                           text-white/30 hover:text-brand transition-all duration-300">
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="font-poppins font-bold text-white text-xs mb-5 uppercase tracking-[0.18em]">
              Navegação
            </h3>
            <ul className="space-y-3">
              {navLinks.map(l => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/30 hover:text-white text-sm transition-colors duration-200">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="font-poppins font-bold text-white text-xs mb-5 uppercase tracking-[0.18em]">
              Serviços
            </h3>
            <ul className="space-y-3">
              {services.map(s => (
                <li key={s}><span className="text-white/30 text-sm">{s}</span></li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-poppins font-bold text-white text-xs mb-5 uppercase tracking-[0.18em]">
              Contato
            </h3>
            <ul className="space-y-4">
              <li>
                <a href={BASE} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/30 hover:text-white text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/15 transition-colors">
                    <MessageCircle size={13} className="text-[#25D366]" />
                  </div>
                  (48) 98863-6608
                </a>
              </li>
              <li>
                <a href="tel:+5548988636608"
                  className="flex items-center gap-3 text-white/30 hover:text-white text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-brand/8 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/15 transition-colors">
                    <Phone size={13} className="text-brand" />
                  </div>
                  +55 (48) 9 8863-6608
                </a>
              </li>
              <li>
                <a href="mailto:nextplanee@gmail.com"
                  className="flex items-center gap-3 text-white/30 hover:text-white text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/8 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/15 transition-colors">
                    <Mail size={13} className="text-blue-400" />
                  </div>
                  nextplanee@gmail.com
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-white/20 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white/4 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={13} className="text-white/30" />
                  </div>
                  <span>Santa Catarina, SC<br />Atendimento Online — Brasil</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="divider mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <p className="text-white/20 text-xs">
              © {new Date().getFullYear()} Next Plane — Viagens & Experiências. Todos os direitos reservados.
            </p>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <p className="text-white/15 text-xs">
              CNPJ: 54.108.033/0001-89
            </p>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <p className="text-white/15 text-xs">
              Cadastur em processo de registro
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/politica-de-privacidade"
              className="text-white/20 hover:text-white/50 text-xs transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/termos-de-uso"
              className="text-white/20 hover:text-white/50 text-xs transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
