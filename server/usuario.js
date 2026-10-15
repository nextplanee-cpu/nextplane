/**
 * Cria ou atualiza um usuário da equipe (admin ou consultor) e define a senha dele.
 *
 *   npm run usuario -- --email joseph@exemplo.com --nome "Joseph" --role admin
 *
 * A senha é digitada no terminal (não aparece na tela nem fica no histórico).
 * Para automatizar, use a variável NOVA_SENHA. A pessoa precisa trocar a senha no primeiro acesso
 * (passe --sem-troca para dispensar). Usar de novo com o mesmo e-mail redefine a senha.
 */
import { pathToFileURL } from 'node:url'
import { query, closeDb } from './db.js'
import { hashSenha, senhaFraca } from '../api/_lib/senha.js'

function argumentos() {
  const a = process.argv.slice(2), out = {}
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue
    const k = a[i].slice(2)
    out[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true
  }
  return out
}

/* Lê a senha sem mostrar o que é digitado */
function lerSenha(pergunta) {
  return new Promise(resolve => {
    process.stdout.write(pergunta)
    const stdin = process.stdin
    let s = ''
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8')
    const onData = c => {
      for (const ch of c) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); process.stdout.write('\n'); return resolve(s) }
        if (ch === '\u0003') process.exit(130)
        if (ch === '\u007f' || ch === '\b') s = s.slice(0, -1)
        else s += ch
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  const arg = argumentos()
  const email = String(arg.email || '').trim().toLowerCase()
  const role = arg.role === 'consultor' ? 'consultor' : 'admin'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe --email com um e-mail válido')
  const nome = String(arg.nome || email.split('@')[0])

  let senha = process.env.NOVA_SENHA || ''
  if (!senha) {
    if (!process.stdin.isTTY) throw new Error('Rode num terminal (ou defina NOVA_SENHA) para digitar a senha')
    senha = await lerSenha('Senha (mín. 10 caracteres): ')
    if (senha !== await lerSenha('Repita a senha: ')) throw new Error('As senhas não são iguais')
  }
  if (senhaFraca(senha)) throw new Error('A senha precisa ter pelo menos 10 caracteres')

  const trocar = !arg['sem-troca']
  await query(
    `insert into crm_users (email, nome, role, senha_hash, trocar_senha) values ($1, $2, $3, $4, $5)
     on conflict (email) do update set nome = excluded.nome, role = excluded.role, senha_hash = excluded.senha_hash,
       trocar_senha = excluded.trocar_senha, ativo = true, falhas = 0, bloqueado_ate = null, token_ver = crm_users.token_ver + 1`,
    [email, nome, role, await hashSenha(senha), trocar])
  console.log(`✔ ${role === 'admin' ? 'Administrador' : 'Consultor'} ${email} pronto${trocar ? ' — vai precisar trocar a senha no primeiro acesso' : ''}.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(err => { console.error('Falhou:', err.message); process.exitCode = 1 }).finally(() => closeDb())
}
