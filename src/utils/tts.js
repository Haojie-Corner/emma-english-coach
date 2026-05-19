// 按优先级排列的女声名称（Mac / Windows / Chrome / iOS 均有覆盖）
const FEMALE_VOICE_NAMES = [
  'Samantha',   // macOS 默认女声（美式英语）
  'Victoria',   // macOS 女声
  'Karen',      // macOS 澳洲女声
  'Moira',      // macOS 爱尔兰女声
  'Tessa',      // macOS 南非女声
  'Allison',    // macOS 女声
  'Ava',        // macOS 女声
  'Susan',      // macOS 女声
  'Zoe',        // macOS 女声
  'Nicky',      // macOS 女声
  'Google US English',  // Chrome TTS（通常为女声）
  'Microsoft Zira',     // Windows 女声
  'Microsoft Eva',      // Windows 女声
  'en-US-AriaNeural',   // Edge 女声
]

let cachedVoice = null

const getFemaleVoice = () => {
  if (cachedVoice) return cachedVoice

  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  // 按优先级匹配
  for (const name of FEMALE_VOICE_NAMES) {
    const match = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'))
    if (match) { cachedVoice = match; return match }
  }

  // 找任意 en-US 女声（部分浏览器 voice.name 包含 "female"）
  const byGender = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
  if (byGender) { cachedVoice = byGender; return byGender }

  // 最后兜底：取第一个英语语音
  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) { cachedVoice = enVoice; return enVoice }

  return null
}

export const speak = (text, rate = 0.82) => {
  window.speechSynthesis.cancel()

  const go = () => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.pitch = 1.1   // 稍高音调，听起来更女性化

    const voice = getFemaleVoice()
    if (voice) utterance.voice = voice

    window.speechSynthesis.speak(utterance)
  }

  // 语音列表异步加载，需等待 voiceschanged
  if (window.speechSynthesis.getVoices().length > 0) {
    go()
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
  }
}
