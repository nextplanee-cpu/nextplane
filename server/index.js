/**
 * Servidor Next Plane — entrega o site (pasta dist/) e a API (/api/*) num só processo Node.
 * As funções em api/*.js são as mesmas que rodavam na Vercel: aqui ficam atrás de um Express.
 *
 *   npm run build && npm start        (lê as variáveis do arquivo .env)
 *
 * Atrás de um proxy HTTPS (Caddy/Nginx — ver docker-compose.yml) para o cookie de sessão Secure funcionar.
 */
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { query, dbConfigured } from './db.js'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(raiz, 'dist')

/* Funções da API: todo arquivo de api/ que não começa com "_" */
const funcoes = new Set(fs.readdirSync(path.join(raiz, 'api')).filter(f => f.endsWith('.js') && !f.startsWith('_')).map(f => f.slice(0, -3)))
/* Estas leem o corpo cru (assinatura da Meta; upload de arquivo): não passam pelo parser de JSON */
const CORPO_CRU = new Set(['meta-leads', 'anexos'])

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"

export function criarApp() {
  const app = express()
  app.disable('x-powered-by')
  // quantos proxies confiáveis existem na frente (1 = Caddy do docker-compose; 0 = acesso direto, sem proxy)
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))

  app.use((req, res, next) => {
    res.set({
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': req.path.startsWith('/acompanhar/') ? 'no-referrer' : 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Content-Security-Policy': CSP,
    })
    if (req.path.startsWith('/crm') || req.path.startsWith('/acompanhar/') || req.path.startsWith('/cliente')) res.set('X-Robots-Tag', 'noindex, nofollow')
    next()
  })

  app.get('/healthz', async (req, res) => {
    try { await query('select 1'); res.json({ ok: true }) } catch { res.status(503).json({ ok: false }) }
  })

  const json = express.json({ limit: '1mb' })
  app.all('/api/:nome', (req, res, next) => (CORPO_CRU.has(req.params.nome) ? next() : json(req, res, next)), async (req, res) => {
    const { nome } = req.params
    if (!funcoes.has(nome)) return res.status(404).json({ error: 'not_found' })
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' })
    try {
      const { default: handler } = await import(pathToFileURL(path.join(raiz, 'api', `${nome}.js`)).href)
      await handler(req, res)
    } catch (err) {
      console.error(`[api/${nome}]`, err)
      if (!res.headersSent) res.status(500).json({ error: 'server_error' })
    }
  })
  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }))

  // site (Vite build): arquivos com hash em /assets duram um ano; o resto sempre revalida
  app.use(express.static(dist, {
    index: false,
    setHeaders: (res, file) => res.set('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'),
  }))
  app.use((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end()
    res.set('Cache-Control', 'no-cache')
    res.sendFile(path.join(dist, 'index.html'), err => { if (err && !res.headersSent) res.status(404).send('Rode "npm run build" antes de iniciar o servidor.') })
  })

  // corpo JSON inválido etc.
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(err.status === 413 ? 413 : 400).json({ error: err.status === 413 ? 'too_large' : 'bad_request' })
  })
  return app
}

/* Confere o essencial antes de aceitar requisições: melhor não subir do que subir inseguro */
export function conferirAmbiente() {
  const falta = []
  if ((process.env.JWT_SECRET || '').length < 32 && !process.env.CRM_ENCRYPTION_KEY) falta.push('JWT_SECRET (mínimo 32 caracteres)')
  try {
    if (Buffer.from(process.env.CRM_ENCRYPTION_KEY || '', 'base64').length !== 32) falta.push('CRM_ENCRYPTION_KEY (32 bytes em base64)')
  } catch { falta.push('CRM_ENCRYPTION_KEY') }
  if (!dbConfigured()) falta.push('APP_DB_USER e APP_DB_PASSWORD (ou DATABASE_URL)')
  return falta
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const falta = conferirAmbiente()
  if (falta.length) {
    console.error('Faltam variáveis no .env:\n - ' + falta.join('\n - '))
    process.exit(1)
  }
  const porta = Number(process.env.PORT || 3000)
  criarApp().listen(porta, process.env.HOST || '0.0.0.0', () => console.log(`Next Plane no ar na porta ${porta}`))
}
