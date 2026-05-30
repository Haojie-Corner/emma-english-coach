import { useNavigate } from 'react-router-dom'
import { fluencyLessons } from '../../data/fluency'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const groups = [
  { name: '基础表达', ids: fluencyLessons.slice(0, 5).map(l => l.id), icon: '🌱', desc: '开口第一步' },
  { name: '日常沟通', ids: fluencyLessons.slice(5, 9).map(l => l.id), icon: '💬', desc: '流利交流' },
  { name: '进阶表达', ids: fluencyLessons.slice(9, 13).map(l => l.id), icon: '🎯', desc: '深度沟通' },
  { name: '综合演练', ids: fluencyLessons.slice(13, 18).map(l => l.id), icon: '🚀', desc: '自如应对' },
  { name: '高阶技巧', ids: fluencyLessons.slice(18).map(l => l.id), icon: '⚡', desc: 'Discourse · 修复 · 模糊策略' },
]

const FluencyModule = () => {
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

  const totalCompleted = fluencyLessons.filter(l => getLessonStatus(l.id) === 'completed').length
  const pct = Math.round(totalCompleted / fluencyLessons.length * 100)

  return (
    <ModuleLockGate moduleId="fluency">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        <button
          onClick={() => navigate('/course')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f0e0c'}
          onMouseLeave={e => e.currentTarget.style.color = '#9e998e'}
        >← 课程中心</button>

        <div style={{ marginBottom: 20 }}>
          <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>
            🗣️ 自如交流 · Fluency
          </h1>
          <p style={{ fontSize: 13, color: '#9e998e', marginBottom: 14 }}>
            AI 陪练开放对话，从小聊到辩论，练出真实交流能力 · 共 {fluencyLessons.length} 课
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: '#e5e1d8', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #9b72d0, #7b5ea7)',
                width: `${pct}%`, transition: 'width 0.8s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#9e998e', whiteSpace: 'nowrap' }}>
              {totalCompleted}/{fluencyLessons.length} 课
            </span>
          </div>
        </div>

        {/* 模块特色说明 */}
        <div style={{
          background: '#f3eeff', border: '1px solid #d5c5f0',
          borderRadius: 18, padding: '16px 18px', marginBottom: 24,
          boxShadow: '0 2px 8px rgba(123,94,167,0.08)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#7b5ea7', marginBottom: 10 }}>💡 自如交流的学习方式</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {['每课有关键短语 + 常见错误分析', 'AI 扮演不同角色陪你开放对话', '无固定剧本，模拟真实对话场景', '完成对话后 AI 给出语言反馈'].map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: '#fff',
                  background: 'linear-gradient(135deg, #9b72d0, #7b5ea7)',
                  borderRadius: 6, padding: '1px 6px', flexShrink: 0,
                }}>0{i + 1}</span>
                <span style={{ fontSize: 13, color: '#5c5850' }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {groups.map(group => {
            const groupLessons = group.ids.map(id => fluencyLessons.find(l => l.id === id)).filter(Boolean)
            const completedCount = groupLessons.filter(l => getLessonStatus(l.id) === 'completed').length

            return (
              <div key={group.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: '#f3eeff', border: '1px solid #d5c5f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{group.icon}</span>
                    <div>
                      <span className="font-title" style={{ fontWeight: 700, fontSize: 15, color: '#0f0e0c' }}>{group.name}</span>
                      <span style={{ fontSize: 12, color: '#7b5ea7', marginLeft: 8 }}>{group.desc}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#9e998e', background: '#f5f3ef', padding: '3px 10px', borderRadius: 20 }}>
                    {completedCount}/{groupLessons.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupLessons.map((lesson) => {
                    const globalIndex = fluencyLessons.findIndex(l => l.id === lesson.id)
                    const prevLesson = globalIndex > 0 ? fluencyLessons[globalIndex - 1] : null
                    const locked = globalIndex > 0 && getLessonStatus(prevLesson?.id) !== 'completed'
                    const status = getLessonStatus(lesson.id)

                    return (
                      <Card key={lesson.id}
                        onClick={locked ? undefined : () => navigate(`/course/fluency/${lesson.id}`)}
                        style={{ padding: '14px 16px', opacity: locked ? 0.5 : 1, cursor: locked ? 'not-allowed' : 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                            background: status === 'completed' ? '#eaf5ef' : locked ? '#f5f3ef' : '#f3eeff',
                            color: status === 'completed' ? '#3a9a5f' : locked ? '#9e998e' : '#7b5ea7',
                            fontWeight: 800,
                          }}>
                            {status === 'completed' ? '✓' : locked ? '🔒' : globalIndex + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="font-title" style={{
                              fontSize: 14, color: '#0f0e0c', fontWeight: 700,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {lesson.title.replace(/^Lesson \d+ — /, '')}
                            </p>
                            <p style={{ fontSize: 12, color: '#9e998e', marginTop: 2 }}>{lesson.subtitle}</p>
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

export default FluencyModule
