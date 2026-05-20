import { useNavigate } from 'react-router-dom'
import { modules } from '../../data/phonics'
import useProgressStore from '../../store/progressStore'

const routeMap = {
  phonics: '/course/phonics',
  intonation: '/course/intonation',
  scenes: '/course/scenes',
  mindset: '/course/mindset',
  demo: '/course/demo',
  tech: '/course/tech',
}

const CourseOverview = () => {
  const navigate = useNavigate()
  const { getModuleCompletion, isModuleUnlocked } = useProgressStore()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
      <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917', marginBottom: 4 }}>课程中心</h1>
      <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 28 }}>
        体系化学习路径 · 完成前置课程后自动解锁下一关
      </p>

      {/* 路径示意 */}
      <div style={{
        background: 'linear-gradient(135deg, #fdf0ea, #fff)', border: '1px solid #f5c4a8',
        borderRadius: 14, padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, color: '#7a7870' }}>学习路径：</span>
        {modules.filter(m => m.requires !== null || m.id === 'phonics').map((mod, i, arr) => (
          <span key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: isModuleUnlocked(mod.id) ? '#d97757' : '#b0aea5' }}>
              {mod.icon} {mod.name}
            </span>
            {i < arr.length - 1 && <span style={{ color: '#dedad0', fontSize: 14 }}>→</span>}
          </span>
        ))}
        <span style={{ fontSize: 12, color: '#b0aea5', marginLeft: 4 }}>
          ···
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modules.map((mod) => {
          const pct = getModuleCompletion(mod.id, mod.totalLessons)
          const unlocked = isModuleUnlocked(mod.id)
          const reqMod = mod.requires ? modules.find(m => m.id === mod.requires.moduleId) : null
          const reqPct = reqMod ? getModuleCompletion(reqMod.id, reqMod.totalLessons) : 0

          return (
            <div
              key={mod.id}
              onClick={() => unlocked && navigate(routeMap[mod.id] || '#')}
              style={{
                background: '#fff',
                border: `1.5px solid ${unlocked ? '#dedad0' : '#ece9e0'}`,
                borderRadius: 16,
                padding: '18px 20px',
                cursor: unlocked ? 'pointer' : 'default',
                opacity: unlocked ? 1 : 0.7,
                transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => { if (unlocked) { e.currentTarget.style.boxShadow = `0 4px 16px ${mod.color}22`; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = mod.color } }}
              onMouseLeave={e => { if (unlocked) { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#dedad0' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* 图标 */}
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: unlocked ? `${mod.color}18` : '#f5f3ee',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  border: `1.5px solid ${unlocked ? mod.color + '40' : '#ece9e0'}`,
                }}>
                  {unlocked ? mod.icon : '🔒'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span className="font-title" style={{ fontSize: 15, color: '#1a1917' }}>
                      {mod.name}
                    </span>
                    <span style={{ fontSize: 10, color: unlocked ? mod.color : '#b0aea5', background: unlocked ? `${mod.color}18` : '#f5f3ee', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      {mod.levelTag}
                    </span>
                    {!unlocked && (
                      <span style={{ fontSize: 10, color: '#b0aea5', background: '#f5f3ee', padding: '2px 8px', borderRadius: 20 }}>
                        🔒 未解锁
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 8 }}>{mod.desc}</p>

                  {/* 已解锁：显示本模块完成进度 */}
                  {unlocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: '#ece9e0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: mod.color, transition: 'width 0.8s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#b0aea5', whiteSpace: 'nowrap' }}>
                        {pct}% · {mod.totalLessons}课
                      </span>
                    </div>
                  )}

                  {/* 未解锁：显示解锁进度 */}
                  {!unlocked && mod.requires && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ flex: 1, height: 5, background: '#ece9e0', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${reqPct}%`, background: reqMod.color, transition: 'width 0.8s',
                          }} />
                          <div style={{
                            position: 'absolute', top: 0, bottom: 0,
                            left: `${mod.requires.pct}%`, width: 2,
                            background: '#1a1917', opacity: 0.2,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#b0aea5', whiteSpace: 'nowrap' }}>
                          {reqPct}% / {mod.requires.pct}%
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#b0aea5' }}>
                        需先完成：{reqMod.icon} {mod.requires.label}
                      </p>
                    </div>
                  )}
                </div>

                {unlocked && <span style={{ color: '#b0aea5', fontSize: 18 }}>›</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseOverview
