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
import { getTodayStudyMinutes } from '../utils/studyTime'
import { getWeaknessSummary } from '../utils/weakness'
import { getIeltsGoal, getIeltsGoalSummary } from '../utils/ieltsGoal'
import { LEARNING_STATE_SYNCED, LEARNING_SYNC_STATUS_CHANGED, getLearningSyncStatus, notifyLearningStateChanged, syncLearningState } from '../utils/learningStateSync'
import InstallAppCard from '../components/ui/InstallAppCard'
import { buildTodayLearningReview, saveDailyLearningReview } from '../utils/learningReview'
import DiagnosticModal, { DIAGNOSTIC_KEY, getStoredDiagnostic } from '../components/DiagnosticModal'

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

const getDiagnosticLabel = (profile) => {
  if (!profile) return '未诊断'
  const levelMap = {
    starter: '零基础起步',
    basic: '开口突破',
    speaking: '流利表达',
    ielts: '雅思/高阶',
  }
  const goalMap = {
    pronunciation: '发音优先',
    conversation: '对话优先',
    grammar: '纠错优先',
    ielts: '雅思优先',
  }
  return `${levelMap[profile.level] || '个性化'} · ${goalMap[profile.goal] || '综合提升'}`
}

const weaknessPracticeMap = {
  pronunciation: { to: '/practice/speaking', icon: '🎤', title: '补弱：发音准确度' },
  fluency: { to: '/course/fluency', icon: '🗣️', title: '补弱：流利度' },
  stress: { to: '/course/intonation', icon: '🎵', title: '补弱：重音节奏' },
  intonation: { to: '/course/intonation', icon: '🎵', title: '补弱：语音语调' },
  grammar: { to: '/practice/speaking?tab=grammar', icon: '📝', title: '补弱：语法准确' },
  vocabulary: { to: '/vocabulary', icon: '📚', title: '补弱：词汇表达' },
  communication: { to: '/course/scenes', icon: '💬', title: '补弱：沟通展开' },
}

const buildTodayPlan = ({ profile, ieltsGoal, nextLessonInfo, dueVocabCount, lowScoreLesson, topWeakness, isModuleUnlocked }) => {
  const goal = ieltsGoal ? 'ielts' : (profile?.goal || 'pronunciation')
  const level = profile?.level || 'starter'
  const minutes = Number(ieltsGoal?.dailyMinutes || profile?.minutes || 20)
  const mainMinutes = minutes >= 40 ? 16 : minutes >= 20 ? 7 : 4
  const reviewMinutes = minutes >= 40 ? 8 : minutes >= 20 ? 5 : 2
  const outputMinutes = minutes >= 40 ? 10 : minutes >= 20 ? 5 : 3
  const summaryMinutes = Math.max(1, minutes - mainMinutes - reviewMinutes - outputMinutes)

  const firstPractice = goal === 'grammar'
    ? { title: '语法纠错热身', sub: '写 2 句英文，让 AI 找出最该改的地方', to: '/practice/speaking?tab=grammar', icon: '📝' }
    : goal === 'ielts'
      ? { title: '雅思口语热身', sub: '先做 1 道 Part 1，观察 Band 反馈', to: '/practice/speaking?tab=part1', icon: '🗣️' }
      : { title: level === 'starter' ? '发音热身' : '开口热身', sub: '录 1 次短句，先把嘴巴叫醒', to: '/practice/speaking', icon: '🎤' }

  const outputPractice = goal === 'ielts'
    ? Number(ieltsGoal?.currentBand || 0) >= 6
      ? { title: '雅思深度讨论', sub: '练 1 道 Part 3，训练观点展开和让步', to: '/practice/speaking?tab=part3', icon: '🎯' }
      : { title: '雅思独白训练', sub: '做 1 张 Cue Card，练结构和展开', to: '/practice/speaking?tab=cuecard', icon: '🎓' }
    : isModuleUnlocked('scenes')
      ? { title: '场景对话输出', sub: '完成一轮真实场景对话，结束后看复盘', to: '/course/scenes', icon: '💬' }
      : { title: '句子输出训练', sub: '用今日内容说 3 句自己的英文', to: '/practice/speaking?tab=grammar', icon: '✍️' }

  return [
    { ...firstPractice, minutes: summaryMinutes, tag: '热身', color: '#4a7a9b' },
    {
      title: dueVocabCount > 0 ? `复习 ${dueVocabCount} 个到期词` : '积累今日表达',
      sub: dueVocabCount > 0 ? '先复习旧词，防止学了就忘' : '没有到期词时，手动加入 1 个今天会用的表达',
      to: dueVocabCount > 0 ? '/vocabulary?tab=due' : '/vocabulary',
      icon: '📚',
      minutes: reviewMinutes,
      tag: '词汇',
      color: '#3a9a5f',
    },
    {
      title: topWeakness ? (weaknessPracticeMap[topWeakness.type]?.title || `补弱：${topWeakness.label}`) : lowScoreLesson ? `补弱：${lowScoreLesson.lesson.title}` : nextLessonInfo.lesson.title,
      sub: topWeakness ? `最近出现 ${topWeakness.count} 次：${topWeakness.latest?.detail || '建议定向复练'}` : lowScoreLesson ? `上次 ${lowScoreLesson.score} 分，今天把它补上` : nextLessonInfo.label,
      to: topWeakness ? (weaknessPracticeMap[topWeakness.type]?.to || '/practice/speaking') : lowScoreLesson ? lowScoreLesson.getPath(lowScoreLesson.lesson.id) : nextLessonInfo.getPath(nextLessonInfo.lesson.id),
      icon: topWeakness ? (weaknessPracticeMap[topWeakness.type]?.icon || '🎯') : lowScoreLesson?.icon || nextLessonInfo.icon,
      minutes: mainMinutes,
      tag: topWeakness || lowScoreLesson ? '补弱' : '主线',
      color: topWeakness || lowScoreLesson ? '#d94040' : '#e8672a',
    },
    { ...outputPractice, minutes: outputMinutes, tag: '输出', color: '#7b5ea7' },
  ]
}

