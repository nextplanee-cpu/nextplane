/**
 * Limite de tentativas por IP (em memória da função). Não é perfeito em serverless
 * (cada instância tem sua memória), mas corta força bruta e spam em rajada.
 * O login também tem bloqueio persistente no banco (5 erros seguidos → 15 min).
 */
const buckets = new Map()

export function clientIp(req) {
  // req.ip (Express com 'trust proxy') só confia no proxy da frente; o cabeçalho cru pode ser forjado
  if (req.ip) return req.ip
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim()
}

/* true = pode seguir; false = estourou o limite */
export function rateLimit(key, { max, windowMs }) {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k)
    return true
  }
  b.count += 1
  return b.count <= max
}

/* Requisição vinda do próprio site (bloqueia CSRF e formulários de outros domínios) */
export function sameOrigin(req) {
  const origin = req.headers.origin || req.headers.referer
  if (!origin) return false
  try {
    const host = new URL(origin).host
    const proprio = req.headers['x-forwarded-host'] || req.headers.host
    const publico = process.env.PUBLIC_URL ? new URL(process.env.PUBLIC_URL).host : null
    return host === proprio || host === publico
  } catch { return false }
}
