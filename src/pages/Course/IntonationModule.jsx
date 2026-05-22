import { useNavigate } from 'react-router-dom'
import { intonationLessons } from '../../data/intonation'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const statusConfig = {
  completed: { icon: '✓', color: '#3a9a5f', bg: '#eaf5ef' },
  in_progress: { icon: '▶', color: '#e8672a', bg: '#fff3ee' },
  locked: { icon: '○', color: '#9e998e', bg: '#f5f3ef' },
}

const IntonationModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  return (
    <ModuleLockGate moduleId="intonation">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        <button
          onClick={() => navigate('/course')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f0e0c'}
          onMouseLeave={e => e.currentTarget.style.color = '#9e998e'}
        >← 课程中心</button>

        <div style={{ marginBottom: 24 }}>
          <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>
            🎵 语音语调 Intonation
          </h1>
          <p style={{ fontSize: 13, color: '#9e998e' }}>重音、节奏、连读、语调 — 说出真正的英文感觉 · 共 11 课</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {intonationLessons.map((lesson, i) => {
            const status = i === 0 ? (getLessonStatus(lesson.id) || 'in_progress') : getLessonStatus(lesson.id)
            const locked = i > 0 && getLessonStatus(intonationLessons[i - 1].id) !== 'completed'
            const cfg = statusConfig[locked ? 'locked' : status] || statusConfig.locked

            return (
              <Card
                key={lesson.id}
                onClick={() => !locked && navigate(`/course/intonation/${lesson.id}`)}
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
                  {!locked && <span style={{ color: '#c0bdb8', fontSize: 18, flexShrink: 0 }}>›</span>}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </ModuleLockGate>
  )
}

export default IntonationModule
