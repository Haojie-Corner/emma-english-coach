import { getWeaknessSummary } from './weakness'
import { getIeltsGoal, getIeltsGoalSummary, getIeltsAttemptSummary } from './ieltsGoal'

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('zh-CN')
}

export const buildEmmaLearningContext = () => {
  const lines = []
  const ieltsGoal = getIeltsGoal()
  const goalSummary = getIeltsGoalSummary(ieltsGoal)
  const attemptSummary = getIeltsAttemptSummary()
  const weaknesses = getWeaknessSummary().slice(0, 3)

  if (ieltsGoal) {
    lines.push(`雅思目标：当前 Band ${ieltsGoal.currentBand}，目标 Band ${ieltsGoal.targetBand}，每天 ${ieltsGoal.dailyMinutes} 分钟。`)
    if (goalSummary?.daysLeft !== null) lines.push(`雅思考试倒计时：约 ${goalSummary.daysLeft} 天，节奏判断：${goalSummary.intensity}。`)
  }

  if (attemptSummary) {
    lines.push(`最近雅思练习：${attemptSummary.latest.part}，Band ${attemptSummary.latest.band}，近 5 次平均 Band ${attemptSummary.avgBand}。`)
  }

  if (weaknesses.length > 0) {
    lines.push(`近期高频弱点：${weaknesses.map(w => `${w.label}${w.count ? `(${w.count}次)` : ''}`).join('、')}。`)
  }

  const updatedAt = attemptSummary?.latest?.createdAt || ieltsGoal?.updatedAt
  if (updatedAt) lines.push(`学习档案更新时间：${formatDate(updatedAt)}。`)

  return lines.join('\n')
}
