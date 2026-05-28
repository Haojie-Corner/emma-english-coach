import { notifyLearningStateChanged } from './learningStateSync'

const TODAY_KEY = () => `studyMinutes_${new Date().toISOString().split('T')[0]}`

export const addStudySeconds = (seconds) => {
  if (seconds < 5) return
  const key = TODAY_KEY()
  const existing = parseInt(localStorage.getItem(key) || '0', 10)
  localStorage.setItem(key, String(existing + Math.round(seconds)))
  notifyLearningStateChanged()
}

export const getTodayStudyMinutes = () => {
  const raw = parseInt(localStorage.getItem(TODAY_KEY()) || '0', 10)
  return Math.floor(raw / 60)
}

// Call on lesson page mount — returns a cleanup function that saves elapsed time
export const startLessonTimer = () => {
  const start = Date.now()
  return () => {
    const elapsed = (Date.now() - start) / 1000
    addStudySeconds(elapsed)
  }
}
