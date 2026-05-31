import { useState, useEffect, useRef } from 'react'
import useAudioRecorder from '../hooks/useAudioRecorder'
import { analyzePronunciation } from '../services/gemini'
import { saveRecording, getRecordings } from '../services/supabase'
import { speak, speakMultilingual, stopSpeaking, pauseSpeaking, resumeSpeaking, prefetchAudio, playBlobUrl } from '../utils/tts'
import Button from './ui/Button'
import Card from './ui/Card'
import { recordPronunciationWeaknesses } from '../utils/weakness'

const MiniScoreChart = ({ history }) => {
  if (history.length < 1) return null
  const allScores = [...history].reverse().map(h => h.ai_score).filter(s => s != null)
  if (allScores.length === 0) return null
  const scores = allScores.slice(-8)
  const best = Math.max(...allScores)
  const latest = scores[scores.length - 1]
  const color = latest >= 80 ? '#788c5d' : latest >= 60 ? '#d97757' : '#c45c5c'
  const bestColor = best >= 80 ? '#788c5d' : best >= 60 ? '#d97757' : '#c45c5c'

  if (scores.length < 2) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{latest}</p>
          <p style={{ fontSize: 10, color: '#b0aea5', marginTop: 1 }}>上次得分</p>
        </div>
        {best === latest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: bestColor, fontWeight: 700, background: `${bestColor}14`, borderRadius: 20, padding: '2px 8px' }}>
              🏆 最高 {best}
            </span>
          </div>
        )}
      </div>
    )
  }

  const W = 130, H = 40
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - (s / 100) * H
    return `${x},${y}`
  }).join(' ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', flexWrap: 'wrap' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', flexShrink: 0 }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {scores.map((s, i) => (
          <circle key={i} cx={(i / (scores.length - 1)) * W} cy={H - (s / 100) * H}
            r={i === scores.length - 1 ? 4.5 : 2.5} fill={color}
            opacity={i === scores.length - 1 ? 1 : 0.55} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 12 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{latest}</p>
          <p style={{ fontSize: 10, color: '#b0aea5', marginTop: 1 }}>上次得分</p>
        </div>
        {best !== latest && (
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: bestColor, lineHeight: 1 }}>🏆 {best}</p>
            <p style={{ fontSize: 10, color: '#b0aea5', marginTop: 1 }}>历史最高</p>
          </div>
        )}
      </div>
    </div>
  )
}

