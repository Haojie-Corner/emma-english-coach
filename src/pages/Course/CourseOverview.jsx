import { useNavigate } from 'react-router-dom'
import { modules } from '../../data/phonics'
import useProgressStore from '../../store/progressStore'

const routeMap = {
  phonics: '/course/phonics', intonation: '/course/intonation', scenes: '/course/scenes',
  mindset: '/course/mindset', demo: '/course/demo', fluency: '/course/fluency', tech: '/course/tech',
}

const CourseOverview = () => {
  const navigate = useNavigate()
  const { getModuleCompletion, isModuleUnlocked } = useProgressStore()

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 6 }}>
          课程中心
        </h1>
        <p style={{ fontSize: 13, color: '#9e998e' }}>
          按顺序解锁 · 完成前置课程后自动开放下一关
        </p>
      </div>

      {/* Path list */}
      <div>
        {modules.map((mod, idx) => {
          const pct = getModuleCompletion(mod.id, mod.totalLessons)
          const unlocked = isModuleUnlocked(mod.id)
          const reqMod = mod.requires ? modules.find(m => m.id === mod.requires.moduleId) : null
          const reqPct = reqMod ? getModuleCompletion(reqMod.id, reqMod.totalLessons) : 0
          const isLast = idx === modules.length - 1

          return (
            <div key={mod.id} style={{ display: 'flex', gap: 0 }}>

              {/* Left path line */}
              <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {idx > 0 && <div style={{ width: 2, height: 18, background: '#e5e1d8' }} />}
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: pct === 100 ? mod.color : unlocked ? '#fff' : '#e5e1d8',
                  border: `2.5px solid ${unlocked ? mod.color : '#d5d1c8'}`,
                  marginTop: idx === 0 ? 16 : 0,
                  boxShadow: unlocked && pct > 0 ? `0 0 0 3px ${mod.color}20` : 'none',
                  transition: 'all 0.3s',
                }} />
                {!isLast && <div style={{ flex: 1, width: 2, background: '#e5e1d8', minHeight: 28 }} />}
              </div>

              {/* Module card */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10, paddingTop: idx === 0 ? 10 : 2 }}>
                <div
                  onClick={() => unlocked && navigate(routeMap[mod.id] || '#')}
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${unlocked ? 'rgba(0,0,0,0.07)' : '#ede9e1'}`,
                    borderRadius: 18,
                    padding: '18px 18px',
                    cursor: unlocked ? 'pointer' : 'default',
                    opacity: unlocked ? 1 : 0.65,
                    transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.18s',
                    boxShadow: unlocked ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (unlocked) {
                      e.currentTarget.style.borderColor = mod.color
                      e.currentTarget.style.boxShadow = `0 6px 22px ${mod.color}22`
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (unlocked) {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      background: unlocked ? `${mod.color}16` : '#f0ede6',
                      border: `1.5px solid ${unlocked ? mod.color + '30' : '#e5e1d8'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24,
                    }}>
                      {unlocked ? mod.icon : '🔒'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="font-title" style={{ fontSize: 15.5, color: '#0f0e0c' }}>
                          {mod.name}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                          color: unlocked ? mod.color : '#9e998e',
                          background: unlocked ? `${mod.color}14` : '#f5f3ef',
                        }}>
                          {mod.levelTag}
                        </span>
                        {!unlocked && (
                          <span style={{ fontSize: 10, color: '#9e998e', background: '#f5f3ef', padding: '2px 8px', borderRadius: 20 }}>
                            未解锁
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 10, lineHeight: 1.5 }}>{mod.desc}</p>

                      {/* Unlocked progress */}
                      {unlocked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 5, background: '#f0ede6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: mod.color, transition: 'width 0.8s ease-out' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#9e998e', whiteSpace: 'nowrap' }}>
                            {pct}% · {mod.totalLessons}课
                          </span>
                        </div>
                      )}

                      {/* Locked unlock progress */}
                      {!unlocked && mod.requires && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ flex: 1, height: 5, background: '#f0ede6', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                              <div style={{ height: '100%', borderRadius: 3, width: `${reqPct}%`, background: reqMod.color, transition: 'width 0.8s' }} />
                              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mod.requires.pct}%`, width: 2, background: '#0f0e0c', opacity: 0.15 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#9e998e', whiteSpace: 'nowrap' }}>
                              {reqPct}% / {mod.requires.pct}%
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: '#9e998e' }}>
                            需先完成：{reqMod?.icon} {mod.requires.label}
                          </p>
                        </div>
                      )}
                    </div>

                    {unlocked && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M9 18L15 12L9 6" stroke="#c0bdb8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseOverview
