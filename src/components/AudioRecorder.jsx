import { useState, useEffect } from 'react'
import useAudioRecorder from '../hooks/useAudioRecorder'
import { analyzePronunciation } from '../services/gemini'
import { speak, speakMultilingual, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../utils/tts'
import Button from './ui/Button'
import Card from './ui/Card'

const ScoreRing = ({ score }) => {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#5a7a3a' : score >= 60 ? '#d97757' : '#dc3030'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#dedad0" strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      <text x="40" y="45" textAnchor="middle" fontSize="16" fontWeight="700"
        fill={color} fontFamily="-apple-system,Arial,sans-serif">{score}</text>
    </svg>
  )
}

const btnBase = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
  border: '1.5px solid', cursor: 'pointer',
}

const TeacherAvatar = ({ speakState, hasPlayed, onPause, onResume, onReplay, onRestart }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px', borderRadius: 14,
    background: '#fff', border: '1.5px solid #dedad0',
    marginBottom: 12,
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #d97757 0%, #e8a06a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26,
      boxShadow: speakState === 'playing' ? '0 0 0 5px rgba(217,119,87,0.25)' : 'none',
      animation: speakState === 'playing' ? 'pulse-ring 1.4s ease infinite' : 'none',
      transition: 'box-shadow 0.3s',
    }}>👩‍🏫</div>

    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917', marginBottom: 1 }}>Emma 老师</p>
      <p style={{ fontSize: 11, color: speakState !== 'idle' ? '#d97757' : '#7a7870' }}>
        {speakState === 'playing' ? '🔴 正在讲解…'
          : speakState === 'paused' ? '⏸ 已暂停'
          : 'AI 发音教练'}
      </p>
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      {speakState === 'idle' && (
        <button onClick={onReplay} style={{
          ...btnBase,
          background: hasPlayed ? '#f5f3ee' : '#d97757',
          borderColor: hasPlayed ? '#dedad0' : '#d97757',
          color: hasPlayed ? '#7a7870' : '#fff',
        }}>
          {hasPlayed ? '🔊 再听一遍' : '▶ 开始讲解'}
        </button>
      )}
      {speakState === 'playing' && (<>
        <button onClick={onPause} style={{ ...btnBase, background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>
          ⏸ 暂停
        </button>
        <button onClick={onRestart} style={{ ...btnBase, background: '#f5f3ee', borderColor: '#dedad0', color: '#7a7870' }}>
          ↩ 重新讲解
        </button>
      </>)}
      {speakState === 'paused' && (<>
        <button onClick={onResume} style={{ ...btnBase, background: '#eaf2e3', borderColor: '#a3c98a', color: '#3d7a20' }}>
          ▶ 继续
        </button>
        <button onClick={onRestart} style={{ ...btnBase, background: '#f5f3ee', borderColor: '#dedad0', color: '#7a7870' }}>
          ↩ 重新讲解
        </button>
      </>)}
    </div>
  </div>
)

const AudioRecorder = ({ targetText, targetZh }) => {
  const { status, audioUrl, error, startRecording, stopRecording, reset, getBase64 } = useAudioRecorder()
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [speakState, setSpeakState] = useState('idle') // 'idle' | 'playing' | 'paused'
  const [hasPlayed, setHasPlayed] = useState(false)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const base64 = await getBase64()
      const feedback = await analyzePronunciation(base64, targetText)
      setResult(feedback)
    } catch (e) {
      setAnalyzeError('AI 分析失败：' + e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    reset()
    setResult(null)
    setAnalyzeError(null)
    stopSpeaking()
    setSpeakState('idle')
    setHasPlayed(false)
  }

  const handleReplay = () => {
    if (!result?.voice_script) return
    setHasPlayed(true)
    setSpeakState('playing')
    speakMultilingual(result.voice_script, () => setSpeakState('idle'))
  }

  const handlePause = () => { pauseSpeaking(); setSpeakState('paused') }
  const handleResume = () => { resumeSpeaking(); setSpeakState('playing') }
  const handleRestart = () => { stopSpeaking(); handleReplay() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 练习目标 */}
      <Card>
        <p style={{ fontSize: 11, color: '#7a7870', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>练习内容</p>
        <p className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: '#1a1917', marginBottom: 4, letterSpacing: '0.05em' }}>{targetText}</p>
        {targetZh && <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 12 }}>{targetZh}</p>}
        <button onClick={() => speak(targetText, 0.75)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: '#f5f3ee', border: '1.5px solid #dedad0', color: '#1a1917',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#ece9e0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f5f3ee'}
        >
          🔊 听女声示范
        </button>
      </Card>

      {/* 录音区 */}
      {!result && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
          <button
            onClick={status === 'recording' ? stopRecording : startRecording}
            disabled={status === 'processing' || analyzing}
            className={status === 'recording' ? 'recording-pulse' : ''}
            style={{
              width: 72, height: 72, borderRadius: '50%', border: 'none',
              fontSize: 26, cursor: status === 'processing' || analyzing ? 'not-allowed' : 'pointer',
              background: status === 'recording' ? '#dc3030' : '#d97757',
              color: '#fff', transition: 'background 0.2s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: status === 'processing' || analyzing ? 0.6 : 1,
            }}
          >
            {status === 'recording' ? '⏹' : '🎤'}
          </button>

          <p style={{ fontSize: 13, color: '#7a7870' }}>
            {status === 'idle'       && '点击麦克风开始录音'}
            {status === 'recording'  && '🔴 录音中… 点击停止'}
            {status === 'processing' && '处理中…'}
            {status === 'done'       && '录音完成'}
          </p>
          {error && <p style={{ fontSize: 13, color: '#dc3030' }}>{error}</p>}

          {status === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              <audio src={audioUrl} controls style={{ width: '100%', maxWidth: 320, borderRadius: 8 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 分析中…</> : '🤖 AI 分析发音'}
                </Button>
                <Button variant="secondary" onClick={handleReset}>重新录音</Button>
              </div>
              {analyzeError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', width: '100%' }}>
                  {analyzeError}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI 分析结果 */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">

          {/* 老师头像 */}
          <TeacherAvatar
            speakState={speakState}
            hasPlayed={hasPlayed}
            onPause={handlePause}
            onResume={handleResume}
            onReplay={handleReplay}
            onRestart={handleRestart}
          />

          {/* 总评分 */}
          <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={result.overall_score} />
            <div>
              <p style={{ fontSize: 11, color: '#7a7870', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>发音评分</p>
              <p style={{ fontSize: 14, color: '#1a1917', lineHeight: 1.5 }}>{result.positive_feedback}</p>
            </div>
          </Card>

          {/* 具体问题 */}
          {result.pronunciation_issues?.length > 0 && (
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917', marginBottom: 12 }}>📝 需要改进的发音</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.pronunciation_issues.map((issue, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #d97757', paddingLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#1a1917' }}>
                        {issue.word} <span style={{ fontSize: 12, fontWeight: 400, color: '#7a7870' }}>{issue.correct_ipa}</span>
                      </p>
                      {issue.tip_demo && (
                        <button
                          onClick={() => {
                            stopSpeaking()
                            setIsSpeaking(false)
                            speakMultilingual(issue.tip_demo)
                          }}
                          style={{
                            padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: '#fdf0ea', border: '1px solid #f5c4a8',
                            color: '#d97757', cursor: 'pointer', flexShrink: 0,
                          }}
                        >🔊 听示范</button>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: '#7a7870', marginTop: 2 }}>{issue.issue}</p>
                    <p style={{ fontSize: 13, color: '#5a7a3a', marginTop: 3 }}>💡 {issue.tip}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 下次重点 */}
          {result.next_focus && (
            <div style={{ background: '#fdf0ea', border: '1px solid #f5c4a8', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#b85f3e' }}>🎯 下次练习重点：{result.next_focus}</p>
            </div>
          )}

          <Button onClick={handleReset} style={{ width: '100%', justifyContent: 'center' }}>
            再练一次
          </Button>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
