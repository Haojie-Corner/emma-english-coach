import { useNavigate } from 'react-router-dom'
import { phonicsLessons } from '../../data/phonics'
import Card from '../../components/ui/Card'
import useProgressStore from '../../store/progressStore'

const PhonicsModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  const statusIcon = { completed: '✅', in_progress: '▶', locked: '🔒' }
  const statusColor = { completed: 'text-[#788c5d]', in_progress: 'text-[#d97757]', locked: 'text-[#b0aea5]' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/course')} className="flex items-center gap-1 text-sm text-[#b0aea5] hover:text-[#141413] mb-4 transition-colors">
        ← 课程中心
      </button>
      <h1 className="text-xl font-bold text-[#141413] mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        🔤 自然拼读 Phonics
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">看到单词就能读出来，不靠死记硬背 · 共 22 课</p>

      <div className="space-y-3">
        {phonicsLessons.map((lesson, i) => {
          const status = i === 0 ? (getLessonStatus(lesson.id) || 'in_progress') : getLessonStatus(lesson.id)
          const locked = i > 0 && getLessonStatus(phonicsLessons[i - 1].id) !== 'completed'

          return (
            <Card
              key={lesson.id}
              className={locked ? 'opacity-60' : ''}
              onClick={() => !locked && navigate(`/course/phonics/${lesson.id}`)}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xl ${statusColor[locked ? 'locked' : status]}`}>
                  {statusIcon[locked ? 'locked' : status]}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
                    {lesson.title}
                  </p>
                  <p className="text-xs text-[#b0aea5]">{lesson.subtitle}</p>
                </div>
                {!locked && <span className="text-[#b0aea5]">›</span>}
              </div>
            </Card>
          )
        })}

        {/* 占位：未来的课程 */}
        {Array.from({ length: Math.max(0, 22 - phonicsLessons.length) }, (_, i) => (
          <Card key={`coming-${i}`} className="opacity-40">
            <div className="flex items-center gap-4">
              <span className="text-xl text-[#b0aea5]">🔒</span>
              <div>
                <p className="font-semibold text-sm text-[#b0aea5]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
                  Lesson {phonicsLessons.length + i + 1} — 即将推出
                </p>
                <p className="text-xs text-[#b0aea5]">敬请期待</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PhonicsModule
