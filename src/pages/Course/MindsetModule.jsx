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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/course')} className="flex items-center gap-1 text-sm text-[#b0aea5] hover:text-[#141413] mb-4 transition-colors">
        ← 课程中心
      </button>
      <h1 className="text-xl font-bold text-[#141413] mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        🧠 认知重塑 Mindset
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">打破翻译思维，建立真正的英文直觉 · 6 个单元 · 共 30 课</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {Object.entries(units).map(([unitName, lessons]) => {
          const completedCount = lessons.filter(l => getLessonStatus(l.id) === 'completed').length
          return (
            <div key={unitName}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{unitIcons[unitName] || '📚'}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1917', fontFamily: 'Poppins, Arial, sans-serif' }}>{unitName}</span>
                </div>
                <span style={{ fontSize: 12, color: '#b0aea5' }}>{completedCount}/{lessons.length} 完成</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lessons.map((lesson, i) => {
                  const status = getLessonStatus(lesson.id)
                  const allLessonsInUnit = Object.values(units).flat()
                  const globalIndex = allLessonsInUnit.findIndex(l => l.id === lesson.id)
                  const prevLesson = globalIndex > 0 ? allLessonsInUnit[globalIndex - 1] : null
                  const locked = globalIndex > 0 && getLessonStatus(prevLesson.id) !== 'completed'

                  return (
                    <Card
                      key={lesson.id}
                      className={locked ? 'opacity-60' : ''}
                      onClick={() => !locked && navigate(`/course/mindset/${lesson.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                          {locked ? '🔒' : status === 'completed' ? '✅' : status === 'in_progress' ? '▶' : '⭕'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1917', fontFamily: 'Poppins, Arial, sans-serif' }}>{lesson.title}</p>
                          <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{lesson.subtitle}</p>
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
    </ModuleLockGate>
  )
}

export default MindsetModule
