import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMindsetLesson, mindsetLessons } from '../../data/mindset'
import useStudyTimer from '../../hooks/useStudyTimer'
import { generateMindsetQuiz } from '../../services/deepseek'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import VocabChip from '../../components/ui/VocabChip'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'
import { speakMultilingual } from '../../utils/tts'
import LessonValueBanner from '../../components/ui/LessonValueBanner'
import { addVocabularyWord } from '../../services/supabase'
import { expandVocabulary } from '../../services/gemini'

const MindsetLesson = () => {
  useStudyTimer()
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const lesson = getMindsetLesson(lessonId)
  const currentIndex = mindsetLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? mindsetLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < mindsetLessons.length - 1 ? mindsetLessons[currentIndex + 1] : null

  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [previousQuestions, setPreviousQuestions] = useState([])
  const [phase, setPhase] = useState('intro') // intro | quiz
  const [quizHistory, setQuizHistory] = useState([]) // session answer history
  const [showHistory, setShowHistory] = useState(false)
  const [savedVocabs, setSavedVocabs] = useState(new Set())
  const [savingVocab, setSavingVocab] = useState(null)

  if (!lesson) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <p style={{ color: '#7a7870' }}>课程不存在</p>
      <Button onClick={() => navigate('/course/mindset')} variant="secondary" style={{ marginTop: 16 }}>返回</Button>
    </div>
  )

  const fetchQuiz = async () => {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    setQuiz(null)
    try {
      const raw = await generateMindsetQuiz(lesson.topic, lesson.quizType, previousQuestions)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const q = JSON.parse(match[0])
        setQuiz(q)
        setPreviousQuestions(prev => [...prev, q.question])
      }
    } catch {
      setQuiz({ error: '出题失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    setPhase('quiz')
    await fetchQuiz()
  }

  const handleSelect = (option) => {
    if (revealed) return
    setSelected(option)
  }

  const handleReveal = async () => {
    if (!selected || !quiz) return
    setRevealed(true)
    const isCorrect = selected === quiz.correct_answer
    const newTotal = totalCount + 1
    const newCorrect = isCorrect ? correctCount + 1 : correctCount
    setTotalCount(newTotal)
    setCorrectCount(newCorrect)
    setQuizHistory(prev => [...prev, {
      question: quiz.question,
      selected,
      correctAnswer: quiz.correct_answer,
      isCorrect,
      explanation: quiz.explanation,
    }])
    if (user && newTotal >= 3) {
      await updateProgress(user.id, 'mindset', lesson.id, newCorrect >= 2 ? 'completed' : 'in_progress', Math.round((newCorrect / newTotal) * 100))
    }
    if (quiz.voice_script) {
      speakMultilingual(quiz.voice_script)
    } else if (quiz.explanation) {
      speakMultilingual(quiz.explanation)
    }
  }

  const handleSaveVocab = async (en, zh) => {
    if (!user || savedVocabs.has(en) || savingVocab === en) return
    setSavingVocab(en)
    try {
      const expanded = await expandVocabulary(en)
      await addVocabularyWord(
        user.id, en,
        expanded.phonetic || '',
        expanded.meaning || zh || en,
        expanded.example || '',
        expanded.example_zh || '',
        `认知重塑·${lesson.title}`,
      )
      setSavedVocabs(prev => new Set([...prev, en]))
    } catch { /* vocabulary save is optional */ }
    finally { setSavingVocab(null) }
  }

  const isCorrect = revealed && selected === quiz?.correct_answer

  const optionStyle = (option) => {
    let bg = '#faf9f5', border = '#dedad0', color = '#1a1917'
    if (selected === option && !revealed) { bg = '#fdf0ea'; border = '#d97757'; color = '#d97757' }
    if (revealed) {
      if (option === quiz?.correct_answer) { bg = '#eaf2e3'; border = '#788c5d'; color = '#5a7a3a' }
      else if (selected === option) { bg = '#fdeaea'; border = '#c45c5c'; color = '#c45c5c' }
    }
    return { background: bg, border: `1.5px solid ${border}`, color, borderRadius: 12, padding: '12px 16px', cursor: revealed ? 'default' : 'pointer', fontSize: 14, lineHeight: 1.5, transition: 'all 0.15s' }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => navigate('/course/mindset')} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
          onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
        >← 认知重塑</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={!prevLesson} onClick={() => prevLesson && navigate(`/course/mindset/${prevLesson.id}`)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: prevLesson ? 'pointer' : 'not-allowed',
            background: prevLesson ? '#fff' : '#f5f3ee', color: prevLesson ? '#1a1917' : '#b0aea5',
          }}>‹ 上一课</button>
          <button disabled={!nextLesson} onClick={() => nextLesson && navigate(`/course/mindset/${nextLesson.id}`)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: nextLesson ? 'pointer' : 'not-allowed',
            background: nextLesson ? '#fff' : '#f5f3ee', color: nextLesson ? '#1a1917' : '#b0aea5',
          }}>下一课 ›</button>
        </div>
      </div>

      <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917', marginBottom: 12 }}>{lesson.title}</h1>
      <LessonValueBanner lesson={lesson} color="#788c5d" bg="#f2f6ec" borderColor="#c4ddb0" />

      {/* 思维提示 */}
      {lesson.tips?.length > 0 && (
        <Card style={{ marginBottom: 20, background: '#faf9f5' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#1a1917', marginBottom: 10 }}>📌 本课核心要点</p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
            {lesson.tips.map((tip, i) => (
              <li key={i} style={{ fontSize: 13, color: '#7a7870', lineHeight: 1.5 }}>{tip}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* 开始前 */}
      {phase === 'intro' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: 14, color: '#7a7870', marginBottom: 20 }}>读完要点后，开始 AI 出题练习。每次做 5 道题，AI 根据你的回答即时反馈。</p>
          <Button onClick={handleStart} size="lg">开始练习 🧠</Button>
        </div>
      )}

      {/* 答题阶段 */}
      {phase === 'quiz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 进度 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#7a7870' }}>第 {totalCount + (revealed ? 0 : 1)} 题</span>
            <span style={{ fontSize: 13, color: '#788c5d' }}>✅ 正确：{correctCount} / {totalCount}</span>
          </div>

          {loading && (
            <Card style={{ textAlign: 'center', padding: '32px' }}>
              <p className="spin" style={{ fontSize: 28, display: 'inline-block' }}>🤔</p>
              <p style={{ fontSize: 13, color: '#7a7870', marginTop: 8 }}>AI 正在出题…</p>
            </Card>
          )}

          {quiz && !quiz.error && !loading && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 题目 */}
              <Card>
                <p style={{ fontSize: 12, color: '#b0aea5', marginBottom: 8 }}>{quiz.question_type}</p>
                <p style={{ fontSize: 15, color: '#1a1917', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{quiz.question}</p>
                {quiz.question_en && (
                  <p style={{ fontSize: 14, color: '#d97757', marginTop: 8, fontStyle: 'italic' }}>{quiz.question_en}</p>
                )}
              </Card>

              {/* 选项 */}
              {quiz.options?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quiz.options.map((option, i) => (
                    <div key={i} onClick={() => handleSelect(option)} style={optionStyle(option)}>
                      <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                      {option}
                      {revealed && option === quiz.correct_answer && <span style={{ marginLeft: 8 }}>✅</span>}
                      {revealed && selected === option && option !== quiz.correct_answer && <span style={{ marginLeft: 8 }}>❌</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* 提交 / 解析 */}
              {!revealed && (
                <Button onClick={handleReveal} disabled={!selected} style={{ width: '100%', justifyContent: 'center' }}>
                  确认答案
                </Button>
              )}

              {revealed && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Card style={{ background: isCorrect ? '#eaf2e3' : '#fdf0ea', border: `1px solid ${isCorrect ? '#c4ddb0' : '#f5c4a8'}` }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: isCorrect ? '#5a7a3a' : '#d97757', marginBottom: 6 }}>
                      {isCorrect ? '🎉 回答正确！' : '❌ 再想想'}
                    </p>
                    <p style={{ fontSize: 13, color: '#1a1917', lineHeight: 1.6 }}>{quiz.explanation}</p>
                  </Card>

                  {quiz.thinking_tip && (
                    <Card style={{ background: '#f0eeff', border: '1px solid #d0c8f0' }}>
                      <p style={{ fontSize: 13, color: '#7a6bba' }}>🧠 思维建议：{quiz.thinking_tip}</p>
                    </Card>
                  )}

                  {quiz.example_in_context && (
                    <Card>
                      <p style={{ fontSize: 12, color: '#b0aea5', marginBottom: 6 }}>实际应用</p>
                      <p style={{ fontSize: 13, color: '#1a1917', lineHeight: 1.6 }}>{quiz.example_in_context}</p>
                    </Card>
                  )}

                  {quiz.key_vocab?.length > 0 && (
                    <div style={{ background: '#faf9f5', border: '1px solid #ece9e0', borderRadius: 12, padding: '10px 14px' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#788c5d', marginBottom: 8 }}>📚 本题重点词汇（点 + 存入词汇本）</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {quiz.key_vocab.map((v, i) => (
                          <VocabChip
                            key={i} en={v.en} zh={v.zh}
                            saved={savedVocabs.has(v.en)}
                            saving={savingVocab === v.en}
                            onSave={(en, zh) => handleSaveVocab(en, zh)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={fetchQuiz} style={{ width: '100%', justifyContent: 'center' }}>
                    下一题 →
                  </Button>
                </div>
              )}
            </div>
          )}

          {quiz?.error && (
            <Card style={{ textAlign: 'center' }}>
              <p style={{ color: '#c45c5c', marginBottom: 12 }}>{quiz.error}</p>
              <Button onClick={fetchQuiz}>重试</Button>
            </Card>
          )}

          {/* 本次答题记录 */}
          {quizHistory.length > 0 && (
            <div style={{ background: '#faf9f5', border: '1px solid #ece9e0', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
              <button onClick={() => setShowHistory(v => !v)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', fontSize: 13, fontWeight: 600, color: '#1a1917',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                <span>📋 本次答题记录（{quizHistory.length} 题）</span>
                <span style={{ fontSize: 11, color: '#7a7870' }}>
                  ✅ {quizHistory.filter(h => h.isCorrect).length} 正确 / ❌ {quizHistory.filter(h => !h.isCorrect).length} 错误
                </span>
              </button>
              {showHistory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }} className="fade-in">
                  {quizHistory.map((h, i) => (
                    <div key={i} style={{
                      borderLeft: `3px solid ${h.isCorrect ? '#788c5d' : '#c45c5c'}`,
                      paddingLeft: 10, paddingBottom: 4,
                    }}>
                      <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 3 }}>第 {i + 1} 题</p>
                      <p style={{ fontSize: 13, color: '#1a1917', lineHeight: 1.5, marginBottom: 4 }}>{h.question}</p>
                      <p style={{ fontSize: 12 }}>
                        <span style={{ color: h.isCorrect ? '#788c5d' : '#c45c5c', fontWeight: 600 }}>
                          {h.isCorrect ? '✅ ' : '❌ '} 你的答案：{h.selected}
                        </span>
                      </p>
                      {!h.isCorrect && (
                        <p style={{ fontSize: 12, color: '#788c5d', marginTop: 2 }}>✅ 正确：{h.correctAnswer}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MindsetLesson
