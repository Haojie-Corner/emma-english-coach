import { create } from 'zustand'
import { supabase, signIn, signUp, signOut } from '../services/supabase'
import { syncLearningState } from '../utils/learningStateSync'

const useUserStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })
    if (session?.user) {
      syncLearningState(session.user.id).catch(() => {})
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
      if (_event === 'SIGNED_IN' && session?.user) {
        syncLearningState(session.user.id).catch(() => {})
      }
    })
  },

  login: async (email, password) => {
    const data = await signIn(email, password)
    set({ session: data.session, user: data.user })
    return data
  },

  register: async (email, password, displayName) => {
    const data = await signUp(email, password, displayName)
    return data
  },

  logout: async () => {
    await signOut()
    set({ user: null, session: null })
  },
}))

export default useUserStore
