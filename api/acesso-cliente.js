/**
 * Acesso do cliente por CPF + senha — gerenciado pelo CRM (equipe logada).
 *   admin     → qualquer assessoria
 *   consultor → só as fichas em que é o responsável
 *
 * GET    ?assessoria=<id>                       → situação do acesso { ativo, cpf, trocar_senha, ultimo_acesso }
 * POST   { assessoria, cpf, nome }              → cria o acesso (ou liga a ficha a um cliente que já existe).
 *                                                 Cliente novo recebe uma SENHA PROVISÓRIA, mostrada só nesta resposta.
 * PUT    { assessoria }                         → gera outra senha provisória (cliente esqueceu a senha)
 * DELETE ?assessoria=<id>                       → desliga o acesso do cliente a esta ficha
 *
 * No primeiro acesso o cliente é obrigado a trocar a senha provisória.
 */
import { requireUser, esquecer } from './_lib/auth.js'
import { clientIp } from './_lib/ratelimit.js'
import { dbConfigured, query, audit, getAssessoriaOwner, setAssessoriaCliente } from './_lib/db.js'
import { encrypt, decrypt } from './_lib/crypto.js'
import { cpfDigitos, cpfValido, cpfHash, cpfMascara, cpfOculto, hashSenha, senhaProvisoria } from './_lib/senha.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!dbConfigured()) return res.status(503).json({ error: 'not_configured' })
  const user = await requireUser(req, res)
  if (!user) return
  const ip = clientIp(req)

  try {
    const assId = String(req.body?.assessoria ?? req.query.assessoria ?? '')
    if (!/^\d+$/.test(assId)) return res.status(400).json({ error: 'bad_request' })
    const owner = await getAssessoriaOwner(assId)
    if (!owner || (user.role !== 'admin' && owner.responsavel !== user.nome)) return res.status(404).json({ error: 'not_found' })

    if (req.method === 'GET') {
      if (!owner.cliente_id) return res.status(200).json({ ativo: false })
      const { rows: [c] } = await query('select cpf_enc, trocar_senha, ultimo_acesso, ativo from crm_clientes where id = $1', [owner.cliente_id])
      if (!c) return res.status(200).json({ ativo: false })
      return res.status(200).json({
        ativo: c.ativo, cpf: cpfOculto(decrypt(c.cpf_enc)), trocar_senha: c.trocar_senha, ultimo_acesso: c.ultimo_acesso,
      })
    }

    if (req.method === 'POST') {
      const cpf = cpfDigitos(req.body?.cpf)
      if (!cpfValido(cpf)) return res.status(400).json({ error: 'cpf_invalido' })
      const hash = cpfHash(cpf)
      const nome = String(req.body?.nome || '').trim().slice(0, 120)
      const { rows: [existe] } = await query('select id, ativo from crm_clientes where cpf_hash = $1', [hash])

      if (existe) {
        // o cliente já tem conta (outra viagem): só liga esta ficha, sem mexer na senha dele
        if (!existe.ativo) await query('update crm_clientes set ativo = true, updated_at = now() where id = $1', [existe.id])
        await setAssessoriaCliente(assId, existe.id)
        audit(user, 'acesso_cliente_ligado', 'assessoria', assId, ip)
        return res.status(200).json({ ok: true, novo: false, cpf: cpfMascara(cpf) })
      }

      const provisoria = senhaProvisoria()
      const { rows: [novo] } = await query(
        `insert into crm_clientes (cpf_hash, cpf_enc, nome_enc, senha_hash, trocar_senha) values ($1, $2, $3, $4, true) returning id`,
        [hash, encrypt(cpf), encrypt(nome), await hashSenha(provisoria)])
      await setAssessoriaCliente(assId, novo.id)
      audit(user, 'acesso_cliente_criado', 'assessoria', assId, ip)
      return res.status(201).json({ ok: true, novo: true, cpf: cpfMascara(cpf), senha_provisoria: provisoria })
    }

    if (req.method === 'PUT') {
      if (!owner.cliente_id) return res.status(404).json({ error: 'sem_acesso' })
      const provisoria = senhaProvisoria()
      // token_ver sobe: sessões abertas do cliente caem; falhas zeradas para ele conseguir entrar
      await query(
        `update crm_clientes set senha_hash = $1, trocar_senha = true, ativo = true, falhas = 0, bloqueado_ate = null,
           token_ver = token_ver + 1, updated_at = now() where id = $2`,
        [await hashSenha(provisoria), owner.cliente_id])
      esquecer('cliente', owner.cliente_id)
      audit(user, 'acesso_cliente_senha_redefinida', 'assessoria', assId, ip)
      return res.status(200).json({ ok: true, senha_provisoria: provisoria })
    }

    if (req.method === 'DELETE') {
      if (!owner.cliente_id) return res.status(200).json({ ok: true })
      await setAssessoriaCliente(assId, null)
      // sem nenhuma viagem ligada, a conta fica desativada
      const { rows: [resta] } = await query('select count(*)::int as n from crm_assessorias where cliente_id = $1', [owner.cliente_id])
      if (!resta.n) {
        await query('update crm_clientes set ativo = false, token_ver = token_ver + 1, updated_at = now() where id = $1', [owner.cliente_id])
        esquecer('cliente', owner.cliente_id)
      }
      audit(user, 'acesso_cliente_removido', 'assessoria', assId, ip)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error('[acesso-cliente]', err.message)
    return res.status(500).json({ error: 'server_error' })
  }
}
