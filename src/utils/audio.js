const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
]

export const getSupportedAudioMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return AUDIO_MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type)) || ''
}

export const createAudioRecorder = (stream) => {
  const mimeType = getSupportedAudioMimeType()
  return mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
}

export const buildAudioBlob = (chunks, mimeType = '') => {
  const type = mimeType || chunks.find(chunk => chunk?.type)?.type || 'audio/webm'
  return new Blob(chunks, { type })
}

export const blobToBase64WithMime = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const [meta, base64] = String(reader.result).split(',')
      const mimeType = meta?.match(/^data:(.*);base64$/)?.[1] || blob.type || 'audio/webm'
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
