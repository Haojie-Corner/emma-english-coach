import { useState, useEffect, useRef, useCallback } from 'react'
import useAudioRecorder from '../hooks/useAudioRecorder'
import { analyzePronunciation } from '../services/gemini'
import { saveRecording, getRecordings } from '../services/supabase'
import { speak, speakMultilingual, stopSpeaking, pauseSpeaking, resumeSpeaking, prefetchAudio, playBlobUrl } from '../utils/tts'
import Button from './ui/Button'
import Card from './ui/Card'

const MiniScoreChart = ({ history }) => {
  if (history.length < 2) return null
  const scores = [...history].reverse().slice(-8).map(h => h.ai_score)
  const W = 140, H = 40
  const latest = scores[scores.length - 1]
  const color = latest >= 80 ? '#788c5d' : latest >= 60 ? '#d97757' : '#c45c5c'
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - (s / 100) * H
    return `${x},${y}`
  }).join(' ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', flexShrink: 0 }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {scores.map((s, i) => (
          <circle key={i} cx={(i / (scores.length - 1)) * W} cy={H - (s / 100) * H}
            r={i === scores.length - 1 ? 4.5 : 2.5} fill={color}
            opacity={i === scores.length - 1 ? 1 : 0.55} />
        ))}
      </svg>
      <div>
        <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{latest}</p>
        <p style={{ fontSize: 10, color: '#b0aea5', marginTop: 1 }}>最近得分</p>
      </div>
    </div>
  )
}

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

/* ── 录音波形可视化 ── */
const Waveform = ({ analyserRef }) => {
  const barsRef = useRef([])
  const rafRef = useRef(null)
  const BAR_COUNT = 20

  useEffect(() => {
    const draw = () => {
      const analyser = analyserRef.current
      if (!analyser) {
        barsRef.current.forEach(b => { if (b) b.style.height = '4px' })
        return
      }
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const step = Math.floor(data.length / BAR_COUNT)
      barsRef.current.forEach((bar, i) => {
        if (!bar) return
        const val = data[i * step] / 255
        const h = Math.max(4, Math.round(val * 40))
        bar.style.height = `${h}px`
        bar.style.opacity = `${0.4 + val * 0.6}`
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [analyserRef])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 44, padding: '0 8px' }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div key={i} ref={el => barsRef.current[i] = el} style={{
          width: 3, height: 4, borderRadius: 2,
          background: '#d97757', transition: 'height 0.08s ease-out',
        }} />
      ))}
    </div>
  )
}

