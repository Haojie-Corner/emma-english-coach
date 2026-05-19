import { create } from 'zustand'
import { getProgress, saveProgress, getTodayCheckIn, checkIn, getStreak } from '../services/supabase'

const useProgressStore = create((set, get) => ({
  progress: [],
  streak: 0,
  checkedInToday: false,
  loading: false,

  fetchProgress: async (userId) => {
    set({ loading: true })
    const [progress, streak, todayCheckIn] = await Promise.all([
      getProgress(userId),
      getStreak(userId),
      getTodayCheckIn(userId),
    ])
    set({ progress: progress || [], streak, checkedInToday: !!todayCheckIn, loading: false })
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

  getModuleCompletion: (moduleId) => {
    const { progress } = get()
    const moduleLessons = progress.filter(p => p.module_id === moduleId)
    if (moduleLessons.length === 0) return 0
    const completed = moduleLessons.filter(p => p.status === 'completed').length
    return Math.round((completed / moduleLessons.length) * 100)
  },
}))

export default useProgressStore
