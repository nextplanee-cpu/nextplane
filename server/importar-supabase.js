/**
 * Copia os dados que já estão no Supabase (leads, assessorias, anexos, registro de acessos)
 * para o PostgreSQL do servidor. Os dados continuam criptografados como estão: por isso o
 * CRM_ENCRYPTION_KEY do .env PRECISA ser o mesmo que está na Vercel.
 *
 *   1. no .env, preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (os mesmos da Vercel) e a chave de criptografia antiga
 *   2. npm run migrate            (cria as tabelas)
 *   3. npm run importar-supabase  (pode rodar de novo: o que já foi copiado é ignorado)
 *
 * Não copia usuários nem senhas (ficam no Supabase Auth): crie os acessos com `npm run usuario`.
 */
import { pathToFileURL } from 'node:url'
import pg from 'pg'
import { connectionString } from './db.js'
import { decrypt, isEncrypted, decryptBuffer } from '../api/_lib/crypto.js'
import { tipoReal } from '../api/_lib/storage.js'

const BUCKET = 'crm-anexos'
const TABELAS = [
  { nome: 'crm_leads', ordem: 'id' },
  { nome: 'crm_assessorias', ordem: 'id' },
  { nome: 'crm_audit', ordem: 'id' },
]

export async function importar({ url, chave, db, log = console.log }) {
  const base = url.replace(/\/$/, '')
  const cab = { apikey: chave, ...(chave.startsWith('sb_') ? {} : { Authorization: `Bearer ${chave}` }) }
  const get = async (caminho, opts = {}) => {
    const r = await fetch(`${base}${caminho}`, { ...opts, headers: { ...cab, ...(opts.headers || {}) } })
    if (!r.ok) throw new Error(`Supabase ${caminho} → ${r.status}: ${(await r.text()).slice(0, 200)}`)
    return r
  }

  async function linhas(tabela, ordem) {
    const out = []
    for (let off = 0; ; off += 1000) {
      const lote = await (await get(`/rest/v1/${tabela}?select=*&order=${ordem}.asc&limit=1000&offset=${off}`)).json()
      out.push(...lote)
      if (lote.length < 1000) return out
    }
  }

  // 1) a chave de criptografia é a mesma? (senão tudo importaria "vazio" sem aviso)
  const amostra = (await linhas('crm_leads', 'id')).find(l => isEncrypted(l.name)) || (await linhas('crm_assessorias', 'id')).find(a => isEncrypted(a.data?._enc))
  if (amostra && !decrypt(amostra.name ?? amostra.data?._enc)) {
    throw new Error('CRM_ENCRYPTION_KEY do .env não é a mesma da Vercel — os dados não abririam. Copie a chave de lá e rode de novo.')
  }

  const contagem = {}
  for (const { nome, ordem } of TABELAS) {
    const cols = (await db.query("select column_name, data_type from information_schema.columns where table_name = $1 and table_schema = 'public'", [nome])).rows
    const tipos = Object.fromEntries(cols.map(c => [c.column_name, c.data_type]))
    const rows = await linhas(nome, ordem)
    let novas = 0
    for (const row of rows) {
      const ks = Object.keys(row).filter(k => k in tipos)
      const vals = ks.map(k => (tipos[k] === 'jsonb' && row[k] !== null ? JSON.stringify(row[k]) : row[k]))
      const r = await db.query(
        `insert into ${nome} (${ks.join(', ')}) values (${ks.map((k, i) => `$${i + 1}${tipos[k] === 'jsonb' ? '::jsonb' : ''}`).join(', ')}) on conflict do nothing`, vals)
      novas += r.rowCount || 0
    }
    // a sequência precisa continuar depois do maior id importado
    await db.query(`select setval(pg_get_serial_sequence('${nome}', 'id'), greatest((select coalesce(max(id), 1) from ${nome}), 1))`)
    contagem[nome] = { lidas: rows.length, novas }
    log(`✔ ${nome}: ${rows.length} no Supabase, ${novas} copiadas agora`)
  }

  // anexos: cada assessoria tem uma pasta <id>/ no bucket
  let anexos = 0
  for (const { id } of (await db.query('select id from crm_assessorias')).rows) {
    const r = await fetch(`${base}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST', headers: { ...cab, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: `${id}/`, limit: 1000 }),
    })
    if (!r.ok) continue // bucket ainda não existe = nenhum anexo
    for (const o of (await r.json().catch(() => [])) || []) {
      if (!o.name || !/^[0-9a-f-]{36}$/.test(o.name)) continue
      const dados = Buffer.from(await (await get(`/storage/v1/object/${BUCKET}/${id}/${o.name}`)).arrayBuffer())
      const aberto = decryptBuffer(dados)
      const tipo = tipoReal(aberto)
      if (!tipo) { log(`! anexo ${id}/${o.name} ignorado (tipo desconhecido)`); continue }
      const x = await db.query(
        'insert into crm_anexos (file_id, assessoria_id, tipo, tamanho, conteudo) values ($1, $2, $3, $4, $5) on conflict do nothing',
        [o.name, id, tipo, aberto.length, dados])
      anexos += x.rowCount || 0
    }
  }
  log(`✔ anexos: ${anexos} copiados`)
  contagem.anexos = anexos
  return contagem
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  const admin = connectionString({ admin: true })
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !admin) {
    console.error('Preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POSTGRES_USER e POSTGRES_PASSWORD no .env')
    process.exit(1)
  }
  // roda com o usuário dono: precisa ajustar as sequências dos ids
  const client = new pg.Client({ connectionString: admin })
  await client.connect()
  try {
    await importar({ url: SUPABASE_URL, chave: SUPABASE_SERVICE_ROLE_KEY, db: { query: (s, p) => client.query(s, p) } })
    console.log('Importação concluída.')
  } catch (err) {
    console.error('Falhou:', err.message)
    process.exitCode = 1
  } finally { await client.end() }
}
