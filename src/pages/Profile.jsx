import { useState, useEffect, useMemo } from 'react'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { modules } from '../data/phonics'
import { getVocabulary, getAllRecordings, getLessonScoreHistory } from '../services/supabase'
import { showToast } from '../utils/toast'

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
  const [weaknesses, setWeaknesses] = useState(null)  // null = loading, [] = none found
  const [dailyGoal, setDailyGoal] = useState(() => parseInt(localStorage.getItem('dailyGoal') || '2', 10))
  const [savingGoal, setSavingGoal] = useState(false)
  const [scoreHistory, setScoreHistory] = useState([])
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (!user) return
    getVocabulary(user.id).then(words => {
      const byFamiliarity = [0, 1, 2, 3].map(f => words.filter(w => w.familiarity === f).length)
      setVocabStats({ total: words.length, mastered: byFamiliarity[3], byFamiliarity })
    }).catch(() => {})
  }, [user])

  /* ── 发音进步曲线（每课得分历史） ── */
  useEffect(() => {
    if (!user) return
    getLessonScoreHistory(user.id).then(setScoreHistory).catch(() => {})
  }, [user])

  /* ── 发音弱点分析（从历史录音聚合） ── */
  useEffect(() => {
    if (!user) return
    getAllRecordings(user.id).then(recs => {
      const issueMap = {}
      recs.forEach(rec => {
        let fb = rec.ai_feedback
        if (typeof fb === 'string') { try { fb = JSON.parse(fb) } catch { return } }
        if (!fb?.pronunciation_issues?.length) return
        fb.pronunciation_issues.forEach(issue => {
          const key = issue.word?.toLowerCase()
          if (!key) return
          if (!issueMap[key]) issueMap[key] = { word: issue.word, ipa: issue.correct_ipa || '', count: 0, tip: issue.tip || '' }
          issueMap[key].count++
        })
      })
      const top = Object.values(issueMap).sort((a, b) => b.count - a.count).slice(0, 4)
      setWeaknesses(top)
    }).catch(() => setWeaknesses([]))
  }, [user])

  const handleSaveGoal = () => {
    localStorage.setItem('dailyGoal', String(dailyGoal))
    setSavingGoal(true)
    setTimeout(() => setSavingGoal(false), 1200)
    showToast(`每日目标已设为 ${dailyGoal} 课`, 'success')
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  const totalCompleted = progress.filter(p => p.status === 'completed').length
  const totalAttempted = progress.length
  const avgScore = progress.filter(p => p.score).length > 0
    ? Math.round(progress.filter(p => p.score).reduce((sum, p) => sum + p.score, 0) / progress.filter(p => p.score).length)
    : 0

  const weekTotal = Object.values(weeklyLessonCounts).reduce((s, v) => s + v, 0)

  /* ── 发音进步折线图（按时间取最近20次有效录音得分） ── */
  const trendScores = useMemo(() => {
    return scoreHistory.slice(-20).map(r => r.ai_score).filter(s => s != null)
  }, [scoreHistory])

  const trendImproved = trendScores.length >= 2
    ? trendScores[trendScores.length - 1] > trendScores[0]
    : null

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

      {/* 每日目标设置 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>每日学习目标</h2>
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 10 }}>
              每天完成 <span style={{ fontWeight: 800, color: '#d97757', fontSize: 18 }}>{dailyGoal}</span> 课
            </p>
            <input
              type="range" min={1} max={8} value={dailyGoal}
              onChange={e => setDailyGoal(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#d97757' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#b0aea5' }}>1课/天（轻松）</span>
              <span style={{ fontSize: 10, color: '#b0aea5' }}>8课/天（高强度）</span>
            </div>
          </div>
          <button
            onClick={handleSaveGoal}
            style={{
              background: savingGoal ? '#788c5d' : '#d97757',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 16px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0, transition: 'background 0.3s',
            }}
          >
            {savingGoal ? '✓ 已保存' : '保存'}
          </button>
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

      {/* 发音进步曲线 */}
      {trendScores.length >= 2 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>发音进步曲线</h2>
          <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#7a7870' }}>最近 {trendScores.length} 次录音得分</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: trendImproved ? '#788c5d' : '#d97757' }}>
                {trendImproved ? '📈 持续进步中！' : '💪 继续努力'}
              </span>
            </div>
            {(() => {
              const W = 280, H = 60
              const max = Math.max(...trendScores, 60)
              const pts = trendScores.map((s, i) => {
                const x = trendScores.length === 1 ? W / 2 : (i / (trendScores.length - 1)) * W
                const y = H - (s / max) * H * 0.9
                return `${x},${y}`
              }).join(' ')
              const latest = trendScores[trendScores.length - 1]
              const color = latest >= 80 ? '#788c5d' : latest >= 60 ? '#d97757' : '#c45c5c'
              return (
                <div style={{ overflowX: 'auto' }}>
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 200 }}>
                    <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
                      strokeLinejoin="round" strokeLinecap="round" />
                    {trendScores.map((s, i) => {
                      const x = trendScores.length === 1 ? W / 2 : (i / (trendScores.length - 1)) * W
                      const y = H - (s / max) * H * 0.9
                      const isLast = i === trendScores.length - 1
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r={isLast ? 5 : 3} fill={color} opacity={isLast ? 1 : 0.5} />
                          {isLast && (
                            <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="700"
                              fill={color} fontFamily="-apple-system,Arial,sans-serif">{s}</text>
                          )}
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )
            })()}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#b0aea5' }}>最早</span>
              <span style={{ fontSize: 10, color: '#b0aea5' }}>最近</span>
            </div>
          </Card>
        </>
      )}

      {/* 30天打卡日历 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>打卡记录</h2>
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <CheckInHeatmap history={checkInHistory} />
      </Card>

      {/* 发音弱点分析 */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>发音弱点分析</h2>
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        {weaknesses === null ? (
          <p style={{ fontSize: 13, color: '#b0aea5', textAlign: 'center' }}>分析中…</p>
        ) : weaknesses.length === 0 ? (
          <p style={{ fontSize: 13, color: '#b0aea5', textAlign: 'center' }}>
            暂无录音数据，完成几课发音练习后这里会显示你的弱点单词
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 12 }}>
              根据你的历史录音分析，以下单词发音出现问题次数最多：
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weaknesses.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#faf9f5', borderRadius: 10, padding: '10px 14px',
                  border: '1px solid #ece9e0',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: ['#fdeaea', '#fdf0ea', '#fdf6e3', '#eaf2e3'][i] || '#f5f3ee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    color: ['#c45c5c', '#d97757', '#c4a35a', '#788c5d'][i] || '#7a7870',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1917' }}>{w.word}</span>
                      {w.ipa && <span style={{ fontSize: 11, color: '#b0aea5', fontFamily: 'monospace' }}>{w.ipa}</span>}
                    </div>
                    {w.tip && <p style={{ fontSize: 11, color: '#7a7870', marginTop: 2 }}>{w.tip}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                      background: '#fdeaea', color: '#c45c5c',
                    }}>出现 {w.count} 次</span>
                    <button
                      onClick={() => navigate(`/practice/speaking?drill=${encodeURIComponent(w.word)}`)}
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: '#fdf0ea', color: '#d97757',
                        border: '1px solid #f5c4a8', cursor: 'pointer',
                      }}
                    >🎤 练习</button>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 12, textAlign: 'center' }}>
              点击「🎤 练习」直接跳转到发音练习页
            </p>
          </>
        )}
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

      {/* 分享进度 */}
      <button onClick={() => setShowShare(true)} style={{
        width: '100%', padding: '12px', borderRadius: 12, marginBottom: 12,
        background: 'linear-gradient(135deg, #fdf0ea, #fff8f4)',
        border: '1.5px solid #f5c4a8', cursor: 'pointer',
        fontSize: 13, fontWeight: 700, color: '#d97757',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        🏆 分享我的学习进度
      </button>

      <Button variant="secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
        退出登录
      </Button>

      {/* 分享卡弹窗 */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowShare(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* 分享卡主体 */}
            <div style={{ background: 'linear-gradient(135deg, #e07c58 0%, #be5530 100%)', padding: '28px 28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🎓</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{displayName} 的英语学习报告</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>AI 英语陪练 · {new Date().toLocaleDateString('zh-CN')}</p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { emoji: '🔥', value: `${streak} 天`, label: '连续打卡' },
                  { emoji: '📚', value: `${totalCompleted} 节`, label: '完成课程' },
                  { emoji: '⭐', value: `${avgScore || '--'} 分`, label: '平均得分' },
                  { emoji: '📖', value: `${vocabStats?.total || 0} 词`, label: '词汇积累' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#faf9f5', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18 }}>{item.emoji}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#1a1917' }}>{item.value}</p>
                    <p style={{ fontSize: 11, color: '#7a7870' }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#b0aea5', textAlign: 'center', marginBottom: 16 }}>
                💡 截图此页面分享到朋友圈 / 微信
              </p>
              <button onClick={() => setShowShare(false)} style={{
                width: '100%', padding: '11px', borderRadius: 10,
                background: '#f0ede4', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#7a7870',
              }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
