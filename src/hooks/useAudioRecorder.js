import { useState, useRef, useCallback } from 'react'
import { blobToBase64WithMime, buildAudioBlob, createAudioRecorder } from '../utils/audio'

const acquireWakeLock = async () => {
  if (!('wakeLock' in navigator)) return null
  try {
    return await navigator.wakeLock.request('screen')
  } catch {
    return null
  }
}

const useAudioRecorder = () => {
  const [status, setStatus] = useState('idle') // idle | recording | processing | done | error
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioMimeType, setAudioMimeType] = useState('audio/webm')
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const wakeLockRef = useRef(null)

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setAudioUrl(null)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = createAudioRecorder(stream)
      const mimeType = recorder.mimeType || 'audio/webm'
      mediaRecorderRef.current = recorder
      setAudioMimeType(mimeType)

      // Prevent screen from sleeping during recording
      acquireWakeLock().then(lock => { wakeLockRef.current = lock })

      // Set up Web Audio analyser for waveform
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = buildAudioBlob(chunksRef.current, recorder.mimeType || mimeType)
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setStatus('done')
        stream.getTracks().forEach(t => t.stop())
        analyserRef.current = null
        audioCtxRef.current?.close().catch(() => {})
        audioCtxRef.current = null
        wakeLockRef.current?.release().catch(() => {})
        wakeLockRef.current = null
      }

      recorder.start()
      setStatus('recording')
    } catch {
      setError('无法访问麦克风，请检查权限设置')
      setStatus('error')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop()
      setStatus('processing')
    }
  }, [status])

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
    setStatus('idle')
    setAudioBlob(null)
    setAudioUrl(null)
    setAudioMimeType('audio/webm')
    setError(null)
  }, [audioUrl])

  const getBase64 = useCallback(async () => {
    if (!audioBlob) return null
    const payload = await blobToBase64WithMime(audioBlob)
    return payload.base64
  }, [audioBlob])

  const getBase64WithMime = useCallback(async () => {
    if (!audioBlob) return null
    return blobToBase64WithMime(audioBlob)
  }, [audioBlob])

  return { status, audioBlob, audioUrl, audioMimeType, error, startRecording, stopRecording, reset, getBase64, getBase64WithMime, analyserRef }
}

export default useAudioRecorder
