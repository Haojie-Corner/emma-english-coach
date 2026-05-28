import { notifyLearningStateChanged } from './learningStateSync'

export const IELTS_GOAL_KEY = 'ielts_goal_profile'
export const IELTS_ATTEMPTS_KEY = 'ielts_speaking_attempts'

export const DEFAULT_IELTS_GOAL = {
  targetBand: 6.5,
  currentBand: 5.5,
  examDate: '',
  dailyMinutes: 30,
}

export const getIeltsGoal = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(IELTS_GOAL_KEY) || 'null')
    return saved ? { ...DEFAULT_IELTS_GOAL, ...saved } : null
  } catch {
    return null
  }
}

export const saveIeltsGoal = (goal) => {
  const normalized = {
    targetBand: Number(goal.targetBand) || DEFAULT_IELTS_GOAL.targetBand,
    currentBand: Number(goal.currentBand) || DEFAULT_IELTS_GOAL.currentBand,
    examDate: goal.examDate || '',
    dailyMinutes: Number(goal.dailyMinutes) || DEFAULT_IELTS_GOAL.dailyMinutes,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(IELTS_GOAL_KEY, JSON.stringify(normalized))
  notifyLearningStateChanged()
  return normalized
}

export const getIeltsGoalSummary = (goal) => {
  if (!goal) return null
  const gap = Math.max(0, Number(goal.targetBand) - Number(goal.currentBand))
  const daysLeft = goal.examDate
    ? Math.max(0, Math.ceil((new Date(`${goal.examDate}T23:59:59`) - new Date()) / 86400000))
    : null

  const intensity = gap >= 1.5 || (daysLeft !== null && daysLeft <= 45)
    ? '冲刺'
    : gap >= 0.5
      ? '稳步提分'
      : '保分强化'

  return { gap, daysLeft, intensity }
}

export const getIeltsAttempts = () => {
  try {
    return JSON.parse(localStorage.getItem(IELTS_ATTEMPTS_KEY) || '[]')
  } catch {
    return []
  }
}

export const recordIeltsAttempt = (attempt) => {
  const band = Number(attempt.band)
  if (!Number.isFinite(band)) return null

  const record = {
    part: attempt.part,
    band,
    topic: attempt.topic || '',
    question: attempt.question || '',
    dimensionScores: attempt.dimensionScores || null,
    improvements: attempt.improvements || [],
    createdAt: new Date().toISOString(),
  }
  const next = [...getIeltsAttempts(), record].slice(-100)
  localStorage.setItem(IELTS_ATTEMPTS_KEY, JSON.stringify(next))
  notifyLearningStateChanged()
  return record
}

export const getIeltsAttemptSummary = () => {
  const attempts = getIeltsAttempts()
  if (attempts.length === 0) return null
  const latest = attempts[attempts.length - 1]
  const recent = attempts.slice(-5)
  const avgBand = Number((recent.reduce((sum, item) => sum + Number(item.band || 0), 0) / recent.length).toFixed(1))
  return { latest, recent, avgBand, count: attempts.length }
}
