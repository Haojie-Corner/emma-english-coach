import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMindsetLesson } from '../../data/mindset'
import { generateMindsetQuiz } from '../../services/deepseek'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'
import { speakMultilingual } from '../../utils/tts'
import LessonValueBanner from '../../components/ui/LessonValueBanner'

const MindsetLesson = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const lesson = getMindsetLesson(lessonId)

  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [previousQuestions, setPreviousQuestions] = useState([])
  const [phase, setPhase] = useState('intro') // intro | quiz

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
    } catch (e) {
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
    if (user && newTotal >= 3) {
      await updateProgress(user.id, 'mindset', lesson.id, newCorrect >= 2 ? 'completed' : 'in_progress', Math.round((newCorrect / newTotal) * 100))
    }
    if (quiz.voice_script) {
      speakMultilingual(quiz.voice_script)
    } else if (quiz.explanation) {
      speakMultilingual(quiz.explanation)
    }
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
      <button onClick={() => navigate('/course/mindset')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer',
        marginBottom: 16, padding: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
        onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
      >← 认知重塑</button>

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
        </div>
      )}
    </div>
  )
}

export default MindsetLesson
