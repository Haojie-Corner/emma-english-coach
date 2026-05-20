import { useNavigate } from 'react-router-dom'
import { intonationLessons } from '../../data/intonation'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const IntonationModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  const statusIcon = { completed: '✅', in_progress: '▶', locked: '🔒' }
  const statusColor = { completed: 'text-[#788c5d]', in_progress: 'text-[#d97757]', locked: 'text-[#b0aea5]' }

  return (
    <ModuleLockGate moduleId="intonation">
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/course')} className="flex items-center gap-1 text-sm text-[#b0aea5] hover:text-[#141413] mb-4 transition-colors">
        ← 课程中心
      </button>
      <h1 className="text-xl font-bold text-[#141413] mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        🎵 语音语调 Intonation
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">重音、节奏、连读、语调 — 说出真正的英文感觉 · 共 11 课</p>

      <div className="space-y-3">
        {intonationLessons.map((lesson, i) => {
          const status = i === 0 ? (getLessonStatus(lesson.id) || 'in_progress') : getLessonStatus(lesson.id)
          const locked = i > 0 && getLessonStatus(intonationLessons[i - 1].id) !== 'completed'

          return (
            <Card
              key={lesson.id}
              className={locked ? 'opacity-60' : ''}
              onClick={() => !locked && navigate(`/course/intonation/${lesson.id}`)}
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
      </div>
    </div>
    </ModuleLockGate>
  )
}

export default IntonationModule
