/**
 * Teste do importador: um "Supabase de mentira" (HTTP) entrega leads, assessorias e anexos
 * criptografados; conferimos que chegam íntegros ao Postgres e que a chave errada é barrada.
 */
import http from 'node:http'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

Object.assign(process.env, {
  DB_DRIVER: 'pglite',
  CRM_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  JWT_SECRET: crypto.randomBytes(48).toString('hex'),
})
const { migrar } = await import('../migrate.js')
const { rawDb, closeDb } = await import('../db.js')
const { importar } = await import('../importar-supabase.js')
const { encrypt, encryptJSON, encryptBuffer } = await import('../../api/_lib/crypto.js')

const pdf = Buffer.from('%PDF-1.4\nconteudo do bilhete\n%%EOF')
const fid = crypto.randomUUID()
const leads = [
  { id: 7, name: encrypt('Ana Souza'), phone: encrypt('11999990000'), email: '', value: 2500, stage: 3, respostas: encryptJSON([{ pergunta: 'p', resposta: 'r' }]), created_at: '2026-09-25T10:00:00+00:00' },
  { id: 9, name: encrypt('Bia Lima'), phone: '', email: '', value: 0, stage: 0, respostas: [], created_at: '2026-09-26T10:00:00+00:00' },
]
const assessorias = [{ id: 4, lead_id: 7, data: { responsavel: 'Joseph', _enc: encryptJSON({ cliente: 'Ana', valor: 800 }) }, created_at: '2026-09-29T10:00:00+00:00' }]
const audit = [{ id: 1, at: '2026-09-30T10:00:00+00:00', user_email: 'joseph@x.com', action: 'login', entity: 'auth', entity_id: null, ip: '1.1.1.1' }]

const fake = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  const json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) }
  const off = Number(u.searchParams.get('offset') || 0)
  if (u.pathname === '/rest/v1/crm_leads') return json(off ? [] : leads)
  if (u.pathname === '/rest/v1/crm_assessorias') return json(off ? [] : assessorias)
  if (u.pathname === '/rest/v1/crm_audit') return json(off ? [] : audit)
  if (u.pathname === '/storage/v1/object/list/crm-anexos') {
    let b = ''; req.on('data', c => (b += c)); req.on('end', () => json(JSON.parse(b).prefix === '4/' ? [{ name: fid }, { name: '.emptyFolderPlaceholder' }] : []))
    return
  }
  if (u.pathname === `/storage/v1/object/crm-anexos/4/${fid}`) return res.end(encryptBuffer(pdf))
  res.statusCode = 404; res.end('{}')
})
await new Promise(r => fake.listen(0, r))
const url = `http://127.0.0.1:${fake.address().port}`

try {
  const raw = await rawDb()
  await migrar({ exec: s => raw.exec(s), query: (s, p) => raw.query(s, p) })
  const db = { query: (s, p) => raw.query(s, p).then(r => ({ rows: r.rows, rowCount: r.affectedRows ?? r.rows.length })) }

  const quieto = () => {}
  let c = await importar({ url, chave: 'sb_secret_teste', db, log: quieto })
  assert.deepEqual(c.crm_leads, { lidas: 2, novas: 2 })
  const l = (await raw.query('select id, name, value, stage, respostas from crm_leads order by id')).rows
  assert.deepEqual(l.map(x => x.id), [7, 9]); assert.equal(l[0].value, 2500)
  assert.match(l[0].name, /^enc:v1:/); assert.match(l[0].respostas, /^enc:v1:/); assert.deepEqual(l[1].respostas, [])
  console.log('  ✔ leads copiados com ids, valores e campos criptografados intactos')

  const a = (await raw.query('select id, lead_id, data from crm_assessorias')).rows[0]
  assert.equal(a.id, 4); assert.equal(a.data.responsavel, 'Joseph'); assert.match(a.data._enc, /^enc:v1:/)
  console.log('  ✔ assessoria copiada com a ficha criptografada')

  const x = (await raw.query('select file_id, assessoria_id, tipo, tamanho from crm_anexos')).rows
  assert.equal(x.length, 1); assert.equal(x[0].tipo, 'application/pdf'); assert.equal(x[0].tamanho, pdf.length)
  console.log('  ✔ anexo copiado (tipo e tamanho conferidos, ignorou o placeholder do Supabase)')

  const novo = (await raw.query("insert into crm_leads (name) values ('novo') returning id")).rows[0].id
  assert.equal(novo, 10); console.log('  ✔ novos leads continuam a numeração depois do maior id importado')

  c = await importar({ url, chave: 'sb_secret_teste', db, log: quieto })
  assert.deepEqual(c.crm_leads, { lidas: 2, novas: 0 }); assert.equal(c.anexos, 0)
  console.log('  ✔ rodar de novo não duplica nada')

  // chave de criptografia errada → aborta antes de gravar
  process.env.CRM_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64')
  await raw.exec('delete from crm_anexos; delete from crm_assessorias; delete from crm_leads; delete from crm_audit;')
  await assert.rejects(() => importar({ url, chave: 'sb_secret_teste', db, log: quieto }), /não é a mesma/)
  assert.equal((await raw.query('select count(*)::int as n from crm_leads')).rows[0].n, 0)
  console.log('  ✔ chave de criptografia diferente da antiga aborta sem importar nada')
  console.log('\nImportador OK.')
} catch (err) {
  console.error('\nFALHOU:', err.message)
  process.exitCode = 1
} finally {
  fake.close()
  await closeDb().catch(() => {})
}
