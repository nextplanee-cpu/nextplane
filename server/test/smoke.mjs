/**
 * Teste de ponta a ponta (sem instalar Postgres: usa o PGlite, um Postgres real em memória).
 *   npm test
 * Cobre: migração, login da equipe, troca obrigatória de senha, JWT, acesso do cliente por CPF,
 * isolamento entre clientes, criptografia no banco, bloqueio por tentativas e anexos.
 */
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const senhaAdmin = 'Adm1n-' + crypto.randomBytes(6).toString('hex')
Object.assign(process.env, {
  DB_DRIVER: 'pglite',
  JWT_SECRET: crypto.randomBytes(48).toString('hex'),
  CRM_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  COOKIE_SECURE: 'false',
  TRUST_PROXY: '0',
  ADMIN_EMAIL: 'admin@teste.local',
  ADMIN_NOME: 'Admin Teste',
  ADMIN_SENHA_INICIAL: senhaAdmin,
})

const { criarApp, conferirAmbiente } = await import('../index.js')
const { migrar } = await import('../migrate.js')
const { rawDb, query, closeDb } = await import('../db.js')
const { hashSenha } = await import('../../api/_lib/senha.js')

assert.deepEqual(conferirAmbiente(), [], 'ambiente de teste deve estar completo')
const raw = await rawDb()
await migrar({ exec: sql => raw.exec(sql), query: (sql, p) => raw.query(sql, p) })

const servidor = criarApp().listen(0)
const base = `http://127.0.0.1:${servidor.address().port}`

/* "navegador" com cookies próprios */
const navegador = () => {
  const jar = new Map()
  return async (caminho, { method = 'GET', body, headers = {} } = {}) => {
    const h = { Origin: base, ...headers }
    if (body && !(body instanceof Buffer)) h['Content-Type'] = 'application/json'
    if (jar.size) h.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const r = await fetch(base + caminho, { method, headers: h, body: body instanceof Buffer ? body : body ? JSON.stringify(body) : undefined })
    for (const c of r.headers.getSetCookie()) {
      const [par, ...attrs] = c.split('; ')
      const i = par.indexOf('=')
      if (attrs.some(a => a === 'Max-Age=0')) jar.delete(par.slice(0, i)); else jar.set(par.slice(0, i), par.slice(i + 1))
    }
    const tipo = r.headers.get('content-type') || ''
    return { status: r.status, headers: r.headers, data: tipo.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()), jar }
  }
}

let n = 0
const ok = nome => console.log(`  ✔ ${++n}. ${nome}`)

