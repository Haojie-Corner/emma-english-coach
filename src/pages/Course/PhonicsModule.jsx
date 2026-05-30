import { useNavigate } from 'react-router-dom'
import { phonicsLessons } from '../../data/phonics'
import Card from '../../components/ui/Card'
import useProgressStore from '../../store/progressStore'

const statusConfig = {
  completed: { icon: '✓', color: '#3a9a5f', bg: '#eaf5ef' },
  in_progress: { icon: '▶', color: '#e8672a', bg: '#fff3ee' },
  locked: { icon: '○', color: '#9e998e', bg: '#f5f3ef' },
}

const PhonicsModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  const getLessonScore = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.score ?? null
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
      <button
        onClick={() => navigate('/course')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
        onMouseEnter={e => e.currentTarget.style.color = '#0f0e0c'}
        onMouseLeave={e => e.currentTarget.style.color = '#9e998e'}
      >← 课程中心</button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>
          🔤 自然拼读 Phonics
        </h1>
        <p style={{ fontSize: 13, color: '#9e998e' }}>看到单词就能读出来，不靠死记硬背 · 共 22 课</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {phonicsLessons.map((lesson, i) => {
          const status = i === 0 ? (getLessonStatus(lesson.id) || 'in_progress') : getLessonStatus(lesson.id)
          const locked = i > 0 && getLessonStatus(phonicsLessons[i - 1].id) !== 'completed'
          const cfg = statusConfig[locked ? 'locked' : status] || statusConfig.locked

          return (
            <Card
              key={lesson.id}
              onClick={() => !locked && navigate(`/course/phonics/${lesson.id}`)}
              style={{ opacity: locked ? 0.6 : 1, padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: cfg.color,
                }}>
                  {locked ? '🔒' : cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f0e0c', marginBottom: 2 }}>{lesson.title}</p>
                  <p style={{ fontSize: 12, color: '#9e998e' }}>{lesson.subtitle}</p>
                </div>
                {status === 'completed' && getLessonScore(lesson.id) !== null && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, flexShrink: 0, borderRadius: 20, padding: '2px 8px',
                    color: getLessonScore(lesson.id) >= 80 ? '#3a9a5f' : '#e8672a',
                    background: getLessonScore(lesson.id) >= 80 ? '#edf8f2' : '#fff3ee',
                  }}>{getLessonScore(lesson.id)}</span>
                )}
                {!locked && <span style={{ color: '#c0bdb8', fontSize: 18, flexShrink: 0 }}>›</span>}
              </div>
            </Card>
          )
        })}

        {Array.from({ length: Math.max(0, 22 - phonicsLessons.length) }, (_, i) => (
          <div key={`coming-${i}`} style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 18, padding: '14px 16px', opacity: 0.35,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#9e998e' }}>Lesson {phonicsLessons.length + i + 1} — 即将推出</p>
                <p style={{ fontSize: 12, color: '#c0bdb8' }}>敬请期待</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PhonicsModule