const DimensionBars = ({ scores }) => {
  if (!scores) return null
  const dims = [
    { key: 'pronunciation', label: '发音准确', color: '#e8672a' },
    { key: 'fluency',       label: '流利连贯', color: '#3a9a5f' },
    { key: 'stress',        label: '重音节奏', color: '#7b5ea7' },
    { key: 'intonation',    label: '语调自然', color: '#4a7a9b' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {dims.map(d => {
        const val = scores[d.key] ?? 0
        return (
          <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#7a7870', width: 52, flexShrink: 0 }}>{d.label}</span>
            <div style={{ flex: 1, height: 8, background: '#f0ede6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${val}%`, borderRadius: 6,
                background: d.color,
                transition: 'width 1s ease-out',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.color, width: 28, textAlign: 'right', flexShrink: 0 }}>{val}</span>
          </div>
        )
      })}
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
  minHeight: 38, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
  border: '1.5px solid', cursor: 'pointer',
  fontFamily: 'inherit',
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
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
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

    <div style={{ flex: '1 1 150px', minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917', marginBottom: 1 }}>Emma 老师</p>
      <p style={{ fontSize: 11, color: speakState !== 'idle' ? '#d97757' : preloading ? '#c4a35a' : '#7a7870' }}>
        {speakState === 'playing' ? '🔴 正在讲解…'
          : speakState === 'paused' ? '⏸ 已暂停'
          : preloading ? '正在准备语音…'
          : 'AI 发音教练'}
      </p>
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

const PASS_SCORE = 75
const MAX_SESSION_ATTEMPTS = 5

const DIM_META = {
  pronunciation: { label: '发音准确', tip: '放慢语速，一个音一个音咬清楚' },
  fluency:       { label: '流利连贯', tip: '不要停顿太久，哪怕速度慢也要一口气说完' },
  stress:        { label: '重音节奏', tip: '找到每个单词的重音音节，着重加重那一拍' },
  intonation:    { label: '语调自然', tip: '句末根据意思升调或降调，避免单调平读' },
}

const getWeakestDimension = (dimScores) => {
  if (!dimScores) return null
  return Object.entries(dimScores).reduce((min, [k, v]) => (!min || v < min[1] ? [k, v] : min), null)
}

const RetryNudge = ({ result, attemptNum, prevScore }) => {
  const weak = getWeakestDimension(result?.dimension_scores)
  const meta = weak ? DIM_META[weak[0]] : null
  const delta = attemptNum > 1 && prevScore != null ? result.overall_score - prevScore : null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff8f4, #fffaf7)',
      border: '1.5px solid #f3c4a2',
      borderRadius: 14, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🎯</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#0f0e0c' }}>
            {delta != null
              ? delta > 0
                ? `比上次高了 +${delta} 分，继续！`
                : delta < 0
                  ? `这次低了 ${Math.abs(delta)} 分，别急，再来`
                  : '和上次持平，专注最弱维度再来一次'
              : `差 ${PASS_SCORE - result.overall_score} 分达标，来加把劲`}
          </p>
          {meta && (
            <p style={{ fontSize: 12, color: '#d97757', marginTop: 2 }}>
              最弱：{meta.label} — {meta.tip}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const PassBanner = ({ score, attemptNum }) => (
  <div style={{
    background: 'linear-gradient(135deg, #edf8f2, #d8f0e8)',
    border: '1.5px solid #7fc9a0',
    borderRadius: 14, padding: '16px 18px',
    textAlign: 'center',
  }}>
    <p style={{ fontSize: 28, marginBottom: 6 }}>🎉</p>
    <p style={{ fontSize: 16, fontWeight: 800, color: '#1f6b40' }}>
      达标！第 {attemptNum} 次拿到了 {score} 分
    </p>
    <p style={{ fontSize: 12, color: '#3a7a50', marginTop: 4 }}>
      超过 {PASS_SCORE} 分的基准线，发音相当不错了！
    </p>
  </div>
)

const SessionSummary = ({ attempts, onReset }) => {
  const best = Math.max(...attempts.map(a => a.score))
  const last = attempts[attempts.length - 1]?.score
  const trend = attempts.length >= 2
    ? last > attempts[0].score ? '📈 进步' : last === attempts[0].score ? '→ 持平' : '↓ 有波动'
    : '首次完成'

  const dimTotals = {}
  attempts.forEach(a => {
    if (!a.dimension_scores) return
    Object.entries(a.dimension_scores).forEach(([k, v]) => {
      if (!dimTotals[k]) dimTotals[k] = []
      dimTotals[k].push(v)
    })
  })
  const dimAvgs = Object.entries(dimTotals).map(([k, vals]) => ({
    key: k, avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length), meta: DIM_META[k],
  })).sort((a, b) => a.avg - b.avg)
  const weakest = dimAvgs[0]

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e1d8', borderRadius: 16, padding: '18px' }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: '#0f0e0c', marginBottom: 12 }}>
        📊 本轮总结 · {attempts.length} 次练习
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          { label: '最高分', value: best, color: best >= PASS_SCORE ? '#3a9a5f' : '#e8672a', bg: best >= PASS_SCORE ? '#edf8f2' : '#fff3ee' },
          { label: '最终分', value: last, color: '#4a7a9b', bg: '#eef4fb' },
          { label: '趋势', value: trend, color: '#5c5850', bg: '#f5f3ef', small: true },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: s.small ? 12 : 22, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#9e998e', marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {weakest && dimAvgs.length > 0 && (
        <div style={{
          background: '#fff8f4', border: '1px solid #f3c4a2',
          borderRadius: 12, padding: '10px 13px', marginBottom: 14,
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#d97757', marginBottom: 4 }}>
            🎯 今日最需要练：{weakest.meta?.label || weakest.key}（均分 {weakest.avg}）
          </p>
          <p style={{ fontSize: 12, color: '#5c5850', lineHeight: 1.5 }}>
            {weakest.meta?.tip || '建议有针对性地多练几次'}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {dimAvgs.map(d => (
              <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#7a7870' }}>{d.meta?.label || d.key}</span>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: d.avg >= 80 ? '#3a9a5f' : d.avg >= 60 ? '#e8672a' : '#d94040',
                }}>{d.avg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#7a7870', lineHeight: 1.55, marginBottom: 14 }}>
        {best >= PASS_SCORE
          ? `最高达到 ${best} 分，已超过达标线，今天这个句子打卡成功！`
          : `今天练了 ${attempts.length} 次，最高 ${best} 分。明天再来，肌肉记忆会越来越稳。`}
      </p>
      <button onClick={onReset} style={{
        width: '100%', minHeight: 44, borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg, #f28040, #e05020)',
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>
        换一句继续练
      </button>
    </div>
  )
}

const AudioRecorder = ({ targetText, targetZh, userId, lessonId }) => {
  const { status, audioBlob, audioUrl, error, startRecording, stopRecording, reset, getBase64WithMime, analyserRef } = useAudioRecorder()
  const [analyzePhase, setAnalyzePhase] = useState(null)  // null | 'processing' | 'analyzing'
  const [analyzeElapsed, setAnalyzeElapsed] = useState(0)
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
  // Session tracking: multiple attempts at the same target sentence
  const [sessionAttempts, setSessionAttempts] = useState([])   // [{score, dimension_scores}]

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
    prefetchAborts.current.forEach(ac => { try { ac.abort() } catch { /* already closed */ } })
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

  useEffect(() => {
    if (analyzePhase !== 'analyzing') { setAnalyzeElapsed(0); return }
    const start = Date.now()
    const timer = setInterval(() => setAnalyzeElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [analyzePhase])

  const handleAnalyze = async () => {
    setAnalyzePhase('processing')
    setAnalyzeError(null)
    try {
      const payload = await getBase64WithMime()
      if (!payload?.base64) throw new Error('录音为空，请重新录一次')
      setAnalyzePhase('analyzing')
      const feedback = await analyzePronunciation(payload.base64, targetText, payload.mimeType)
      setResult(feedback)
      if (!feedback.fallback) {
        recordPronunciationWeaknesses(feedback, targetZh || targetText || '发音练习')
        setSessionAttempts(prev => [...prev, {
          score: feedback.overall_score,
          dimension_scores: feedback.dimension_scores,
        }])
      }
      if (!feedback.fallback && userId && lessonId && audioBlob) {
        saveRecording(userId, lessonId, audioBlob, feedback.overall_score, feedback).catch(() => {})
      }
    } catch (e) {
      setAnalyzeError('AI 分析失败：' + e.message)
    } finally {
      setAnalyzePhase(null)
    }
  }

  // 重试：保留 session 记录，只重置录音状态
  const handleRetry = () => {
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

  // 完全重置：清掉 session，回到第一次状态
  const handleReset = () => {
    handleRetry()
    setSessionAttempts([])
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
        <p className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: '#1a1917', marginBottom: 4, letterSpacing: '0.05em', overflowWrap: 'anywhere', lineHeight: 1.35 }}>{targetText}</p>
        {targetZh && <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 12 }}>{targetZh}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleTargetSpeak} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            minHeight: 40, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
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
              minHeight: 40, padding: '7px 12px', borderRadius: 10, fontSize: 13,
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
            aria-label={status === 'recording' ? '停止录音（Space键）' : '开始录音（Space键）'}
            style={{
              width: 84, height: 84, borderRadius: '50%', border: 'none',
              fontSize: 26, cursor: status === 'processing' || !!analyzePhase ? 'not-allowed' : 'pointer',
              background: status === 'recording' ? '#dc3030' : '#d97757',
              color: '#fff', transition: 'background 0.2s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: status === 'processing' || !!analyzePhase ? 0.6 : 1,
              boxShadow: status === 'recording' ? '0 8px 28px rgba(220,48,48,0.32)' : '0 8px 28px rgba(217,119,87,0.28)',
            }}
          >
            {status === 'recording' ? '⏹' : '🎤'}
          </button>

          {status === 'recording' && <Waveform analyserRef={analyserRef} />}

          <p style={{ fontSize: 13, color: status === 'recording' ? '#dc3030' : '#7a7870', fontWeight: status === 'recording' ? 800 : 500 }}>
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
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', justifyContent: 'center' }}>
                <Button onClick={handleAnalyze} disabled={!!analyzePhase} style={{ minHeight: 46, flex: '1 1 160px' }}>
                  {analyzePhase === 'processing'
                    ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 处理录音…</>
                    : analyzePhase === 'analyzing'
                    ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> AI 分析中…</>
                    : '🤖 AI 分析发音'}
                </Button>
                <Button variant="secondary" onClick={handleReset} style={{ minHeight: 46, flex: '1 1 120px' }}>重新录音</Button>
              </div>
              {analyzePhase === 'analyzing' && (
                <p style={{ fontSize: 12, color: '#9e998e', textAlign: 'center' }}>
                  {analyzeElapsed < 5
                    ? 'AI 正在分析你的发音…'
                    : analyzeElapsed < 14
                    ? `服务启动中，请稍候…（${analyzeElapsed}s）`
                    : `模型较忙，正在切换备用…（${analyzeElapsed}s）`}
                </p>
              )}
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
      {result && (() => {
        const attemptNum = sessionAttempts.length
        const prevScore = sessionAttempts.length >= 2
          ? sessionAttempts[sessionAttempts.length - 2].score
          : null
        const passed = !result.fallback && result.overall_score >= PASS_SCORE
        const maxReached = attemptNum >= MAX_SESSION_ATTEMPTS

        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">

          {/* Session 进度指示 */}
          {!result.fallback && attemptNum > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f5f3ef', borderRadius: 12, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5c5850' }}>
                第 {attemptNum} 次练习
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: MAX_SESSION_ATTEMPTS }).map((_, i) => {
                  const a = sessionAttempts[i]
                  return (
                    <div key={i} style={{
                      width: 28, height: 7, borderRadius: 4,
                      background: a
                        ? a.score >= PASS_SCORE ? '#3a9a5f' : '#e8672a'
                        : i === attemptNum ? '#dedad0' : '#ece9e0',
                    }} />
                  )
                })}
              </div>
              <span style={{ fontSize: 11, color: '#9e998e' }}>目标 {PASS_SCORE}+</span>
            </div>
          )}

          {result.fallback && (
            <div style={{
              background: '#fff8ea', border: '1px solid #f3d08b',
              borderRadius: 12, padding: '10px 13px',
              fontSize: 12.5, color: '#8a5b10', lineHeight: 1.55,
            }}>
              <p style={{ marginBottom: 10 }}>
                Gemini 云端评分暂时繁忙，本次先显示基础反馈，不计入正式学习记录。
              </p>
              <button
                onClick={handleAnalyze}
                disabled={!!analyzePhase}
                style={{
                  minHeight: 34, borderRadius: 9, border: '1px solid #d6a84f',
                  background: '#fff', color: '#8a5b10', cursor: analyzePhase ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 800, padding: '6px 10px',
                }}
              >
                {analyzePhase ? '正在重新请求…' : '重新获取完整 AI 评分'}
              </button>
            </div>
          )}

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

          {/* 总评分 + 4维度 */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <ScoreRing score={result.overall_score} />
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <p style={{ fontSize: 11, color: '#7a7870', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>综合发音评分</p>
                <p style={{ fontSize: 14, color: '#1a1917', lineHeight: 1.5 }}>{result.positive_feedback}</p>
              </div>
            </div>
            <DimensionBars scores={result.dimension_scores} />
          </Card>

          {/* 对比听 */}
          {audioUrl && (
            <div style={{ background: '#f5f3ef', border: '1px solid #e5e1d8', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#5c5850', marginBottom: 10 }}>🎧 对比听——你的录音 vs 示范发音</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#7a7870', width: 56, flexShrink: 0 }}>你的录音</span>
                  <audio src={audioUrl} controls style={{ flex: '1 1 190px', height: 32 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#7a7870', width: 56, flexShrink: 0 }}>示范发音</span>
                  <button onClick={handleTargetSpeak} style={{
                    flex: 1, minHeight: 40, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: activeDemo === 'target' ? '#fef0ea' : '#fff',
                    border: `1.5px solid ${activeDemo === 'target' ? '#f5c4a8' : '#dedad0'}`,
                    color: activeDemo === 'target' ? '#d97757' : '#5c5850',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    {activeDemo === 'target' ? (demoPaused ? '▶ 继续播放' : '⏸ 暂停') : '🔊 播放示范音频'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 具体问题 */}
          {result.pronunciation_issues?.length > 0 && (
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917', marginBottom: 12 }}>📝 需要改进的发音</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.pronunciation_issues.map((issue, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #d97757', paddingLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <p className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', overflowWrap: 'anywhere' }}>
                        {issue.word} <span style={{ fontSize: 12, fontWeight: 400, color: '#7a7870' }}>{issue.correct_ipa}</span>
                      </p>
                      {issue.tip_demo && (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            // eslint-disable-next-line react-hooks/refs -- click handler reads prefetch refs only after user interaction
                            onClick={() => handleTipDemo(issue.word, issue.tip_demo)}
                            style={{
                              minHeight: 34, padding: '5px 10px', borderRadius: 9, fontSize: 11, fontWeight: 700,
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
                                minHeight: 34, padding: '5px 9px', borderRadius: 9, fontSize: 11,
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
          {result.next_focus && !passed && (
            <div style={{ background: '#fdf0ea', border: '1px solid #f5c4a8', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#b85f3e' }}>🎯 下次练习重点：{result.next_focus}</p>
            </div>
          )}

          {/* 新记录庆祝 */}
          {!result.fallback && history.length > 0 && (() => {
            const prevBest = Math.max(...history.map(h => h.ai_score).filter(s => s != null), 0)
            return result.overall_score > prevBest ? (
              <div style={{
                background: 'linear-gradient(135deg, #fef6e0, #fff9ee)',
                border: '1.5px solid #f0c040', borderRadius: 14,
                padding: '12px 16px', textAlign: 'center',
              }} className="fade-in">
                <p style={{ fontSize: 18, marginBottom: 4 }}>🏆</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#b8860b' }}>
                  新纪录！超过历史最高 {prevBest} 分
                </p>
              </div>
            ) : null
          })()}

          {/* 达标庆祝 */}
          {passed && <PassBanner score={result.overall_score} attemptNum={attemptNum} />}

          {/* 未达标：重试引导 */}
          {!result.fallback && !passed && !maxReached && (
            <RetryNudge result={result} attemptNum={attemptNum} prevScore={prevScore} />
          )}

          {/* 达到最大次数：本轮总结 */}
          {maxReached && !passed && (
            <SessionSummary attempts={sessionAttempts} onReset={handleReset} />
          )}

          {/* 操作按钮 */}
          {!maxReached && (
            <div style={{ display: 'flex', gap: 10 }}>
              {!passed && (
                <Button onClick={handleRetry} style={{ flex: 1, minHeight: 48, justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f28040, #e05020)', color: '#fff', border: 'none' }}>
                  {attemptNum > 0 ? `再来一次（第 ${attemptNum + 1} 次）` : '再练一次'}
                </Button>
              )}
              {passed && (
                <Button onClick={handleReset} style={{ flex: 1, minHeight: 48, justifyContent: 'center',
                  background: 'linear-gradient(135deg, #3a9a5f, #2a7a4a)', color: '#fff', border: 'none' }}>
                  换一句继续
                </Button>
              )}
              {attemptNum > 0 && (
                <Button variant="secondary" onClick={handleReset} style={{ minHeight: 48, padding: '0 16px' }}>
                  重新开始
                </Button>
              )}
            </div>
          )}
        </div>
        )
      })()}

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
