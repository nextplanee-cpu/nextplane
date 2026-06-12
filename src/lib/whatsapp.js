/**
 * Next Plane — Configuração central de links
 * Para atualizar os links, edite apenas este arquivo.
 */

/** Link direto do WhatsApp */
export const WA_DIRECT = 'https://wa.me/message/JBJYXKFEPHNMG1'

/** Link do formulário de cotação */
export const COTACAO_LINK = 'https://agencia.iddas.com.br/so/ivjkp9ty'

// Aliases mantidos para compatibilidade com componentes existentes
export const PHONE = '5548988636608'
export const BASE  = WA_DIRECT

/** Todos os botões de WhatsApp apontam para o link direto */
export const WA_HERO        = WA_DIRECT
export const WA_NAVBAR      = WA_DIRECT
export const WA_FAQ         = WA_DIRECT
export const WA_EXPERIENCIAS = WA_DIRECT
export const WA_QUEM_SOMOS  = WA_DIRECT
export const WA_COTACAO     = WA_DIRECT

/** Destinos — botão "Solicitar Roteiro" por destino */
export const waDestino = () => WA_DIRECT

/** Mensagem automática enviada pelo botão flutuante */
export const WA_MSG = encodeURIComponent(
  'Olá! Vim pelo site da Next Plane e gostaria de solicitar uma cotação de viagem. 🌍✈️'
)

/** Link com mensagem pré-preenchida */
export const WA_MSG_LINK = `https://wa.me/${PHONE}?text=${WA_MSG}`

/** Botão flutuante — 2 opções limpas */
export const WA_FLOAT_OPTIONS = [
  {
    label: '💬 Solicitar Cotação',
    href: WA_MSG_LINK,
    primary: true,
  },
  {
    label: '💬 Falar no WhatsApp',
    href: WA_MSG_LINK,
    primary: false,
  },
]

/** CTA laranja — chips de ação rápida (seção WhatsAppCTA) */
export const WA_CTA_OPTIONS = [
  { label: 'Planeje sua próxima viagem', href: COTACAO_LINK },
  { label: 'Solicitar cotação',          href: COTACAO_LINK },
  { label: 'Lua de mel & casais',        href: WA_DIRECT },
  { label: 'Viagem em família',          href: WA_DIRECT },
]
