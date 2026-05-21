import { useNavigate } from 'react-router-dom'
import { fluencyLessons } from '../../data/fluency'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const groups = [
  { name: '基础表达', ids: fluencyLessons.slice(0, 5).map(l => l.id), icon: '🌱', desc: '开口第一步' },
  { name: '日常沟通', ids: fluencyLessons.slice(5, 9).map(l => l.id), icon: '💬', desc: '流利交流' },
  { name: '进阶表达', ids: fluencyLessons.slice(9, 13).map(l => l.id), icon: '🎯', desc: '深度沟通' },
  { name: '综合演练', ids: fluencyLessons.slice(13).map(l => l.id), icon: '🚀', desc: '自如应对' },
]

const FluencyModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()

  const getLessonStatus = (lessonId) => {
    const p = progress.find(p => p.lesson_id === lessonId)
    return p?.status || 'locked'
  }

  const totalCompleted = fluencyLessons.filter(l => getLessonStatus(l.id) === 'completed').length

  return (
    <ModuleLockGate moduleId="fluency">
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/course')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
        onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
      >← 课程中心</button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917', marginBottom: 4 }}>
          🗣️ 自如交流 · Fluency
        </h1>
        <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 12 }}>
          AI 陪练开放对话，从小聊到辩论，练出真实交流能力 · 共 {fluencyLessons.length} 课
        </p>
        <div style={{ height: 6, background: '#ece9e0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, background: '#7a6bba',
            width: `${Math.round(totalCompleted / fluencyLessons.length * 100)}%`,
            transition: 'width 0.8s',
          }} />
        </div>
        <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 4 }}>
          {totalCompleted} / {fluencyLessons.length} 课已完成
        </p>
      </div>

      {/* 模块特色说明 */}
      <Card style={{ marginBottom: 24, background: '#f5f0ff', border: '1px solid #d0c0e8' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#7a6bba', marginBottom: 8 }}>💡 自如交流的学习方式</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['每课有关键短语 + 常见错误分析', 'AI 扮演不同角色陪你开放对话', '无固定剧本，模拟真实对话场景', '完成对话后 AI 给出语言反馈'].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#7a6bba', fontWeight: 700 }}>0{i + 1}</span>
              <span style={{ fontSize: 12, color: '#6b5ba6' }}>{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {groups.map(group => {
          const groupLessons = group.ids.map(id => fluencyLessons.find(l => l.id === id)).filter(Boolean)
          const completedCount = groupLessons.filter(l => getLessonStatus(l.id) === 'completed').length

          return (
            <div key={group.name}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{group.icon}</span>
                  <div>
                    <span className="font-title" style={{ fontWeight: 700, fontSize: 15, color: '#1a1917' }}>{group.name}</span>
                    <span style={{ fontSize: 12, color: '#9b7ec8', marginLeft: 8 }}>{group.desc}</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#b0aea5' }}>{completedCount}/{groupLessons.length} 完成</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groupLessons.map((lesson, i) => {
                  const globalIndex = fluencyLessons.findIndex(l => l.id === lesson.id)
                  const prevLesson = globalIndex > 0 ? fluencyLessons[globalIndex - 1] : null
                  const locked = globalIndex > 0 && getLessonStatus(prevLesson?.id) !== 'completed'
                  const status = getLessonStatus(lesson.id)

                  return (
                    <Card key={lesson.id}
                      onClick={locked ? undefined : () => navigate(`/course/fluency/${lesson.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        opacity: locked ? 0.5 : 1,
                        cursor: locked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        background: status === 'completed' ? '#eaf2e3' : locked ? '#f5f3ee' : '#f5f0ff',
                        color: status === 'completed' ? '#5a7a3a' : locked ? '#b0aea5' : '#7a6bba',
                        fontWeight: 700,
                      }}>
                        {status === 'completed' ? '✓' : locked ? '🔒' : globalIndex + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="font-title" style={{
                          fontSize: 14, color: '#1a1917',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {lesson.title.replace(/^Lesson \d+ — /, '')}
                        </p>
                        <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{lesson.subtitle}</p>
                      </div>
                      {!locked && (
                        <span style={{ fontSize: 16, color: '#b0aea5', flexShrink: 0 }}>›</span>
                      )}
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

export default FluencyModule