const getSyncStatusMeta = (syncStatus) => {
  const status = syncStatus?.status || 'pending'
  const map = {
    pending: { label: '待同步', color: '#d48a10', bg: '#fff8ea', dot: '●' },
    syncing: { label: '同步中', color: '#4a7a9b', bg: '#eef7fb', dot: '●' },
    synced: { label: '已同步', color: '#3a9a5f', bg: '#edf8f2', dot: '●' },
    error: { label: '需检查', color: '#d94040', bg: '#fdf0f0', dot: '●' },
  }
  const lastTime = syncStatus?.updatedAt
    ? new Date(syncStatus.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '刚刚'
  return { ...(map[status] || map.pending), lastTime, message: syncStatus?.message || '登录后会自动同步学习记录' }
}

const buildLoopSteps = ({ checkedInToday, todayMinutes, todayCompleted, targetMinutes, weaknessSummary }) => {
  const minimumStudyMinutes = Math.max(5, Math.round(targetMinutes * 0.35))
  return [
    { label: '签到', done: checkedInToday, hint: '先建立连续感' },
    { label: '输入', done: todayMinutes >= minimumStudyMinutes, hint: `学满 ${minimumStudyMinutes} 分钟` },
    { label: '输出', done: todayCompleted > 0, hint: '完成 1 课或 1 次练习' },
    { label: '复盘', done: weaknessSummary.length > 0, hint: '留下一个弱点记录' },
  ]
}

const Dashboard = () => {
  const { user } = useUserStore()
  const { progress, streak, checkedInToday, loading: progressLoading, weeklyLessonCounts, fetchProgress, doCheckIn, getModuleCompletion, isModuleUnlocked, dueVocabCount } = useProgressStore()
  const navigate = useNavigate()
  const [milestone, setMilestone] = useState(null)
  const [wordOfDay, setWordOfDay] = useState(null)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [diagnostic, setDiagnostic] = useState(() => getStoredDiagnostic())
  const [ieltsGoal, setIeltsGoal] = useState(() => getIeltsGoal())
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [weaknessSummary, setWeaknessSummary] = useState(() => getWeaknessSummary())
  const [syncStatus, setSyncStatus] = useState(() => getLearningSyncStatus())

  useEffect(() => { if (user) fetchProgress(user.id) }, [user, fetchProgress])
  useEffect(() => { setTodayMinutes(getTodayStudyMinutes()) }, [])
  useEffect(() => {
    if (!progressLoading && progress.length === 0 && !diagnostic) setShowDiagnostic(true)
  }, [progressLoading, progress.length, diagnostic])
  useEffect(() => {
    const refreshWeaknesses = () => setWeaknessSummary(getWeaknessSummary())
    refreshWeaknesses()
    window.addEventListener('focus', refreshWeaknesses)
    return () => window.removeEventListener('focus', refreshWeaknesses)
  }, [])
  useEffect(() => {
    const refreshGoal = () => setIeltsGoal(getIeltsGoal())
    window.addEventListener('focus', refreshGoal)
    return () => window.removeEventListener('focus', refreshGoal)
  }, [])
  useEffect(() => {
    const refreshCloudState = () => {
      setDiagnostic(getStoredDiagnostic())
      setIeltsGoal(getIeltsGoal())
      setWeaknessSummary(getWeaknessSummary())
      setTodayMinutes(getTodayStudyMinutes())
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

  useEffect(() => {
    if (!user) return
    const todayKey = `wod_${new Date().toISOString().split('T')[0]}`
    const cached = localStorage.getItem(todayKey)
    if (cached) { try { setWordOfDay(JSON.parse(cached)) } catch { /* ignore stale cache */ } return }
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
  }, [nextLessonInfo, isModuleUnlocked, dueVocabCount, weakModule, lowScoreLesson])

  const nextModPct = getModuleCompletion(nextLessonInfo.moduleId, modules.find(m => m.id === nextLessonInfo.moduleId)?.totalLessons || 10)
  const todayPlan = useMemo(() => buildTodayPlan({
    profile: diagnostic,
    ieltsGoal,
    nextLessonInfo,
    dueVocabCount,
    lowScoreLesson,
    topWeakness: weaknessSummary[0],
    isModuleUnlocked,
  }), [diagnostic, ieltsGoal, nextLessonInfo, dueVocabCount, lowScoreLesson, weaknessSummary, isModuleUnlocked])
  const ieltsSummary = getIeltsGoalSummary(ieltsGoal)
  const targetMinutes = Number(ieltsGoal?.dailyMinutes || diagnostic?.minutes || 20)
  const loopSteps = buildLoopSteps({ checkedInToday, todayMinutes, todayCompleted, targetMinutes, weaknessSummary })
  const loopDoneCount = loopSteps.filter(step => step.done).length
  const nextLoopStep = loopSteps.find(step => !step.done)
  const syncMeta = getSyncStatusMeta(syncStatus)
  const todayReview = useMemo(() => buildTodayLearningReview({
    todayMinutes,
    targetMinutes,
    todayCompleted,
    dueVocabCount,
    weaknessSummary,
    ieltsGoal,
    nextLessonInfo,
  }), [todayMinutes, targetMinutes, todayCompleted, dueVocabCount, weaknessSummary, ieltsGoal, nextLessonInfo])
  const reviewActionTo = todayReview.topWeaknessType
    ? (weaknessPracticeMap[todayReview.topWeaknessType]?.to || '/practice/speaking')
    : dueVocabCount > 0
      ? '/vocabulary?tab=due'
      : nextLessonInfo.getPath(nextLessonInfo.lesson.id)

  useEffect(() => {
    saveDailyLearningReview(todayReview)
  }, [todayReview])

  const handleSaveDiagnostic = (profile) => {
    localStorage.setItem(DIAGNOSTIC_KEY, JSON.stringify(profile))
    notifyLearningStateChanged()
    setDiagnostic(profile)
    setShowDiagnostic(false)
  }

  const handleManualSync = () => {
    if (!user?.id) return
    syncLearningState(user.id).catch(() => {})
  }

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', overflowX: 'hidden' }}>

      {milestone && <MilestoneModal milestoneKey={milestone} onClose={() => setMilestone(null)} />}
      {showDiagnostic && (
        <DiagnosticModal
          initialProfile={diagnostic}
          onClose={() => setShowDiagnostic(false)}
          onSave={handleSaveDiagnostic}
        />
      )}

      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(180deg, #fff5ee 0%, #fef9f5 60%, transparent 100%)',
        padding: '28px clamp(14px, 4vw, 20px) 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 20 }}>
          <div style={{ minWidth: 0 }}>
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
              background: streak >= 30 ? 'linear-gradient(135deg, #fff3ea, #ffe0c0)' : '#fff5ea',
              border: `1.5px solid ${streak >= 30 ? '#e8a050' : '#f3c4a2'}`,
              borderRadius: 18, padding: '10px 14px', textAlign: 'center', minWidth: 74,
              boxShadow: streak >= 30 ? '0 4px 14px rgba(232,103,42,0.25)' : '0 2px 8px rgba(232,103,42,0.15)',
            }}>
              <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{streak >= 30 ? '⚡' : streak >= 7 ? '🔥' : '🔥'}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#e8672a', letterSpacing: -0.03, lineHeight: 1 }}>{streak}</p>
              <p style={{ fontSize: 10, color: streak >= 30 ? '#c45c1a' : '#9e998e', fontWeight: 600, marginTop: 3 }}>
                {streak >= 30 ? '天传奇' : streak >= 7 ? '天连续' : '天连续'}
              </p>
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
          <div>
            {streak > 0 && new Date().getHours() >= 20 && (
              <div style={{
                background: '#fff5ea', border: '1px solid #f5c4a8',
                borderRadius: 12, padding: '8px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <p style={{ fontSize: 12, color: '#c45c1a', fontWeight: 600, lineHeight: 1.45 }}>
                  今天还没打卡！{streak} 天连续记录今晚就会中断，快来签到！
                </p>
              </div>
            )}
            <button
              onClick={() => doCheckIn(user.id)}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #f28040, #e05020)',
                color: '#fff', border: 'none', borderRadius: 16,
                minHeight: 54, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(232,103,42,0.32)',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.07)'}
              onMouseLeave={e => e.currentTarget.style.filter = ''}
            >
              📅 今日打卡，连续 {streak + 1} 天
            </button>
          </div>
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

      <div style={{ padding: '0 clamp(14px, 4vw, 20px)' }}>

        {/* ── New User Welcome ── */}
        {progress.length === 0 && !progressLoading && (
          <div style={{
            background: 'linear-gradient(135deg, #fef2ea 0%, #fff8f4 100%)',
            border: '1.5px solid #f3c4a2', borderRadius: 20,
            padding: '22px 22px', marginBottom: 20,
            boxShadow: '0 4px 20px rgba(232,103,42,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                background: 'linear-gradient(135deg, #f28040, #e05020)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 4px 14px rgba(232,103,42,0.3)',
              }}>🎓</div>
              <div>
                <p className="font-title" style={{ fontSize: 17, color: '#0f0e0c', marginBottom: 3 }}>
                  欢迎来到 AI 英语陪练！
                </p>
                <p style={{ fontSize: 12, color: '#9e998e' }}>3 步开始你的个性化学习之旅</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {[
                { step: '01', title: '做 1 分钟诊断', desc: '告诉 AI 你的起点和目标，它会自动安排每日计划', icon: '🎯', done: !!diagnostic },
                { step: '02', title: '完成第一课', desc: '从「自然拼读 Lesson 1」开始，AI 打分反馈发音', icon: '🔤', done: false },
                { step: '03', title: '每天打卡坚持', desc: '连续打卡激活进度追踪和弱点分析系统', icon: '🔥', done: checkedInToday },
              ].map(item => (
                <div key={item.step} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: item.done ? '#edf8f2' : '#fff',
                  border: `1px solid ${item.done ? '#b5e0c8' : '#f3c4a2'}`,
                  borderRadius: 14, padding: '10px 14px',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: item.done ? '#3a9a5f' : '#fef2ea',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: item.done ? 14 : 16,
                    color: item.done ? '#fff' : undefined,
                    fontWeight: 800,
                  }}>{item.done ? '✓' : item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: item.done ? '#3a9a5f' : '#0f0e0c', marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: '#7a756c', lineHeight: 1.45 }}>{item.desc}</p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 8px',
                    color: item.done ? '#3a9a5f' : '#e8672a',
                    background: item.done ? '#d8f0e8' : '#fff3ee',
                  }}>{item.done ? '已完成' : item.step}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => diagnostic ? navigate('/course/phonics/phonics_01') : setShowDiagnostic(true)} style={{
                background: 'linear-gradient(135deg, #f28040, #e05020)', color: '#fff',
                border: 'none', borderRadius: 12, minHeight: 44, padding: '10px 18px', flex: 1,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(232,103,42,0.3)',
              }}>
                {diagnostic ? '开始第一课 →' : '做 1 分钟诊断 →'}
              </button>
              <button onClick={() => navigate('/teacher')} style={{
                background: '#fff', color: '#e8672a', border: '1.5px solid #f3c4a2',
                borderRadius: 12, minHeight: 44, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                问 Emma 老师
              </button>
            </div>
          </div>
        )}

        {/* ── 英雄行动卡：唯一最优先任务 ── */}
        {progress.length > 0 && todayPlan.length > 0 && (() => {
          const hero = todayPlan[2] || todayPlan[0]  // 主线/补弱 优先
          const isCheckedIn = checkedInToday
          return (
            <div
              onClick={() => navigate(hero.to)}
              style={{
                background: 'linear-gradient(135deg, #f28040 0%, #e05020 100%)',
                borderRadius: 20, padding: '20px 20px', marginBottom: 16,
                boxShadow: '0 6px 24px rgba(232,103,42,0.30)',
                cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', gap: 16,
                WebkitTapHighlightColor: 'transparent',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.06)'}
              onMouseLeave={e => e.currentTarget.style.filter = ''}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 17, flexShrink: 0,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{hero.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 800, opacity: 0.82, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isCheckedIn ? '现在就做这件事' : '打卡后立刻开始'}
                </p>
                <p style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25, marginBottom: 3 }}>{hero.title}</p>
                <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hero.sub}</p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ fontSize: 20, fontWeight: 800 }}>{hero.minutes}</p>
                <p style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>分钟</p>
              </div>
            </div>
          )
        })()}

        {/* ── Diagnostic / Today Plan（折叠为次要信息） ── */}
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 20, padding: '18px 18px', marginBottom: 20,
          boxShadow: '0 3px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#e8672a', marginBottom: 5 }}>今日 {ieltsGoal?.dailyMinutes || diagnostic?.minutes || 20} 分钟计划</p>
              <h2 className="font-title" style={{ fontSize: 19, color: '#0f0e0c', marginBottom: 4 }}>
                {ieltsGoal ? `雅思 Band ${ieltsGoal.targetBand} 目标` : diagnostic ? getDiagnosticLabel(diagnostic) : '先诊断，再安排'}
              </h2>
              <p style={{ fontSize: 12.5, color: '#5c5850', lineHeight: 1.55 }}>
                {ieltsGoal
                  ? `当前 ${ieltsGoal.currentBand}，还差 ${ieltsSummary?.gap.toFixed(1)} 分，今天优先练评分维度。`
                  : diagnostic ? `按你每天 ${diagnostic.minutes || 20} 分钟的节奏安排，练完就算今天很扎实。` : '用 3 个问题判断起点，自动生成今天该练什么。'}
              </p>
            </div>
            <button onClick={() => setShowDiagnostic(true)} style={{
              background: diagnostic ? '#f5f3ef' : 'linear-gradient(135deg, #f28040, #e05020)',
              color: diagnostic ? '#5c5850' : '#fff',
              border: diagnostic ? '1px solid #e5e1d8' : 'none',
              borderRadius: 12, minHeight: 40, padding: '8px 12px', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>
              {diagnostic ? '重测' : '开始诊断'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {todayPlan.map((item, i) => (
              <div key={`${item.tag}-${i}`} onClick={() => navigate(item.to)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                border: '1px solid #eee9df', borderRadius: 15,
                minHeight: 66, padding: '12px 13px', background: '#fffdfa', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 13, flexShrink: 0,
                  background: `${item.color}14`, border: `1.5px solid ${item.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 7px', marginBottom: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f0e0c', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.title}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, color: item.color,
                      background: `${item.color}12`, borderRadius: 20, padding: '2px 7px', flexShrink: 0,
                    }}>{item.tag}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#7a756c', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.sub}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: item.color, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>{item.minutes} 分</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Daily Loop / Sync ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 20,
        }}>
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 18, padding: '15px 16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#e8672a', marginBottom: 4 }}>今日学习闭环</p>
                <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f0e0c' }}>
                  {loopDoneCount}/4 步完成
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, color: loopDoneCount === 4 ? '#3a9a5f' : '#d48a10',
                background: loopDoneCount === 4 ? '#edf8f2' : '#fff8ea',
                borderRadius: 20, padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {loopDoneCount === 4 ? '今天很完整' : `下一步：${nextLoopStep?.label}`}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
              {loopSteps.map(step => (
                <div key={step.label} style={{
                  borderRadius: 12, padding: '9px 6px', textAlign: 'center',
                  background: step.done ? '#edf8f2' : '#faf9f6',
                  border: `1px solid ${step.done ? '#b5e0c8' : '#ede9e1'}`,
                  minWidth: 0,
                }}>
                  <p style={{ fontSize: 15, lineHeight: 1, marginBottom: 4 }}>{step.done ? '✓' : '○'}</p>
                  <p style={{ fontSize: 11.5, fontWeight: 800, color: step.done ? '#3a9a5f' : '#5c5850' }}>{step.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#7a756c', lineHeight: 1.55 }}>
              {loopDoneCount === 4
                ? '今天的学习从打卡、输入、输出到复盘都闭合了，明天系统会继续根据弱点安排。'
                : nextLoopStep?.hint || '继续完成今天剩下的学习步骤。'}
            </p>
          </div>

          <div style={{
            background: syncMeta.bg, border: `1px solid ${syncMeta.color}33`,
            borderRadius: 18, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 12, flexShrink: 0,
              background: '#fff', color: syncMeta.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900,
            }}>{syncMeta.dot}</div>
            <div style={{ flex: '1 1 190px', minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f0e0c', marginBottom: 2 }}>
                云同步 · {syncMeta.label}
              </p>
              <p style={{ fontSize: 11.5, color: '#5c5850', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                {syncMeta.message} · {syncMeta.lastTime}
              </p>
            </div>
            <button onClick={handleManualSync} style={{
              fontSize: 11, fontWeight: 800, color: syncMeta.color,
              background: '#fff', border: `1px solid ${syncMeta.color}44`,
              borderRadius: 10, minHeight: 36, padding: '6px 10px', cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}>刷新</button>
          </div>
        </div>

        {/* ── Daily Review ── */}
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 18, padding: '16px 18px', marginBottom: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#7b5ea7', marginBottom: 4 }}>今日复盘闭环</p>
              <p style={{ fontSize: 15.5, fontWeight: 800, color: '#0f0e0c', lineHeight: 1.35 }}>
                {todayReview.summary}
              </p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800, color: todayReview.level === 'closed' ? '#3a9a5f' : '#d48a10',
              background: todayReview.level === 'closed' ? '#edf8f2' : '#fff8ea',
              borderRadius: 20, padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {todayReview.level === 'closed' ? '已闭环' : '待补齐'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
            {todayReview.wins.map(item => (
              <div key={item} style={{
                background: '#faf9f6', border: '1px solid #ede9e1',
                borderRadius: 12, padding: '9px 8px', minWidth: 0,
              }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5c5850', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{item}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: '#5c5850', lineHeight: 1.6, marginBottom: 8 }}>
            <strong style={{ color: '#0f0e0c' }}>下一次只盯一个点：</strong>{todayReview.focus}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: '#7a756c', lineHeight: 1.5, flex: '1 1 220px' }}>{todayReview.tomorrowAction}</p>
            <button onClick={() => navigate(reviewActionTo)} style={{
              fontSize: 12, fontWeight: 800, color: '#7b5ea7',
              background: '#f3eeff', border: '1px solid #d5c5f0',
              borderRadius: 11, minHeight: 38, padding: '8px 12px', cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}>马上补齐</button>
          </div>
        </div>

        <InstallAppCard />

        {ieltsGoal && (
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 18, padding: '15px 18px', marginBottom: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: 13,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              background: '#f3eeff', color: '#7b5ea7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🎓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#7b5ea7', marginBottom: 3 }}>雅思冲刺目标</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0f0e0c', marginBottom: 2 }}>
                Band {ieltsGoal.currentBand} → {ieltsGoal.targetBand}
              </p>
              <p style={{ fontSize: 12, color: '#7a756c' }}>
                {ieltsSummary?.daysLeft !== null ? `距离考试约 ${ieltsSummary.daysLeft} 天 · ` : ''}{ieltsSummary?.intensity}节奏
              </p>
            </div>
            <button onClick={() => navigate('/profile')} style={{
              fontSize: 12, fontWeight: 800, color: '#7b5ea7',
              background: '#f8f5ff', border: '1px solid #d5c5f0',
              borderRadius: 10, padding: '7px 11px', cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}>调整</button>
          </div>
        )}

        {/* ── Weakness Profile ── */}
        {weaknessSummary.length > 0 && (
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 18, padding: '16px 18px', marginBottom: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#d94040', marginBottom: 4 }}>弱点档案</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0f0e0c' }}>最近最该补的 3 个点</p>
              </div>
              <span style={{ fontSize: 11, color: '#9e998e' }}>近 21 天</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weaknessSummary.slice(0, 3).map(item => (
                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 12, flexShrink: 0,
                    background: '#fff0f0', color: '#d94040',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800,
                  }}>
                    {weaknessPracticeMap[item.type]?.icon || '🎯'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#0f0e0c', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 11.5, color: '#7a756c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.latest?.fix ? `${item.latest.example || '表达'} → ${item.latest.fix}` : item.latest?.detail || '建议定向练习'}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#d94040' }}>{item.count} 次</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {/* Today's study time ring */}
          {(() => {
            const target = targetMinutes
            const pct = Math.min(todayMinutes / target, 1)
            const r = 22, circ = 2 * Math.PI * r
            const offset = circ - pct * circ
            const color = pct >= 1 ? '#3a9a5f' : pct >= 0.5 ? '#e8672a' : '#4a7a9b'
            return (
              <div style={{
                flex: 1, background: pct >= 1 ? '#edf8f2' : '#fff', borderRadius: 18,
                border: `1px solid ${pct >= 1 ? '#b5e0c8' : 'rgba(0,0,0,0.07)'}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                padding: '14px 10px', textAlign: 'center',
              }}>
                <svg width={50} height={50} viewBox="0 0 50 50" style={{ display: 'block', margin: '0 auto 4px' }}>
                  <circle cx="25" cy="25" r={r} fill="none" stroke="#f0ede6" strokeWidth="5" />
                  <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 25 25)"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                  <text x="25" y="29" textAnchor="middle" fontSize="11" fontWeight="800"
                    fill={color} fontFamily="-apple-system,Arial,sans-serif">{todayMinutes}</text>
                </svg>
                <p style={{ fontSize: 11, color: '#9e998e' }}>今日分钟</p>
              </div>
            )
          })()}
          {[
            { icon: '✅', value: totalCompleted, label: '已完成课' },
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
                  { emoji: '⏱️', value: todayMinutes, label: '今日分钟', color: '#4a7a9b' },
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
