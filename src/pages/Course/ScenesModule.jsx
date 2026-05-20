import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sceneCategories } from '../../data/scenes'
import Card from '../../components/ui/Card'

const difficultyColor = { '入门': '#788c5d', '初级': '#d97757', '中级': '#7a6bba', '进阶': '#c45c5c' }
const difficultyBg = { '入门': '#eaf2e3', '初级': '#fdf0ea', '中级': '#f0eeff', '进阶': '#fdeaea' }

const ScenesModule = () => {
  const navigate = useNavigate()
  const [openCategory, setOpenCategory] = useState(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/course')} className="flex items-center gap-1 text-sm text-[#b0aea5] hover:text-[#141413] mb-4 transition-colors">
        ← 课程中心
      </button>
      <h1 className="text-xl font-bold text-[#141413] mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        🎭 场景实战 Scenes
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">与 AI 角色扮演，练真实英语对话 · 8 大主题 · 46 个场景</p>

      <div className="space-y-3">
        {sceneCategories.map(category => {
          const isOpen = openCategory === category.id
          return (
            <div key={category.id}>
              <div
                onClick={() => setOpenCategory(isOpen ? null : category.id)}
                style={{
                  background: '#fff', border: `1.5px solid ${isOpen ? category.color : '#dedad0'}`,
                  borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: isOpen ? `0 4px 12px ${category.color}22` : 'none',
                }}
                onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.borderColor = category.color; e.currentTarget.style.boxShadow = `0 2px 8px ${category.color}20` } }}
                onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.borderColor = '#dedad0'; e.currentTarget.style.boxShadow = 'none' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{category.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#1a1917', fontFamily: 'Poppins, Arial, sans-serif' }}>{category.name}</p>
                      <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{category.description}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#b0aea5' }}>{category.scenes.length} 个场景</span>
                    <span style={{ color: '#b0aea5', fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ paddingLeft: 12, paddingRight: 4, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }} className="fade-in">
                  {category.scenes.map(scene => (
                    <Card
                      key={scene.id}
                      onClick={() => navigate(`/course/scenes/${scene.id}`)}
                      style={{ padding: '14px 16px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1917' }}>{scene.title}</p>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              color: difficultyColor[scene.difficulty] || '#7a7870',
                              background: difficultyBg[scene.difficulty] || '#f0ede4',
                            }}>{scene.difficulty}</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#7a7870' }}>{scene.subtitle}</p>
                          <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 4 }}>👤 你的角色：{scene.role} · ⏱ {scene.duration}</p>
                        </div>
                        <span style={{ color: '#b0aea5', fontSize: 18 }}>›</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ScenesModule
