import { useState, useEffect, useMemo } from 'react'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StateBlock, { LoadingBlock } from '../components/ui/StateBlock'
import { useNavigate } from 'react-router-dom'
import { modules } from '../data/phonics'
import { getVocabulary, getAllRecordings, getLessonScoreHistory } from '../services/supabase'
import { showToast } from '../utils/toast'
import { getWeaknessSummary } from '../utils/weakness'
import { DEFAULT_IELTS_GOAL, getIeltsAttempts, getIeltsGoal, getIeltsGoalSummary, saveIeltsGoal } from '../utils/ieltsGoal'
import { LEARNING_STATE_SYNCED, LEARNING_SYNC_STATUS_CHANGED, getLearningSyncStatus, notifyLearningStateChanged, syncLearningState } from '../utils/learningStateSync'
import DiagnosticModal, { DIAGNOSTIC_KEY, getStoredDiagnostic, getDiagnosticSummary } from '../components/DiagnosticModal'
import { getNotifPrefs, saveNotifPrefs, isNotifSupported, requestPermission } from '../utils/notifications'

/* ── 60天打卡热图（带月份标签）── */
const CheckInHeatmap = ({ history }) => {
  const today = new Date()
  const DAYS = 60
  const days = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const historySet = new Set(history)
  const todayStr = today.toISOString().split('T')[0]
  const recentCount = history.filter(d => days.includes(d)).length
  const monthLabels = []
  let lastMonth = -1
  days.forEach((day, idx) => {
    const m = new Date(day + 'T12:00:00').getMonth()
    if (m !== lastMonth) { monthLabels.push({ idx, label: `${m + 1}月` }); lastMonth = m }
  })

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {days.map(day => {
            const checked = historySet.has(day)
            const isToday = day === todayStr
            const intensity = checked ? 1 : 0
            return (
              <div key={day} title={day} style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: intensity ? '#e8672a' : '#edeae3',
                border: isToday ? '1.5px solid #0f0e0c' : '1.5px solid transparent',
                transition: 'background 0.2s',
              }} />
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        {monthLabels.map(m => (
          <span key={m.idx} style={{ fontSize: 10, color: '#9e998e' }}>{m.label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#e8672a' }} />
        <span style={{ fontSize: 11, color: '#5c5850' }}>已打卡</span>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#edeae3', marginLeft: 8 }} />
        <span style={{ fontSize: 11, color: '#5c5850' }}>未打卡</span>
        <span style={{ fontSize: 11, color: '#e8672a', marginLeft: 8, fontWeight: 700 }}>
          近 {DAYS} 天：{recentCount} 天
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
              <span style={{ fontSize: 10, color: '#e8672a', fontWeight: 700 }}>{val}</span>
            )}
            <div style={{
              width: '100%', height: Math.max(h, 4), borderRadius: '5px 5px 2px 2px',
              background: val > 0 ? (isToday ? '#c4521a' : '#e8672a') : '#edeae3',
              transition: 'height 0.5s ease-out',
            }} />
            <span style={{ fontSize: 10, color: isToday ? '#e8672a' : '#9e998e', fontWeight: isToday ? 700 : 400 }}>
              {weekShort[d.getDay()]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const SectionTitle = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>
    {children}
  </p>
)

const getSyncStatusMeta = (syncStatus) => {
  const status = syncStatus?.status || 'pending'
  const map = {
    pending: { label: '待同步', color: '#d48a10', bg: '#fff8ea', desc: '有学习记录等待上传到云端' },
    syncing: { label: '同步中', color: '#4a7a9b', bg: '#eef7fb', desc: '正在合并手机和电脑学习记录' },
    synced: { label: '已同步', color: '#3a9a5f', bg: '#edf8f2', desc: '手机和电脑使用同一账号即可接续学习' },
    error: { label: '需检查', color: '#d94040', bg: '#fdf0f0', desc: syncStatus?.message || '同步失败，请检查网络或 Supabase 表是否已创建' },
  }
  const lastTime = syncStatus?.updatedAt
    ? new Date(syncStatus.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '尚未同步'
  return { ...(map[status] || map.pending), lastTime }
}

const weaknessRoutes = {
  pronunciation: '/practice/speaking',
  fluency: '/course/fluency',
  stress: '/course/intonation',
  intonation: '/course/intonation',
  grammar: '/practice/speaking?tab=grammar',
  vocabulary: '/vocabulary',
  communication: '/course/scenes',
}

const categorizeGrammarError = (reason) => {
  if (!reason) return '其他'
  const r = reason
  if (/冠词/.test(r)) return '冠词 (a/an/the)'
  if (/时态/.test(r)) return '时态错误'
  if (/介词/.test(r)) return '介词用法'
  if (/单复数|复数|不可数/.test(r)) return '单复数'
  if (/主谓一致|主语/.test(r)) return '主谓一致'
  if (/语序|倒装/.test(r)) return '语序错误'
  if (/词汇|用词|搭配/.test(r)) return '词汇搭配'
  if (/because.*so|双重否定/.test(r)) return '逻辑连词'
  return '其他语法'
}

const Profile = () => {
  const { user, logout } = useUserStore()
  const { streak, progress, getModuleCompletion, checkInHistory, weeklyLessonCounts, dueVocabCount } = useProgressStore()
  const navigate = useNavigate()
  const [vocabStats, setVocabStats] = useState(null)
  const [weaknesses, setWeaknesses] = useState(null)
  const [grammarErrors, setGrammarErrors] = useState([])
  const [weaknessSummary, setWeaknessSummary] = useState([])
  const [diagnostic, setDiagnostic] = useState(() => getStoredDiagnostic())
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState(() => getNotifPrefs() || { enabled: false, time: '20:00' })
  const [notifPermission, setNotifPermission] = useState(() => isNotifSupported() ? Notification.permission : 'unsupported')
  const [dailyGoal, setDailyGoal] = useState(() => parseInt(localStorage.getItem('dailyGoal') || '2', 10))
  const [ieltsGoal, setIeltsGoal] = useState(() => getIeltsGoal() || DEFAULT_IELTS_GOAL)
  const [ieltsAttempts, setIeltsAttempts] = useState(() => getIeltsAttempts())
  const [savingGoal, setSavingGoal] = useState(false)
  const [savingIeltsGoal, setSavingIeltsGoal] = useState(false)
  const [scoreHistory, setScoreHistory] = useState([])
  const [showShare, setShowShare] = useState(false)
  const [syncStatus, setSyncStatus] = useState(() => getLearningSyncStatus())

  useEffect(() => {
    if (!user) return
    getVocabulary(user.id).then(words => {
      const byFamiliarity = [0, 1, 2, 3].map(f => words.filter(w => w.familiarity === f).length)
      setVocabStats({ total: words.length, mastered: byFamiliarity[3], byFamiliarity })
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    getLessonScoreHistory(user.id).then(setScoreHistory).catch(() => {})
  }, [user])

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

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('grammarErrors') || '[]')
      const catMap = {}
      raw.forEach(item => {
        const cat = categorizeGrammarError(item.reason)
        catMap[cat] = (catMap[cat] || 0) + 1
      })
      const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
      setGrammarErrors(sorted)
    } catch { /* ignore malformed local history */ }
  }, [])

  useEffect(() => {
    setWeaknessSummary(getWeaknessSummary())
    setIeltsAttempts(getIeltsAttempts())
  }, [])

  useEffect(() => {
    const refreshCloudState = () => {
      setDailyGoal(parseInt(localStorage.getItem('dailyGoal') || '2', 10))
      setIeltsGoal(getIeltsGoal() || DEFAULT_IELTS_GOAL)
      setIeltsAttempts(getIeltsAttempts())
      setWeaknessSummary(getWeaknessSummary())
      try {
        const raw = JSON.parse(localStorage.getItem('grammarErrors') || '[]')
        const catMap = {}
        raw.forEach(item => {
          const cat = categorizeGrammarError(item.reason)
          catMap[cat] = (catMap[cat] || 0) + 1
        })
        setGrammarErrors(Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6))
      } catch { /* ignore malformed cloud state */ }
    }
    window.addEventListener(LEARNING_STATE_SYNCED, refreshCloudState)
    return () => window.removeEventListener(LEARNING_STATE_SYNCED, refreshCloudState)
  }, [])
  useEffect(() => {
    const refreshSyncStatus = () => setSyncStatus(getLearningSyncStatus())
    window.addEventListener(LEARNING_SYNC_STATUS_CHANGED, refreshSyncStatus)
    window.addEventListener(LEARNING_STATE_SYNCED, refreshSyncStatus)
    return () => {
      window.removeEventListener(LEARNING_SYNC_STATUS_CHANGED, refreshSyncStatus)
      window.removeEventListener(LEARNING_STATE_SYNCED, refreshSyncStatus)
    }
  }, [])

  const handleToggleReminder = async () => {
    if (notifPrefs.enabled) {
      const updated = { ...notifPrefs, enabled: false }
      saveNotifPrefs(updated)
      setNotifPrefs(updated)
      showToast('每日提醒已关闭', 'info')
      return
    }
    const perm = await requestPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      const updated = { ...notifPrefs, enabled: true }
      saveNotifPrefs(updated)
      setNotifPrefs(updated)
      showToast('每日提醒已开启，会在设定时间提醒你打卡', 'success')
    } else if (perm === 'denied') {
      showToast('通知权限被拒绝，请在浏览器设置中允许通知', 'error')
    } else {
      showToast('当前环境不支持通知', 'info')
    }
  }

  const handleNotifTimeChange = (time) => {
    const updated = { ...notifPrefs, time }
    saveNotifPrefs(updated)
    setNotifPrefs(updated)
  }

  const handleSaveDiagnostic = (profile) => {
    localStorage.setItem(DIAGNOSTIC_KEY, JSON.stringify(profile))
    notifyLearningStateChanged()
    setDiagnostic(profile)
    setShowDiagnostic(false)
    showToast('诊断档案已更新', 'success')
  }

  const handleSaveGoal = () => {
    localStorage.setItem('dailyGoal', String(dailyGoal))
    notifyLearningStateChanged()
    setSavingGoal(true)
    setTimeout(() => setSavingGoal(false), 1200)
    showToast(`每日目标已设为 ${dailyGoal} 课`, 'success')
  }

  const handleSaveIeltsGoal = () => {
    const saved = saveIeltsGoal(ieltsGoal)
    setIeltsGoal(saved)
    setSavingIeltsGoal(true)
    setTimeout(() => setSavingIeltsGoal(false), 1200)
    showToast(`雅思目标已设为 Band ${saved.targetBand}`, 'success')
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'
  const totalCompleted = progress.filter(p => p.status === 'completed').length
  const totalAttempted = progress.length
  const avgScore = progress.filter(p => p.score).length > 0
    ? Math.round(progress.filter(p => p.score).reduce((sum, p) => sum + p.score, 0) / progress.filter(p => p.score).length)
    : 0
  const weekTotal = Object.values(weeklyLessonCounts).reduce((s, v) => s + v, 0)
  const ieltsSummary = getIeltsGoalSummary(ieltsGoal)
  const recentIeltsAttempts = ieltsAttempts.slice(-3).reverse()
  const syncMeta = getSyncStatusMeta(syncStatus)

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

  const handleManualSync = () => {
    if (!user?.id) return
    syncLearningState(user.id).catch(() => {})
  }

  const downloadShareImage = () => {
    const W = 360, H = 460
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width = W * dpr; canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#f28040'); grad.addColorStop(1, '#e05020')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, 160)
    ctx.font = `bold 18px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.fillText(`${displayName} 的英语学习报告`, W / 2, 90)
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.fillText(`AI 英语陪练  ·  ${new Date().toLocaleDateString('zh-CN')}`, W / 2, 116)
    const cards = [
      { emoji: '🔥', value: `${streak} 天`, label: '连续打卡', color: '#e8672a' },
      { emoji: '📚', value: `${totalCompleted} 节`, label: '完成课程', color: '#3a9a5f' },
      { emoji: '⭐', value: `${avgScore || '--'} 分`, label: '平均得分', color: '#7a6bba' },
      { emoji: '📖', value: `${vocabStats?.total || 0} 词`, label: '词汇积累', color: '#5b8def' },
    ]
    const cardW = 148, cardH = 88, gap = 16, startX = 24, startY = 176
    cards.forEach((card, i) => {
      const col = i % 2, row = Math.floor(i / 2)
      const x = startX + col * (cardW + gap), y = startY + row * (cardH + gap)
      ctx.fillStyle = '#faf9f6'; ctx.fillRect(x, y, cardW, cardH)
      ctx.font = `bold 26px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
      ctx.fillStyle = card.color; ctx.textAlign = 'center'
      ctx.fillText(card.value, x + cardW / 2, y + 46)
      ctx.font = `12px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
      ctx.fillStyle = '#5c5850'; ctx.fillText(card.label, x + cardW / 2, y + 68)
    })
    ctx.font = `11px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
    ctx.fillStyle = '#9e998e'; ctx.textAlign = 'center'
    ctx.fillText('AI 英语陪练大师  ·  坚持学习，持续进步', W / 2, H - 22)
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `英语学习报告_${new Date().toISOString().split('T')[0]}.png`
      a.click(); URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', padding: '24px clamp(14px, 4vw, 20px)', overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f28040 0%, #e05020 100%)',
        borderRadius: 22, padding: '24px 22px', marginBottom: 20,
        boxShadow: '0 6px 24px rgba(232,103,42,0.28)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 800, flexShrink: 0,
          }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 19, color: '#fff', marginBottom: 3 }}>{displayName}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>{user?.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                🔥 {streak} 天连续
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px',
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
              }}>
                ✅ {totalCompleted} 课
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: '完成课程', value: totalCompleted, unit: '节', color: '#3a9a5f', bg: '#edf8f2', borderColor: '#b5e0c8' },
          { label: '练习记录', value: totalAttempted, unit: '次', color: '#5b8def', bg: '#eef4ff', borderColor: '#c0d8f8' },
          { label: '平均得分', value: avgScore || '--', unit: avgScore ? '分' : '', color: '#e8672a', bg: '#fef2ea', borderColor: '#f3c4a2' },
          { label: '连续打卡', value: streak, unit: '天', color: '#7a6bba', bg: '#f3f0ff', borderColor: '#d4c8f8' },
        ].map(item => (
          <div key={item.label} style={{
            background: item.bg, border: `1.5px solid ${item.borderColor}`,
            borderRadius: 16, padding: '16px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: item.color, letterSpacing: -0.025, lineHeight: 1 }}>
              {item.value}<span style={{ fontSize: 13, fontWeight: 600 }}>{item.unit}</span>
            </p>
            <p style={{ fontSize: 12, color: '#5c5850', marginTop: 6 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Cross Device Sync ── */}
      <SectionTitle>手机电脑同步</SectionTitle>
      <Card style={{ marginBottom: 20, background: syncMeta.bg, borderColor: `${syncMeta.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, flexShrink: 0,
            background: '#fff', color: syncMeta.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900,
          }}>●</div>
          <div style={{ flex: '1 1 210px', minWidth: 0 }}>
            <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f0e0c', marginBottom: 3 }}>
              云同步 · {syncMeta.label}
            </p>
            <p style={{ fontSize: 12, color: '#5c5850', lineHeight: 1.55 }}>
              {syncMeta.desc}。上次状态：{syncMeta.lastTime}
            </p>
          </div>
          <button onClick={handleManualSync} style={{
            fontSize: 12, fontWeight: 800, color: syncMeta.color,
            background: '#fff', border: `1px solid ${syncMeta.color}44`,
            borderRadius: 10, minHeight: 40, padding: '8px 11px', cursor: 'pointer',
            fontFamily: 'inherit', flexShrink: 0,
          }}>立即同步</button>
        </div>
      </Card>

      {/* ── Diagnostic Profile ── */}
      <SectionTitle>学习档案</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        {diagnostic ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: '#fef2ea',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🎯</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f0e0c', marginBottom: 3 }}>
                {getDiagnosticSummary(diagnostic)}
              </p>
              <p style={{ fontSize: 12, color: '#9e998e' }}>
                上次更新：{diagnostic.updatedAt
                  ? new Date(diagnostic.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
                  : '未知'}
              </p>
            </div>
            <button onClick={() => setShowDiagnostic(true)} style={{
              fontSize: 12, fontWeight: 800, color: '#e8672a',
              background: '#fff', border: '1px solid #f3c4a2',
              borderRadius: 10, minHeight: 40, padding: '8px 11px', cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}>重新诊断</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: '#f0ede6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>❓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f0e0c', marginBottom: 3 }}>还没有学习档案</p>
              <p style={{ fontSize: 12, color: '#9e998e' }}>3 个问题帮 AI 了解你的学习目标</p>
            </div>
            <button onClick={() => setShowDiagnostic(true)} style={{
              fontSize: 12, fontWeight: 800, color: '#fff',
              background: 'linear-gradient(135deg, #f28040, #e05020)', border: 'none',
              borderRadius: 10, minHeight: 40, padding: '8px 11px', cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
              boxShadow: '0 3px 10px rgba(232,103,42,0.3)',
            }}>开始诊断</button>
          </div>
        )}
      </Card>

      {/* ── Daily Goal ── */}
      <SectionTitle>每日学习目标</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 210px', minWidth: 0 }}>
            <p style={{ fontSize: 13, color: '#5c5850', marginBottom: 10 }}>
              每天完成 <span style={{ fontWeight: 800, color: '#e8672a', fontSize: 22, letterSpacing: -0.02 }}>{dailyGoal}</span> 课
            </p>
            <input
              type="range" min={1} max={8} value={dailyGoal}
              onChange={e => setDailyGoal(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#e8672a' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: '#9e998e' }}>1课（轻松）</span>
              <span style={{ fontSize: 10, color: '#9e998e' }}>8课（高强度）</span>
            </div>
          </div>
          <button onClick={handleSaveGoal} style={{
            background: savingGoal
              ? '#3a9a5f'
              : 'linear-gradient(135deg, #f28040, #e05020)',
            color: '#fff', border: 'none', borderRadius: 12,
            minHeight: 42, padding: '10px 16px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
            boxShadow: savingGoal ? '0 2px 8px rgba(58,154,95,0.3)' : '0 3px 10px rgba(232,103,42,0.3)',
            transition: 'all 0.3s',
          }}>
            {savingGoal ? '✓ 已保存' : '保存'}
          </button>
        </div>
      </Card>

      {/* ── IELTS Goal ── */}
      <SectionTitle>雅思口语目标</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', marginBottom: 6, display: 'block' }}>目标 Band</label>
            <select value={ieltsGoal.targetBand} onChange={e => setIeltsGoal({ ...ieltsGoal, targetBand: Number(e.target.value) })} style={{
              width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
              borderRadius: 12, padding: '10px 12px', fontSize: 14, color: '#0f0e0c', fontFamily: 'inherit',
            }}>
              {[5.5, 6, 6.5, 7, 7.5, 8].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', marginBottom: 6, display: 'block' }}>当前 Band</label>
            <select value={ieltsGoal.currentBand} onChange={e => setIeltsGoal({ ...ieltsGoal, currentBand: Number(e.target.value) })} style={{
              width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
              borderRadius: 12, padding: '10px 12px', fontSize: 14, color: '#0f0e0c', fontFamily: 'inherit',
            }}>
              {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', marginBottom: 6, display: 'block' }}>考试日期</label>
            <input type="date" value={ieltsGoal.examDate} onChange={e => setIeltsGoal({ ...ieltsGoal, examDate: e.target.value })} style={{
              width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
              borderRadius: 12, padding: '10px 12px', fontSize: 14, color: '#0f0e0c', fontFamily: 'inherit', boxSizing: 'border-box',
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', marginBottom: 6, display: 'block' }}>每日分钟</label>
            <input type="number" min={10} max={120} value={ieltsGoal.dailyMinutes} onChange={e => setIeltsGoal({ ...ieltsGoal, dailyMinutes: Number(e.target.value) })} style={{
              width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
              borderRadius: 12, padding: '10px 12px', fontSize: 14, color: '#0f0e0c', fontFamily: 'inherit', boxSizing: 'border-box',
            }} />
          </div>
        </div>
        <div style={{
          background: '#fef2ea', border: '1px solid #f3c4a2',
          borderRadius: 14, padding: '11px 13px', marginBottom: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#e8672a', marginBottom: 4 }}>
            {ieltsSummary?.intensity} · 还差 {ieltsSummary?.gap.toFixed(1)} 分
          </p>
          <p style={{ fontSize: 12, color: '#5c5850', lineHeight: 1.55 }}>
            {ieltsSummary?.daysLeft !== null ? `距离考试约 ${ieltsSummary.daysLeft} 天，` : ''}
            建议每天完成 1 次 Part 1、1 次 Cue Card，并复盘 3 个高频错误。
          </p>
        </div>
        <button onClick={handleSaveIeltsGoal} style={{
          width: '100%', padding: '11px', borderRadius: 12,
          background: savingIeltsGoal ? '#3a9a5f' : 'linear-gradient(135deg, #f28040, #e05020)',
          border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {savingIeltsGoal ? '✓ 已保存' : '保存雅思目标'}
        </button>
        {recentIeltsAttempts.length > 0 && (
          <div style={{ marginTop: 14, borderTop: '1px solid #eee9df', paddingTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#0f0e0c', marginBottom: 8 }}>最近雅思练习</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentIeltsAttempts.map((item, i) => (
                <div key={`${item.createdAt}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#faf9f6', border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 12, padding: '10px 12px',
                }}>
                  <span style={{
                    width: 42, height: 30, borderRadius: 10, flexShrink: 0,
                    background: '#f3eeff', color: '#7b5ea7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800,
                  }}>{item.band}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 800, color: '#0f0e0c' }}>{item.part} · {item.topic || '口语练习'}</p>
                    <p style={{ fontSize: 11, color: '#9e998e' }}>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <button onClick={() => navigate(item.part === 'Part 3' ? '/practice/speaking?tab=part3' : item.part === 'Part 2' ? '/practice/speaking?tab=cuecard' : '/practice/speaking?tab=part1')} style={{
                    fontSize: 11, fontWeight: 800, color: '#7b5ea7',
                    background: '#fff', border: '1px solid #d5c5f0',
                    borderRadius: 20, padding: '4px 9px', cursor: 'pointer',
                  }}>再练</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Weekly Chart ── */}
      <SectionTitle>本周学习</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: '#5c5850' }}>最近 7 天完成课程</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8672a' }}>{weekTotal} 节</span>
        </div>
        <WeeklyBarChart counts={weeklyLessonCounts} />
        {/* 每日学习分钟数 */}
        {(() => {
          const days = []
          const today = new Date()
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const key = `studyMinutes_${d.toISOString().split('T')[0]}`
            const raw = localStorage.getItem(key)
            const seconds = raw ? (isNaN(Number(raw)) ? 0 : Number(raw)) : 0
            days.push({ day: d, minutes: Math.round(seconds / 60) })
          }
          const totalMins = days.reduce((s, d) => s + d.minutes, 0)
          if (totalMins === 0) return null
          const maxMins = Math.max(...days.map(d => d.minutes), 1)
          const weekShort = ['日', '一', '二', '三', '四', '五', '六']
          const todayStr = today.toISOString().split('T')[0]
          return (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#5c5850' }}>每日学习时长</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4a7a9b' }}>{totalMins} 分钟/周</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
                {days.map((d, i) => {
                  const h = Math.round((d.minutes / maxMins) * 52)
                  const isToday = d.day.toISOString().split('T')[0] === todayStr
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      {d.minutes > 0 && <span style={{ fontSize: 9, color: '#4a7a9b', fontWeight: 700 }}>{d.minutes}</span>}
                      <div style={{
                        width: '100%', height: Math.max(h, 3), borderRadius: '4px 4px 2px 2px',
                        background: d.minutes > 0 ? (isToday ? '#2a5a7b' : '#4a7a9b') : '#edeae3',
                        transition: 'height 0.5s ease-out',
                      }} />
                      <span style={{ fontSize: 9.5, color: isToday ? '#4a7a9b' : '#9e998e', fontWeight: isToday ? 700 : 400 }}>
                        {weekShort[d.day.getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </Card>

      {/* ── Module Score Breakdown ── */}
      {(() => {
        const moduleScores = modules
          .map(mod => {
            const modProgress = progress.filter(p => p.module_id === mod.id && p.score != null && p.status === 'completed')
            if (modProgress.length === 0) return null
            const avg = Math.round(modProgress.reduce((s, p) => s + p.score, 0) / modProgress.length)
            const completedCount = progress.filter(p => p.module_id === mod.id && p.status === 'completed').length
            return { ...mod, avg, completedCount }
          })
          .filter(Boolean)
        if (moduleScores.length < 2) return null
        return (
          <>
            <SectionTitle>模块成绩</SectionTitle>
            <Card style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#5c5850', marginBottom: 14 }}>各模块已完成课程的平均得分</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {moduleScores.map(mod => (
                  <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${mod.color}18`, border: `1.5px solid ${mod.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>{mod.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c' }}>{mod.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: mod.avg >= 80 ? '#3a9a5f' : mod.avg >= 60 ? '#e8672a' : '#d94040' }}>
                          {mod.avg} 分
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#f0ede6', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 6, transition: 'width 0.8s ease-out',
                          width: `${mod.avg}%`,
                          background: mod.avg >= 80 ? '#3a9a5f' : mod.avg >= 60 ? '#e8672a' : '#d94040',
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#9e998e', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                      {mod.completedCount} 课
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )
      })()}

      {/* ── Score Trend ── */}
      {trendScores.length >= 2 && (
        <>
          <SectionTitle>发音进步曲线</SectionTitle>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#5c5850' }}>最近 {trendScores.length} 次录音得分</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: trendImproved ? '#3a9a5f' : '#e8672a' }}>
                {trendImproved ? '📈 进步中！' : '💪 继续努力'}
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
              const color = latest >= 80 ? '#3a9a5f' : latest >= 60 ? '#e8672a' : '#d94040'
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
              <span style={{ fontSize: 10, color: '#9e998e' }}>最早</span>
              <span style={{ fontSize: 10, color: '#9e998e' }}>最近</span>
            </div>
          </Card>
        </>
      )}

      {/* ── Check-in Heatmap ── */}
      <SectionTitle>打卡记录</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <CheckInHeatmap history={checkInHistory} />
      </Card>

      {/* ── Learning Weakness Profile ── */}
      <SectionTitle>综合弱点档案</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        {weaknessSummary.length === 0 ? (
          <StateBlock
            compact
            icon="◎"
            tone="purple"
            title="还没有形成稳定弱点档案"
            description="完成发音分析、语法纠错或对话复盘后，这里会自动汇总最近 21 天最该补的地方。"
            actionLabel="做一次语法纠错"
            onAction={() => navigate('/practice/speaking?tab=grammar')}
          />
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#5c5850', marginBottom: 14, lineHeight: 1.5 }}>
              系统会把发音、语法和对话复盘里的问题沉淀到这里，优先处理出现次数最多的弱点。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weaknessSummary.slice(0, 5).map((item, i) => {
                const color = ['#d94040', '#e8672a', '#d48a10', '#7b5ea7', '#4a7a9b'][i] || '#9e998e'
                return (
                  <div key={item.type} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#faf9f6', borderRadius: 12, padding: '12px 14px',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: `${color}14`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f0e0c' }}>{item.label}</span>
                        {item.avgScore !== null && <span style={{ fontSize: 11, color }}>均分 {item.avgScore}</span>}
                      </div>
                      <p style={{ fontSize: 11, color: '#5c5850', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.latest?.fix ? `${item.latest.example || '表达'} → ${item.latest.fix}` : item.latest?.detail || '建议定向复练'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${color}14`, color }}>
                        {item.count} 次
                      </span>
                      <button
                        onClick={() => navigate(weaknessRoutes[item.type] || '/practice/speaking')}
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                          background: '#fff', color, border: `1px solid ${color}44`, cursor: 'pointer',
                        }}
                      >去补弱</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* ── Weakness Analysis ── */}
      <SectionTitle>发音弱点分析</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        {weaknesses === null ? (
          <LoadingBlock compact title="正在分析发音记录" description="稍等一下，系统在找最该复练的单词。" />
        ) : weaknesses.length === 0 ? (
          <StateBlock
            compact
            icon="🎙"
            title="暂时没有发音弱点数据"
            description="完成几次录音分析后，这里会显示你的高频发音问题和复练入口。"
            actionLabel="去录一段"
            onAction={() => navigate('/practice/speaking')}
          />
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#5c5850', marginBottom: 14, lineHeight: 1.5 }}>
              根据你的历史录音分析，以下单词发音出现问题次数最多：
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weaknesses.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#faf9f6', borderRadius: 12, padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: ['#fdf0f0', '#fef2ea', '#fff8ea', '#edf8f2'][i] || '#f5f3ef',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    color: ['#d94040', '#e8672a', '#d48a10', '#3a9a5f'][i] || '#5c5850',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#0f0e0c' }}>{w.word}</span>
                      {w.ipa && <span style={{ fontSize: 11, color: '#9e998e', fontFamily: 'monospace' }}>{w.ipa}</span>}
                    </div>
                    {w.tip && <p style={{ fontSize: 11, color: '#5c5850', marginTop: 2 }}>{w.tip}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: '#fdf0f0', color: '#d94040' }}>
                      {w.count} 次
                    </span>
                    <button
                      onClick={() => navigate(`/practice/speaking?drill=${encodeURIComponent(w.word)}`)}
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: '#fef2ea', color: '#e8672a', border: '1px solid #f3c4a2', cursor: 'pointer',
                      }}
                    >🎤 练习</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Grammar Error Analysis ── */}
      <SectionTitle>语法错误分析</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        {grammarErrors.length === 0 ? (
          <StateBlock
            compact
            icon="Aa"
            tone="warm"
            title="还没有语法练习记录"
            description="写 2-3 句今天真实想表达的话，系统会帮你沉淀高频错误类型。"
            actionLabel="开始纠错"
            onAction={() => navigate('/practice/speaking?tab=grammar')}
          />
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#5c5850', marginBottom: 14 }}>根据语法纠错记录，你的高频错误类型：</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grammarErrors.map(([cat, count], i) => {
                const max = grammarErrors[0][1]
                const colors = ['#e8672a', '#7b5ea7', '#3a9a5f', '#4a7a9b', '#d48a10', '#9e998e']
                const color = colors[i] || '#9e998e'
                return (
                  <div key={cat}
                    onClick={() => navigate('/practice/speaking?tab=grammar')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', borderRadius: 12, padding: '7px 10px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f3ef'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{
                      width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                      background: `${color}14`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, fontWeight: 800, color,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, color: '#0f0e0c', width: 80, flexShrink: 0, fontWeight: 600 }}>{cat}</span>
                    <div style={{ flex: 1, height: 8, background: '#f0ede6', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${(count / max) * 100}%`,
                        background: color, borderRadius: 6,
                        transition: 'width 0.8s ease-out',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color, width: 36, textAlign: 'right', flexShrink: 0 }}>{count}次</span>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/practice/speaking?tab=grammar')}
              style={{
                width: '100%', marginTop: 14, padding: '10px', borderRadius: 12,
                background: '#fff', border: '1.5px solid #e8672a30',
                color: '#e8672a', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              去语法纠错练习，减少这些错误 →
            </button>
          </>
        )}
      </Card>

      {/* ── Module Progress ── */}
      <SectionTitle>模块进度</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modules.map(mod => {
            const pct = getModuleCompletion(mod.id, mod.totalLessons)
            const completed = progress.filter(p => p.module_id === mod.id && p.status === 'completed').length
            return (
              <div key={mod.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#0f0e0c', fontWeight: 500 }}>{mod.icon} {mod.name}</span>
                  <span style={{ fontSize: 12, color: '#9e998e' }}>{completed}/{mod.totalLessons}</span>
                </div>
                <div style={{ height: 6, background: '#f0ede6', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, width: `${pct}%`, background: mod.color, transition: 'width 0.8s ease-out' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Vocab Stats ── */}
      {vocabStats !== null && (
        <>
          <SectionTitle>词汇本</SectionTitle>
          <Card style={{ marginBottom: 20 }}>
            {vocabStats.total === 0 ? (
              <StateBlock
                compact
                icon="+"
                tone="success"
                title="还没有收藏词汇"
                description="把今天想用的表达先存进词汇本，再通过复习和造句变成自己的口语。"
                actionLabel="添加第一个词"
                onAction={() => navigate('/vocabulary')}
              />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
                  {[
                    { value: vocabStats.total, label: '总词汇', color: '#7a6bba', tab: 'all' },
                    { value: vocabStats.mastered, label: '已掌握', color: '#3a9a5f', tab: 'all' },
                    { value: dueVocabCount, label: '今日复习', color: '#e8672a', tab: 'due' },
                  ].map(item => (
                    <div key={item.label} onClick={() => navigate(`/vocabulary?tab=${item.tab}`)}
                      style={{ textAlign: 'center', cursor: 'pointer' }}>
                      <p style={{ fontSize: 26, fontWeight: 800, color: item.color, letterSpacing: -0.025, lineHeight: 1.1 }}>{item.value}</p>
                      <p style={{ fontSize: 11, color: '#5c5850', marginTop: 4 }}>{item.label} ›</p>
                    </div>
                  ))}
                </div>
                <div style={{ height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                  {[{ color: '#dedad0' }, { color: '#f0b880' }, { color: '#a8c880' }, { color: '#70b860' }].map((seg, i) => {
                    const pct = (vocabStats.byFamiliarity[i] / vocabStats.total) * 100
                    return pct > 0 ? <div key={i} style={{ width: `${pct}%`, background: seg.color, transition: 'width 0.8s ease-out' }} /> : null
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  {['陌生', '模糊', '熟悉', '掌握'].map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: ['#dedad0', '#f0b880', '#a8c880', '#70b860'][i] }} />
                      <span style={{ fontSize: 10, color: '#5c5850' }}>{label} {vocabStats.byFamiliarity[i]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* ── Daily Reminder ── */}
      {isNotifSupported() && (
        <>
          <SectionTitle>每日学习提醒</SectionTitle>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                background: notifPrefs.enabled ? '#edf8f2' : '#f0ede6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>🔔</div>
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f0e0c', marginBottom: 3 }}>
                  {notifPrefs.enabled ? '提醒已开启' : '开启每日提醒'}
                </p>
                <p style={{ fontSize: 12, color: '#9e998e', lineHeight: 1.5 }}>
                  {notifPermission === 'denied'
                    ? '通知权限被拒绝，请在浏览器设置中允许'
                    : notifPrefs.enabled
                      ? `每天 ${notifPrefs.time} 提醒你打卡`
                      : '每天到点提醒，帮你保持连续打卡'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {notifPrefs.enabled && (
                  <input
                    type="time" value={notifPrefs.time}
                    onChange={e => handleNotifTimeChange(e.target.value)}
                    style={{
                      background: '#f5f3ef', border: '1.5px solid #e5e1d8',
                      borderRadius: 10, padding: '8px 10px', fontSize: 13,
                      color: '#0f0e0c', fontFamily: 'inherit',
                    }}
                  />
                )}
                <button
                  onClick={handleToggleReminder}
                  disabled={notifPermission === 'denied'}
                  style={{
                    minHeight: 40, padding: '8px 14px',
                    borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: notifPermission === 'denied' ? 'default' : 'pointer',
                    border: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
                    background: notifPrefs.enabled ? '#fdf0f0' : 'linear-gradient(135deg, #f28040, #e05020)',
                    color: notifPrefs.enabled ? '#d94040' : '#fff',
                    boxShadow: notifPrefs.enabled ? 'none' : '0 3px 10px rgba(232,103,42,0.3)',
                  }}
                >{notifPrefs.enabled ? '关闭' : '开启'}</button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Share + Logout ── */}
      <button onClick={() => setShowShare(true)} style={{
        width: '100%', padding: '13px', borderRadius: 14, marginBottom: 12,
        background: 'linear-gradient(135deg, #fef2ea, #fff8f4)',
        border: '1.5px solid #f3c4a2', cursor: 'pointer',
        fontSize: 14, fontWeight: 700, color: '#e8672a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 2px 8px rgba(232,103,42,0.1)',
        transition: 'filter 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
        onMouseLeave={e => e.currentTarget.style.filter = ''}
      >
        🏆 分享我的学习进度
      </button>

      <Button variant="secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
        退出登录
      </Button>

      {showDiagnostic && (
        <DiagnosticModal
          initialProfile={diagnostic}
          onClose={() => setShowDiagnostic(false)}
          onSave={handleSaveDiagnostic}
        />
      )}

      {/* ── Share Modal ── */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowShare(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg, #f28040 0%, #e05020 100%)', padding: '28px 28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 10 }}>🎓</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 5 }}>{displayName} 的英语学习报告</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>AI 英语陪练 · {new Date().toLocaleDateString('zh-CN')}</p>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {[
                  { emoji: '🔥', value: `${streak} 天`, label: '连续打卡' },
                  { emoji: '📚', value: `${totalCompleted} 节`, label: '完成课程' },
                  { emoji: '⭐', value: `${avgScore || '--'} 分`, label: '平均得分' },
                  { emoji: '📖', value: `${vocabStats?.total || 0} 词`, label: '词汇积累' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#faf9f6', borderRadius: 14, padding: '14px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: 20 }}>{item.emoji}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#0f0e0c', letterSpacing: -0.02, marginTop: 4 }}>{item.value}</p>
                    <p style={{ fontSize: 11, color: '#9e998e', marginTop: 3 }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button onClick={downloadShareImage} style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #f28040, #e05020)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  boxShadow: '0 3px 10px rgba(232,103,42,0.3)',
                }}>⬇ 下载图片</button>
                <button onClick={() => setShowShare(false)} style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: '#f5f3ef', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#5c5850',
                }}>关闭</button>
              </div>
              <p style={{ fontSize: 11, color: '#9e998e', textAlign: 'center' }}>也可截图此页面分享到朋友圈</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Profile
