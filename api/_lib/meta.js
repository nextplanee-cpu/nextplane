/**
 * Graph API da Meta — token da Página e assinatura do app na Página.
 *
 * META_PAGE_ACCESS_TOKEN pode ser o token do Usuário do sistema (não expira)
 * ou já um token da Página: pageToken() troca pelo token da Página quando preciso.
 */

export const PAGE_ID = () => process.env.META_PAGE_ID || '405032602704500'
export const GRAPH   = () => `https://graph.facebook.com/${process.env.META_API_VERSION || 'v23.0'}`

async function graph(path, { method = 'GET', token } = {}) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${GRAPH()}/${path}${sep}access_token=${encodeURIComponent(token)}`, { method })
  const data = await res.json()
  if (!res.ok || data.error) {
    const e = new Error(data.error?.message || `Graph API ${res.status}`)
    e.meta = data.error
    throw e
  }
  return data
}

let cached = null
export async function pageToken() {
  const base = process.env.META_PAGE_ACCESS_TOKEN
  if (!base) throw new Error('META_PAGE_ACCESS_TOKEN não configurado')
  if (cached) return cached
  try {
    const data = await graph(`${PAGE_ID()}?fields=access_token`, { token: base })
    cached = data.access_token || base
  } catch {
    cached = base // já é um token da Página
  }
  return cached
}

export async function fetchLead(leadgenId) {
  const fields = 'id,created_time,field_data,form_id,ad_id,ad_name,adset_name,campaign_name,platform'
  return graph(`${leadgenId}?fields=${fields}`, { token: await pageToken() })
}

export async function pageStatus() {
  const token = await pageToken()
  const page = await graph(`${PAGE_ID()}?fields=name`, { token })
  const subs = await graph(`${PAGE_ID()}/subscribed_apps`, { token })
  const appId = process.env.META_APP_ID || '1055029080847335' // app "Next Plane CRM"
  const apps = (subs.data || []).map(a => ({ id: a.id, name: a.name, fields: a.subscribed_fields || [] }))
  const ours = apps.find(a => a.id === appId && a.fields.includes('leadgen'))
  return { page: page.name, pageId: PAGE_ID(), subscribed: Boolean(ours), apps }
}

export async function subscribePage() {
  const token = await pageToken()
  await graph(`${PAGE_ID()}/subscribed_apps?subscribed_fields=leadgen`, { method: 'POST', token })
  return pageStatus()
}