try {
  // ── saúde e segurança básica ──
  const equipe = navegador()
  assert.equal((await equipe('/healthz')).status, 200); ok('servidor e banco respondendo')
  const sec = await equipe('/healthz')
  assert.match(sec.headers.get('content-security-policy'), /default-src 'self'/)
  assert.ok(sec.headers.get('strict-transport-security')); ok('cabeçalhos de segurança (CSP, HSTS)')

  // ── admin: login → troca obrigatória → CRM liberado ──
  let r = await equipe('/api/auth?action=login', { method: 'POST', body: { email: 'admin@teste.local', password: 'senha-errada-123' } })
  assert.equal(r.status, 401); ok('senha errada é recusada')
  r = await equipe('/api/auth?action=login', { method: 'POST', body: { email: 'admin@teste.local', password: senhaAdmin } })
  assert.equal(r.status, 200); assert.equal(r.data.role, 'admin'); assert.equal(r.data.trocar_senha, true)
  assert.ok(!('senha_hash' in r.data)); ok('admin entra com a senha inicial e é mandado trocar a senha')
  r = await equipe('/api/leads')
  assert.equal(r.status, 403); assert.equal(r.data.error, 'must_change_password'); ok('CRM bloqueado até trocar a senha inicial')
  const senhaNova = 'Nova-Senha-' + crypto.randomBytes(4).toString('hex')
  r = await equipe('/api/auth?action=senha', { method: 'POST', body: { atual: senhaAdmin, nova: 'curta' } })
  assert.equal(r.status, 400); ok('senha fraca é recusada')
  r = await equipe('/api/auth?action=senha', { method: 'POST', body: { atual: senhaAdmin, nova: senhaNova } })
  assert.equal(r.status, 200); ok('admin troca a senha')
  r = await equipe('/api/leads')
  assert.equal(r.status, 200); assert.ok(Array.isArray(r.data)); ok('CRM liberado depois da troca')

  // ── JWT: adulterado, "alg none", outro tipo, Bearer ──
  const jwt = r.jar.get('np_at')
  const [h, p, s] = jwt.split('.')
  const outro = navegador()
  const comCookie = async (token, caminho = '/api/auth?action=me') => (await fetch(base + caminho, { headers: { Cookie: `np_at=${token}` } })).status
  assert.equal(await comCookie(jwt), 200)
  assert.equal(await comCookie(`${h}.${p}.${s.slice(0, -2)}xx`), 401); ok('JWT adulterado é recusado')
  const payload = JSON.parse(Buffer.from(p, 'base64url'))
  const semAssinatura = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ ...payload, role: 'admin' })).toString('base64url')}.`
  assert.equal(await comCookie(semAssinatura), 401); ok('JWT com alg=none é recusado')
  const bearer = await fetch(base + '/api/auth?action=me', { headers: { Authorization: `Bearer ${jwt}` } })
  assert.equal(bearer.status, 200); ok('JWT também vale em Authorization: Bearer (apps futuros)')
  r = await fetch(base + '/api/auth?action=me&tipo=cliente', { headers: { Authorization: `Bearer ${jwt}` } })
  assert.equal(r.status, 401); ok('JWT da equipe não abre a área do cliente')
  // trocar a senha derruba o JWT antigo (token_ver)
  const sessao2 = navegador()
  await sessao2('/api/auth?action=login', { method: 'POST', body: { email: 'admin@teste.local', password: senhaNova } })
  const jwt2 = (await sessao2('/api/auth?action=me')).jar.get('np_at')
  await equipe('/api/auth?action=senha', { method: 'POST', body: { atual: senhaNova, nova: senhaNova + 'X' } })
  assert.equal(await comCookie(jwt2), 401); ok('trocar a senha derruba as sessões antigas')

  // ── bloqueio por tentativas (equipe) ──
  await query("insert into crm_users (email, nome, role, senha_hash) values ('bloq@teste.local', 'Bloq', 'consultor', $1)",
    [await hashSenha('Certa-123456')])
  const tentativas = []
  for (let i = 0; i < 6; i++) tentativas.push((await outro('/api/auth?action=login', { method: 'POST', body: { email: 'bloq@teste.local', password: 'errada-' + i } })).status)
  assert.deepEqual(tentativas.slice(0, 5), [401, 401, 401, 401, 401]); assert.equal(tentativas[5], 429)
  r = await outro('/api/auth?action=login', { method: 'POST', body: { email: 'bloq@teste.local', password: 'Certa-123456' } })
  assert.equal(r.status, 429); ok('5 erros seguidos bloqueiam a conta, até com a senha certa')

  // ── CSRF: POST de outra origem é barrado ──
  r = await equipe('/api/leads', { method: 'POST', body: { name: 'x' }, headers: { Origin: 'https://site-malicioso.com' } })
  assert.equal(r.status, 403); ok('requisição de outra origem é barrada')

  // ── lead e assessoria ──
  r = await equipe('/api/leads', { method: 'POST', body: { name: 'Maria Cliente', phone: '11999990000', email: 'maria@x.com', value: 1500 } })
  assert.equal(r.status, 201); assert.equal(r.data.name, 'Maria Cliente'); ok('lead criado e devolvido aberto para quem tem acesso')
  const brutoLead = (await query('select name, phone, email, value from crm_leads')).rows[0]
  assert.match(brutoLead.name, /^enc:v1:/); assert.match(brutoLead.phone, /^enc:v1:/); assert.equal(brutoLead.value, 1500)
  ok('dados do lead ficam criptografados no banco')

  const CPF_A = '529.982.247-25', CPF_B = '111.444.777-35'
  const view = { cliente: 'Maria', destino: 'Lisboa', inicio: '2027-01-26', fim: '2027-02-06', viajantes: 2, proxima: { etapa: 'Aéreo', acao: 'Emitir', detalhe: 'x' },
    etapas: [{ k: 'aereo', nome: 'Aéreo', estado: 'atual', done: 0, total: 1, unit: 'trechos', itens: [{ titulo: 'GRU → LIS', status: 'Pendente', anexos: [] }] }],
    economia: { total: 1200, itens: [{ nome: 'Aéreo', valor: 1200 }] }, atualizado: new Date().toISOString() }
  const ficha = { cliente: 'Maria Cliente', responsavel: 'Joseph', status: 'andamento', valor: 800, lucro: { hotel: 300 }, economia: { aereo: 1200 },
    passageiros: [{ nome: 'Maria', cpf: CPF_A, passaporte_num: 'FA123456' }], acesso: { ativo: true }, portal_view: view, fim: '2027-02-06' }
  r = await equipe('/api/assessorias', { method: 'POST', body: { data: ficha } })
  assert.equal(r.status, 201); const idA = r.data.id; assert.equal(r.data.data.passageiros[0].cpf, CPF_A)
  r = await equipe('/api/assessorias', { method: 'POST', body: { data: { ...ficha, cliente: 'Outro', passageiros: [] } } })
  const idB = r.data.id
  const brutoAss = (await query('select data from crm_assessorias where id = $1', [idA])).rows[0].data
  assert.ok(brutoAss._enc.startsWith('enc:v1:')); assert.ok(!JSON.stringify(brutoAss).includes('FA123456')); assert.ok(!JSON.stringify(brutoAss).includes('Maria'))
  ok('ficha da assessoria (passaporte, CPF, valores) criptografada no banco')

  // ── acesso do cliente por CPF ──
  r = await equipe('/api/acesso-cliente', { method: 'POST', body: { assessoria: idA, cpf: '123.456.789-00', nome: 'Maria' } })
  assert.equal(r.status, 400); assert.equal(r.data.error, 'cpf_invalido'); ok('CPF inválido é recusado')
  r = await equipe('/api/acesso-cliente', { method: 'POST', body: { assessoria: idA, cpf: CPF_A, nome: 'Maria Cliente' } })
  assert.equal(r.status, 201); assert.equal(r.data.novo, true); const provisoria = r.data.senha_provisoria
  assert.ok(provisoria && provisoria.length >= 8); ok('acesso criado, com senha provisória mostrada uma vez')
  const cb = (await query('select cpf_hash, cpf_enc, nome_enc, senha_hash, trocar_senha from crm_clientes')).rows[0]
  assert.ok(!cb.cpf_hash.includes('52998224725')); assert.match(cb.cpf_enc, /^enc:v1:/); assert.match(cb.senha_hash, /^scrypt\$/)
  assert.ok(!cb.senha_hash.includes(provisoria)); assert.equal(cb.trocar_senha, true); ok('CPF não fica aberto e a senha é só um hash scrypt')
  r = await equipe(`/api/acesso-cliente?assessoria=${idA}`)
  assert.equal(r.data.cpf, '***.***.247-25'); assert.equal(r.data.trocar_senha, true); assert.ok(!JSON.stringify(r.data).includes(provisoria))
  ok('o CRM só mostra o CPF mascarado')

  const cliente = navegador()
  r = await cliente('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: CPF_B, password: provisoria } })
  const semConta = r
  r = await cliente('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: CPF_A, password: 'senha-errada1' } })
  assert.equal(r.status, 401); assert.deepEqual(r.data, semConta.data); ok('CPF inexistente e senha errada dão a mesma resposta')
  r = await cliente('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: '529.982.247-25', password: provisoria } })
  assert.equal(r.status, 200); assert.equal(r.data.trocar_senha, true); assert.equal(r.data.tipo, 'cliente'); ok('cliente entra por CPF + senha provisória')
  r = await cliente('/api/cliente')
  assert.equal(r.status, 403); assert.equal(r.data.error, 'must_change_password'); ok('1º acesso: nada abre até trocar a senha')
  r = await cliente('/api/auth?action=senha', { method: 'POST', body: { tipo: 'cliente', atual: provisoria, nova: '52998224725a' } })
  assert.equal(r.status, 400); ok('senha nova não pode conter o CPF')
  r = await cliente('/api/auth?action=senha', { method: 'POST', body: { tipo: 'cliente', atual: provisoria, nova: provisoria } })
  assert.equal(r.status, 400); assert.equal(r.data.error, 'same_password'); ok('senha nova precisa ser diferente da provisória')
  const senhaCliente = 'Viagem-' + crypto.randomBytes(3).toString('hex') + '9'
  r = await cliente('/api/auth?action=senha', { method: 'POST', body: { tipo: 'cliente', atual: provisoria, nova: senhaCliente } })
  assert.equal(r.status, 200); ok('cliente define a própria senha')
  r = await cliente('/api/cliente')
  assert.equal(r.status, 200); assert.equal(r.data.length, 1); assert.equal(r.data[0].id, idA)
  assert.equal(r.data[0].destino, 'Lisboa'); assert.equal(r.data[0].economia.total, 1200); ok('cliente vê a viagem dele, com a economia')
  const texto = JSON.stringify(r.data)
  for (const proibido of ['lucro', 'FA123456', '529.982', '52998224725', 'passaporte', 'valor":800']) assert.ok(!texto.includes(proibido), `vazou: ${proibido}`)
  ok('nada de lucro, CPF, passaporte ou valores no que o cliente recebe')
  assert.equal((await cliente('/api/leads')).status, 401)
  assert.equal((await cliente('/api/assessorias')).status, 401)
  assert.equal((await cliente('/api/acesso-cliente?assessoria=' + idA)).status, 401); ok('cliente não alcança nenhuma API da equipe')
  const jwtCliente = cliente.jar?.get?.('np_ct') ?? (await cliente('/api/cliente')).jar.get('np_ct')
  r = await fetch(base + '/api/leads', { headers: { Authorization: `Bearer ${jwtCliente}` } })
  assert.equal(r.status, 401); ok('JWT de cliente não vale como equipe')
  r = await cliente('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: CPF_A, password: provisoria } })
  assert.equal(r.status, 401); ok('a senha provisória deixa de funcionar')

  // outro cliente não vê a viagem alheia
  await equipe('/api/acesso-cliente', { method: 'POST', body: { assessoria: idB, cpf: CPF_B, nome: 'Outro' } })
    .then(async x => {
      const c2 = navegador()
      await c2('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: CPF_B, password: x.data.senha_provisoria } })
      const nova = 'Outra-' + crypto.randomBytes(3).toString('hex') + '7'
      await c2('/api/auth?action=senha', { method: 'POST', body: { tipo: 'cliente', atual: x.data.senha_provisoria, nova } })
      const lista = (await c2('/api/cliente')).data
      assert.deepEqual(lista.map(v => v.id), [idB])
    })
  ok('cada cliente vê só a própria viagem')

  // anexo: equipe sobe, cliente baixa só se aparece na página dele
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')
  r = await equipe(`/api/anexos?a=${idA}&nome=bilhete.pdf`, { method: 'POST', body: pdf, headers: { 'Content-Type': 'application/octet-stream' } })
  assert.equal(r.status, 201); const fid = r.data.id
  assert.ok(!(await query('select conteudo from crm_anexos')).rows[0].conteudo.toString().includes('%PDF')); ok('anexo é gravado criptografado')
  r = await equipe(`/api/anexos?a=${idA}&f=${fid}`)
  assert.deepEqual(r.data, pdf); ok('equipe baixa o anexo')
  r = await cliente(`/api/cliente?a=${idA}&f=${fid}`)
  assert.equal(r.status, 404); ok('anexo fora da página do cliente não é entregue')
  view.etapas[0].itens[0].anexos = [{ id: fid, nome: 'bilhete.pdf', tipo: 'application/pdf' }]
  await equipe(`/api/assessorias?id=${idA}`, { method: 'PATCH', body: { data: { ...ficha, portal_view: view } } })
  r = await cliente(`/api/cliente?a=${idA}&f=${fid}`)
  assert.equal(r.status, 200); assert.deepEqual(r.data, pdf); ok('anexo liberado aparece para o cliente')

  // redefinir senha derruba a sessão do cliente
  r = await equipe('/api/acesso-cliente', { method: 'PUT', body: { assessoria: idA } })
  assert.equal(r.status, 200); const nova2 = r.data.senha_provisoria
  assert.equal((await cliente('/api/cliente')).status, 401); ok('redefinir a senha derruba a sessão aberta do cliente')
  r = await cliente('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: CPF_A, password: nova2 } })
  assert.equal(r.data.trocar_senha, true); ok('depois de redefinida, o cliente volta ao fluxo de primeiro acesso')

  // desligar acesso
  await equipe(`/api/acesso-cliente?assessoria=${idA}`, { method: 'DELETE' })
  r = await navegador()('/api/auth?action=cliente-login', { method: 'POST', body: { cpf: CPF_A, password: nova2 } })
  assert.equal(r.status, 403); ok('acesso desligado não entra mais')

  // consultor só vê o que é dele
  await query("insert into crm_users (email, nome, role, senha_hash) values ('ana@teste.local', 'Ana', 'consultor', $1)",
    [await hashSenha('Ana-Senha-1234')])
  const ana = navegador()
  await ana('/api/auth?action=login', { method: 'POST', body: { email: 'ana@teste.local', password: 'Ana-Senha-1234' } })
  assert.deepEqual((await ana('/api/assessorias')).data, []); assert.equal((await ana(`/api/acesso-cliente?assessoria=${idA}`)).status, 404)
  assert.equal((await ana('/api/auth?action=audit')).status, 403); ok('consultor não vê fichas alheias nem o registro de acessos')

  // funil público grava lead
  r = await navegador()('/api/funil-lead', { method: 'POST', body: { name: 'Lead Funil', phone: '11988887777', dest: 'Europa' } })
  assert.equal(r.status, 201); ok('funil público continua salvando leads')

  const trilha = (await equipe('/api/auth?action=audit')).data.map(x => x.action)
  for (const a of ['login', 'senha_trocada', 'acesso_cliente_criado', 'login_falhou']) assert.ok(trilha.includes(a), `auditoria sem ${a}`)
  ok('registro de acessos guardou logins, trocas de senha e criação de acesso')

  console.log(`\nTudo certo: ${n} verificações passaram.`)
} catch (err) {
  console.error('\nFALHOU:', err.message)
  if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'))
  process.exitCode = 1
} finally {
  servidor.close()
  await closeDb().catch(() => {})
}