const TeacherAvatar = ({ speakState, hasPlayed, preloading, onPause, onResume, onReplay, onRestart }) => (
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
      <p style={{ fontSize: 11, color: speakState !== 'idle' ? '#d97757' : preloading ? '#c4a35a' : '#7a7870' }}>
        {speakState === 'playing' ? '🔴 正在讲解…'
          : speakState === 'paused' ? '⏸ 已暂停'
          : preloading ? '正在准备语音…'
          : 'AI 发音教练'}
      </p>
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      {speakState === 'idle' && (
        <button onClick={preloading ? undefined : onReplay} style={{
          ...btnBase,
          background: preloading ? '#f5f3ee' : hasPlayed ? '#f5f3ee' : '#d97757',
          borderColor: preloading ? '#dedad0' : hasPlayed ? '#dedad0' : '#d97757',
          color: preloading ? '#b0aea5' : hasPlayed ? '#7a7870' : '#fff',
          cursor: preloading ? 'default' : 'pointer',
        }}>
          {preloading
            ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 准备中…</>
            : hasPlayed ? '🔊 再听一遍' : '▶ 开始讲解'}
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

const AudioRecorder = ({ targetText, targetZh, userId, lessonId }) => {
  const { status, audioBlob, audioUrl, error, startRecording, stopRecording, reset, getBase64, analyserRef } = useAudioRecorder()
  const [analyzePhase, setAnalyzePhase] = useState(null)  // null | 'processing' | 'analyzing'
  const [result, setResult] = useState(null)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [speakState, setSpeakState] = useState('idle')
  const [hasPlayed, setHasPlayed] = useState(false)
  const [preloadedUrl, setPreloadedUrl] = useState(null)
  const [preloading, setPreloading] = useState(false)
  const [tipDemoUrls, setTipDemoUrls] = useState({})
  const [targetAudioUrl, setTargetAudioUrl] = useState(null)
  const [activeDemo, setActiveDemo] = useState(null)   // null | 'target' | word_string
  const [demoPaused, setDemoPaused] = useState(false)
  const prefetchAborts = useRef([])                    // AbortControllers for in-flight prefetches
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (userId && lessonId) {
      getRecordings(userId, lessonId).then(setHistory).catch(() => {})
    }
  }, [userId, lessonId])

  // Pre-fetch target text audio on mount so "听女声示范" is instant on first click
  // Uses MODEL_FAST to avoid ElevenLabs concurrency conflicts with later prefetches
  useEffect(() => {
    if (!targetText) return
    let cancelled = false
    let url = null
    prefetchAudio(targetText).then(u => {
      if (cancelled) { if (u) URL.revokeObjectURL(u); return }
      url = u
      setTargetAudioUrl(u)
    })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [targetText])

  // Cancel all in-flight prefetch requests (called before user-triggered playback)
  const cancelPrefetches = () => {
    prefetchAborts.current.forEach(ac => { try { ac.abort() } catch {} })
    prefetchAborts.current = []
  }

  // Prefetch strategy: voice_script first (alone), then all tip_demos in parallel.
  // Uses AbortControllers so user-triggered playback can instantly cancel competing requests.
  useEffect(() => {
    if (!result) return
    let cancelled = false
    cancelPrefetches()
    setTipDemoUrls({})

    const run = async () => {
      // Step 1: voice_script alone (highest priority — first thing user clicks)
      // Uses MODEL_FAST (turbo) to keep ElevenLabs response fast and avoid server-side concurrency conflicts
      if (result.voice_script) {
        setPreloading(true)
        setPreloadedUrl(null)
        const ac = new AbortController()
        prefetchAborts.current.push(ac)
        const url = await prefetchAudio(result.voice_script, undefined, ac.signal)
        if (cancelled) { if (url) URL.revokeObjectURL(url); return }
        setPreloadedUrl(url)
        setPreloading(false)
      }

      // Step 2: all tip_demos in parallel (voice_script done → no competition)
      const issues = result.pronunciation_issues?.filter(i => i.tip_demo) ?? []
      if (!issues.length) return
      await Promise.all(issues.map(async ({ word, tip_demo }) => {
        const ac = new AbortController()
        prefetchAborts.current.push(ac)
        const url = await prefetchAudio(tip_demo, undefined, ac.signal)
        if (cancelled || !url) return
        setTipDemoUrls(prev => ({ ...prev, [word]: url }))
      }))
    }

    run()
    return () => { cancelled = true; setPreloading(false); cancelPrefetches() }
  }, [result])

  // Revoke blob URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => { if (preloadedUrl) URL.revokeObjectURL(preloadedUrl) }
  }, [preloadedUrl])

  // Space bar → start / stop recording (ignore when focused on inputs)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || e.target.isContentEditable) return
      if (result || !!analyzePhase) return
      e.preventDefault()
      if (status === 'idle' || status === 'done') startRecording()
      else if (status === 'recording') stopRecording()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, result, analyzePhase, startRecording, stopRecording])

  const handleAnalyze = async () => {
    setAnalyzePhase('processing')
    setAnalyzeError(null)
    try {
      const base64 = await getBase64()
      setAnalyzePhase('analyzing')
      const feedback = await analyzePronunciation(base64, targetText)
      setResult(feedback)
      if (userId && lessonId && audioBlob) {
        saveRecording(userId, lessonId, audioBlob, feedback.overall_score, feedback).catch(() => {})
      }
    } catch (e) {
      setAnalyzeError('AI 分析失败：' + e.message)
    } finally {
      setAnalyzePhase(null)
    }
  }

  const handleReset = () => {
    cancelPrefetches()
    reset()
    setResult(null)
    setAnalyzeError(null)
    stopSpeaking()
    setSpeakState('idle')
    setHasPlayed(false)
    if (preloadedUrl) { URL.revokeObjectURL(preloadedUrl); setPreloadedUrl(null) }
    setPreloading(false)
    Object.values(tipDemoUrls).forEach(u => URL.revokeObjectURL(u))
    setTipDemoUrls({})
    setActiveDemo(null)
    setDemoPaused(false)
  }

  const handleReplay = () => {
    if (!result?.voice_script) return
    setActiveDemo(null)
    setDemoPaused(false)
    setHasPlayed(true)
    setSpeakState('playing')
    if (preloadedUrl) {
      playBlobUrl(preloadedUrl, 1.0, () => setSpeakState('idle'))
    } else {
      cancelPrefetches()
      speakMultilingual(result.voice_script, () => setSpeakState('idle'))
    }
  }

  // Toggle play/pause for target text ("听女声示范")
  const handleTargetSpeak = () => {
    if (activeDemo === 'target') {
      if (demoPaused) { resumeSpeaking(); setDemoPaused(false) }
      else { pauseSpeaking(); setDemoPaused(true) }
      return
    }
    stopSpeaking()
    setSpeakState('idle')
    setActiveDemo('target')
    setDemoPaused(false)
    const onEnd = () => { setActiveDemo(null); setDemoPaused(false) }
    if (targetAudioUrl) playBlobUrl(targetAudioUrl, 0.75, onEnd)
    else speak(targetText, 0.75, onEnd)
  }

  // Toggle play/pause for each tip_demo ("听示范")
  const handleTipDemo = (word, tip_demo) => {
    if (activeDemo === word) {
      if (demoPaused) { resumeSpeaking(); setDemoPaused(false) }
      else { pauseSpeaking(); setDemoPaused(true) }
      return
    }
    stopSpeaking()
    setSpeakState('idle')
    setActiveDemo(word)
    setDemoPaused(false)
    const onEnd = () => { setActiveDemo(null); setDemoPaused(false) }
    const url = tipDemoUrls[word]
    if (url) {
      playBlobUrl(url, 1.0, onEnd)
    } else {
      cancelPrefetches()  // stop competing prefetches so ElevenLabs only has 1 request
      speakMultilingual(tip_demo, onEnd)
    }
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleTargetSpeak} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: activeDemo === 'target' ? '#fdf0ea' : '#f5f3ee',
            border: `1.5px solid ${activeDemo === 'target' ? '#f5c4a8' : '#dedad0'}`,
            color: activeDemo === 'target' ? '#d97757' : '#1a1917',
            cursor: 'pointer', transition: 'background 0.15s',
          }}>
            {activeDemo === 'target'
              ? (demoPaused ? '▶ 继续' : '⏸ 暂停')
              : '🔊 听女声示范'}
          </button>
          {activeDemo === 'target' && (
            <button onClick={() => { stopSpeaking(); setActiveDemo(null); setDemoPaused(false) }} style={{
              padding: '7px 10px', borderRadius: 8, fontSize: 13,
              background: '#f5f3ee', border: '1.5px solid #dedad0', color: '#7a7870',
              cursor: 'pointer',
            }}>⏹</button>
          )}
        </div>
      </Card>

      {/* 录音区 */}
      {!result && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
          <button
            onClick={status === 'recording' ? stopRecording : startRecording}
            disabled={status === 'processing' || !!analyzePhase}
            className={status === 'recording' ? 'recording-pulse' : ''}
            style={{
              width: 72, height: 72, borderRadius: '50%', border: 'none',
              fontSize: 26, cursor: status === 'processing' || !!analyzePhase ? 'not-allowed' : 'pointer',
              background: status === 'recording' ? '#dc3030' : '#d97757',
              color: '#fff', transition: 'background 0.2s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: status === 'processing' || !!analyzePhase ? 0.6 : 1,
            }}
          >
            {status === 'recording' ? '⏹' : '🎤'}
          </button>

          {status === 'recording' && <Waveform analyserRef={analyserRef} />}

          <p style={{ fontSize: 13, color: '#7a7870' }}>
            {status === 'idle'       && '点击麦克风开始录音'}
            {status === 'recording'  && '🔴 录音中… 点击停止'}
            {status === 'processing' && '处理中…'}
            {status === 'done'       && '录音完成'}
          </p>
          {(status === 'idle' || status === 'recording') && (
            <p style={{ fontSize: 11, color: '#b0aea5' }}>或按空格键</p>
          )}
          {error && <p style={{ fontSize: 13, color: '#dc3030' }}>{error}</p>}

          {status === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              <audio src={audioUrl} controls style={{ width: '100%', maxWidth: 320, borderRadius: 8 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={handleAnalyze} disabled={!!analyzePhase}>
                  {analyzePhase === 'processing'
                    ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 处理录音…</>
                    : analyzePhase === 'analyzing'
                    ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> AI 分析中…</>
                    : '🤖 AI 分析发音'}
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
            preloading={preloading}
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
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => handleTipDemo(issue.word, issue.tip_demo)}
                            style={{
                              padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: activeDemo === issue.word ? '#fee9d8' : '#fdf0ea',
                              border: '1px solid #f5c4a8',
                              color: '#d97757', cursor: 'pointer',
                            }}
                          >
                            {activeDemo === issue.word
                              ? (demoPaused ? '▶ 继续' : '⏸ 暂停')
                              : (tipDemoUrls[issue.word] ? '🔊 听示范' : '🔊 听示范')}
                          </button>
                          {activeDemo === issue.word && (
                            <button
                              onClick={() => { stopSpeaking(); setActiveDemo(null); setDemoPaused(false) }}
                              style={{
                                padding: '2px 7px', borderRadius: 6, fontSize: 11,
                                background: '#f5f3ee', border: '1px solid #dedad0',
                                color: '#7a7870', cursor: 'pointer',
                              }}
                            >⏹</button>
                          )}
                        </div>
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

      {/* 历史记录 */}
      {history.length > 0 && !result && (
        <div style={{ background: '#faf9f5', border: '1px solid #ece9e0', borderRadius: 12, padding: '12px 14px' }}>
          <MiniScoreChart history={history} />
          <button onClick={() => setShowHistory(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#7a7870', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 0', marginTop: history.length >= 2 ? 6 : 0,
          }}>
            📋 {showHistory ? '收起' : `查看历史记录 (${history.length} 次)`}
          </button>
          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
              {history.map((rec, i) => (
                <div key={rec.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: i === 0 ? '1px solid #ece9e0' : 'none', paddingTop: i === 0 ? 8 : 0,
                }}>
                  <span style={{ fontSize: 12, color: '#7a7870' }}>
                    第 {history.length - i} 次 · {new Date(rec.created_at).toLocaleDateString('zh-CN')}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: rec.ai_score >= 80 ? '#788c5d' : rec.ai_score >= 60 ? '#d97757' : '#dc3030',
                  }}>
                    {rec.ai_score} 分
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
