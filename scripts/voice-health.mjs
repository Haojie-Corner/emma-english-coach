import { existsSync, readFileSync } from 'node:fs'

const envFiles = ['.env.local', '.env']
const env = {}

for (const file of envFiles) {
  if (!existsSync(file)) continue
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!(key in env)) env[key] = value
  }
}

const mask = (value = '') => value ? `${value.slice(0, 3)}...len=${value.length}` : 'missing'

const readBody = async (res) => {
  const text = await res.text()
  try {
    const parsed = JSON.parse(text)
    return parsed?.detail?.message || parsed?.error?.message || parsed?.message || text
  } catch {
    return text
  }
}

let failures = 0

const print = (name, ok, detail) => {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`)
}

const elevenKey = env.VITE_ELEVENLABS_API_KEY
const geminiKey = env.VITE_GEMINI_API_KEY
const voiceId = 'EXAVITQu4vr4xnSDxMaL'

print('ElevenLabs key', Boolean(elevenKey), mask(elevenKey))
if (elevenKey) {
  const headers = { 'xi-api-key': elevenKey }
  const userRes = await fetch('https://api.elevenlabs.io/v1/user', { headers })
  const userText = await userRes.text()
  let used = null
  let limit = null
  try {
    const user = JSON.parse(userText)
    used = user?.subscription?.character_count
    limit = user?.subscription?.character_limit
  } catch { /* keep nulls */ }
  print('ElevenLabs account', userRes.ok, userRes.ok ? `quota ${used}/${limit}` : userText.slice(0, 160))

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { ...headers, Accept: 'audio/mpeg', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello', model_id: 'eleven_multilingual_v2' }),
  })
  const ttsDetail = ttsRes.ok ? 'synthesis ok' : await readBody(ttsRes)
  print('ElevenLabs TTS', ttsRes.ok, ttsDetail.slice(0, 220))
}

print('Gemini key', Boolean(geminiKey), mask(geminiKey))
if (geminiKey) {
  for (const model of ['gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with exactly OK.' }] }] }),
    })
    const detail = res.ok ? 'text model ok' : await readBody(res)
    print(`Gemini ${model}`, res.ok, detail.slice(0, 220))
  }
}

if (failures > 0) {
  console.log(`Voice health failed (${failures} check${failures > 1 ? 's' : ''})`)
  process.exitCode = 1
} else {
  console.log('Voice health passed')
}
