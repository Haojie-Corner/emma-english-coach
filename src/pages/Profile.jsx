import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { modules } from '../data/phonics'

const Profile = () => {
  const { user, logout } = useUserStore()
  const { streak, progress, getModuleCompletion } = useProgressStore()
  const navigate = useNavigate()

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  const totalCompleted = progress.filter(p => p.status === 'completed').length
  const totalAttempted = progress.length
  const avgScore = progress.filter(p => p.score).length > 0
    ? Math.round(progress.filter(p => p.score).reduce((sum, p) => sum + p.score, 0) / progress.filter(p => p.score).length)
    : 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const statItems = [
    { label: '完成课程', value: totalCompleted, unit: '节', color: '#788c5d', bg: '#eaf2e3' },
    { label: '练习记录', value: totalAttempted, unit: '次', color: '#6a9bcc', bg: '#e8f2fc' },
    { label: '平均得分', value: avgScore || '--', unit: avgScore ? '分' : '', color: '#d97757', bg: '#fdf0ea' },
    { label: '连续打卡', value: streak, unit: '天', color: '#c4a35a', bg: '#fdf6e3' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#141413] mb-6" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        👤 个人中心
      </h1>

      {/* 用户信息 */}
      <Card className="mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d97757, #c05e3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 700,
            fontFamily: 'Poppins, Arial, sans-serif', flexShrink: 0,
          }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#1a1917', fontFamily: 'Poppins, Arial, sans-serif' }}>{displayName}</p>
            <p style={{ fontSize: 12, color: '#b0aea5', marginTop: 2 }}>{user?.email}</p>
            <p style={{ fontSize: 11, color: '#7a7870', marginTop: 4 }}>
              🔥 连续打卡 <span style={{ color: '#d97757', fontWeight: 700 }}>{streak}</span> 天
            </p>
          </div>
        </div>
      </Card>

      {/* 学习统计 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10, fontFamily: 'Poppins, Arial, sans-serif' }}>
        学习统计
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {statItems.map(item => (
          <div key={item.label} style={{
            background: item.bg,
            border: `1px solid ${item.color}30`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: 'Poppins, Arial, sans-serif' }}>
              {item.value}<span style={{ fontSize: 12, fontWeight: 500 }}>{item.unit}</span>
            </p>
            <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* 各模块进度 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10, fontFamily: 'Poppins, Arial, sans-serif' }}>
        模块进度
      </h2>
      <Card className="mb-6" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modules.map(mod => {
            const pct = getModuleCompletion(mod.id, mod.totalLessons)
            const completed = progress.filter(p => p.module_id === mod.id && p.status === 'completed').length
            return (
              <div key={mod.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: '#1a1917' }}>{mod.icon} {mod.name}</span>
                  <span style={{ fontSize: 12, color: '#7a7870' }}>{completed}/{mod.totalLessons}</span>
                </div>
                <div style={{ height: 6, background: '#ece9e0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${pct}%`,
                    background: mod.color, transition: 'width 0.8s ease-out',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Button variant="secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
        退出登录
      </Button>
    </div>
  )
}

export default Profile
