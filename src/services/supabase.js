import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signUp = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) throw error
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const saveProgress = async (userId, moduleId, lessonId, status, score) => {
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    module_id: moduleId,
    lesson_id: lessonId,
    status,
    score,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' })
  if (error) throw error
}

export const getProgress = async (userId) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export const saveRecording = async (userId, lessonId, audioBlob, aiScore, aiFeedback) => {
  const fileName = `${userId}/${lessonId}/${Date.now()}.webm`
  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(fileName, audioBlob, { contentType: 'audio/webm' })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('recordings').getPublicUrl(fileName)

  const { error } = await supabase.from('recordings').insert({
    user_id: userId,
    lesson_id: lessonId,
    audio_url: publicUrl,
    ai_score: aiScore,
    ai_feedback: aiFeedback,
  })
  if (error) throw error
}

export const getTodayCheckIn = async (userId) => {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .single()
  return data
}

export const checkIn = async (userId) => {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('check_ins').upsert({
    user_id: userId,
    check_in_date: today,
  }, { onConflict: 'user_id,check_in_date' })
  if (error) throw error
}

export const getVocabulary = async (userId) => {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .order('next_review', { ascending: true })
  if (error) throw error
  return data || []
}

export const addVocabularyWord = async (userId, word, phonetic, meaning, example, exampleZh, source) => {
  const { data, error } = await supabase.from('vocabulary').upsert({
    user_id: userId,
    word,
    phonetic,
    meaning,
    example,
    example_zh: exampleZh,
    source,
    familiarity: 0,
    next_review: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,word' })
  if (error) throw error
  return data
}

export const updateVocabularyFamiliarity = async (userId, word, familiarity) => {
  // familiarity 0-3 → next review: 1/3/7/14 days
  const days = [1, 3, 7, 14][familiarity] ?? 14
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + days)
  const { error } = await supabase
    .from('vocabulary')
    .update({ familiarity, next_review: nextReview.toISOString() })
    .eq('user_id', userId)
    .eq('word', word)
  if (error) throw error
}

export const deleteVocabularyWord = async (userId, word) => {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('user_id', userId)
    .eq('word', word)
  if (error) throw error
}

export const getDueVocabulary = async (userId) => {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review', now)
    .order('next_review', { ascending: true })
  if (error) throw error
  return data || []
}

export const getStreak = async (userId) => {
  const { data } = await supabase
    .from('check_ins')
    .select('check_in_date')
    .eq('user_id', userId)
    .order('check_in_date', { ascending: false })
    .limit(90)
  if (!data || data.length === 0) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < data.length; i++) {
    const d = new Date(data[i].check_in_date)
    const diff = Math.round((today - d) / 86400000) - i
    if (diff === 0 || diff === 1) streak++
    else break
  }
  return streak
}
