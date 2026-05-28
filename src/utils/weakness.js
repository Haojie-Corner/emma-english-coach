import { notifyLearningStateChanged } from './learningStateSync'

const WEAKNESS_KEY = 'learningWeaknesses'
const MAX_RECORDS = 300

export const WEAKNESS_LABELS = {
  pronunciation: '发音准确度',
  fluency: '流利度',
  stress: '重音节奏',
  intonation: '语音语调',
  grammar: '语法准确',
  vocabulary: '词汇表达',
  communication: '沟通展开',
}

export const getWeaknessRecords = () => {
  try {
    return JSON.parse(localStorage.getItem(WEAKNESS_KEY) || '[]')
  } catch {
    return []
  }
}

export const recordWeakness = (record) => {
  if (!record?.type) return
  const records = getWeaknessRecords()
  records.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    ...record,
  })
  localStorage.setItem(WEAKNESS_KEY, JSON.stringify(records.slice(-MAX_RECORDS)))
  notifyLearningStateChanged()
}

export const recordPronunciationWeaknesses = (feedback, source = '发音练习') => {
  const scores = feedback?.dimension_scores
  if (!scores) return
  Object.entries(scores).forEach(([type, score]) => {
    if (Number(score) >= 72) return
    recordWeakness({
      type,
      source,
      score: Number(score),
      label: WEAKNESS_LABELS[type] || type,
      detail: feedback?.weakness || feedback?.suggestion || feedback?.voice_script || '这个维度还可以继续加强。',
    })
  })
}

export const recordGrammarWeaknesses = (issues, source = '语法练习') => {
  if (!Array.isArray(issues)) return
  issues.slice(0, 5).forEach(issue => {
    recordWeakness({
      type: 'grammar',
      source,
      label: '语法准确',
      example: issue.error,
      fix: issue.correction,
      detail: issue.reason || '这类语法问题需要复练。',
    })
  })
}

export const recordConversationWeaknesses = (review, source = '对话复盘') => {
  if (!review) return
  Object.entries(review.dimension_scores || {}).forEach(([type, score]) => {
    if (Number(score) >= 72) return
    recordWeakness({
      type,
      source,
      score: Number(score),
      label: WEAKNESS_LABELS[type] || type,
      detail: '对话复盘里这个维度偏弱，建议安排一次定向练习。',
    })
  })
  ;(review.top3_issues || []).slice(0, 3).forEach(issue => {
    recordWeakness({
      type: 'communication',
      source,
      label: '表达修正',
      example: issue.example || issue.issue,
      fix: issue.fix,
      detail: issue.tip || issue.issue || '复盘中出现的高频表达问题。',
    })
  })
}

export const getWeaknessSummary = () => {
  const records = getWeaknessRecords()
  const since = Date.now() - 21 * 86400000
  const recent = records.filter(r => new Date(r.date).getTime() >= since)
  const groups = recent.reduce((acc, item) => {
    const key = item.type || 'communication'
    if (!acc[key]) {
      acc[key] = {
        type: key,
        label: item.label || WEAKNESS_LABELS[key] || '表达问题',
        count: 0,
        latest: item,
        totalScore: 0,
        scored: 0,
      }
    }
    acc[key].count += 1
    if (typeof item.score === 'number') {
      acc[key].totalScore += item.score
      acc[key].scored += 1
    }
    if (new Date(item.date) > new Date(acc[key].latest.date)) acc[key].latest = item
    return acc
  }, {})

  return Object.values(groups)
    .map(g => ({ ...g, avgScore: g.scored ? Math.round(g.totalScore / g.scored) : null }))
    .sort((a, b) => b.count - a.count || (a.avgScore ?? 100) - (b.avgScore ?? 100))
}
