import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIntonationLesson } from '../../data/intonation'
import AudioRecorder from '../../components/AudioRecorder'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'
import { speak } from '../../utils/tts'

const ItemCard = ({ item }) => (
  <div
    onClick={() => speak(item.example)}
    style={{
      background: '#fff', border: '1.5px solid #dedad0', borderRadius: 14,
      padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8,
      cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d97757'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(217,119,87,0.15)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#dedad0'; e.currentTarget.style.boxShadow = 'none' }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span className="font-title" style={{ fontSize: 18, fontWeight: 800, color: '#d97757' }}>{item.letter}</span>
      {item.ipa && <span className="font-mono" style={{ fontSize: 12, color: '#7a7870' }}>{item.ipa}</span>}
    </div>
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1917' }}>{item.example}</p>
      <p style={{ fontSize: 12, color: '#7a7870' }}>{item.example_zh}</p>
    </div>
    {item.tip && (
      <p style={{ fontSize: 12, color: '#7a7870', lineHeight: 1.5, background: '#faf9f5', borderRadius: 8, padding: '8px 10px' }}>
        💡 {item.tip}
      </p>
    )}
    <p style={{ fontSize: 10, color: '#b0aea5' }}>🔊 点击听示例</p>
  </div>
)

const IntonationLesson = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const [tab, setTab] = useState('learn')
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [completedTargets, setCompletedTargets] = useState(new Set())

  const lesson = getIntonationLesson(lessonId)

  if (!lesson) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <p style={{ color: '#7a7870' }}>课程不存在</p>
      <Button onClick={() => navigate('/course/intonation')} variant="secondary" style={{ marginTop: 16 }}>返回</Button>
    </div>
  )

  const currentTarget = lesson.practice.targets[practiceIndex]

  const handleMarkComplete = async () => {
    const next = new Set(completedTargets)
    next.add(practiceIndex)
    setCompletedTargets(next)
    if (user) {
      const allDone = next.size >= lesson.practice.targets.length
      await updateProgress(user.id, 'intonation', lesson.id, allDone ? 'completed' : 'in_progress', null)
    }
    if (practiceIndex < lesson.practice.targets.length - 1) setPracticeIndex(practiceIndex + 1)
  }

  const allDone = completedTargets.size >= lesson.practice.targets.length

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px' }}>
      <button onClick={() => navigate('/course/intonation')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer',
        marginBottom: 16, padding: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
        onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
      >← 语音语调</button>

      <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917', marginBottom: 6 }}>{lesson.title}</h1>
      <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 24, lineHeight: 1.6 }}>{lesson.description}</p>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', background: '#ece9e0', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {[['learn', '📖 学习内容'], ['practice', '🎤 跟读练习']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? '#1a1917' : '#7a7870',
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* 学习内容 */}
      {tab === 'learn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {lesson.sections.map(section => (
            <div key={section.id}>
              <h2 className="font-title" style={{ fontSize: 15, color: '#1a1917', marginBottom: 4 }}>{section.title}</h2>
              <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 14 }}>{section.subtitle}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item, i) => <ItemCard key={i} item={item} />)}
              </div>
            </div>
          ))}
          <Button onClick={() => setTab('practice')} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
            开始跟读练习 🎤
          </Button>
        </div>
      )}

      {/* 跟读练习 */}
      {tab === 'practice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#7a7870' }}>{lesson.practice.instructions}</p>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {lesson.practice.targets.map((t, i) => (
              <button key={i} onClick={() => setPracticeIndex(i)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                background: i === practiceIndex ? '#d97757' : completedTargets.has(i) ? '#eaf2e3' : '#ece9e0',
                color: i === practiceIndex ? '#fff' : completedTargets.has(i) ? '#5a7a3a' : '#7a7870',
              }}>
                {completedTargets.has(i) ? '✅ ' : `${i + 1}. `}{t.zh}
              </button>
            ))}
          </div>

          <AudioRecorder
            key={practiceIndex}
            targetText={currentTarget.text}
            targetZh={currentTarget.zh}
            lessonId={lesson.id}
          />

          {!allDone && (
            <Button variant="secondary" onClick={handleMarkComplete} style={{ width: '100%', justifyContent: 'center' }}>
              ✅ 完成这个，进入下一个
            </Button>
          )}

          {allDone && (
            <div style={{ background: '#fdf0ea', border: '1px solid #f5c4a8', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }} className="fade-in">
              <p style={{ fontSize: 28, marginBottom: 8 }}>🎉</p>
              <p className="font-title" style={{ fontSize: 16, color: '#d97757', marginBottom: 6 }}>{lesson.title.split(' — ')[0]} 完成！</p>
              <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 16 }}>你的语调越来越有英文味了！</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Button onClick={() => navigate('/course/intonation')}>查看全部课程</Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>返回首页</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IntonationLesson
