/**
 * Demonstração local: sobe o site + API com um Postgres em memória (PGlite), sem instalar nada.
 * Os dados somem quando o processo termina. Serve a pasta dist/ (rode `npm run build` antes).
 *
 *   npm run demo        → http://localhost:3100  (CRM em /crm, área do cliente em /cliente)
 *
 * Cria um administrador de teste com senha aleatória, mostrada no terminal
 * (ou gravada no arquivo indicado em DEMO_CREDENCIAIS_ARQUIVO).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'

const senha = 'Demo-' + crypto.randomBytes(5).toString('hex')
Object.assign(process.env, {
  DB_DRIVER: 'pglite',
  JWT_SECRET: crypto.randomBytes(48).toString('hex'),
  CRM_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  COOKIE_SECURE: 'false',
  TRUST_PROXY: '0',
  ADMIN_EMAIL: 'admin@demo.local',
  ADMIN_NOME: 'Admin Demo',
  ADMIN_SENHA_INICIAL: senha,
})

const { criarApp } = await import('./index.js')
const { migrar } = await import('./migrate.js')
const { rawDb } = await import('./db.js')

const raw = await rawDb()
await migrar({ exec: s => raw.exec(s), query: (s, p) => raw.query(s, p) })

const porta = Number(process.env.PORT || 3100)
criarApp().listen(porta, '127.0.0.1', () => {
  console.log(`\nDemo no ar: http://localhost:${porta}/crm`)
  const texto = `Administrador de teste\nE-mail: admin@demo.local\nSenha inicial: ${senha}\n(a senha inicial precisa ser trocada no primeiro acesso)\n`
  if (process.env.DEMO_CREDENCIAIS_ARQUIVO) {
    fs.writeFileSync(process.env.DEMO_CREDENCIAIS_ARQUIVO, texto)
    console.log(`Credenciais gravadas em ${process.env.DEMO_CREDENCIAIS_ARQUIVO}`)
  } else console.log('\n' + texto)
})
