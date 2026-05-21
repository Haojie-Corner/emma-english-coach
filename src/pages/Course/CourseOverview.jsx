import { useNavigate } from 'react-router-dom'
import { modules } from '../../data/phonics'
import useProgressStore from '../../store/progressStore'

const routeMap = {
  phonics:    '/course/phonics',
  intonation: '/course/intonation',
  scenes:     '/course/scenes',
  mindset:    '/course/mindset',
  demo:       '/course/demo',
  fluency:    '/course/fluency',
  tech:       '/course/tech',
}

const CourseOverview = () => {
  const navigate = useNavigate()
  const { getModuleCompletion, isModuleUnlocked } = useProgressStore()

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>

      {/* ── 标题 ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-title" style={{ fontSize: 24, color: '#1a1917', marginBottom: 4 }}>
          课程中心
        </h1>
        <p style={{ fontSize: 13, color: '#a09b95' }}>
          按顺序解锁 · 完成前置课程后自动开放下一关
        </p>
      </div>

      {/* ── 路径卡片列表 ── */}
      <div>
        {modules.map((mod, idx) => {
          const pct = getModuleCompletion(mod.id, mod.totalLessons)
          const unlocked = isModuleUnlocked(mod.id)
          const reqMod = mod.requires ? modules.find(m => m.id === mod.requires.moduleId) : null
          const reqPct = reqMod ? getModuleCompletion(reqMod.id, reqMod.totalLessons) : 0
          const isLast = idx === modules.length - 1

          return (
            <div key={mod.id} style={{ display: 'flex', gap: 0 }}>

              {/* ── 左侧路径线 ── */}
              <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {/* 上方连接线（第一个不需要） */}
                {idx > 0 && (
                  <div style={{ width: 2, height: 16, background: '#e8e4dc' }} />
                )}
                {/* 节点圆点 */}
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  background: pct === 100 ? mod.color : unlocked ? '#fff' : '#e8e4dc',
                  border: `2.5px solid ${unlocked ? mod.color : '#d8d4cc'}`,
                  zIndex: 1,
                  marginTop: idx === 0 ? 16 : 0,
                  transition: 'background 0.3s, border-color 0.3s',
                }} />
                {/* 下方连接线（最后一个不需要） */}
                {!isLast && (
                  <div style={{ flex: 1, width: 2, background: '#e8e4dc', minHeight: 24 }} />
                )}
              </div>

              {/* ── 右侧模块卡片 ── */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10, paddingTop: idx === 0 ? 10 : 2 }}>
                <div
                  onClick={() => unlocked && navigate(routeMap[mod.id] || '#')}
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${unlocked ? '#e8e4dc' : '#ede9e0'}`,
                    borderRadius: 16,
                    padding: '16px 18px',
                    cursor: unlocked ? 'pointer' : 'default',
                    opacity: unlocked ? 1 : 0.72,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { if (unlocked) { e.currentTarget.style.borderColor = mod.color; e.currentTarget.style.boxShadow = `0 4px 18px ${mod.color}20` } }}
                  onMouseLeave={e => { if (unlocked) { e.currentTarget.style.borderColor = '#e8e4dc'; e.currentTarget.style.boxShadow = 'none' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

                    {/* 图标 */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: unlocked ? `${mod.color}16` : '#f5f3ee',
                      border: `1.5px solid ${unlocked ? mod.color + '35' : '#e8e4dc'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {unlocked ? mod.icon : '🔒'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span className="font-title" style={{ fontSize: 15, color: '#1a1917' }}>
                          {mod.name}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: unlocked ? mod.color : '#b0aea5',
                          background: unlocked ? `${mod.color}14` : '#f5f3ee',
                          padding: '2px 8px', borderRadius: 20,
                        }}>
                          {mod.levelTag}
                        </span>
                        {!unlocked && (
                          <span style={{ fontSize: 10, color: '#b0aea5', background: '#f5f3ee', padding: '2px 8px', borderRadius: 20 }}>
                            未解锁
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: '#a09b95', marginBottom: 8, lineHeight: 1.4 }}>{mod.desc}</p>

                      {/* 已解锁进度条 */}
                      {unlocked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: '#ece9e0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: mod.color, transition: 'width 0.8s ease-out' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#a09b95', whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>
                            {pct}% · {mod.totalLessons}课
                          </span>
                        </div>
                      )}

                      {/* 未解锁：解锁进度 */}
                      {!unlocked && mod.requires && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ flex: 1, height: 5, background: '#ece9e0', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                              <div style={{ height: '100%', borderRadius: 3, width: `${reqPct}%`, background: reqMod.color, transition: 'width 0.8s' }} />
                              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mod.requires.pct}%`, width: 2, background: '#1a1917', opacity: 0.2 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#b0aea5', whiteSpace: 'nowrap' }}>
                              {reqPct}% / {mod.requires.pct}%
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: '#b0aea5' }}>
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
