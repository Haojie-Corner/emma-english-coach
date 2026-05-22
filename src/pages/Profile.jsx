import { useState, useEffect } from 'react'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { modules } from '../data/phonics'
import { getVocabulary } from '../services/supabase'

/* ── 30天打卡热图 ── */
const CheckInHeatmap = ({ history }) => {
  const today = new Date()
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const historySet = new Set(history)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const todayStr = today.toISOString().split('T')[0]

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {days.map(day => {
          const checked = historySet.has(day)
          const isToday = day === todayStr
          const d = new Date(day + 'T12:00:00')
          return (
            <div key={day} title={`${day} ${weekDays[d.getDay()]}`} style={{
              width: 22, height: 22, borderRadius: 5,
              background: checked ? '#d97757' : '#ece9e0',
              border: isToday ? '2px solid #1a1917' : '2px solid transparent',
              transition: 'background 0.2s',
              flexShrink: 0,
            }} />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: '#b0aea5' }}>30 天前</span>
        <span style={{ fontSize: 10, color: '#b0aea5' }}>今天</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: '#d97757' }} />
        <span style={{ fontSize: 11, color: '#7a7870' }}>已打卡</span>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: '#ece9e0', marginLeft: 8 }} />
        <span style={{ fontSize: 11, color: '#7a7870' }}>未打卡</span>
        <span style={{ fontSize: 11, color: '#d97757', marginLeft: 8, fontWeight: 700 }}>
          {history.length} / 30 天
        </span>
      </div>
    </div>
  )
}

/* ── 7天完成课程柱状图 ── */
const WeeklyBarChart = ({ counts }) => {
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const weekShort = ['日', '一', '二', '三', '四', '五', '六']
  const maxVal = Math.max(...days.map(d => counts[d] || 0), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {days.map(day => {
        const val = counts[day] || 0
        const h = Math.round((val / maxVal) * 64)
        const d = new Date(day + 'T12:00:00')
        const isToday = day === today.toISOString().split('T')[0]
        return (
          <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {val > 0 && (
              <span style={{ fontSize: 10, color: '#d97757', fontWeight: 700 }}>{val}</span>
            )}
            <div style={{
              width: '100%', height: Math.max(h, 4), borderRadius: '4px 4px 2px 2px',
              background: val > 0 ? (isToday ? '#c05e3a' : '#d97757') : '#ece9e0',
              transition: 'height 0.5s ease-out',
            }} />
            <span style={{ fontSize: 10, color: isToday ? '#d97757' : '#b0aea5', fontWeight: isToday ? 700 : 400 }}>
              {weekShort[d.getDay()]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const Profile = () => {
  const { user, logout } = useUserStore()
  const { streak, progress, getModuleCompletion, checkInHistory, weeklyLessonCounts, dueVocabCount } = useProgressStore()
  const navigate = useNavigate()
  const [vocabStats, setVocabStats] = useState(null)

  useEffect(() => {
    if (!user) return
    getVocabulary(user.id).then(words => {
      const byFamiliarity = [0, 1, 2, 3].map(f => words.filter(w => w.familiarity === f).length)
      setVocabStats({ total: words.length, mastered: byFamiliarity[3], byFamiliarity })
    }).catch(() => {})
  }, [user])

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  const totalCompleted = progress.filter(p => p.status === 'completed').length
  const totalAttempted = progress.length
  const avgScore = progress.filter(p => p.score).length > 0
    ? Math.round(progress.filter(p => p.score).reduce((sum, p) => sum + p.score, 0) / progress.filter(p => p.score).length)
    : 0

  const weekTotal = Object.values(weeklyLessonCounts).reduce((s, v) => s + v, 0)

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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917', marginBottom: 20 }}>
        👤 个人中心
      </h1>

      {/* 用户信息 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d97757, #c05e3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0,
          }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#1a1917' }}>{displayName}</p>
            <p style={{ fontSize: 12, color: '#b0aea5', marginTop: 2 }}>{user?.email}</p>
            <p style={{ fontSize: 11, color: '#7a7870', marginTop: 4 }}>
              🔥 连续打卡 <span style={{ color: '#d97757', fontWeight: 700 }}>{streak}</span> 天
            </p>
          </div>
        </div>
      </Card>

      {/* 学习统计 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>学习统计</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {statItems.map(item => (
          <div key={item.label} style={{
            background: item.bg,
            border: `1px solid ${item.color}30`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
              {item.value}<span style={{ fontSize: 12, fontWeight: 500 }}>{item.unit}</span>
            </p>
            <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* 本周学习 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>本周学习</h2>
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#7a7870' }}>最近 7 天完成课程</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#d97757' }}>{weekTotal} 节</span>
        </div>
        <WeeklyBarChart counts={weeklyLessonCounts} />
      </Card>

      {/* 30天打卡日历 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>打卡记录</h2>
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <CheckInHeatmap history={checkInHistory} />
      </Card>

      {/* 各模块进度 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>模块进度</h2>
      <Card style={{ marginBottom: 24, padding: '16px 20px' }}>
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

      {/* 词汇本统计 */}
      {vocabStats !== null && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>词汇本</h2>
          <Card style={{ marginBottom: 24, padding: '16px 20px' }}>
            {vocabStats.total === 0 ? (
              <p style={{ fontSize: 13, color: '#b0aea5', textAlign: 'center' }}>还没有收藏词汇，去课程里点 + 存入吧</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14 }}>
                  {[
                    { value: vocabStats.total, label: '总词汇', color: '#7a6bba', tab: 'all' },
                    { value: vocabStats.mastered, label: '已掌握', color: '#788c5d', tab: 'all' },
                    { value: dueVocabCount, label: '今日复习', color: '#d97757', tab: 'due' },
                  ].map(item => (
                    <div key={item.label} onClick={() => navigate(`/vocabulary?tab=${item.tab}`)}
                      style={{ textAlign: 'center', cursor: 'pointer' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1.1 }}>{item.value}</p>
                      <p style={{ fontSize: 11, color: '#7a7870', marginTop: 3 }}>{item.label} ›</p>
                    </div>
                  ))}
                </div>
                <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  {[
                    { color: '#dedad0' },
                    { color: '#f0b880' },
                    { color: '#a8c880' },
                    { color: '#70b860' },
                  ].map((seg, i) => {
                    const pct = (vocabStats.byFamiliarity[i] / vocabStats.total) * 100
                    return pct > 0 ? (
                      <div key={i} style={{ width: `${pct}%`, background: seg.color, transition: 'width 0.8s ease-out' }} />
                    ) : null
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  {['陌生', '模糊', '熟悉', '掌握'].map((label, i) => {
                    const colors = ['#dedad0', '#f0b880', '#a8c880', '#70b860']
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i] }} />
                        <span style={{ fontSize: 10, color: '#7a7870' }}>{label} {vocabStats.byFamiliarity[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      <Button variant="secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
        退出登录
      </Button>
    </div>
  )
}

export default Profile
