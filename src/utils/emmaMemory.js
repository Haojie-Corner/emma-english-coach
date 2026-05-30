import { saveEmmaMemoryCloud, getEmmaMemoryCloud } from '../services/supabase'

const MEMORY_KEY = 'emma_long_memory'
const MAX_SESSIONS = 5

const extractTags = (messages) => {
  const allText = messages.map(m => m.content).join(' ')
  const tagMap = {
    pronunciation: ['发音', '音标', '读音', 'pronunciation', 'phonics', '拼读'],
    grammar:       ['语法', '时态', '冠词', '介词', 'grammar', '句子结构', '纠错'],
    fluency:       ['流利', '卡壳', '流畅', 'fluency', '连贯', '表达'],
    vocabulary:    ['单词', '词汇', '词组', 'vocabulary', '记词', '表达'],
    ielts:         ['雅思', 'IELTS', 'Band', 'Part1', 'Part2', 'cue card'],
    intonation:    ['语调', '语音', '重音', 'intonation', 'stress'],
  }
  return Object.entries(tagMap)
    .filter(([, keywords]) => keywords.some(k => allText.includes(k)))
    .map(([tag]) => tag)
}

export const saveEmmaSession = (messages, pageLabel, progressSummary, userId) => {
  if (!messages || messages.length < 2) return
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) return

  const session = {
    date: new Date().toISOString(),
    page: pageLabel || '',
    totalCompleted: progressSummary?.totalCompleted ?? 0,
    streak: progressSummary?.streak ?? 0,
    firstQuestion: userMessages[0]?.content?.slice(0, 80) ?? '',
    tags: extractTags(messages),
    messageCount: messages.length,
  }

  try {
    const existing = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]')
    const updated = [session, ...existing].slice(0, MAX_SESSIONS)
    localStorage.setItem(MEMORY_KEY, JSON.stringify(updated))
  } catch { /* storage full or parse error */ }

  if (userId) {
    saveEmmaMemoryCloud(userId, session).catch(() => {})
  }
}

export const mergeEmmaMemoryFromCloud = async (userId) => {
  if (!userId) return
  try {
    const cloudSessions = await getEmmaMemoryCloud(userId)
    if (!cloudSessions.length) return
    const localSessions = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]')
    const localDates = new Set(localSessions.map(s => s.date))
    const newSessions = cloudSessions.filter(s => s?.date && !localDates.has(s.date))
    if (!newSessions.length) return
    const merged = [...localSessions, ...newSessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, MAX_SESSIONS)
    localStorage.setItem(MEMORY_KEY, JSON.stringify(merged))
  } catch { /* silently ignore cloud merge errors */ }
}

export const getEmmaMemoryPrompt = () => {
  try {
    const sessions = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]')
    if (!sessions.length) return ''

    const lines = sessions.slice(0, 2).map((s, i) => {
      const daysSince = Math.round((Date.now() - new Date(s.date)) / 86400000)
      const when = daysSince === 0 ? '今天' : daysSince === 1 ? '昨天' : `${daysSince}天前`
      const tagStr = s.tags?.length ? `，关注方向：${s.tags.join('/')}` : ''
      const pageStr = s.page ? `（在${s.page}）` : ''
      return `• ${i === 0 ? '上次' : '更早前'}${when}${pageStr}曾问过「${s.firstQuestion}」${tagStr}，当时已完成${s.totalCompleted}课`
    })

    return `\n\n【你记得的学习历史（勿重复说，仅供参考）】\n${lines.join('\n')}`
  } catch {
    return ''
  }
}

export const getLastSessionHint = () => {
  try {
    const sessions = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]')
    if (!sessions.length) return null
    return sessions[0]
  } catch {
    return null
  }
}
