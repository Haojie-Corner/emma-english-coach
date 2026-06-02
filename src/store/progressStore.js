import { create } from 'zustand'
import { getProgress, saveProgress, getTodayCheckIn, checkIn, getStreak, getCheckInHistory, getWeeklyLessonCounts, getDueVocabulary } from '../services/supabase'
import { modules } from '../data/phonics'
import { isE2EMode } from '../utils/e2eMode'

const today = () => new Date().toISOString().split('T')[0]

const e2eProgress = [
  { module_id: 'phonics', lesson_id: 'phonics_01', status: 'completed', score: 86, updated_at: new Date().toISOString() },
  { module_id: 'phonics', lesson_id: 'phonics_02', status: 'completed', score: 72, updated_at: new Date().toISOString() },
  { module_id: 'phonics', lesson_id: 'phonics_03', status: 'in_progress', score: null, updated_at: new Date().toISOString() },
]

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
    if (isE2EMode()) {
      set({
        progress: e2eProgress,
        streak: 3,
        checkedInToday: true,
        loading: false,
        checkInHistory: [today()],
        weeklyLessonCounts: { [today()]: 1 },
        dueVocabCount: 2,
      })
      return
    }
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
    if (isE2EMode()) {
      const current = get().progress.filter(p => p.lesson_id !== lessonId)
      set({ progress: [...current, { module_id: moduleId, lesson_id: lessonId, status, score, updated_at: new Date().toISOString() }] })
      return
    }
    await saveProgress(userId, moduleId, lessonId, status, score)
    const progress = await getProgress(userId)
    set({ progress: progress || [] })
  },

  doCheckIn: async (userId) => {
    if (isE2EMode()) {
      set({ checkedInToday: true, streak: Math.max(get().streak, 1) })
      return
    }
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
