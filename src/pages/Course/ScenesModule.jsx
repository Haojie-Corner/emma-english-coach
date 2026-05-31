import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { sceneCategories } from '../../data/scenes'
import Card from '../../components/ui/Card'
import ModuleLockGate from '../../components/ui/ModuleLockGate'
import useProgressStore from '../../store/progressStore'

const difficultyColor = { '入门': '#5a8c4a', '初级': '#e8672a', '中级': '#7b5ea7', '进阶': '#d94040' }
const difficultyBg = { '入门': '#eaf5ef', '初级': '#fff3ee', '中级': '#f3eeff', '进阶': '#fdf0f0' }

const ScenesModule = () => {
  const navigate = useNavigate()
  const { progress } = useProgressStore()
  const [openCategory, setOpenCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const isSceneCompleted = (sceneId) => {
    return progress.some(p => p.lesson_id === sceneId && p.status === 'completed')
  }

  const recentlyPracticed = useMemo(() => {
    const completedIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.lesson_id))
    const allScenes = sceneCategories.flatMap(cat => cat.scenes.map(s => ({ ...s, categoryName: cat.name, categoryColor: cat.color })))
    return allScenes.filter(s => completedIds.has(s.id)).slice(0, 3)
  }, [progress])

  const filteredScenes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null
    return sceneCategories.flatMap(cat => cat.scenes.map(s => ({ ...s, categoryName: cat.name, categoryColor: cat.color }))).filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.subtitle || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q)
    )
  }, [searchQuery])

  return (
    <ModuleLockGate moduleId="scenes">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        <button
          onClick={() => navigate('/course')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f0e0c'}
          onMouseLeave={e => e.currentTarget.style.color = '#9e998e'}
        >← 课程中心</button>

        <div style={{ marginBottom: 20 }}>
          <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>
            🎭 场景实战 Scenes
          </h1>
          <p style={{ fontSize: 13, color: '#9e998e' }}>与 AI 角色扮演，练真实英语对话 · 10 大主题 · 100 个场景</p>
        </div>

        {/* 最近练习 */}
        {recentlyPracticed.length > 0 && !searchQuery && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9e998e', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>最近练习</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recentlyPracticed.map(scene => (
                <button key={scene.id} onClick={() => navigate(`/course/scenes/${scene.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
                  fontSize: 12, color: '#5c5850', fontFamily: 'inherit',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}>
                  <span style={{ color: scene.categoryColor, fontWeight: 800, fontSize: 10 }}>✓</span>
                  {scene.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索框 */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9e998e', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索场景标题、角色、描述…"
            style={{
              width: '100%', padding: '11px 40px 11px 40px', borderRadius: 14,
              border: '1.5px solid #e5e1d8', background: '#fff', fontSize: 14,
              color: '#0f0e0c', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#e8672a'}
            onBlur={e => e.target.style.borderColor = '#e5e1d8'}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: '#f5f3ef', border: 'none', cursor: 'pointer', fontSize: 14,
              color: '#9e998e', padding: '2px 6px', borderRadius: 6,
            }}>×</button>
          )}
        </div>

        {/* 搜索结果 */}
        {filteredScenes !== null && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#5c5850', marginBottom: 12 }}>
              找到 <strong style={{ color: '#e8672a' }}>{filteredScenes.length}</strong> 个场景
            </p>
            {filteredScenes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9e998e', fontSize: 13 }}>
                没有找到匹配的场景，试试其他关键词
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredScenes.map(scene => {
                  const completed = isSceneCompleted(scene.id)
                  return (
                    <Card key={scene.id} onClick={() => navigate(`/course/scenes/${scene.id}`)} style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {completed && (
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: '#edf8f2', border: '1.5px solid #b5e0c8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: '#3a9a5f',
                          }}>✓</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f0e0c' }}>{scene.title}</p>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                              color: difficultyColor[scene.difficulty] || '#9e998e',
                              background: difficultyBg[scene.difficulty] || '#f5f3ef',
                            }}>{scene.difficulty}</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#5c5850' }}>{scene.subtitle}</p>
                          <p style={{ fontSize: 11, color: '#9e998e', marginTop: 3 }}>
                            <span style={{ color: scene.categoryColor, fontWeight: 700 }}>{scene.categoryName}</span>
                            {' · '}👤 {scene.role} · ⏱ {scene.duration}
                          </p>
                        </div>
                        <span style={{ color: '#c0bdb8', fontSize: 18, flexShrink: 0 }}>›</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 分类 Accordion */}
        {filteredScenes === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sceneCategories.map(category => {
              const isOpen = openCategory === category.id
              const completedCount = category.scenes.filter(s => isSceneCompleted(s.id)).length
              const pct = Math.round((completedCount / category.scenes.length) * 100)
              return (
                <div key={category.id}>
                  <div
                    onClick={() => setOpenCategory(isOpen ? null : category.id)}
                    style={{
                      background: '#fff',
                      border: `1.5px solid ${isOpen ? category.color : 'rgba(0,0,0,0.07)'}`,
                      borderRadius: 18, padding: '16px 20px', cursor: 'pointer',
                      transition: 'all 0.18s',
                      boxShadow: isOpen ? `0 4px 16px ${category.color}22` : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.borderColor = category.color; e.currentTarget.style.boxShadow = `0 4px 12px ${category.color}18` } }}
                    onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                          background: `${category.color}14`,
                          border: `1.5px solid ${category.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        }}>{category.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="font-title" style={{ fontWeight: 700, fontSize: 15, color: '#0f0e0c' }}>{category.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <div style={{ flex: 1, height: 4, background: '#f0ede6', borderRadius: 4, overflow: 'hidden', maxWidth: 100 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: category.color, borderRadius: 4, transition: 'width 0.6s' }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#9e998e', whiteSpace: 'nowrap' }}>
                              {completedCount}/{category.scenes.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        {completedCount === category.scenes.length && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#3a9a5f', background: '#edf8f2', borderRadius: 20, padding: '2px 8px' }}>全完成</span>
                        )}
                        <span style={{ color: '#9e998e', fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ paddingLeft: 12, paddingRight: 4, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }} className="fade-in">
                      {category.scenes.map(scene => {
                        const completed = isSceneCompleted(scene.id)
                        return (
                          <Card
                            key={scene.id}
                            onClick={() => navigate(`/course/scenes/${scene.id}`)}
                            style={{ padding: '14px 16px', background: completed ? '#fcfffe' : '#fff' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: completed ? '#edf8f2' : `${category.color}14`,
                                border: `1.5px solid ${completed ? '#b5e0c8' : `${category.color}30`}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 800,
                                color: completed ? '#3a9a5f' : category.color,
                              }}>
                                {completed ? '✓' : '▶'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f0e0c' }}>{scene.title}</p>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                    color: difficultyColor[scene.difficulty] || '#9e998e',
                                    background: difficultyBg[scene.difficulty] || '#f5f3ef',
                                  }}>{scene.difficulty}</span>
                                </div>
                                <p style={{ fontSize: 12, color: '#5c5850' }}>{scene.subtitle}</p>
                                <p style={{ fontSize: 11, color: '#9e998e', marginTop: 4 }}>👤 你的角色：{scene.role} · ⏱ {scene.duration}</p>
                              </div>
                              <span style={{ color: '#c0bdb8', fontSize: 18, flexShrink: 0 }}>›</span>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ModuleLockGate>
  )
}

export default ScenesModule
