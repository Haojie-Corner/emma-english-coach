import { useNavigate } from 'react-router-dom'
import { modules } from '../../data/phonics'
import Card from '../../components/ui/Card'
import useProgressStore from '../../store/progressStore'

const CourseOverview = () => {
  const navigate = useNavigate()
  const { getModuleCompletion } = useProgressStore()

  const routeMap = {
    phonics: '/course/phonics',
    intonation: '/course/intonation',
    scenes: '/course/scenes',
    mindset: '/course/mindset',
    demo: '/course/demo',
    tech: '/course/tech',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#141413] mb-2" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        课程中心
      </h1>
      <p className="text-sm text-[#b0aea5] mb-8">从发音地基到自如交流，7个模块系统进阶</p>

      <div className="space-y-3">
        {modules.map((mod, index) => {
          const pct = getModuleCompletion(mod.id)
          const isLocked = index > 0 && getModuleCompletion(modules[index - 1].id) < 30

          return (
            <Card
              key={mod.id}
              className={isLocked ? 'opacity-60' : ''}
              onClick={() => !isLocked && navigate(routeMap[mod.id] || '#')}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{mod.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
                      {mod.name}
                    </p>
                    <span className="text-xs text-[#b0aea5]">{mod.nameEn}</span>
                    {isLocked && <span className="text-xs bg-[#f0ede4] text-[#b0aea5] px-2 py-0.5 rounded-full">🔒 未解锁</span>}
                  </div>
                  <p className="text-xs text-[#b0aea5] mb-2">{mod.totalLessons} 节课</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#e8e6dc] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: mod.color }}
                      />
                    </div>
                    <span className="text-xs text-[#b0aea5] whitespace-nowrap">{pct}%</span>
                  </div>
                </div>
                <span className="text-[#b0aea5]">›</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default CourseOverview
