# Integração Meta Lead Ads → CRM Next Plane

Fluxo: formulário do Facebook/Instagram → webhook da Meta → `/api/meta-leads` (Vercel)
→ tabela `crm_leads` (Supabase) → CRM `/crm`, aba **Leads Meta**.

## 1. Supabase (banco de dados)
1. Crie a conta em https://supabase.com (entrar com GitHub) → **New project**
   (região: South America / São Paulo).
2. **SQL Editor → New query** → cole o conteúdo de `supabase/schema.sql` → **Run**.
3. **Project Settings → API** e anote:
   - `Project URL` → vai em `SUPABASE_URL`
   - `service_role` (secret) → vai em `SUPABASE_SERVICE_ROLE_KEY`
     (nunca coloque essa chave no código nem no navegador)

## 2. Variáveis de ambiente na Vercel
Vercel → projeto **nextplane** → Settings → Environment Variables (Production):

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role |
| `CRM_ACCESS_KEY` | uma senha forte, inventada por você (é a chave para abrir o CRM na nuvem) |
| `META_VERIFY_TOKEN` | um texto qualquer, ex.: `nextplane-leads-2026` |
| `META_APP_SECRET` | App Secret do app da Meta (passo 3) |
| `META_PAGE_ACCESS_TOKEN` | token da Página Next plane (passo 3) |

Depois de salvar, faça **Redeploy**.

## 3. App da Meta (receber os leads)
1. https://developers.facebook.com → **Meus apps → Criar app** → tipo **Empresa**,
   vinculado ao portfólio **Next Plane**.
2. **Configurações do app → Básico** → copie a **Chave secreta do app** → `META_APP_SECRET`.
3. Adicione o produto **Webhooks** → objeto **Page** → **Assinar este objeto**:
   - URL de callback: `https://nextplane.vercel.app/api/meta-leads`
   - Token de verificação: o mesmo de `META_VERIFY_TOKEN`
   - Depois assine o campo **leadgen**.
4. Token da Página (recomendado: Usuário do Sistema, não expira):
   Business Manager → Configurações da empresa → **Usuários do sistema** → Adicionar (Admin)
   → Atribuir ativos: Página **Next plane** (controle total) e o app → **Gerar token**
   com permissões `leads_retrieval`, `pages_manage_metadata`, `pages_show_list`,
   `pages_read_engagement`, `ads_management` → `META_PAGE_ACCESS_TOKEN`.
5. Ligue o app à Página (uma vez), no Graph API Explorer com o token da Página:
   `POST /405032602704500/subscribed_apps?subscribed_fields=leadgen`
6. Business Manager → Integrações → **Acesso a leads** → garanta que o app/usuário
   do sistema tem acesso aos leads da Página.

## 4. Testar antes de publicar a campanha
1. https://developers.facebook.com/tools/lead-ads-testing → Página **Next plane** →
   formulário **Assessoria Viagem - Destino, Pessoas, Dias e Investimento** → **Criar lead**.
2. Abra `https://nextplane.vercel.app/crm` → selo **Só neste navegador** → digite a
   `CRM_ACCESS_KEY` → aba **Leads Meta**. O lead de teste deve aparecer em até 20 s.
3. Se não aparecer: Vercel → Logs, filtrar por `meta-leads`.

## Classificação automática (score 0–10)
- Investimento: até 20 mil = 0 · 20–30 = 2 · 30–40 = 3 · acima de 40 = 4
- Dias: até 10 = 0 · 11–15 = 1 · acima de 15 = 2
- Pessoas: 1 = 0 · 2 = 1 · 3 ou mais = 2
- Destino informado = +1

**VIP** = acima de R$ 40 mil e score ≥ 7 · **Quente** ≥ 6 · **Morno** ≥ 3 · **Frio** < 3.
Regras em `api/_lib/leads.js`.
