import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { WA_FAQ } from '../lib/whatsapp'

const faqs = [
  {
    q: 'Como funciona o planejamento com a Next Plane?',
    a: 'Simples: você manda uma mensagem no WhatsApp com destino, datas e orçamento. A gente monta o roteiro completo — voos, hotel, transfers, experiências — e fica junto até você voltar pra casa.',
  },
  {
    q: 'Atendem viagens em família com crianças pequenas?',
    a: 'Essa é uma das nossas especialidades. Temos experiência com crianças de todas as idades e sabemos escolher hotéis certos, voos com menos escala e roteiros que funcionam de verdade para família.',
  },
  {
    q: 'Para quais destinos a Next Plane trabalha?',
    a: 'Para qualquer lugar do mundo. Santiago, Bariloche, Disney, Maldivas, Europa, Cancún, Dubai — e se você tem outro destino em mente, a gente também chega lá. É só perguntar.',
  },
  {
    q: 'Tem suporte se acontecer algum imprevisto durante a viagem?',
    a: 'Sempre. Nossa equipe fica disponível via WhatsApp do embarque ao retorno. Voo atrasado, dúvida no hotel, qualquer coisa — você não fica na mão.',
  },
  {
    q: 'Atendem quem mora fora de Santa Catarina?',
    a: 'Todo o atendimento é 100% online — via WhatsApp e videochamada. Atendemos clientes em qualquer estado do Brasil.',
  },
  {
    q: 'Com quanto tempo de antecedência eu preciso planejar?',
    a: 'O ideal para viagens internacionais é de 3 a 6 meses — assim garantimos as melhores tarifas. Mas já organizamos viagens com 2 semanas de antecedência. Não deixe o sonho pra depois.',
  },
]

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.38, delay: index * 0.04 }}
      className={`border-b transition-colors duration-200 ${
        open ? 'border-white/10' : 'border-white/5'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className={`text-[14px] leading-snug font-medium transition-colors ${
          open ? 'text-white' : 'text-white/60'
        }`}>
          {item.q}
        </span>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          open ? 'text-brand' : 'text-white/25'
        }`}>
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <p className="text-white/50 text-[14px] leading-[1.75] pb-5 pr-8">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const titleRef = useRef(null)
  const inView   = useInView(titleRef, { once: true, margin: '-60px' })

  return (
    <section id="faq" className="py-24 sm:py-32 bg-surface">
      <div className="max-w-2xl mx-auto px-5 sm:px-8">

        <div ref={titleRef} className="mb-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-brand text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
          >
            Perguntas frequentes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.07 }}
            className="font-poppins text-4xl sm:text-5xl font-bold text-white leading-[1.1]"
          >
            Antes de viajar,{' '}
            <span className="font-light font-serif italic text-white/60">tire as dúvidas.</span>
          </motion.h2>
        </div>

        <div>
          {faqs.map((item, i) => <FAQItem key={i} item={item} index={i} />)}
        </div>

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-white/30 text-sm mt-12 leading-relaxed"
        >
          Ficou com alguma dúvida que não está aqui?{' '}
          <a href={WA_FAQ} target="_blank" rel="noopener noreferrer"
            className="text-brand hover:text-brand-light font-semibold transition-colors underline underline-offset-2">
            Manda uma mensagem →
          </a>
        </motion.p>
      </div>
    </section>
  )
}
