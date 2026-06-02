export const isE2EMode = () => (
  import.meta.env.DEV &&
  import.meta.env.VITE_E2E_MODE === 'true'
)

export const E2E_USER = {
  id: 'e2e-user',
  email: 'e2e@example.com',
  user_metadata: { display_name: '许哲晗' },
}

export const E2E_SESSION = {
  user: E2E_USER,
  access_token: 'e2e-token',
}

export const seedE2ELocalState = () => {
  if (!isE2EMode()) return
  const now = new Date().toISOString()
  const today = now.split('T')[0]
  const defaults = {
    dailyGoal: '2',
    english_diagnostic_profile: JSON.stringify({
      level: 'starter',
      goal: 'pronunciation',
      minutes: 20,
      updatedAt: now,
    }),
    learningWeaknesses: JSON.stringify([
      { type: 'pronunciation', label: '发音准确度', detail: '短元音还需要复练', createdAt: now },
    ]),
    last_route: JSON.stringify({ path: '/practice/speaking?tab=grammar', updatedAt: now }),
    [`studyMinutes_${today}`]: '8',
  }
  Object.entries(defaults).forEach(([key, value]) => {
    if (localStorage.getItem(key) == null) localStorage.setItem(key, value)
  })
}
