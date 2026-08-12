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
    name: '练习中心有 Shadowing 跟读训练',
    file: 'src/pages/Practice/Speaking.jsx',
    patterns: ['ShadowingTab', 'SHADOWING_LINES', "key: 'shadowing'"],
  },
  {
    name: '练习中心可跨设备接续上次模式',
    file: 'src/pages/Practice/Speaking.jsx',
    patterns: ['last_practice_tab', 'LEARNING_STATE_SYNCED', 'refreshSyncedTab'],
  },
  {
    name: '同步体检会记录设备和最近入口',
    file: 'src/utils/learningStateSync.js',
    patterns: ['learning_device_profile', 'last_route', 'getLearningSyncReadiness'],
  },
  {
    name: '100分计划关键学习状态纳入同步',
    file: 'src/utils/learningStateSync.js',
    patterns: ['weakness_records', 'vocab_output_challenges', 'ielts_goal'],
  },
  {
    name: '首页有双端同步体检',
    file: 'src/pages/Dashboard.jsx',
    patterns: ['双端同步体检', '继续上次位置', 'getLearningSyncReadiness'],
  },
  {
    name: '真实浏览器 E2E 脚本已配置',
    file: 'package.json',
    patterns: ['"e2e": "node scripts/e2e-smoke.mjs"'],
  },
  {
    name: 'E2E 模式不会影响生产登录',
    file: 'src/utils/e2eMode.js',
    patterns: ['import.meta.env.DEV', 'VITE_E2E_MODE', 'seedE2ELocalState'],
  },
  {
    name: 'Emma 回复可直接跳转',
    file: 'src/pages/TeacherChat.jsx',
    patterns: ['buildEmmaActions', '去 Lesson', '打开自然拼读'],
  },
  {
    name: 'Emma 失败后可重发原问题',
    file: 'src/pages/TeacherChat.jsx',
    patterns: ['RetryButton', 'retryText', '重新发送刚才的问题'],
  },
  {
    name: '悬浮 Emma 回复可直接跳转',
    file: 'src/components/EmmaBubble.jsx',
    patterns: ['buildEmmaActions', 'handleActionNavigate', '去 Lesson'],
  },
  {
    name: 'Emma 能跳转到跟读训练',
    file: 'src/components/EmmaBubble.jsx',
    patterns: ['去跟读训练', 'tab=shadowing'],
  },
  {
    name: '手机录音格式兼容',
    file: 'src/utils/audio.js',
    patterns: ['getSupportedAudioMimeType', 'audio/mp4', 'blobToBase64WithMime'],
  },
  {
    name: 'Gemini 分析有超时保护',
    file: 'src/services/gemini.js',
    patterns: ['GEMINI_TIMEOUT_MS', 'fetchGeminiWithTimeout', 'Gemini 分析超时'],
  },
  {
    name: '发音分析有兜底重试',
    file: 'src/components/AudioRecorder.jsx',
    patterns: ['重新获取完整 AI 评分', '不计入正式学习记录'],
  },
  {
    name: '网络恢复后自动同步',
    file: 'src/components/Layout.jsx',
    patterns: ["addEventListener('online'", "removeEventListener('online'"],
  },
  {
    name: 'AI 服务状态有全局提示',
    file: 'src/components/ui/ServiceStatusBanner.jsx',
    patterns: ['SERVICE_STATUS_CHANGED', '关闭服务状态提示', 'AI 服务已恢复'],
  },
  {
    name: '服务故障状态会记录和恢复',
    file: 'src/utils/serviceStatus.js',
    patterns: ['reportServiceIssue', 'reportServiceOk', 'SERVICE_STATUS_STALE_MS'],
  },
  {
    name: '同步失败有全局重试入口',
    file: 'src/components/ui/LearningSyncBanner.jsx',
    patterns: ['学习记录同步需要检查', 'syncLearningState', '重试', 'already updates the visible sync error state'],
  },
  {
    name: '词汇本有今日输出挑战',
    file: 'src/pages/Vocabulary.jsx',
    patterns: ['VocabularyOutputChallenge', '今天必须说出来', 'vocab_output_challenges'],
  },
  {
    name: 'Gemini 后端代理存在',
    file: 'supabase/functions/gemini-proxy/index.ts',
    patterns: ['GEMINI_API_KEY'],
  },
  {
    name: 'DeepSeek 后端代理存在',
    file: 'supabase/functions/deepseek-proxy/index.ts',
    patterns: ['DEEPSEEK_API_KEY'],
  },
  {
    name: 'ElevenLabs 后端代理存在',
    file: 'supabase/functions/tts-proxy/index.ts',
    patterns: ['ELEVENLABS_API_KEY'],
  },
  {
    name: 'README 包含 Edge Function 部署说明',
    file: 'README.md',
    patterns: ['supabase/functions/', 'configure the required provider keys as Supabase secrets'],
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
