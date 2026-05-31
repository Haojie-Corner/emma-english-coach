import { showToast } from './toast'
import { supabase } from '../services/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const TTS_TIMEOUT_MS = 30000

// Debounce TTS error toasts — don't spam if multiple calls fail at once
let _lastTtsToastAt = 0
const toastTts = (msg) => {
  const now = Date.now()
  if (now - _lastTtsToastAt < 5000) return
  _lastTtsToastAt = now
  showToast(msg, 'warning')
}

let currentAudio = null
let currentAbort = null  // cancels any in-flight TTS fetch

export const stopSpeaking = () => {
  if (currentAbort) { currentAbort.abort(); currentAbort = null }
  window.speechSynthesis.cancel()
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

export const pauseSpeaking = () => {
  if (currentAudio && !currentAudio.paused) currentAudio.pause()
  if (window.speechSynthesis.speaking) window.speechSynthesis.pause()
}

export const resumeSpeaking = () => {
  if (currentAudio && currentAudio.paused && currentAudio.src) currentAudio.play()
  else if (window.speechSynthesis.paused) window.speechSynthesis.resume()
}

// 获取当前用户的 JWT token（用于 edge function 授权）
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

// ---- 通过 Supabase Edge Function 调用 ElevenLabs（API Key 在服务端）----
const elevenLabsFetch = async (text, modelId, rate, onEnd, signal = null) => {
  if (currentAbort) currentAbort.abort()
  const abort = new AbortController()
  currentAbort = abort
  let timedOut = false
  let timeoutId = null
  if (!signal) {
    timeoutId = window.setTimeout(() => {
      timedOut = true
      abort.abort()
    }, TTS_TIMEOUT_MS)
  }

  // 合并外部 signal（prefetch 用）
  const effectiveSignal = signal || abort.signal

  let res
  try {
    const token = await getAuthToken()
    res = await fetch(`${SUPABASE_URL}/functions/v1/tts-proxy`, {
      signal: effectiveSignal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        text,
        modelId,
        voiceSettings: {
          stability: 0.32,
          similarity_boost: 0.70,
          style: 0.45,
          use_speaker_boost: true,
        },
      }),
    })
  } catch (e) {
    if (timedOut) throw new Error('语音服务请求超时，请稍后重试', { cause: e })
    if (e.name === 'AbortError') return
    throw e
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
  }

  if (currentAbort !== abort && !signal) return
  if (!signal) currentAbort = null

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`TTS ${res.status}: ${msg.slice(0, 160)}`)
  }

  const blob = await res.blob()
  if (currentAbort !== null && !signal) return

  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.playbackRate = rate
  currentAudio = audio
  try {
    await audio.play()
  } catch (e) {
    URL.revokeObjectURL(url)
    if (currentAudio === audio) currentAudio = null
    throw new Error(`Audio playback failed: ${e.message}`, { cause: e })
  }
  audio.onended = () => {
    URL.revokeObjectURL(url)
    if (currentAudio === audio) currentAudio = null
    onEnd?.()
  }
}

// ---- Public API ----

export const MODEL_QUALITY = 'eleven_multilingual_v2'  // practice audio — highest quality
const MODEL_FAST = 'eleven_turbo_v2_5'                 // commentary / feedback — 2-3x faster, multilingual

const handleTtsError = (e) => {
  if (e.name === 'AbortError') return
  const msg = e.message.toLowerCase()
  if (msg.includes('quota') || msg.includes('credit') || msg.includes('character_limit') || msg.includes('402')) {
    toastTts('ElevenLabs 语音额度已用完，充值或更换 Key 后即可恢复')
  } else if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) {
    toastTts('语音服务授权失败，请重新登录后重试')
  } else {
    toastTts('语音服务暂时不可用，请稍后重试')
  }
  console.warn('[TTS] error:', e.message)
}

/** English TTS (ElevenLabs Sarah via edge function). Each call cancels any in-progress audio. */
export const speak = async (text, rate = 0.78, onEnd = null) => {
  stopSpeaking()
  try {
    await elevenLabsFetch(text, MODEL_QUALITY, rate, onEnd)
  } catch (e) {
    handleTtsError(e)
    if (e.name !== 'AbortError') onEnd?.()
  }
}

/** Bilingual mixed Chinese+English. Uses turbo model for faster response. */
export const speakMultilingual = async (text, onEnd = null) => {
  stopSpeaking()
  try {
    await elevenLabsFetch(text, MODEL_FAST, 1.0, onEnd)
  } catch (e) {
    handleTtsError(e)
    if (e.name !== 'AbortError') onEnd?.()
  }
}

/**
 * Pre-fetch audio in the background without playing it.
 * Returns a blob URL (call URL.revokeObjectURL when done), or null on error.
 */
export const prefetchAudio = async (text, modelId = MODEL_FAST, signal = null) => {
  let timeoutId = null
  try {
    const token = await getAuthToken()
    const timeoutAbort = new AbortController()
    timeoutId = window.setTimeout(() => timeoutAbort.abort(), TTS_TIMEOUT_MS)
    signal?.addEventListener('abort', () => timeoutAbort.abort(), { once: true })
    const res = await fetch(`${SUPABASE_URL}/functions/v1/tts-proxy`, {
      method: 'POST',
      signal: timeoutAbort.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        text,
        modelId,
        voiceSettings: { stability: 0.32, similarity_boost: 0.70, style: 0.45, use_speaker_boost: true },
      }),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('[TTS] prefetch error:', e.message)
    return null
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
  }
}


/** Play a pre-fetched blob URL instantly (no network wait). */
export const playBlobUrl = (url, rate = 1.0, onEnd = null) => {
  stopSpeaking()
  const audio = new Audio(url)
  audio.playbackRate = rate
  currentAudio = audio
  audio.play().catch(err => {
    console.warn('[TTS] playBlobUrl failed:', err.message)
    if (currentAudio === audio) currentAudio = null
    onEnd?.()  // trigger callback so UI doesn't get stuck in playing state
  })
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null
    onEnd?.()
  }
}
