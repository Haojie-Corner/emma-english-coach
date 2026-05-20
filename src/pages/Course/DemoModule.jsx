import { useNavigate } from 'react-router-dom'
import { demoLessons } from '../../data/demo'
import Card from '../../components/ui/Card'
import useProgressStore from '../../store/progressStore'

const groups = [
  { name: '日常入门', ids: demoLessons.slice(0, 7).map(l => l.id), icon: '🌱' },
  { name: '职场进阶', ids: demoLessons.slice(7, 11).map(l => l.id), icon: '💼' },
  { name: '生活场景中级', ids: demoLessons.slice(11, 14).map(l => l.id), icon: '🏙️' },
  { name: '进阶表达', ids: demoLessons.slice(14).map(l => l.id), icon: '🚀' },
]

const difficultyColor = { '入门': '#788c5d', '初级': '#d97757', '中级': '#7a6bba', '进阶': '#c45c5c' }
const difficultyBg = { '入门': '#eaf2e3', '初级': '#fdf0ea', '中级': '#f0eeff', '进阶': '#fdeaea' }

const DemoModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/course')} className="flex items-center gap-1 text-sm text-[#b0aea5] hover:text-[#141413] mb-4 transition-colors">
        ← 课程中心
      </button>
      <h1 className="text-xl font-bold text-[#141413] mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        🎬 场景演绎 Demo
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">听示范 → 跟读录音 → AI 评分，练出地道英文语感 · 共 21 课</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {groups.map(group => {
          const groupLessons = group.ids.map(id => demoLessons.find(l => l.id === id)).filter(Boolean)
          const completedCount = groupLessons.filter(l => getLessonStatus(l.id) === 'completed').length

          return (
            <div key={group.name}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{group.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1917', fontFamily: 'Poppins, Arial, sans-serif' }}>{group.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#b0aea5' }}>{completedCount}/{groupLessons.length} 完成</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groupLessons.map((lesson, i) => {
                  const globalIndex = demoLessons.findIndex(l => l.id === lesson.id)
                  const prevLesson = globalIndex > 0 ? demoLessons[globalIndex - 1] : null
                  const locked = globalIndex > 0 && getLessonStatus(prevLesson.id) !== 'completed'
                  const status = getLessonStatus(lesson.id)

                  return (
                    <Card
                      key={lesson.id}
                      className={locked ? 'opacity-60' : ''}
                      onClick={() => !locked && navigate(`/course/demo/${lesson.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                          {locked ? '🔒' : status === 'completed' ? '✅' : status === 'in_progress' ? '▶' : '🎬'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1917' }}>{lesson.title}</p>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              color: difficultyColor[lesson.difficulty] || '#7a7870',
                              background: difficultyBg[lesson.difficulty] || '#f0ede4',
                            }}>{lesson.difficulty}</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#7a7870' }}>{lesson.subtitle} · {lesson.duration}</p>
                        </div>
                        {!locked && <span style={{ color: '#b0aea5' }}>›</span>}
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
  )
}

export default DemoModule
