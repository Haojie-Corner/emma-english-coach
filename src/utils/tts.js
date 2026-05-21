const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

// Sarah — young, clear, professional American female voice
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

let currentAudio = null
let currentAbort = null  // cancels any in-flight ElevenLabs fetch

export const stopSpeaking = () => {
  // Cancel in-flight request so it never plays
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

// ---- ElevenLabs fetch (shared by both speak & speakMultilingual) ----
const elevenLabsFetch = async (text, modelId, rate, onEnd) => {
  // Cancel any previous in-flight request before starting a new one
  if (currentAbort) currentAbort.abort()
  const abort = new AbortController()
  currentAbort = abort

  let res
  try {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      signal: abort.signal,
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.32,
          similarity_boost: 0.70,
          style: 0.45,
          use_speaker_boost: true,
        },
      }),
    })
  } catch (e) {
    if (e.name === 'AbortError') return  // Cancelled — do nothing, newer request takes over
    throw e
  }

  // If another request was started while we were fetching, discard this result
  if (currentAbort !== abort) return
  currentAbort = null

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 160)}`)
  }

  const blob = await res.blob()
  // Double-check: still the latest request?
  if (currentAbort !== null) return

  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.playbackRate = rate
  currentAudio = audio
  audio.play()
  audio.onended = () => {
    URL.revokeObjectURL(url)
    if (currentAudio === audio) currentAudio = null
    onEnd?.()
  }
}

// ---- Web Speech API fallback (English, fixed voice) ----
const FEMALE_VOICE_NAMES = [
  'Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Allison', 'Ava',
  'Google US English', 'Microsoft Zira', 'Microsoft Eva',
]
let cachedEnVoice = null

const getFemaleVoice = () => {
  if (cachedEnVoice) return cachedEnVoice
  const voices = window.speechSynthesis.getVoices()
  for (const name of FEMALE_VOICE_NAMES) {
    const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'))
    if (v) { cachedEnVoice = v; return v }
  }
  return voices.find(v => v.lang.startsWith('en')) ?? null
}

const speakFallback = (text, rate, onEnd) => {
  const go = () => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate; u.pitch = 1.05
    if (onEnd) u.onend = onEnd
    const v = getFemaleVoice()
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }
  if (window.speechSynthesis.getVoices().length > 0) go()
  else window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
}

// ---- Public API ----

export const MODEL_QUALITY = 'eleven_multilingual_v2'  // practice audio — highest quality
const MODEL_FAST = 'eleven_turbo_v2_5'                 // commentary / feedback — 2-3x faster, multilingual

/** English TTS (ElevenLabs Sarah). Each call cancels any in-progress audio. */
export const speak = async (text, rate = 0.78, onEnd = null) => {
  stopSpeaking()
  if (!ELEVENLABS_KEY) { console.warn('[TTS] No ElevenLabs key'); return }
  try {
    await elevenLabsFetch(text, MODEL_QUALITY, rate, onEnd)
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('[TTS] ElevenLabs error:', e.message)
  }
}

/** Bilingual mixed Chinese+English. Uses turbo model for faster response. */
export const speakMultilingual = async (text, onEnd = null) => {
  stopSpeaking()
  if (!ELEVENLABS_KEY) { console.warn('[TTS] No ElevenLabs key'); return }
  try {
    await elevenLabsFetch(text, MODEL_FAST, 1.0, onEnd)
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('[TTS] ElevenLabs error:', e.message)
  }
}

/**
 * Pre-fetch audio in the background without playing it.
 * Returns a blob URL (call URL.revokeObjectURL when done), or null on error.
 */
export const prefetchAudio = async (text, modelId = MODEL_FAST, signal = null) => {
  if (!ELEVENLABS_KEY) return null
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      signal,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.32, similarity_boost: 0.70, style: 0.45, use_speaker_boost: true },
      }),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('[TTS] prefetch error:', e.message)
    return null
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
