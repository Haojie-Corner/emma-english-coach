import { useNavigate } from 'react-router-dom'
import { getMindsetUnits } from '../../data/mindset'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const unitIcons = {
  '思维方式': '🧠',
  '打破中式英语': '🔄',
  '表达方式升级': '⬆️',
  '思维表达进阶': '🚀',
  '文化与语境': '🌍',
  '综合实战思维': '🏆',
}

const MindsetModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()
  const units = getMindsetUnits()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  return (
    <ModuleLockGate moduleId="mindset">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        <button
          onClick={() => navigate('/course')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f0e0c'}
          onMouseLeave={e => e.currentTarget.style.color = '#9e998e'}
        >← 课程中心</button>

        <div style={{ marginBottom: 24 }}>
          <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>
            🧠 认知重塑 Mindset
          </h1>
          <p style={{ fontSize: 13, color: '#9e998e' }}>打破翻译思维，建立真正的英文直觉 · 6 个单元 · 共 30 课</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {Object.entries(units).map(([unitName, lessons]) => {
            const completedCount = lessons.filter(l => getLessonStatus(l.id) === 'completed').length
            return (
              <div key={unitName}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: '#f3eeff', border: '1px solid #d5c5f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{unitIcons[unitName] || '📚'}</span>
                    <span className="font-title" style={{ fontWeight: 700, fontSize: 15, color: '#0f0e0c' }}>{unitName}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#9e998e', background: '#f5f3ef', padding: '3px 10px', borderRadius: 20 }}>
                    {completedCount}/{lessons.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lessons.map((lesson) => {
                    const status = getLessonStatus(lesson.id)
                    const allLessonsInUnit = Object.values(units).flat()
                    const globalIndex = allLessonsInUnit.findIndex(l => l.id === lesson.id)
                    const prevLesson = globalIndex > 0 ? allLessonsInUnit[globalIndex - 1] : null
                    const locked = globalIndex > 0 && getLessonStatus(prevLesson.id) !== 'completed'

                    return (
                      <Card
                        key={lesson.id}
                        onClick={() => !locked && navigate(`/course/mindset/${lesson.id}`)}
                        style={{ opacity: locked ? 0.6 : 1, padding: '14px 16px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: status === 'completed' ? '#eaf5ef' : locked ? '#f5f3ef' : '#f3eeff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: status === 'completed' ? 16 : 14,
                            fontWeight: 800,
                            color: status === 'completed' ? '#3a9a5f' : locked ? '#9e998e' : '#7b5ea7',
                          }}>
                            {locked ? '🔒' : status === 'completed' ? '✓' : status === 'in_progress' ? '▶' : '○'}
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
            )
          })}
        </div>
      </div>
    </ModuleLockGate>
  )
}

export default MindsetModule
