import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDemoLesson, demoLessons } from '../../data/demo'
import { scoreSpeechSimilarity } from '../../services/gemini'
import useAudioRecorder from '../../hooks/useAudioRecorder'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'
import { speak, speakMultilingual, stopSpeaking } from '../../utils/tts'
import LessonValueBanner from '../../components/ui/LessonValueBanner'
import VocabChip from '../../components/ui/VocabChip'
import { expandVocabulary } from '../../services/gemini'
import { addVocabularyWord } from '../../services/supabase'

const ScoreBar = ({ label, score }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 12, color: '#7a7870' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: score >= 80 ? '#788c5d' : score >= 60 ? '#d97757' : '#c45c5c' }}>{score}</span>
    </div>
    <div style={{ height: 6, background: '#ece9e0', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 3, width: `${score}%`, background: score >= 80 ? '#788c5d' : score >= 60 ? '#d97757' : '#c45c5c', transition: 'width 0.6s' }} />
    </div>
  </div>
)

const DemoLesson = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const lesson = getDemoLesson(lessonId)
  const currentIndex = demoLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? demoLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < demoLessons.length - 1 ? demoLessons[currentIndex + 1] : null

  const [tab, setTab] = useState('demo')
  const [playingLine, setPlayingLine] = useState(null)
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [savedVocabs, setSavedVocabs] = useState(new Set())
  const [savingVocab, setSavingVocab] = useState(null)
  const [studentAudioUrl, setStudentAudioUrl] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [ttsRate, setTtsRate] = useState(1.0)
  const compareAudioRef = useRef(null)

  const handleSaveVocab = async (en) => {
    if (!user || savedVocabs.has(en)) return
    setSavingVocab(en)
    try {
      const expanded = await expandVocabulary(en)
      await addVocabularyWord(user.id, en, expanded.phonetic, expanded.meaning, expanded.example, expanded.example_zh, `场景演绎·${lesson.title}`)
      setSavedVocabs(prev => new Set([...prev, en]))
    } catch { /* silently fail */ }
    finally { setSavingVocab(null) }
  }

  const { status: recStatus, audioBlob, startRecording, stopRecording, getBase64, reset: resetRec } = useAudioRecorder()
  const isRecording = recStatus === 'recording'

  useEffect(() => {
    if (recStatus === 'done') {
      setAnalyzing(true)
      setError('')
      setResult(null)
      getBase64().then(async (base64) => {
        if (!base64) { setAnalyzing(false); return }
        try {
          const data = await scoreSpeechSimilarity(base64, lesson.practiceTarget, lesson.practiceZh)
          setResult(data)
          // 保存学生录音 blob URL 用于对比回放
          if (audioBlob) {
            if (studentAudioUrl) URL.revokeObjectURL(studentAudioUrl)
            setStudentAudioUrl(URL.createObjectURL(audioBlob))
          }
          if (user) await updateProgress(user.id, 'demo', lesson.id, data.overall_score >= 70 ? 'completed' : 'in_progress', data.overall_score)
          if (data.voice_script) speakMultilingual(data.voice_script)
        } catch (e) {
          setError('分析失败：' + e.message)
        } finally {
          setAnalyzing(false)
        }
      })
    }
  }, [recStatus]) // eslint-disable-line

  // 离开时释放 blob URL
  useEffect(() => {
    return () => {
      if (studentAudioUrl) URL.revokeObjectURL(studentAudioUrl)
      if (compareAudioRef.current) { compareAudioRef.current.pause(); compareAudioRef.current = null }
    }
  }, []) // eslint-disable-line

  if (!lesson) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <p style={{ color: '#7a7870' }}>课程不存在</p>
      <Button onClick={() => navigate('/course/demo')} variant="secondary" style={{ marginTop: 16 }}>返回</Button>
    </div>
  )

  const handlePlayLine = (line, index) => {
    stopSpeaking()
    setPlayingLine(index)
    speak(line.text, ttsRate, () => setPlayingLine(null))
  }

  const handlePlayAll = () => {
    stopSpeaking()
    let i = 0
    const playNext = () => {
      if (i >= lesson.dialogue.length) { setPlayingLine(null); return }
      setPlayingLine(i)
      speak(lesson.dialogue[i].text, ttsRate, () => { i++; setTimeout(playNext, 500) })
    }
    playNext()
  }

  const handleRecord = () => {
    if (isRecording) {
      stopRecording()
    } else {
      setResult(null)
      setComparing(false)
      if (compareAudioRef.current) { compareAudioRef.current.pause(); compareAudioRef.current = null }
      resetRec()
      startRecording()
    }
  }

  /* 对比回放：先播 TTS 示范，再播学生录音 */
  const handleCompare = () => {
    if (comparing) return
    setComparing(true)
    stopSpeaking()
    speak(lesson.practiceTarget, ttsRate, () => {
      setTimeout(() => {
        if (!studentAudioUrl) { setComparing(false); return }
        const audio = new Audio(studentAudioUrl)
        compareAudioRef.current = audio
        audio.onended = () => { setComparing(false); compareAudioRef.current = null }
        audio.onerror = () => { setComparing(false); compareAudioRef.current = null }
        audio.play().catch(() => setComparing(false))
      }, 700)
    })
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => { stopSpeaking(); navigate('/course/demo') }} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
          onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
        >← 场景演绎</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={!prevLesson} onClick={() => { stopSpeaking(); prevLesson && navigate(`/course/demo/${prevLesson.id}`) }} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: prevLesson ? 'pointer' : 'not-allowed',
            background: prevLesson ? '#fff' : '#f5f3ee', color: prevLesson ? '#1a1917' : '#b0aea5',
          }}>‹ 上一课</button>
          <button disabled={!nextLesson} onClick={() => { stopSpeaking(); nextLesson && navigate(`/course/demo/${nextLesson.id}`) }} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: nextLesson ? 'pointer' : 'not-allowed',
            background: nextLesson ? '#fff' : '#f5f3ee', color: nextLesson ? '#1a1917' : '#b0aea5',
          }}>下一课 ›</button>
        </div>
      </div>

      <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917', marginBottom: 12 }}>{lesson.title}</h1>
      <LessonValueBanner lesson={lesson} color="#c4a35a" bg="#fdf8ed" borderColor="#e8d4a0" />

      {/* Tab */}
      <div style={{ display: 'flex', background: '#ece9e0', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {[['demo', '🎬 示范对话'], ['practice', '🎤 跟读练习']].map(([key, label]) => (
          <button key={key} onClick={() => { stopSpeaking(); setTab(key) }} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? '#1a1917' : '#7a7870',
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* 示范对话 */}
      {tab === 'demo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: '#fdf0ea', border: '1px solid #f5c4a8' }}>
            <p style={{ fontSize: 13, color: '#d97757', marginBottom: 4 }}>🎯 本课重点</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {lesson.focusPoints?.map((fp, i) => (
                <span key={i} style={{ fontSize: 12, color: '#7a7870', background: '#fff', border: '1px solid #dedad0', borderRadius: 8, padding: '4px 10px' }}>{fp}</span>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
            <button onClick={handlePlayAll} style={{ fontSize: 12, color: '#d97757', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              ▶▶ 全部朗读
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lesson.dialogue.map((line, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                flexDirection: line.role === 'B' ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: line.role === 'A' ? '#fdf0ea' : '#f0eeff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: line.role === 'A' ? '#d97757' : '#7a6bba',
                  flexShrink: 0,
                }}>{line.role}</div>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{
                    background: '#fff', border: `1.5px solid ${playingLine === i ? '#d97757' : '#dedad0'}`,
                    borderRadius: 12, padding: '10px 14px',
                    boxShadow: playingLine === i ? '0 2px 8px rgba(217,119,87,0.2)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    <p style={{ fontSize: 14, color: '#1a1917', fontWeight: 500, lineHeight: 1.5 }}>{line.text}</p>
                    <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 3 }}>{line.zh}</p>
                  </div>
                  <button onClick={() => handlePlayLine(line, i)} style={{ fontSize: 11, color: '#b0aea5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', marginTop: 2 }}>
                    {playingLine === i ? '🔊 播放中…' : '🔊 单独听'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => setTab('practice')} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            开始跟读练习 🎤
          </Button>
        </div>
      )}

      {/* 跟读练习 */}
      {tab === 'practice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: '#faf9f5' }}>
            <p style={{ fontSize: 12, color: '#b0aea5', marginBottom: 6 }}>练习内容</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1917', lineHeight: 1.6 }}>{lesson.practiceTarget}</p>
            <p style={{ fontSize: 13, color: '#7a7870', marginTop: 4 }}>{lesson.practiceZh}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={() => speak(lesson.practiceTarget, ttsRate)} style={{ fontSize: 12, color: '#d97757', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                🔊 听示范
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0.75, 1.0, 1.25].map(r => (
                  <button key={r} onClick={() => setTtsRate(r)} style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${ttsRate === r ? '#d97757' : '#dedad0'}`,
                    background: ttsRate === r ? '#fdf0ea' : '#faf9f5',
                    color: ttsRate === r ? '#d97757' : '#b0aea5', cursor: 'pointer',
                  }}>{r === 1.0 ? '正常' : r < 1 ? `慢速` : `快速`}</button>
                ))}
              </div>
            </div>
          </Card>

          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <button
              onClick={handleRecord}
              disabled={analyzing}
              style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: analyzing ? 'default' : 'pointer',
                background: isRecording ? '#c45c5c' : '#d97757',
                color: '#fff', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', transition: 'all 0.2s',
                boxShadow: isRecording ? '0 0 0 8px rgba(196,92,92,0.2)' : '0 4px 16px rgba(217,119,87,0.35)',
                animation: isRecording ? 'recording-pulse 1.5s infinite' : 'none',
              }}
            >
              {analyzing ? <span className="spin">⏳</span> : isRecording ? '⏹' : '🎤'}
            </button>
            <p style={{ fontSize: 13, color: '#7a7870', marginTop: 12 }}>
              {analyzing ? 'AI 分析中…' : isRecording ? '录音中，点击停止' : '点击开始录音'}
            </p>
          </div>

          {error && <p style={{ color: '#c45c5c', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          {result && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#1a1917', marginBottom: 12 }}>
                  综合得分：<span style={{ color: result.overall_score >= 80 ? '#788c5d' : result.overall_score >= 60 ? '#d97757' : '#c45c5c', fontSize: 24 }}>{result.overall_score}</span>
                  <span style={{ fontSize: 13, color: '#b0aea5' }}> / 100</span>
                </p>
                <ScoreBar label="内容相似度" score={result.similarity_score} />
                <ScoreBar label="发音清晰度" score={result.pronunciation_score} />
                <ScoreBar label="语调节奏" score={result.intonation_score} />

                {/* 对比回放按钮 */}
                {studentAudioUrl && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0ede4' }}>
                    <p style={{ fontSize: 11, color: '#7a7870', marginBottom: 8 }}>🎧 对比回放</p>
                    <button
                      onClick={handleCompare}
                      disabled={comparing}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: comparing ? '#f5f3ee' : '#f0eeff',
                        border: `1.5px solid ${comparing ? '#dedad0' : '#c0b0e8'}`,
                        color: comparing ? '#b0aea5' : '#7a6bba',
                        cursor: comparing ? 'default' : 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {comparing
                        ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 播放中…</>
                        : '🔄 示范 → 我的录音 对比'}
                    </button>
                    <p style={{ fontSize: 10, color: '#b0aea5', marginTop: 5 }}>
                      先播示范音，间隔 0.7s 后播你的录音，自己听差距
                    </p>
                  </div>
                )}
              </Card>

              {result.highlight && (
                <Card style={{ background: '#eaf2e3', border: '1px solid #c4ddb0' }}>
                  <p style={{ fontSize: 13, color: '#5a7a3a' }}>✨ {result.highlight}</p>
                </Card>
              )}

              {result.words_missed?.length > 0 && (
                <Card>
                  <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 8 }}>遗漏或说错（点 + 存入词汇本）：</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {result.words_missed.map((w, i) => (
                      <VocabChip key={i} en={w} zh=""
                        saved={savedVocabs.has(w)} saving={savingVocab === w}
                        onSave={handleSaveVocab} />
                    ))}
                  </div>
                </Card>
              )}

              {result.feedback && (
                <Card>
                  <p style={{ fontSize: 13, color: '#1a1917', lineHeight: 1.6 }}>💬 {result.feedback}</p>
                </Card>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={() => { setResult(null); setError(''); setStudentAudioUrl(null); resetRec() }} variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  再试一次
                </Button>
                <Button onClick={() => navigate('/course/demo')} style={{ flex: 1, justifyContent: 'center' }}>
                  返回列表
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DemoLesson
