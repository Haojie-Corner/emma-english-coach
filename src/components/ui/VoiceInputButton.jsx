import { useState, useRef, useCallback } from 'react'
import { transcribeSpeech } from '../../services/gemini'

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

// Inline voice recorder → Gemini transcription → calls onResult(text)
const VoiceInputButton = ({ onResult, disabled }) => {
  const [phase, setPhase] = useState('idle') // idle | recording | transcribing
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const start = useCallback(async () => {
    if (phase !== 'idle') return
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRef.current = recorder
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setPhase('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const base64 = await toBase64(blob)
          const text = await transcribeSpeech(base64)
          if (text) onResult(text)
        } catch {
          // silently fail — user can retry
        } finally {
          setPhase('idle')
        }
      }
      recorder.start()
      setPhase('recording')
    } catch {
      setPhase('idle')
    }
  }, [phase, onResult])

  const stop = useCallback(() => {
    if (mediaRef.current && phase === 'recording') {
      mediaRef.current.stop()
    }
  }, [phase])

  const handleClick = () => {
    if (phase === 'idle') start()
    else if (phase === 'recording') stop()
  }

  const isRecording = phase === 'recording'
  const isTranscribing = phase === 'transcribing'

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      title={isRecording ? '点击停止录音' : isTranscribing ? '转写中…' : '语音输入（说英文，自动转文字）'}
      style={{
        width: 38, height: 38, borderRadius: 10,
        border: `1.5px solid ${isRecording ? '#dc2626' : '#dedad0'}`,
        background: isRecording ? '#fef2f2' : isTranscribing ? '#f5f3ef' : '#fff',
        color: isRecording ? '#dc2626' : isTranscribing ? '#9e998e' : '#5c5850',
        fontSize: isTranscribing ? 13 : 17,
        cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        animation: isRecording ? 'pulse-ring 1s ease infinite' : 'none',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {isTranscribing ? <span className="spin" style={{ display: 'inline-block', fontSize: 14 }}>⟳</span>
        : isRecording ? '⏹'
        : '🎤'}
    </button>
  )
}

export default VoiceInputButton
