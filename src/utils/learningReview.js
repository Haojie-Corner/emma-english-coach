import { getWeaknessSummary } from './weakness'
import { getIeltsAttemptSummary, getIeltsGoal } from './ieltsGoal'
import { notifyLearningStateChanged } from './learningStateSync'

export const DAILY_REVIEWS_KEY = 'daily_learning_reviews'
export const EMMA_NUDGE_DISMISSED_KEY = 'emma_coach_nudge_dismissed'

const todayKey = () => new Date().toISOString().split('T')[0]

export const getDailyLearningReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(DAILY_REVIEWS_KEY) || '[]')
  } catch {
    return []
  }
}

export const getLatestLearningReview = () => getDailyLearningReviews().at(-1) || null

export const saveDailyLearningReview = (review) => {
  if (!review?.date) return
  const existing = getDailyLearningReviews()
  const prev = existing.find(item => item.date === review.date)
  const comparablePrev = prev ? { ...prev, updatedAt: undefined } : null
  const comparableNext = { ...review, updatedAt: undefined }
  if (JSON.stringify(comparablePrev) === JSON.stringify(comparableNext)) return
  const reviews = existing.filter(item => item.date !== review.date)
  const next = [...reviews, { ...review, updatedAt: new Date().toISOString() }].slice(-45)
  localStorage.setItem(DAILY_REVIEWS_KEY, JSON.stringify(next))
  notifyLearningStateChanged()
}

const reviewLevel = ({ todayMinutes, targetMinutes, todayCompleted, weaknessSummary }) => {
  if (todayMinutes >= targetMinutes && todayCompleted > 0 && weaknessSummary.length > 0) return 'closed'
  if (todayMinutes >= Math.max(8, Math.round(targetMinutes * 0.5)) || todayCompleted > 0) return 'active'
  return 'light'
}

export const buildTodayLearningReview = ({
  todayMinutes = 0,
  targetMinutes = 20,
  todayCompleted = 0,
  dueVocabCount = 0,
  weaknessSummary = [],
  ieltsGoal = null,
  nextLessonInfo = null,
}) => {
  const topWeakness = weaknessSummary[0]
  const level = reviewLevel({ todayMinutes, targetMinutes, todayCompleted, weaknessSummary })
  const ieltsAttempt = getIeltsAttemptSummary()
  const focusLabel = topWeakness?.label || (ieltsGoal ? '雅思口语输出' : '稳定开口')
  const tomorrowAction = topWeakness
    ? `明天先用 5 分钟复练「${topWeakness.label}」，不要同时改太多问题。`
    : dueVocabCount > 0
      ? `明天先复习 ${dueVocabCount} 个到期词，再开口造 3 句。`
      : nextLessonInfo?.lesson?.title
        ? `明天继续主线课「${nextLessonInfo.lesson.title}」。`
        : '明天继续完成 1 个小任务，保持不断线。'

  return {
    date: todayKey(),
    level,
    todayMinutes,
    targetMinutes,
    todayCompleted,
    dueVocabCount,
    focusLabel,
    topWeaknessType: topWeakness?.type || null,
    summary: level === 'closed'
      ? '今天形成了输入、输出和复盘闭环。'
      : level === 'active'
        ? '今天已经进入学习状态，还差一次复盘或输出就更完整。'
        : '今天先保留轻量学习入口，重点是不断线。',
    wins: [
      todayMinutes > 0 ? `已学习 ${todayMinutes} 分钟` : '还可以先学 5 分钟热身',
      todayCompleted > 0 ? `完成 ${todayCompleted} 课` : '主线课还可以推进 1 小节',
      ieltsAttempt ? `最近雅思 ${ieltsAttempt.latest.part} Band ${ieltsAttempt.latest.band}` : `当前重点：${focusLabel}`,
    ],
    focus: topWeakness
      ? `最近 ${topWeakness.label} 出现 ${topWeakness.count} 次，下一次练习只盯这一个点。`
      : ieltsGoal
        ? `目标 Band ${ieltsGoal.targetBand}，今天优先保证开口和复盘。`
        : '先把发音、词汇和一句真实表达串起来。',
    tomorrowAction,
  }
}

export const getEmmaCoachNudge = () => {
  const dismissed = localStorage.getItem(EMMA_NUDGE_DISMISSED_KEY)
  if (dismissed === todayKey()) return null

  const topWeakness = getWeaknessSummary()[0]
  const latestReview = getLatestLearningReview()
  const ieltsAttempt = getIeltsAttemptSummary()

  if (topWeakness?.count >= 2) {
    return {
      type: 'weakness',
      title: `Emma 发现你最近反复卡在「${topWeakness.label}」`,
      message: topWeakness.latest?.fix
        ? `上一次更好的说法是：${topWeakness.latest.fix}。这次先别追求多，专门把这个点练顺。`
        : `这个问题最近出现 ${topWeakness.count} 次。建议今天只做一个 5 分钟定向练习。`,
      prompt: `我最近总是卡在${topWeakness.label}，请给我一个5分钟定向练习`,
    }
  }

  if (latestReview?.level === 'light') {
    return {
      type: 'review',
      title: '今天还没形成完整学习闭环',
      message: '先做一个很小的动作就够：录 1 句英文，或者复习 1 个词。',
      prompt: '帮我安排一个5分钟英语学习任务',
    }
  }

  if (ieltsAttempt && Number(ieltsAttempt.avgBand) < Number(getIeltsGoal()?.targetBand || 0)) {
    return {
      type: 'ielts',
      title: '雅思目标还可以更聚焦',
      message: `最近平均 Band ${ieltsAttempt.avgBand}。建议下一轮只针对最低维度练 1 题。`,
      prompt: '根据我的雅思记录，安排下一次口语练习',
    }
  }

  return null
}

export const dismissEmmaCoachNudge = () => {
  localStorage.setItem(EMMA_NUDGE_DISMISSED_KEY, todayKey())
}
