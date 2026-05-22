import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import { modules, phonicsLessons } from '../data/phonics'
import { intonationLessons } from '../data/intonation'
import { mindsetLessons } from '../data/mindset'
import { demoLessons } from '../data/demo'
import { sceneCategories } from '../data/scenes'
import { fluencyLessons } from '../data/fluency'
import MilestoneModal, { checkMilestone } from '../components/ui/MilestoneModal'
import { getDueVocabulary } from '../services/supabase'
import { speak } from '../utils/tts'

const routeMap = {
  phonics: '/course/phonics', intonation: '/course/intonation', mindset: '/course/mindset',
  demo: '/course/demo', scenes: '/course/scenes', fluency: '/course/fluency', tech: '/course/tech',
}

const getTimeGreeting = () => {
  const h = new Date().getHours()
  if (h < 6)  return '夜深了'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
}

const getEmmaHint = (progress, streak, getModuleCompletion, isModuleUnlocked, dueVocabCount) => {
  const total = progress.filter(p => p.status === 'completed').length
  if (total === 0) return '从「自然拼读」开始，发音是英语的地基，打好了后面全会更轻松 🎓'
  const phonicsPct = getModuleCompletion('phonics', 22)
  if (phonicsPct < 50) return `拼读进度 ${phonicsPct}%，再完成 ${Math.ceil((50 - phonicsPct) * 22 / 100)} 课就解锁「语音语调」！`
  if (dueVocabCount > 3) return `词汇本有 ${dueVocabCount} 个单词等待复习，趁热打铁效果最好 📚`
  if (streak === 0 && total > 0) return '好久不见！每天一课，坚持比爆发更有效。一起继续吧 💪'
  if (streak >= 7) return `连续 ${streak} 天打卡，状态绝佳 🔥 保持节奏，有问题随时来问我！`
  return '有学习计划或语法疑问？点我聊聊 😊'
}

const allScenes = sceneCategories.flatMap(cat => cat.scenes || [])

const LEARNING_PATH = [
  { moduleId: 'phonics',    lessons: phonicsLessons,    getPath: id => `/course/phonics/${id}`,    label: '自然拼读 · Phonics',   icon: '🔤' },
  { moduleId: 'intonation', lessons: intonationLessons, getPath: id => `/course/intonation/${id}`, label: '语音语调 · Intonation', icon: '🎵' },
  { moduleId: 'mindset',    lessons: mindsetLessons,    getPath: id => `/course/mindset/${id}`,    label: '认知重塑 · Mindset',   icon: '🧠' },
  { moduleId: 'demo',       lessons: demoLessons,       getPath: id => `/course/demo/${id}`,       label: '场景演绎 · Demo',      icon: '🎬' },
  { moduleId: 'scenes',     lessons: allScenes,         getPath: id => `/course/scenes/${id}`,     label: '场景实战 · Scenes',    icon: '💬' },
  { moduleId: 'fluency',    lessons: fluencyLessons,    getPath: id => `/course/fluency/${id}`,    label: '自如交流 · Fluency',   icon: '🗣️' },
]

