import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Política de Privacidade — Next Plane'
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
            <Shield size={16} />
            <span className="text-sm font-semibold">Política de Privacidade</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5971F]/10 border border-[#F5971F]/20 text-[#F5971F] text-xs font-semibold mb-4">
            <Shield size={12} />
            LGPD — Lei nº 13.709/2018
          </div>
          <h1 className="font-poppins text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-400 text-sm">Última atualização: Maio de 2026</p>
          <div className="mt-6 h-0.5 bg-gradient-to-r from-[#F5971F]/50 via-[#F5971F]/20 to-transparent" />
        </div>

        {/* Intro */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 mb-10">
          <p className="text-gray-300 leading-relaxed">
            A <strong className="text-white">Next Plane</strong> valoriza a privacidade e a proteção dos dados pessoais de seus usuários, clientes e visitantes. Esta Política de Privacidade explica como coletamos, utilizamos e protegemos suas informações ao acessar nosso site, entrar em contato conosco ou utilizar nossos serviços.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            Ao utilizar nossos serviços, você concorda com os termos desta Política de Privacidade.
          </p>
        </div>

        <div className="space-y-10">

          <Section number="1" title="Dados coletados">
            <p>Podemos coletar as seguintes informações:</p>
            <ul>
              <li>Nome completo</li>
              <li>Telefone e WhatsApp</li>
              <li>Endereço de e-mail</li>
              <li>Informações fornecidas em formulários</li>
              <li>Dados relacionados à viagem e atendimento</li>
              <li>Informações de navegação no site</li>
              <li>Endereço IP, dispositivo e navegador utilizado</li>
            </ul>
          </Section>

          <Section number="2" title="Como utilizamos os dados">
            <p>Os dados coletados poderão ser utilizados para:</p>
            <ul>
              <li>Realizar atendimentos e suporte ao cliente</li>
              <li>Enviar informações sobre viagens, promoções e oportunidades</li>
              <li>Responder solicitações realizadas pelo usuário</li>
              <li>Melhorar a experiência de navegação no site</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Entrar em contato via WhatsApp, telefone ou e-mail</li>
            </ul>
          </Section>

          <Section number="3" title="Compartilhamento de informações">
            <p>A Next Plane <strong className="text-white">não vende dados pessoais</strong>.</p>
            <p>As informações poderão ser compartilhadas apenas quando necessário com:</p>
            <ul>
              <li>Companhias aéreas</li>
              <li>Seguradoras</li>
              <li>Parceiros relacionados à viagem</li>
              <li>Plataformas de pagamento</li>
              <li>Ferramentas de marketing e análise</li>
            </ul>
            <p>Sempre buscando limitar o compartilhamento ao mínimo necessário.</p>
          </Section>

          <Section number="4" title="Cookies e tecnologias de rastreamento">
            <p>Nosso site pode utilizar cookies e tecnologias semelhantes para:</p>
            <ul>
              <li>Melhorar a navegação</li>
              <li>Analisar métricas e desempenho</li>
              <li>Personalizar conteúdos e anúncios</li>
            </ul>
            <p>Ao continuar navegando no site, o usuário concorda com o uso dessas tecnologias.</p>
          </Section>

          <Section number="5" title="Segurança das informações">
            <p>
              Adotamos medidas de segurança para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida.
            </p>
            <p>
              Apesar dos esforços, nenhum sistema é completamente seguro, e não podemos garantir segurança absoluta das informações transmitidas pela internet.
            </p>
          </Section>

          <Section number="6" title="Direitos do usuário">
            <p>Nos termos da LGPD, o usuário poderá solicitar:</p>
            <ul>
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos dados pessoais</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Exclusão de dados pessoais quando aplicável</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p>As solicitações poderão ser feitas através dos canais oficiais de atendimento da Next Plane.</p>
          </Section>

          <Section number="7" title="Links externos">
            <p>
              O site poderá conter links para sites externos. Não nos responsabilizamos pelas políticas de privacidade ou conteúdos de terceiros.
            </p>
          </Section>

          <Section number="8" title="Alterações nesta política">
            <p>
              Esta Política de Privacidade poderá ser atualizada periodicamente para adequação legal ou melhoria dos serviços.
            </p>
            <p>Recomendamos que o usuário revise esta página regularmente.</p>
          </Section>

          <Section number="9" title="Contato">
            <p>
              Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados pessoais, entre em contato pelos canais oficiais da Next Plane.
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
          <Link to="/termos-de-uso" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Termos de Uso →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div className="group">
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
