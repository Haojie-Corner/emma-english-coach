import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash']
const TIMEOUT_MS = 30000
const RETRY_ROUNDS = 2

const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // 验证用户身份
  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const { parts } = await req.json()
  if (!parts || !Array.isArray(parts)) return json({ error: 'Invalid request: parts required' }, 400)

  let lastError = ''

  for (let round = 0; round < RETRY_ROUNDS; round++) {
    for (const model of MODELS) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const res = await fetch(geminiUrl(model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] }),
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (res.status === 503 || res.status === 429) {
          lastError = String(res.status)
          continue
        }
        if (!res.ok) {
          const errText = await res.text()
          if (res.status === 400 && errText.includes('API key not valid')) {
            return json({ error: 'Gemini API Key 无效，请检查后台配置' }, 400)
          }
          return json({ error: `Gemini API error: ${res.status}` }, 502)
        }

        const data = await res.json()
        const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        return json({ text })
      } catch (e: unknown) {
        clearTimeout(timer)
        const msg = (e instanceof Error ? e.message : String(e)).toLowerCase()
        if (msg.includes('abort') || msg.includes('timeout')) {
          lastError = 'timeout'
          continue
        }
        lastError = msg
        continue
      }
    }
    if (round < RETRY_ROUNDS - 1) await new Promise(r => setTimeout(r, 1200))
  }

  const errMsg = lastError.includes('timeout')
    ? 'Gemini 分析超时，请检查网络后重试'
    : 'Gemini 现在繁忙，请稍后重试'
  return json({ error: errMsg }, 503)
})
