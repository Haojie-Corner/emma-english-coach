import { useState, useRef, useCallback } from 'react'
import { transcribeSpeech } from '../../services/gemini'
import { blobToBase64WithMime, buildAudioBlob, createAudioRecorder } from '../../utils/audio'
import { showToast } from '../../utils/toast'

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
      const recorder = createAudioRecorder(stream)
      mediaRef.current = recorder
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setPhase('transcribing')
        try {
          const blob = buildAudioBlob(chunksRef.current, recorder.mimeType)
          const { base64, mimeType } = await blobToBase64WithMime(blob)
          const text = await transcribeSpeech(base64, mimeType)
          if (text) onResult(text)
        } catch (e) {
          showToast(`语音转文字失败：${e.message || '请稍后重试'}`, 'warning')
        } finally {
          setPhase('idle')
        }
      }
      recorder.start()
      setPhase('recording')
    } catch {
      showToast('无法访问麦克风，请检查浏览器权限', 'warning')
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
