/**
 * Prepara o banco: cria/atualiza as tabelas (db/*.sql, cada arquivo roda uma vez), garante o usuário
 * da aplicação com permissões mínimas e cria o primeiro administrador.
 *
 *   npm run migrate
 *
 * Roda com o usuário DONO do banco (POSTGRES_USER). A aplicação em si usa só o APP_DB_USER,
 * que lê e grava dados mas não consegue apagar nem alterar tabelas.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import pg from 'pg'
import { connectionString } from './db.js'
import { hashSenha, senhaFraca } from '../api/_lib/senha.js'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IDENT = /^[a-z_][a-z0-9_]{0,62}$/

/**
 * @param {{ exec: (sql: string) => Promise<any>, query: (sql: string, params?: any[]) => Promise<{ rows: any[] }> }} db
 * @param {{ papel?: boolean }} opts  papel: cria o usuário da aplicação (só em Postgres de verdade)
 */
export async function migrar(db, { papel = false } = {}) {
  await db.exec('create table if not exists schema_migrations (nome text primary key, aplicada_em timestamptz default now())')
  const feitas = new Set((await db.query('select nome from schema_migrations')).rows.map(r => r.nome))
  const dir = path.join(raiz, 'db')
  for (const arq of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (feitas.has(arq)) continue
    await db.exec('begin')
    try {
      await db.exec(fs.readFileSync(path.join(dir, arq), 'utf8'))
      await db.query('insert into schema_migrations (nome) values ($1)', [arq])
      await db.exec('commit')
      console.log(`✔ ${arq}`)
    } catch (err) {
      await db.exec('rollback')
      throw new Error(`${arq}: ${err.message}`)
    }
  }

  if (papel) {
    const user = process.env.APP_DB_USER, pass = process.env.APP_DB_PASSWORD
    if (!user || !pass) throw new Error('APP_DB_USER e APP_DB_PASSWORD são obrigatórios no .env')
    if (!IDENT.test(user)) throw new Error('APP_DB_USER só pode ter letras minúsculas, números e _')
    const senha = `'${pass.replace(/'/g, "''")}'`
    const existe = (await db.query('select 1 from pg_roles where rolname = $1', [user])).rows.length
    await db.exec(`${existe ? 'alter' : 'create'} role "${user}" login password ${senha} nosuperuser nocreatedb nocreaterole`)
    const banco = (await db.query('select current_database() as n')).rows[0].n
    await db.exec(`
      grant connect on database "${banco.replace(/"/g, '')}" to "${user}";
      grant usage on schema public to "${user}";
      grant select, insert, update, delete on all tables in schema public to "${user}";
      grant usage, select on all sequences in schema public to "${user}";
      revoke all on schema_migrations from "${user}";
      alter default privileges in schema public grant select, insert, update, delete on tables to "${user}";
      alter default privileges in schema public grant usage, select on sequences to "${user}";`)
    console.log(`✔ usuário da aplicação "${user}" pronto (só lê e grava dados)`)
  }

  // primeiro administrador: só se ainda não existe nenhum
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const inicial = process.env.ADMIN_SENHA_INICIAL || ''
  const { rows } = await db.query("select count(*)::int as n from crm_users where role = 'admin'")
  if (!rows[0].n && email && inicial) {
    if (senhaFraca(inicial)) throw new Error('ADMIN_SENHA_INICIAL precisa ter pelo menos 10 caracteres')
    await db.query(
      "insert into crm_users (email, nome, role, senha_hash, trocar_senha) values ($1, $2, 'admin', $3, true)",
      [email, process.env.ADMIN_NOME || 'Administrador', await hashSenha(inicial)])
    console.log(`✔ administrador ${email} criado — a senha inicial precisa ser trocada no primeiro acesso`)
  } else if (!rows[0].n) {
    console.warn('! Nenhum administrador existe. Defina ADMIN_EMAIL e ADMIN_SENHA_INICIAL no .env (ou use "npm run usuario").')
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const url = connectionString({ admin: true })
  if (!url) { console.error('Defina POSTGRES_USER e POSTGRES_PASSWORD (ou DATABASE_ADMIN_URL) no .env'); process.exit(1) }
  const client = new pg.Client({ connectionString: url, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined })
  try {
    // o banco pode estar acordando (docker): tenta por até ~30 s
    for (let i = 0; ; i++) {
      try { await client.connect(); break } catch (err) { if (i >= 15) throw err; await new Promise(r => setTimeout(r, 2000)) }
    }
    await migrar({ exec: sql => client.query(sql), query: (sql, p) => client.query(sql, p) }, { papel: true })
    console.log('Banco pronto.')
  } catch (err) {
    console.error('Falhou:', err.message)
    process.exitCode = 1
  } finally { await client.end().catch(() => {}) }
}
