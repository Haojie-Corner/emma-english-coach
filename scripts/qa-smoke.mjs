import { existsSync, readFileSync } from 'node:fs'

const checks = [
  {
    name: '环境变量模板完整',
    file: '.env.example',
    patterns: ['VITE_SUPABASE_URL', 'VITE_GEMINI_API_KEY', 'VITE_DEEPSEEK_API_KEY', 'VITE_ELEVENLABS_API_KEY'],
  },
  {
    name: 'Supabase 同步表存在',
    file: 'supabase-setup.sql',
    patterns: ['CREATE TABLE IF NOT EXISTS learning_state', 'learning_state_own'],
  },
  {
    name: '学习复盘已接入同步',
    file: 'src/utils/learningStateSync.js',
    patterns: ['daily_learning_reviews', 'emma_coach_nudge_dismissed'],
  },
  {
    name: '首页有今日复盘闭环',
    file: 'src/pages/Dashboard.jsx',
    patterns: ['今日复盘闭环', 'saveDailyLearningReview'],
  },
  {
    name: 'Emma 有主动提醒',
    file: 'src/components/EmmaBubble.jsx',
    patterns: ['getEmmaCoachNudge', '让 Emma 带我练'],
  },
  {
    name: '练习中心模式可深链',
    file: 'src/pages/Practice/Speaking.jsx',
    patterns: ['setSearchParams', 'aria-selected', 'scrollIntoView'],
  },
  {
    name: '正式上线前安全提醒仍保留',
    file: 'README.md',
    patterns: ['迁移到后端代理', '避免浏览器暴露 API Key'],
  },
]

const failures = []

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures.push(`${check.name}: 缺少文件 ${check.file}`)
    continue
  }
  const text = readFileSync(check.file, 'utf8')
  for (const pattern of check.patterns) {
    if (!text.includes(pattern)) failures.push(`${check.name}: ${check.file} 缺少 ${pattern}`)
  }
}

if (failures.length > 0) {
  console.error(`QA smoke failed (${failures.length})`)
  failures.forEach(item => console.error(`- ${item}`))
  process.exit(1)
}

console.log(`QA smoke passed (${checks.length} checks)`)
