/**
 * Cria o arquivo .env a partir do .env.example, já com senhas e chaves aleatórias fortes.
 *
 *   npm run gerar-env -- --email voce@exemplo.com --dominio crm.seudominio.com.br
 *
 * Não sobrescreve um .env que já existe. Nenhum segredo é mostrado na tela: abra o .env para ler.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const destino = path.join(raiz, '.env')
if (fs.existsSync(destino)) { console.error('.env já existe — não vou sobrescrever. Apague ou renomeie o atual se quiser gerar outro.'); process.exit(1) }

const arg = {}
for (let i = 2; i < process.argv.length; i += 2) arg[process.argv[i].replace(/^--/, '')] = process.argv[i + 1]

const hex = n => crypto.randomBytes(n).toString('hex')
/* senha inicial legível, para o administrador digitar uma vez */
const legivel = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let s = ''
  while (s.length < 16) s += a[crypto.randomInt(a.length)]
  return /\d/.test(s) ? s : legivel()
}

const valores = {
  POSTGRES_PASSWORD: hex(24),
  APP_DB_PASSWORD: hex(24),
  JWT_SECRET: hex(48),
  CRM_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  ADMIN_SENHA_INICIAL: legivel(),
  ...(arg.email ? { ADMIN_EMAIL: arg.email } : {}),
  ...(arg.nome ? { ADMIN_NOME: arg.nome } : {}),
  ...(arg.dominio ? { DOMINIO: arg.dominio, PUBLIC_URL: `https://${arg.dominio}` } : {}),
}

const saida = fs.readFileSync(path.join(raiz, '.env.example'), 'utf8').split('\n').map(linha => {
  const m = /^([A-Z0-9_]+)=/.exec(linha)
  return m && m[1] in valores ? `${m[1]}=${valores[m[1]]}` : linha
}).join('\n')

fs.writeFileSync(destino, saida, { mode: 0o600 })
console.log('✔ .env criado com senhas e chaves aleatórias.')
console.log('  Guarde uma cópia do .env num lugar seguro (principalmente a CRM_ENCRYPTION_KEY).')
