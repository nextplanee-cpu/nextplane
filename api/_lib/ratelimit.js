/**
 * Limite de tentativas por IP (em memória da função). Não é perfeito em serverless
 * (cada instância tem sua memória), mas corta força bruta e spam em rajada.
 * O login também tem o limite do próprio Supabase Auth por trás.
 */
const buckets = new Map()

export function clientIp(req) {
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
    const host = req.headers['x-forwarded-host'] || req.headers.host
    return new URL(origin).host === host
  } catch { return false }
}
