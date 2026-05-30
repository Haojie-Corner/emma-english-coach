import { useNavigate } from 'react-router-dom'
import { demoLessons } from '../../data/demo'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const groups = [
  { name: '日常入门', ids: demoLessons.slice(0, 7).map(l => l.id), icon: '🌱' },
  { name: '职场进阶', ids: demoLessons.slice(7, 11).map(l => l.id), icon: '💼' },
  { name: '生活场景中级', ids: demoLessons.slice(11, 14).map(l => l.id), icon: '🏙️' },
  { name: '进阶表达', ids: demoLessons.slice(14).map(l => l.id), icon: '🚀' },
]

const difficultyColor = { '入门': '#5a8c4a', '初级': '#e8672a', '中级': '#7b5ea7', '进阶': '#d94040' }
const difficultyBg = { '入门': '#eaf5ef', '初级': '#fff3ee', '中级': '#f3eeff', '进阶': '#fdf0f0' }

const DemoModule = () => {
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
    <ModuleLockGate moduleId="demo">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        <button
          onClick={() => navigate('/course')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f0e0c'}
          onMouseLeave={e => e.currentTarget.style.color = '#9e998e'}
        >← 课程中心</button>

        <div style={{ marginBottom: 24 }}>
          <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>
            🎬 场景演绎 Demo
          </h1>
          <p style={{ fontSize: 13, color: '#9e998e' }}>听示范 → 跟读录音 → AI 评分，练出地道英文语感 · 共 21 课</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {groups.map(group => {
            const groupLessons = group.ids.map(id => demoLessons.find(l => l.id === id)).filter(Boolean)
            const completedCount = groupLessons.filter(l => getLessonStatus(l.id) === 'completed').length

            return (
              <div key={group.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: '#fdf7f0', border: '1px solid #f5c4a8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{group.icon}</span>
                    <span className="font-title" style={{ fontWeight: 700, fontSize: 15, color: '#0f0e0c' }}>{group.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#9e998e', background: '#f5f3ef', padding: '3px 10px', borderRadius: 20 }}>
                    {completedCount}/{groupLessons.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupLessons.map((lesson) => {
                    const globalIndex = demoLessons.findIndex(l => l.id === lesson.id)
                    const prevLesson = globalIndex > 0 ? demoLessons[globalIndex - 1] : null
                    const locked = globalIndex > 0 && getLessonStatus(prevLesson.id) !== 'completed'
                    const status = getLessonStatus(lesson.id)

                    return (
                      <Card
                        key={lesson.id}
                        onClick={() => !locked && navigate(`/course/demo/${lesson.id}`)}
                        style={{ opacity: locked ? 0.6 : 1, padding: '14px 16px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: status === 'completed' ? '#eaf5ef' : locked ? '#f5f3ef' : '#fff3ee',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800,
                            color: status === 'completed' ? '#3a9a5f' : locked ? '#9e998e' : '#e8672a',
                          }}>
                            {locked ? '🔒' : status === 'completed' ? '✓' : '▶'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                              <p style={{ fontWeight: 700, fontSize: 14, color: '#0f0e0c' }}>{lesson.title}</p>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                color: difficultyColor[lesson.difficulty] || '#9e998e',
                                background: difficultyBg[lesson.difficulty] || '#f5f3ef',
                              }}>{lesson.difficulty}</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#9e998e' }}>{lesson.subtitle} · {lesson.duration}</p>
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
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModuleLockGate>
  )
}

export default DemoModule
