import crypto from 'node:crypto'

/* Header x-crm-key precisa bater com CRM_ACCESS_KEY (comparação em tempo constante) */
export function authorized(req) {
  const expected = process.env.CRM_ACCESS_KEY || ''
  const got = String(req.headers['x-crm-key'] || '')
  if (!expected || got.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}
