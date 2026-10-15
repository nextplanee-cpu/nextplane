/**
 * Conexão com o PostgreSQL.
 *
 * Produção: `pg` (Pool) com o usuário da aplicação (APP_DB_USER), que só lê e grava dados —
 * não cria nem apaga tabelas. Quem altera a estrutura é o usuário dono (POSTGRES_USER),
 * usado apenas por `npm run migrate`.
 * Testes: DB_DRIVER=pglite roda um Postgres de verdade em memória, sem instalar nada.
 */
import pg from 'pg'

/* bigint e numeric chegam como número (o CRM compara ids e soma valores como número) */
const toNumber = v => (v == null ? v : Number(v))
pg.types.setTypeParser(20, toNumber)
pg.types.setTypeParser(1700, toNumber)

const enc = encodeURIComponent

/* "?sslmode=require" na URL mandaria no lugar de DB_SSL e o pg passaria a exigir o certificado da CA
   (o Supabase usa uma CA própria): tiramos da URL e deixamos o DB_SSL decidir */
const semSslmode = url => (process.env.DB_SSL === 'true' ? url.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '') : url)

export function connectionString({ admin = false } = {}) {
  const e = process.env
  if (!admin && e.DATABASE_URL) return semSslmode(e.DATABASE_URL)
  if (admin && e.DATABASE_ADMIN_URL) return semSslmode(e.DATABASE_ADMIN_URL)
  const user = admin ? e.POSTGRES_USER : e.APP_DB_USER
  const pass = admin ? e.POSTGRES_PASSWORD : e.APP_DB_PASSWORD
  if (!user || !pass) return ''
  return `postgres://${enc(user)}:${enc(pass)}@${e.DB_HOST || 'localhost'}:${e.DB_PORT || 5432}/${enc(e.POSTGRES_DB || 'nextplane')}`
}

export const dbConfigured = () => process.env.DB_DRIVER === 'pglite' || Boolean(connectionString())

let driver = null

async function open() {
  if (process.env.DB_DRIVER === 'pglite') {
    const pacote = '@electric-sql/pglite' // fora de literal: o bundle da Vercel não precisa carregar o PGlite
    const { PGlite } = await import(pacote)
    const mem = new PGlite({ parsers: { 20: toNumber, 1700: toNumber } })
    await mem.waitReady
    return { query: async (text, params) => { const r = await mem.query(text, params); return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length } }, raw: mem }
  }
  const pool = new pg.Pool({
    connectionString: connectionString(),
    // serverless (Vercel): cada função abre a própria conexão — 1 por instância evita estourar o limite do banco
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: process.env.VERCEL ? 5_000 : 30_000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  })
  pool.on('error', err => console.error('[db] conexão ociosa caiu:', err.message))
  return { query: (text, params) => pool.query(text, params), raw: pool }
}

/* { rows, rowCount } — sempre com parâmetros ($1, $2…), nunca texto concatenado */
export async function query(text, params = []) {
  if (!driver) driver = open()
  return (await driver).query(text, params)
}

export async function rawDb() {
  if (!driver) driver = open()
  return (await driver).raw
}

export async function closeDb() {
  if (!driver) return
  const d = await driver
  driver = null
  await (d.raw.end ? d.raw.end() : d.raw.close())
}
