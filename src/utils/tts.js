const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

// Rachel — warm, clear, natural American English female voice
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
const MODEL_ID = 'eleven_turbo_v2_5'

let currentAudio = null

const stopCurrent = () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

const speakElevenLabs = async (text, rate, onEnd) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.80,
        style: 0.25,
        use_speaker_boost: true,
      },
    }),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 120)}`)
  }
  const blob = await res.blob()
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

// ---- Web Speech API fallback ----
const FEMALE_VOICE_NAMES = [
  'Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Allison', 'Ava',
  'Susan', 'Zoe', 'Nicky', 'Google US English', 'Microsoft Zira',
  'Microsoft Eva', 'en-US-AriaNeural',
]
let cachedVoice = null

const getFemaleVoice = () => {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  for (const name of FEMALE_VOICE_NAMES) {
    const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'))
    if (v) { cachedVoice = v; return v }
  }
  const byGender = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
  if (byGender) { cachedVoice = byGender; return byGender }
  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) { cachedVoice = enVoice; return enVoice }
  return null
}

const speakFallback = (text, rate, onEnd) => {
  window.speechSynthesis.cancel()
  const go = () => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate; u.pitch = 1.1
    if (onEnd) u.onend = onEnd
    const v = getFemaleVoice()
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }
  if (window.speechSynthesis.getVoices().length > 0) go()
  else window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
}

export const speak = async (text, rate = 0.85, onEnd = null) => {
  stopCurrent()
  if (ELEVENLABS_KEY) {
    try {
      await speakElevenLabs(text, rate, onEnd)
      return
    } catch (e) {
      console.warn('[TTS] ElevenLabs failed, fallback to Web Speech:', e.message)
    }
  }
  speakFallback(text, rate, onEnd)
}
