import { create } from 'zustand'
import { getProgress, saveProgress, getTodayCheckIn, checkIn, getStreak, getCheckInHistory, getWeeklyLessonCounts, getDueVocabulary } from '../services/supabase'
import { modules } from '../data/phonics'

const useProgressStore = create((set, get) => ({
  progress: [],
  streak: 0,
  checkedInToday: false,
  loading: false,
  checkInHistory: [],
  weeklyLessonCounts: {},
  dueVocabCount: 0,

  fetchProgress: async (userId) => {
    if (get().loading) return
    set({ loading: true })
    const [progress, streak, todayCheckIn, checkInHistory, weeklyLessonCounts, dueVocab] = await Promise.all([
      getProgress(userId),
      getStreak(userId),
      getTodayCheckIn(userId),
      getCheckInHistory(userId, 30),
      getWeeklyLessonCounts(userId),
      getDueVocabulary(userId).catch(() => []),
    ])
    set({ progress: progress || [], streak, checkedInToday: !!todayCheckIn, loading: false, checkInHistory: checkInHistory || [], weeklyLessonCounts: weeklyLessonCounts || {}, dueVocabCount: (dueVocab || []).length })
  },

  updateProgress: async (userId, moduleId, lessonId, status, score) => {
    await saveProgress(userId, moduleId, lessonId, status, score)
    const progress = await getProgress(userId)
    set({ progress: progress || [] })
  },

  doCheckIn: async (userId) => {
    await checkIn(userId)
    const streak = await getStreak(userId)
    set({ checkedInToday: true, streak })
  },

  getModuleCompletion: (moduleId, totalLessons) => {
    const { progress } = get()
    const completed = progress.filter(p => p.module_id === moduleId && p.status === 'completed').length
    const total = totalLessons || progress.filter(p => p.module_id === moduleId).length
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  },

  isModuleUnlocked: (moduleId) => {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod || !mod.requires) return true
    const reqMod = modules.find(m => m.id === mod.requires.moduleId)
    const { progress } = get()
    const completed = progress.filter(p => p.module_id === mod.requires.moduleId && p.status === 'completed').length
    const total = reqMod?.totalLessons || 1
    return Math.round((completed / total) * 100) >= mod.requires.pct
  },
}))

export default useProgressStore
