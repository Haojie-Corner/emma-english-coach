import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import { modules } from '../data/phonics'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const ProgressRing = ({ pct, size = 56, color = '#d97757' }) => {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8e6dc" strokeWidth="5" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="Poppins,Arial,sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

const Dashboard = () => {
  const { user } = useUserStore()
  const { streak, checkedInToday, fetchProgress, doCheckIn, getModuleCompletion, loading } = useProgressStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchProgress(user.id)
  }, [user])

  const handleCheckIn = async () => {
    if (!checkedInToday) await doCheckIn(user.id)
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 顶部欢迎 */}
      <div className="mb-8">
        <p className="text-sm text-[#b0aea5] mb-1">Good morning 早上好，</p>
        <h1 className="text-2xl font-bold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
          {displayName} 👋
        </h1>
      </div>

      {/* 打卡卡片 */}
      <Card className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🔥</div>
          <div>
            <p className="font-bold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
              连续打卡 {streak} 天
            </p>
            <p className="text-sm text-[#b0aea5]">
              {checkedInToday ? '今天已打卡 ✅' : '今天还没打卡'}
            </p>
          </div>
        </div>
        {!checkedInToday && (
          <Button onClick={handleCheckIn} size="sm">打卡</Button>
        )}
      </Card>

      {/* 快速开始 */}
      <Card className="mb-6 bg-[#d97757] border-[#d97757] text-white" onClick={() => navigate('/course/phonics/phonics_01')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>继续学习</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
              Lesson 1 — 26个字母发音
            </p>
            <p className="text-sm opacity-80">自然拼读 · Phonics</p>
          </div>
          <span className="text-3xl">▶</span>
        </div>
      </Card>

      {/* 模块进度 */}
      <h2 className="text-base font-semibold text-[#141413] mb-4" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        学习进度
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {modules.map(mod => {
          const pct = getModuleCompletion(mod.id)
          return (
            <Card
              key={mod.id}
              className="flex items-center gap-3"
              onClick={() => navigate(`/course/${mod.id}`)}
            >
              <ProgressRing pct={pct} color={mod.color} />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#141413] truncate" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
                  {mod.icon} {mod.name}
                </p>
                <p className="text-xs text-[#b0aea5]">{mod.totalLessons} 节课</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 今日推荐 */}
      <h2 className="text-base font-semibold text-[#141413] mb-4" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        今日推荐练习
      </h2>
      <div className="space-y-3">
        {[
          { icon: '🔤', title: 'Lesson 1 — 26个字母发音', sub: '自然拼读 · 约10分钟', to: '/course/phonics/phonics_01' },
          { icon: '💬', title: '自由口语练习', sub: 'AI 实时纠错', to: '/practice/speaking' },
        ].map((item, i) => (
          <Card key={i} className="flex items-center gap-4" onClick={() => navigate(item.to)}>
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>{item.title}</p>
              <p className="text-xs text-[#b0aea5]">{item.sub}</p>
            </div>
            <span className="text-[#b0aea5]">›</span>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