const Dashboard = () => {
  const { user } = useUserStore()
  const { progress, streak, checkedInToday, loading: progressLoading, weeklyLessonCounts, fetchProgress, doCheckIn, getModuleCompletion, isModuleUnlocked, dueVocabCount } = useProgressStore()
  const navigate = useNavigate()
  const [milestone, setMilestone] = useState(null)
  const [wordOfDay, setWordOfDay] = useState(null)

  useEffect(() => { if (user) fetchProgress(user.id) }, [user])

  useEffect(() => {
    if (!user) return
    const todayKey = `wod_${new Date().toISOString().split('T')[0]}`
    const cached = localStorage.getItem(todayKey)
    if (cached) { try { setWordOfDay(JSON.parse(cached)) } catch {} return }
    getDueVocabulary(user.id).then(words => {
      if (!words.length) return
      const w = words[Math.floor(Math.random() * Math.min(words.length, 5))]
      localStorage.setItem(todayKey, JSON.stringify(w))
      setWordOfDay(w)
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    if (progressLoading || !user) return
    const completedCount = progress.filter(p => p.status === 'completed').length
    if (completedCount >= 1 && checkMilestone('first_lesson')) { setMilestone('first_lesson'); return }
    if (streak >= 7  && checkMilestone('streak_7'))  { setMilestone('streak_7');  return }
    if (streak >= 30 && checkMilestone('streak_30')) { setMilestone('streak_30'); return }
    if (progress.some(p => p.score >= 90) && checkMilestone('score_90')) { setMilestone('score_90'); return }
    for (const mod of modules) {
      const pct = getModuleCompletion(mod.id, mod.totalLessons)
      if (pct === 100 && checkMilestone(`first_module_${mod.id}`)) { setMilestone('first_module'); return }
    }
  }, [progressLoading]) // eslint-disable-line

  const dailyGoal = parseInt(localStorage.getItem('dailyGoal') || '2', 10)
  const todayStr = new Date().toISOString().split('T')[0]
  const todayCompleted = weeklyLessonCounts?.[todayStr] || 0
  const goalReached = todayCompleted >= dailyGoal
  const weekTotal = Object.values(weeklyLessonCounts || {}).reduce((s, v) => s + v, 0)
  const totalCompleted = progress.filter(p => p.status === 'completed').length
  const avgScore = progress.filter(p => p.score && p.status === 'completed').length > 0
    ? Math.round(progress.filter(p => p.score && p.status === 'completed').reduce((s, p) => s + p.score, 0) / progress.filter(p => p.score && p.status === 'completed').length)
    : null

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  const nextLessonInfo = useMemo(() => {
    for (const track of LEARNING_PATH) {
      if (!isModuleUnlocked(track.moduleId)) continue
      const lesson = track.lessons.find(l => {
        const p = progress.find(p => p.lesson_id === l.id)
        return !p || p.status !== 'completed'
      })
      if (lesson) return { lesson, ...track }
    }
    const first = LEARNING_PATH[0]
    return { lesson: first.lessons[0], ...first }
  }, [progress, isModuleUnlocked])

  const lowScoreLesson = useMemo(() => {
    const poorOnes = progress.filter(p => p.status === 'completed' && p.score != null && p.score < 70)
    if (poorOnes.length === 0) return null
    const worst = poorOnes.reduce((a, b) => a.score < b.score ? a : b)
    for (const track of LEARNING_PATH) {
      const lesson = track.lessons.find(l => l.id === worst.lesson_id)
      if (lesson) return { lesson, score: worst.score, ...track }
    }
    return null
  }, [progress])

  const weakModule = useMemo(() => {
    const scored = LEARNING_PATH
      .filter(t => isModuleUnlocked(t.moduleId))
      .map(t => {
        const modProgress = progress.filter(p => p.module_id === t.moduleId && p.score)
        if (modProgress.length < 2) return null
        const avg = Math.round(modProgress.reduce((s, p) => s + p.score, 0) / modProgress.length)
        return { ...t, avg }
      })
      .filter(Boolean)
    if (scored.length === 0) return null
    return scored.reduce((a, b) => a.avg < b.avg ? a : b)
  }, [progress, isModuleUnlocked])

  const recommendations = useMemo(() => {
    const list = []
    list.push({
      icon: nextLessonInfo.icon, title: nextLessonInfo.lesson.title,
      sub: nextLessonInfo.label, to: nextLessonInfo.getPath(nextLessonInfo.lesson.id),
      tag: '主线', tagColor: '#e8672a',
    })
    if (dueVocabCount > 0) {
      list.push({ icon: '📚', title: `复习 ${dueVocabCount} 个单词`, sub: '到期词汇 · 遗忘曲线复习', to: '/vocabulary?tab=due', tag: '复习', tagColor: '#3a9a5f' })
    }
    if (lowScoreLesson && list.length < 3) {
      list.push({ icon: lowScoreLesson.icon, title: `重练 ${lowScoreLesson.lesson.title}`, sub: `上次得分 ${lowScoreLesson.score} 分 · 建议重练`, to: lowScoreLesson.getPath(lowScoreLesson.lesson.id), tag: '补弱', tagColor: '#d94040' })
    }
    if (weakModule && weakModule.avg < 75 && list.length < 3) {
      list.push({ icon: weakModule.icon, title: `加强 ${weakModule.label.split('·')[0].trim()}`, sub: `当前平均 ${weakModule.avg} 分`, to: `/course/${weakModule.moduleId}`, tag: '加强', tagColor: '#d48a10' })
    }
    if (list.length < 3) {
      list.push(isModuleUnlocked('scenes')
        ? { icon: '💬', title: '场景实战对话', sub: '100场景 · AI角色扮演', to: '/course/scenes', tag: '练习', tagColor: '#7a6bba' }
        : { icon: '📝', title: '语法纠错练习', sub: '输入英文，AI 实时批改', to: '/practice/speaking', tag: '练习', tagColor: '#7a6bba' })
    }
    return list.slice(0, 3)
  }, [progress, nextLessonInfo, isModuleUnlocked, dueVocabCount, weakModule, lowScoreLesson])

  const nextModPct = getModuleCompletion(nextLessonInfo.moduleId, modules.find(m => m.id === nextLessonInfo.moduleId)?.totalLessons || 10)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {milestone && <MilestoneModal milestoneKey={milestone} onClose={() => setMilestone(null)} />}

      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(180deg, #fff5ee 0%, #fef9f5 60%, transparent 100%)',
        padding: '28px 20px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, color: '#e8672a', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 5 }}>
              {getTimeGreeting()} · 欢迎回来
            </p>
            <h1 className="font-title" style={{ fontSize: 30, color: '#0f0e0c', lineHeight: 1.15 }}>
              {displayName} 👋
            </h1>
          </div>

          {/* Streak badge */}
          {streak > 0 ? (
            <div style={{
              background: '#fff5ea', border: '1.5px solid #f3c4a2',
              borderRadius: 18, padding: '10px 14px', textAlign: 'center', minWidth: 74,
              boxShadow: '0 2px 8px rgba(232,103,42,0.15)',
            }}>
              <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>🔥</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#e8672a', letterSpacing: -0.03, lineHeight: 1 }}>{streak}</p>
              <p style={{ fontSize: 10, color: '#9e998e', fontWeight: 600, marginTop: 3 }}>天连续</p>
            </div>
          ) : (
            <div style={{
              background: '#f5f3ef', border: '1.5px solid #e5e1d8',
              borderRadius: 18, padding: '10px 14px', textAlign: 'center', minWidth: 74,
            }}>
              <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>💤</p>
              <p style={{ fontSize: 12, color: '#9e998e', fontWeight: 600, marginTop: 4 }}>未打卡</p>
            </div>
          )}
        </div>

        {/* Check-in / Goal bar */}
        {!checkedInToday ? (
          <button
            onClick={() => doCheckIn(user.id)}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #f28040, #e05020)',
              color: '#fff', border: 'none', borderRadius: 16,
              padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(232,103,42,0.32)',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.07)'}
            onMouseLeave={e => e.currentTarget.style.filter = ''}
          >
            📅 今日打卡，连续 {streak + 1} 天
          </button>
        ) : dailyGoal > 0 ? (
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14,
            padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: goalReached ? '#3a9a5f' : '#0f0e0c' }}>
                {goalReached ? '🎯 今日目标完成！' : '📅 今日目标'}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 13, color: goalReached ? '#3a9a5f' : '#5c5850', fontWeight: 600 }}>
                  {todayCompleted}/{dailyGoal} 课
                </span>
                <button onClick={() => navigate('/profile')} style={{ fontSize: 11, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer' }}>改目标</button>
              </div>
            </div>
            <div style={{ height: 7, background: '#f0ede6', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 7,
                width: `${Math.min((todayCompleted / dailyGoal) * 100, 100)}%`,
                background: goalReached ? '#3a9a5f' : 'linear-gradient(90deg, #f28040, #e05020)',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 13, color: '#9e998e' }}>
            ✅ 今日已打卡
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── New User Welcome ── */}
        {progress.length === 0 && !progressLoading && (
          <div style={{
            background: 'linear-gradient(135deg, #fef2ea 0%, #fff8f4 100%)',
            border: '1.5px solid #f3c4a2', borderRadius: 20,
            padding: '22px 22px', marginBottom: 20,
            boxShadow: '0 4px 20px rgba(232,103,42,0.1)',
          }}>
            <p style={{ fontSize: 24, marginBottom: 10 }}>👋</p>
            <p className="font-title" style={{ fontSize: 17, color: '#0f0e0c', marginBottom: 8 }}>
              欢迎来到 AI 英语陪练！
            </p>
            <p style={{ fontSize: 13, color: '#5c5850', lineHeight: 1.65, marginBottom: 18 }}>
              你的英语学习之旅从这里开始。先从「自然拼读」打好发音基础，
              后面的语调、对话、场景课会一路解锁。
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/course/phonics')} style={{
                background: 'linear-gradient(135deg, #f28040, #e05020)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '10px 18px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(232,103,42,0.3)',
              }}>
                🔤 开始第一课 →
              </button>
              <button onClick={() => navigate('/teacher')} style={{
                background: '#fff', color: '#e8672a', border: '1.5px solid #f3c4a2',
                borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                问 Emma 老师
              </button>
            </div>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '✅', value: totalCompleted, label: '已完成课' },
            { icon: '📚', value: dueVocabCount > 0 ? dueVocabCount : weekTotal || '--', label: dueVocabCount > 0 ? '待复习词' : '本周课程' },
            { icon: '⭐', value: avgScore !== null ? avgScore : '--', label: '平均得分' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: '#fff', borderRadius: 18,
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              padding: '16px 10px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</p>
              <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.025, color: '#0f0e0c', lineHeight: 1.1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, color: '#9e998e', marginTop: 4 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Continue Learning ── */}
        <div
          onClick={() => navigate(nextLessonInfo.getPath(nextLessonInfo.lesson.id))}
          style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            cursor: 'pointer', marginBottom: 16,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
        >
          <div style={{ height: 4, background: 'linear-gradient(90deg, #f28040, #e05020)' }} />
          <div style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#e8672a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              ▶ 继续学习
            </p>
            <h3 className="font-title" style={{ fontSize: 19, color: '#0f0e0c', marginBottom: 5 }}>
              {nextLessonInfo.lesson.title}
            </h3>
            <p style={{ fontSize: 13, color: '#9e998e', marginBottom: 16 }}>
              {nextLessonInfo.icon} {nextLessonInfo.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 6, background: '#f0ede6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${nextModPct}%`, background: 'linear-gradient(90deg, #f28040, #e05020)', borderRadius: 6, transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 12, color: '#9e998e', flexShrink: 0 }}>{nextModPct}% 完成</span>
              <div style={{
                background: 'linear-gradient(135deg, #f28040, #e05020)', color: '#fff',
                borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700,
                flexShrink: 0, boxShadow: '0 3px 10px rgba(232,103,42,0.3)',
              }}>
                开始 →
              </div>
            </div>
          </div>
        </div>

        {/* ── Emma Advisory ── */}
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 18, padding: '16px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #f28040, #e05020)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16,
            boxShadow: '0 3px 10px rgba(232,103,42,0.3)',
          }}>E</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#e8672a', marginBottom: 3 }}>Emma 老师</p>
            <p style={{ fontSize: 13.5, color: '#0f0e0c', lineHeight: 1.55 }}>
              {getEmmaHint(progress, streak, getModuleCompletion, isModuleUnlocked, dueVocabCount)}
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher')}
            style={{
              fontSize: 12, fontWeight: 600, color: '#e8672a',
              background: '#fef2ea', border: '1px solid #f3c4a2',
              borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
              flexShrink: 0, whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fde8d6'}
            onMouseLeave={e => e.currentTarget.style.background = '#fef2ea'}
          >
            去问 →
          </button>
        </div>

        {/* ── Module Grid ── */}
        <p className="section-title">学习进度</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {modules.map(mod => {
            const pct = getModuleCompletion(mod.id, mod.totalLessons)
            const unlocked = isModuleUnlocked(mod.id)
            return (
              <div
                key={mod.id}
                onClick={() => navigate(routeMap[mod.id] || '/course')}
                style={{
                  background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 18, padding: '16px 16px', cursor: 'pointer',
                  opacity: unlocked ? 1 : 0.55,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
                onMouseEnter={e => { if (unlocked) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                    background: unlocked ? `${mod.color}18` : '#f0ede6',
                    border: `1.5px solid ${unlocked ? mod.color + '30' : '#e5e1d8'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 21,
                  }}>
                    {unlocked ? mod.icon : '🔒'}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: unlocked ? mod.color : '#9e998e' }}>{pct}%</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#0f0e0c', marginBottom: 2 }}>{mod.name}</p>
                <p style={{ fontSize: 11, color: '#9e998e', marginBottom: 10 }}>{mod.nameEn} · {mod.totalLessons}课</p>
                <div style={{ height: 4, background: '#f0ede6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: unlocked ? mod.color : '#e5e1d8', borderRadius: 4, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Daily Recommendations ── */}
        <p className="section-title">今日推荐</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {recommendations.map((item, i) => (
            <div
              key={i}
              onClick={() => navigate(item.to)}
              style={{
                background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: `${item.tagColor}14`,
                border: `1.5px solid ${item.tagColor}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 21,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f0e0c', marginBottom: 3 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: '#9e998e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                  background: `${item.tagColor}14`, color: item.tagColor,
                }}>{item.tag}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#c0bdb8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* ── Word of Day ── */}
        {wordOfDay && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">今日单词</p>
            <div style={{
              background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 18, padding: '18px 18px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0f0e0c' }}>{wordOfDay.word}</span>
                  {wordOfDay.phonetic && (
                    <span style={{ fontSize: 12, color: '#9e998e', fontFamily: 'monospace' }}>{wordOfDay.phonetic}</span>
                  )}
                </div>
                <p style={{ fontSize: 13.5, color: '#5c5850', marginBottom: 4 }}>{wordOfDay.meaning}</p>
                {wordOfDay.example && (
                  <p style={{ fontSize: 12, color: '#9e998e', fontStyle: 'italic' }}>"{wordOfDay.example}"</p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button onClick={() => speak(wordOfDay.word)} style={{
                  background: '#fef2ea', border: '1.5px solid #f3c4a2',
                  borderRadius: 12, padding: '8px 10px', cursor: 'pointer', fontSize: 16,
                  transition: 'background 0.15s',
                }}>🔊</button>
                <button onClick={() => navigate('/vocabulary?tab=due')} style={{
                  background: '#f5f3ef', border: '1px solid #e5e1d8',
                  borderRadius: 10, padding: '6px 8px', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: '#5c5850',
                  transition: 'background 0.15s',
                }}>复习</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Weekly Summary ── */}
        {weekTotal > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">本周总结</p>
            <div style={{
              background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 18, padding: '16px 20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {[
                  { emoji: '📗', value: weekTotal, label: '节课', color: '#3a9a5f' },
                  { emoji: '🔥', value: streak, label: '天连续', color: '#e8672a' },
                  { emoji: '⭐', value: avgScore !== null ? avgScore : '--', label: '平均分', color: '#7a6bba' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20 }}>{item.emoji}</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: item.color, letterSpacing: -0.025, lineHeight: 1.1 }}>{item.value}</p>
                    <p style={{ fontSize: 11, color: '#9e998e', marginTop: 4 }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard
