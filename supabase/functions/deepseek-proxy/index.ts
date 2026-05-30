import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') ?? ''
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

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

  const { messages, systemPrompt } = await req.json()
  if (!messages || !systemPrompt) return json({ error: 'messages and systemPrompt are required' }, 400)

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
    }),
  })

  if (res.status === 429) return json({ error: 'AI 服务繁忙，请稍后重试（请求频率超限）' }, 429)
  if (res.status === 402) return json({ error: 'AI 服务积分不足，请联系管理员' }, 402)
  if (res.status === 401 || res.status === 403) return json({ error: 'AI 服务授权失败，请检查配置' }, 403)
  if (!res.ok) return json({ error: `AI 服务暂时不可用（${res.status}），请稍后重试` }, 502)

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''
  return json({ content })
})
