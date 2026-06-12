import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsOfUse() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Termos de Uso — Next Plane'
  }, [])

  return (
    <div className="min-h-screen bg-base text-white">
      {/* Header */}
      <div className="bg-surface border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao site
          </Link>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-2 text-[#F5971F]">
            <FileText size={16} />
            <span className="text-sm font-semibold">Termos de Uso</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5971F]/10 border border-[#F5971F]/20 text-[#F5971F] text-xs font-semibold mb-4">
            <FileText size={12} />
            Última atualização: Maio de 2026
          </div>
          <h1 className="font-poppins text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Termos de Uso
          </h1>
          <p className="text-gray-400 text-sm">Última atualização: Maio de 2026</p>
          <div className="mt-6 h-0.5 bg-gradient-to-r from-[#F5971F]/50 via-[#F5971F]/20 to-transparent" />
        </div>

        {/* Intro */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 mb-10">
          <p className="text-gray-300 leading-relaxed">
            Bem-vindo à <strong className="text-white">Next Plane</strong>.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            Ao acessar este site e utilizar nossos serviços, você concorda com os presentes Termos de Uso. Recomendamos a leitura atenta deste documento.
          </p>
        </div>

        <div className="space-y-10">

          <Section number="1" title="Sobre a Next Plane">
            <p>A Next Plane atua na intermediação e suporte relacionado a:</p>
            <ul>
              <li>passagens aéreas;</li>
              <li>experiências internacionais;</li>
              <li>viagens;</li>
              <li>intercâmbios;</li>
              <li>orientações relacionadas a documentação e viagem.</li>
            </ul>
            <p>As informações disponibilizadas no site possuem caráter informativo e comercial.</p>
          </Section>

          <Section number="2" title="Aceitação dos termos">
            <p>
              Ao acessar o site da Next Plane, o usuário declara estar ciente e de acordo com estes Termos de Uso e com a{' '}
              <Link to="/politica-de-privacidade" className="text-[#F5971F] hover:underline">
                Política de Privacidade
              </Link>.
            </p>
            <p>Caso não concorde com qualquer condição, recomendamos que não utilize o site.</p>
          </Section>

          <Section number="3" title="Uso do site">
            <p>O usuário compromete-se a utilizar o site de forma ética, legal e responsável, não podendo:</p>
            <ul>
              <li>praticar atividades ilícitas;</li>
              <li>comprometer a segurança do site;</li>
              <li>utilizar informações falsas;</li>
              <li>tentar acessar áreas restritas sem autorização.</li>
            </ul>
          </Section>

          <Section number="4" title="Informações sobre serviços e valores">
            <p>
              Os valores, condições, disponibilidade de passagens, tarifas e serviços podem sofrer alterações sem aviso prévio.
            </p>
            <p>A Next Plane não garante disponibilidade contínua de:</p>
            <ul>
              <li>tarifas promocionais;</li>
              <li>condições especiais;</li>
              <li>vagas em voos;</li>
              <li>valores anunciados anteriormente.</li>
            </ul>
            <p>As ofertas estarão sempre sujeitas à disponibilidade e regras das companhias aéreas e parceiros envolvidos.</p>
          </Section>

          <Section number="5" title="Responsabilidades do usuário">
            <p>É responsabilidade do usuário:</p>
            <ul>
              <li>verificar documentos necessários para viagem;</li>
              <li>conferir informações pessoais antes da emissão;</li>
              <li>acompanhar exigências migratórias e sanitárias;</li>
              <li>cumprir regras de embarque do destino escolhido.</li>
            </ul>
            <p>
              A Next Plane poderá auxiliar com orientações gerais, incluindo suporte relacionado ao ETA/eTA e documentação, mas a aprovação final sempre dependerá dos órgãos responsáveis.
            </p>
          </Section>

          <Section number="6" title="Limitação de responsabilidade">
            <p>A Next Plane atua como intermediadora e suporte na organização da viagem.</p>
            <p>Não nos responsabilizamos por:</p>
            <ul>
              <li>cancelamentos de voos;</li>
              <li>alterações realizadas por companhias aéreas;</li>
              <li>negativa de entrada em países;</li>
              <li>atrasos;</li>
              <li>problemas causados por terceiros;</li>
              <li>indisponibilidades temporárias do site.</li>
            </ul>
          </Section>

          <Section number="7" title="Propriedade intelectual">
            <p>Todos os elementos do site, incluindo:</p>
            <ul>
              <li>textos;</li>
              <li>identidade visual;</li>
              <li>logotipos;</li>
              <li>imagens;</li>
              <li>conteúdos;</li>
            </ul>
            <p>são protegidos por direitos autorais e não podem ser reproduzidos sem autorização prévia.</p>
          </Section>

          <Section number="8" title="Links externos">
            <p>
              O site poderá conter links para plataformas e sites de terceiros. A Next Plane não se responsabiliza por conteúdos, políticas ou práticas desses ambientes externos.
            </p>
          </Section>

          <Section number="9" title="Alterações dos termos">
            <p>
              Os presentes Termos de Uso poderão ser atualizados a qualquer momento, sem aviso prévio. Recomendamos revisão periódica desta página.
            </p>
          </Section>

          <Section number="10" title="Contato">
            <p>
              Em caso de dúvidas, solicitações ou suporte, o usuário poderá entrar em contato através dos canais oficiais da Next Plane.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/message/JBJYXKFEPHNMG1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-semibold rounded-xl text-sm transition-all duration-200"
              >
                WhatsApp: (48) 98863-6608
              </a>
              <a
                href="mailto:nextplanee@gmail.com"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl text-sm transition-all duration-200"
              >
                nextplanee@gmail.com
              </a>
            </div>
          </Section>
        </div>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#F5971F] hover:text-[#FF7A2E] font-semibold text-sm transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao site
          </Link>
          <Link to="/politica-de-privacidade" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-lg bg-[#F5971F]/15 border border-[#F5971F]/25 flex items-center justify-center text-[#F5971F] text-xs font-bold flex-shrink-0">
          {number}
        </span>
        <h2 className="font-poppins text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="ml-11 text-gray-400 leading-relaxed space-y-3 [&_p]:text-gray-400 [&_strong]:text-white [&_ul]:space-y-2 [&_ul]:mt-2 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:before:content-['–'] [&_li]:before:text-[#F5971F] [&_li]:before:flex-shrink-0 [&_li]:before:mt-0.5">
        {children}
      </div>
      <div className="mt-6 h-px bg-white/5" />
    </div>
  )
}
