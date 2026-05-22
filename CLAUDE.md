# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 开发命令

```bash
npm run dev      # 启动开发服务器（通常占用 5173–5175 端口）
npm run build    # 生产构建（构建前用它验证是否有语法错误）
npm run lint     # ESLint 检查
npm run preview  # 预览生产构建
```

依赖安装时若遇到 exit code 137（内存不足），**分批安装**。若构建报 rolldown binding 错误，删除 `node_modules` 和 `package-lock.json` 后重新 `npm install`。

---

## 架构总览

**React 19 + Vite 8 + Tailwind CSS v4**（无测试框架）。后端全部由 Supabase 托管，前端直接调用外部 AI API。

```
src/
├── main.jsx               # 入口：useEffect → userStore.init()，session 加载期间显示 loading
├── router.jsx             # /login 公开，其余用 ProtectedRoute 守卫
├── components/
│   ├── Layout.jsx         # 响应式布局（JS 检测，非 Tailwind 断点类）
│   ├── AudioRecorder.jsx  # 录音 → Gemini 分析 → Emma 老师语音反馈；内含 Waveform 实时波形组件
│   ├── EmmaBubble.jsx     # 全局悬浮 Emma 入口 + 情境感知对话面板（JARVIS 式助手）
│   └── ui/
│       ├── Button.jsx / Card.jsx   # inline style + onMouseEnter/Leave 实现 hover
│       ├── ModuleLockGate.jsx      # 模块锁定守卫：未解锁时显示进度要求，已解锁则渲染 children
│       ├── LessonValueBanner.jsx   # 课程价值卡片：显示 description + objectives/focusPoints/tips，可折叠
│       ├── Toast.jsx               # 全局 Toast 通知容器（固定右上角），由 toast.js 单例驱动
│       └── VocabChip.jsx          # 词汇存入芯片：+/✓/… 三态，onClick 调 expandVocabulary → addVocabularyWord
├── pages/
│   ├── Dashboard.jsx      # 打卡、跨模块进度环、动态"继续学习"、今日单词、本周总结、今日推荐
│   ├── Profile.jsx        # 学习统计 + 发音进步折线图 + 弱点分析 + 分享进度卡
│   ├── Vocabulary.jsx     # 词汇本（全部/今日复习 tab；闪卡三模式；来源标签筛选）
│   ├── Course/            # 各模块入口页（*Module.jsx）+ 课时页（*Lesson.jsx）
│   └── Practice/
│       └── Speaking.jsx   # 4-tab 练习中心（自由录音/语法纠错/编程英语/随拍学英语）；支持 ?drill= 弱点练习
├── store/
│   ├── userStore.js       # Zustand：user / session / loading
│   ├── progressStore.js   # Zustand：进度、打卡、streak、checkInHistory(30天)、weeklyLessonCounts、dueVocabCount、getModuleCompletion、isModuleUnlocked
│   └── emmaStore.js       # Zustand：Emma 面板 open/close 状态（isOpen / open / close / toggle）
├── services/
│   ├── supabase.js        # Supabase 客户端 + DB/Storage/Auth 操作
│   ├── gemini.js          # Gemini REST API（多模型降级重试）
│   └── deepseek.js        # DeepSeek Chat API
├── hooks/
│   └── useAudioRecorder.js  # MediaRecorder → chunks → Blob → base64；返回 analyserRef（Web Audio AnalyserNode）
├── utils/
│   ├── tts.js             # ElevenLabs TTS（主力）+ Web Speech API（结构保留，不再用于降级）
│   └── toast.js           # Toast 单例：showToast(msg, type, ms)，由 Layout 内 Toast.jsx 注册回调
└── data/
    ├── phonics.js         # 自然拼读全22课 + modules 数组（含解锁规则）
    ├── intonation.js      # 语音语调全11课
    ├── mindset.js         # 认知重塑30课（6单元），含 getMindsetUnits()
    ├── demo.js            # 场景演绎21课（4分组），含 getDemoLesson(id)
    ├── scenes.js          # 场景实战100场景（10分类 accordion），含 getScene(id)
    └── fluency.js         # 自如交流15课，含 getFluencyLesson(id)
```

---

## 关键设计决策

### Emma 全局助手架构（JARVIS 式）
`EmmaBubble.jsx` 渲染在 `Layout.jsx` 根节点，通过 `useLocation()` 感知当前路由，派生情境上下文，无需各页面主动注入。

核心逻辑：
- `getRouteContext(pathname)` — 根据 URL 正则匹配返回 `{ label, icon, description, quickQ[] }`，涵盖所有课时页（通过 `lessonId` 查课程标题）和功能页
- `pageContext` — 传给 `chatWithEmma(messages, progressSummary, pageContext)`，注入 DeepSeek 系统 prompt，使回答具有页面针对性
- **面板不销毁**：始终 `position: fixed`，用 `transform: translateX/translateY` 做滑入/滑出，避免重建
- 桌面端：右侧抽屉（`width: 380px`，从右滑入）；移动端：底部 sheet（`height: 75vh`，从底滑入）
- 导航到 `/teacher` 页时隐藏（返回 null），避免与全屏 TeacherChat 冲突
- `handleClose()` 清空 messages + input，确保下次开启时以新页面情境重新打招呼
- `emmaStore.js` 仅持有 open 状态，任意组件可通过 `useEmmaStore().open()` 程序性打开 Emma

### 样式方案
**不依赖 Tailwind 响应式类做关键布局**。`Layout.jsx` 用 `useState + useEffect + window.innerWidth` 检测是否桌面端（≥1024px），动态决定显示侧边栏还是底部导航，完全绕开 `lg:hidden / hidden lg:block`（在 Tailwind v4 CSS-first 模式下不可靠）。Card/Button 的 hover 也用 `onMouseEnter/Leave` + inline style 实现。

### Toast 通知系统（`src/utils/toast.js` + `src/components/ui/Toast.jsx`）
**单例事件总线**：`toast.js` 持有一个 `_cb` 回调引用，`Toast.jsx` 在 `useEffect` 里调 `_setToastCb` 注册自己。任意模块调 `showToast(msg, type)` 即可显示通知，无需 React 上下文。

- 类型：`'error'` / `'warning'` / `'success'` / `'info'`，各有配色和图标
- 主要用途：TTS 失败时给用户明确反馈（不静默失败）
- 5 秒防抖：`tts.js` 内 `_lastTtsToastAt` 时间戳防止连续失败时 toast 刷屏

### TTS 架构（`src/utils/tts.js`）
**所有 TTS 都走 ElevenLabs**，声线固定为 Sarah（`EXAVITQu4vr4xnSDxMaL`），模型统一用 `eleven_multilingual_v2`（支持中英文混读，且 `speak` 和 `speakMultilingual` 用同一模型保证声音一致）。

关键机制：
- `AbortController`：每次新请求自动取消上一个进行中的请求，防止多次快速点击时多段音频叠放。
- **不降级到 Web Speech API**：一旦降级声音会完全不同，宁可静默失败。
- **错误 Toast**：402（积分耗尽）/ 401/403（API Key 无效）/ 网络错误 → 各显示不同中文提示，5 秒防抖
- `speak(text, rate, onEnd)` — 英文 TTS
- `speakMultilingual(text, onEnd)` — 中英混合 TTS（rate 固定 1.0，由 Gemini 脚本控制节奏）
- `pauseSpeaking() / resumeSpeaking() / stopSpeaking()` — 三态控制

### AI 服务调用

**Gemini**：`gemini-2.5-flash` 为主，503/429 时自动降级到 `gemini-2.5-flash-lite` → `gemini-2.0-flash-lite`（`callGemini` 内循环实现）。`gemini-1.5-flash` 和 `gemini-2.0-flash` 均已对新用户下线，不要使用。

`analyzePronunciation` 返回的 JSON 结构（包含 TTS 相关字段）：
```json
{
  "overall_score": 0-100,
  "pronunciation_issues": [{
    "word": "...",
    "issue": "中文描述",
    "correct_ipa": "...",
    "tip": "中文建议",
    "tip_demo": "中文为主、英文单词嵌入的示范口播稿（给 speakMultilingual 用）"
  }],
  "positive_feedback": "中文鼓励",
  "next_focus": "中文建议",
  "voice_script": "中文为主、英文示范词嵌入其中的老师口播稿（给 speakMultilingual 用）"
}
```

`voice_script` 和 `tip_demo` 的 prompt 要强调：**中文为主，英文只在发音示范时嵌入，不要整句英文**，并给正确/错误示例对比，否则模型会输出纯英文。

**DeepSeek**：`https://api.deepseek.com/chat/completions`，model `deepseek-chat`。HTTP 错误已中文化：429 → "AI 服务繁忙，请稍后重试"，402 → "积分不足"，401/403 → "授权失败"，其他 → 状态码提示。

`correctGrammar` 返回 JSON 结构（Speaking.jsx GrammarTab 消费）：
```json
{
  "corrected": "纠正后的英文句子",
  "explanation": "中文语法解释",
  "grammar_tip": "中文规则总结",
  "new_words": [{ "en": "单词或短语", "zh": "中文释义" }],
  "encouragement": "中文鼓励语"
}
```
`new_words` 提取 2-4 个值得零基础学习者掌握的词汇，Speaking.jsx 以 VocabChip 展示，source 标记 `'语法练习'`。

`rateSentence(word, sentence)` 返回 JSON 结构（Vocabulary.jsx 造句模式消费）：
```json
{
  "score": 0-100,
  "word_used": true或false,
  "feedback": "中文评价（30字内）",
  "corrected": "有语法问题时的改进版本，否则null",
  "encouragement": "中文鼓励语（10字内）"
}
```

`chatWithEmma` 系统 prompt 允许 Emma 在解释词汇时，在消息末尾选填一行：`💡 新词汇：word（释义）；word2（释义2）`。EmmaBubble 用 `parseVocabFromMessage()` 解析并渲染为 VocabChip，显示内容中自动去除该行。

### AudioRecorder 的 Emma 老师功能
分析完成后显示 `TeacherAvatar`，**不自动播放**，由用户主动点击"▶ 开始讲解"。

**实时录音波形**（`Waveform` 组件，在 AudioRecorder.jsx 内定义）：
- `useAudioRecorder` 返回 `analyserRef`（Web Audio AnalyserNode，fftSize=64）
- 录音时渲染 20 根 div 竖条，`requestAnimationFrame` 循环读取 `getByteFrequencyData()` 直接操作 DOM 高度（不触发 re-render）
- 仅在 `status === 'recording'` 时显示，停止录音时 analyserRef 和 AudioContext 会自动 close/null

**分析阶段状态机**（`analyzePhase: null | 'processing' | 'analyzing'`）：
- `null`：未开始 / 已完成
- `'processing'`：读取录音 Blob 并转 base64（显示"处理录音…"）
- `'analyzing'`：Gemini API 调用中（显示"AI 分析中…"）
- 按钮在整个分析过程中禁用（`disabled={!!analyzePhase}`）

**TTS 三态控制**（`speakState: 'idle' | 'playing' | 'paused'`）：
- `idle`：首次显示橙色"▶ 开始讲解"，播过后变灰色"🔊 再听一遍"
- `playing`：显示"⏸ 暂停" + "↩ 重新讲解"，头像显示脉冲动画
- `paused`：显示绿色"▶ 继续" + "↩ 重新讲解"

每个 `pronunciation_issues` 条目有"🔊 听示范"按钮，播放 `tip_demo` 字段（`speakMultilingual`）。

### 状态管理
Zustand store 两个：`userStore`（认证）和 `progressStore`（学习进度）。页面直接 import，无 Provider 包裹。`progressStore.fetchProgress()` 依赖 `user.id`，务必在确认 user 存在后才调用。内部有并发防护：`if (get().loading) return`，避免多处同时触发重复请求。

### 课程数据

所有课程内容硬编码在 `src/data/`，按模块分文件。`lessonId` 与 `user_progress.lesson_id` 对应。

| 文件 | 导出 | 课数 |
|------|------|------|
| `phonics.js` | `phonicsLessons`, `modules`, `getLesson(id)` | 22 |
| `intonation.js` | `intonationLessons`, `getIntonationLesson(id)` | 11 |
| `mindset.js` | `mindsetLessons`, `getMindsetLesson(id)`, `getMindsetUnits()` | 30 |
| `demo.js` | `demoLessons`, `getDemoLesson(id)` | 21 |
| `scenes.js` | `sceneCategories`, `getScene(id)` | 100（10分类，含面试求职10+约会交友6） |
| `fluency.js` | `fluencyLessons`, `getFluencyLesson(id)` | 15 |

**`phonics.js` 还导出 `modules` 数组**，是全局模块注册表（含解锁规则），被 `progressStore`、`CourseOverview`、`ModuleLockGate` 共同引用。每个 module 对象含：
```js
{
  id, name, nameEn, icon, totalLessons, color,
  requires: { moduleId, pct, label } | null,  // 解锁前置条件
  levelTag, desc,
}
```

**解锁路径**（硬闸）：phonics(无) → intonation(phonics≥50%) → mindset(intonation≥55%) → demo(mindset≥30%) → scenes(demo≥50%) → fluency(scenes≥50%)。`tech` 模块无前置。

**LessonValueBanner**（`src/components/ui/LessonValueBanner.jsx`）在每个 *Lesson 页顶部显示"为什么学这课"，自动读取 `lesson.objectives || lesson.focusPoints || lesson.tips`，可折叠，颜色由父页面传入。

**Dashboard 关键数据块**：
- **继续学习**：定义 `LEARNING_PATH`（phonics→intonation→mindset→demo→scenes→fluency），用 `useMemo` + `isModuleUnlocked` 找首个未完成课程
- **今日单词**：从 `getDueVocabulary` 随机取一个，按 `wod_{YYYY-MM-DD}` 存入 `localStorage` 当天缓存
- **本周总结**：`weekTotal = Object.values(weeklyLessonCounts || {}).reduce((s,v)=>s+v,0)`，仅在 `weekTotal > 0` 时显示
- **今日推荐（最多3条，按优先级）**：① 主线课程 ② 词汇复习（`dueVocabCount > 0`）③ 低分课重练（`score < 70`）④ 弱项模块（`avg < 75`）⑤ 场景实战/语法练习（兜底）

**Profile 学习数据可视化**：
- `CheckInHeatmap`：30天打卡热图（橙色方格，带今日高亮边框）
- `WeeklyBarChart`：7天完成课程柱状图（纯 div，无图表库）
- **发音进步折线图**：`getLessonScoreHistory(userId)` 取最近20次有效录音分，纯 SVG `<polyline>` 渲染，颜色按最新分（≥80绿/≥60橙/红）
- **分享进度卡**：弹窗展示 streak/完成课/平均分/词汇数 四格，引导用户截图分享
- 数据来源：`progressStore.checkInHistory`（打卡日期数组）、`progressStore.weeklyLessonCounts`（日期→完成数字典）

**词汇本闪卡复习模式**（`Vocabulary.jsx` 内 `FlashCardReview` 组件）支持 3 种模式：
- `'normal'`（英→中）：看英文，点击翻面显示释义，4档评级
- `'reverse'`（中→英）：看中文，用户用文本框输入英文答案，AI 对比后再翻面
- `'compose'`（造句）：看单词，用 textarea 写英文句子，提交给 `rateSentence` → 显示得分/改正/鼓励

**词汇本来源标签筛选**：
- `getSourceTag(source)` helper 把 source 字符串归一化为分类标签（`'自然拼读'` / `'场景实战'` / `'场景演绎'` / `'自如交流'` / `'Emma 老师'` / `'语法练习'` / `'语音语调'`）
- `availableTags` useMemo 仅在有 ≥2 个不同标签时显示筛选器
- 筛选栏横向滚动 chips，`tagFilter` state 与搜索词联合过滤

**SceneLesson 内联语法批注**：
- `extractGrammarNote(content)` 用正则提取 AI 回复中 `📝 建议：` 行
- 批注附加到对应用户消息对象上，渲染为黄色小卡片（`background: '#fdf6e3'`）
- `exportConversation(messages, title)` — 格式化后写入剪贴板，`messages.length >= 2` 时显示"📋 复制"按钮

**FluencyLesson** 有 `exportConversation`（同 SceneLesson），但**尚未有内联语法批注**（已知待完善，优先级高）。

**DemoLesson TTS 变速**：`ttsRate` state（默认 1.0），UI 三档按钮（慢=0.75 / 正常=1.0 / 快=1.25），所有 `speak()` 调用传入 `ttsRate`。

**Speaking.jsx 弱点定向练习**：
- `useSearchParams` 读取 `?drill=<word>`，显示橙色"🎯 弱点定向练习"banner
- `AudioRecorder` 的 `targetText={drillWord}`，`lessonId={'drill_' + drillWord}`
- Profile 发音弱点分析里的"🎤 练习"按钮 → `navigate('/practice/speaking?drill=' + encodeURIComponent(w.word))`
- ListeningTab 也有 `ttsRate` 三档（慢=0.65 / 正常=0.82 / 快=1.0）

**AI 自动填词**（`gemini.js` 的 `expandVocabulary(word, context?)`）：
- AddWordModal 内"✨ AI 填写"按钮：输入单词 → 调 Gemini → 自动填充音标/释义/例句/例句翻译
- 返回 JSON：`{ phonetic, meaning, example, example_zh }`
- 可选 `context` 参数（课程标题）：注入 prompt 让 Gemini 优先选择与当前学习场景匹配的词义
- **AddWordModal 已移除音标输入字段**（IPA 无法手动输入）；音标数据仍由 AI 填写写入 `phonetic` 列

**VocabChip 词汇存入芯片**（`src/components/ui/VocabChip.jsx`）：
- 共享组件，被 Speaking.jsx / EmmaBubble.jsx / DemoLesson.jsx 复用（SceneLesson + FluencyLesson 有自己的局部版本）
- Props：`en`, `zh`, `saved`, `saving`, `onSave(en, zh)`
- `onSave` 通常调 `expandVocabulary(en)` 获取完整词汇数据，再调 `addVocabularyWord(..., source)` 存入
- source 字符串规范：`'语法练习'` / `'场景演绎·{title}'` / `'场景实战·{title}'` / `'自如交流·{title}'` / `'Emma·{pageLabel}'` / `'Emma 老师'`

**Vocabulary.jsx source icon 映射**（词汇卡片右上角显示来源标签）：
- `'自然拼读'` → 📖 / `'场景实战'`前缀 → 🎭 / `'场景演绎'`前缀 → 🎬 / `'Emma'`前缀 → 🤖 / `'语法练习'` → 📝

**登录报错中文化**（`Login.jsx` 的 `translateError(msg)`）：
- 覆盖 Supabase 常见英文错误：credentials / not confirmed / already registered / rate limit 等

### 已知待完善（一致性缺口）
- **SceneLesson 缺少前后场景导航**：Phonics/Intonation/Mindset/Demo/Fluency 均有 `‹ 上一课 / 下一课 ›`，唯独 SceneLesson 没有
- **FluencyLesson 缺少内联语法批注**：SceneLesson 有 `extractGrammarNote()` → 黄色卡片，FluencyLesson 尚无（自由对话场景语法反馈更重要）

---

## 环境变量（`.env.local`）

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_ELEVENLABS_API_KEY=        # ElevenLabs API Key（sk_ 开头）
```

ElevenLabs 可用声线（截至 2026-05）：Sarah（young/American/professional）、Laura（young/sassy）、Jessica（young/warm）、Matilda（educational/upbeat）。当前使用 Sarah。

---

## 当前实现状态

- ✅ 登录/注册（Supabase Auth）
- ✅ Dashboard（打卡、进度环、跨模块"继续学习" — LEARNING_PATH 顺序查找首个未完成课）
- ✅ 自然拼读 **全22课**（字母→短元音→魔法E长元音→辅音连缀→二合字母→R控元音→双元音→不规则词）
- ✅ 语音语调 **全11课**（IntonationModule + IntonationLesson，结构同 Phonics）
- ✅ 认知重塑 **30课**（MindsetModule 6单元 + MindsetLesson DeepSeek 出题评估）
- ✅ 场景演绎 **21课**（DemoModule 4分组 + DemoLesson TTS示范+跟读+Gemini评分）
- ✅ 场景实战 **100场景**（ScenesModule 10分类 accordion + SceneLesson DeepSeek 角色扮演；含「面试求职」10场景 + 「约会交友」6场景）
- ✅ **自如交流 · Fluency Level 5**（FluencyModule + FluencyLesson，15课，AI 开放对话，chatWithFluency；解锁条件：scenes≥50%）
- ✅ 练习页（自由录音 / 语法纠错 / 编程英语 / 随拍学英语，4-tab）
- ✅ Emma 老师语音反馈（中英混合口播，暂停/继续/重新讲解/按词听示范）
- ✅ 词汇本（Vocabulary 全功能：添加/复习/遗忘曲线/按熟练度筛选；闪卡复习模式；AI 自动填词）
- ✅ 课程解锁体系（ModuleLockGate 守卫，6级前置门槛，含 Level 5）
- ✅ 课程价值说明（LessonValueBanner 显示"为什么学这课"，含目标标签，可折叠）
- ✅ Profile 学习统计（完成课数/练习记录/平均分/连续打卡 + 模块进度条）
- ✅ **PWA**（vite-plugin-pwa，generateSW 策略，precache 全静态资源，standalone 模式，iOS/Android 添加到主屏幕）
- ✅ **学习数据可视化**（Profile：30天打卡热图 + 7天完成课程柱状图，纯 div/SVG）
- ✅ **AI 个性化推荐**（Dashboard：词汇到期提醒 + 弱项模块推荐 + 主线课程，优先级排序最多3条）
- ✅ **录音历史持久化**（AudioRecorder 接受 userId/lessonId，分析后静默保存到 recordings 表；课时页显示历史最高分）
- ✅ **对话历史持久化**（SceneLesson + FluencyLesson：离开时 saveConversation，进入时展示历史记录摘要）
- ✅ **全模块前后课导航**（Phonics/Intonation/Mindset/Demo/Fluency 课时页顶部均有 ‹ 上一课 / 下一课 › 按钮）
- ✅ **Mindset AI 出题升级**（generateMindsetQuiz prompt 增加中英思维对比原则 + 真实场景要求 + 文化差异解释）
- ✅ **Emma 全局悬浮入口 + 情境感知**（EmmaBubble 浮动按钮 + 滑入对话面板，路由感知，`chatWithEmma` 接受 `pageContext` 参数）
- ✅ **全场景词汇存入**（VocabChip 共享组件；语法纠错/场景演绎/场景实战/自如交流/Emma 对话均可一键存词汇本；source 字段追踪来源）
- ✅ **Profile 词汇本统计**（总词汇/已掌握/今日复习三指标 + 4档熟练度横向分布条）
- ✅ **Emma 词汇自动识别**（Emma 回复末尾 `💡 新词汇：` 标记由 `parseVocabFromMessage()` 解析，渲染为可保存芯片）
- ✅ **Toast 通知系统**（`toast.js` + `Toast.jsx`：TTS 积分耗尽/API Key 无效/网络错误等给用户明确中文提示，5 秒防抖）
- ✅ **AI 服务错误中文化**（DeepSeek 429/402/401/403 → 对应中文错误信息；Gemini 错误已有模型降级兜底）
- ✅ **AudioRecorder 分析阶段细化**（`analyzePhase` 状态机：处理录音 → AI 分析，两阶段反馈替代单一 loading）
- ✅ **progressStore 并发防护**（`fetchProgress` 内置 loading 守卫，防重复并发调用）
- ✅ **词汇本遗忘曲线说明**（"今日复习" tab 顶部显示 +1/+3/+7/+14 天规则说明卡）
- ✅ **Mindset 答题历史记录**（MindsetLesson 每次 session 记录所有答题，可折叠查看正确/错误明细）
- ✅ **Dashboard 新用户引导**（`progress.length === 0` 时显示欢迎卡，直接跳转第一课或问 Emma）
- ✅ **IntonationLesson 词汇存入**（ItemCard 对含 IPA 的真实英文词显示 VocabChip，支持一键保存到词汇本）
- ✅ **expandVocabulary 语境化**（可选 context 参数，Gemini 据课程标题选择最相关词义）
- ✅ **录音实时波形可视化**（`useAudioRecorder` 返回 `analyserRef`；AudioRecorder 内 `Waveform` 组件 rAF 驱动 div 竖条动画）
- ✅ **词汇闪卡三模式**（英→中 / 中→英输入 / 造句练习；造句调 `rateSentence` AI 评分）
- ✅ **词汇本来源标签筛选**（`getSourceTag` 归一化 + 横向 chip 筛选栏，≥2 种来源时出现）
- ✅ **SceneLesson 内联语法批注**（`extractGrammarNote` 提取 `📝 建议：` 行，附加到用户消息旁黄色卡片）
- ✅ **对话导出到剪贴板**（SceneLesson + FluencyLesson `exportConversation` → clipboard，≥2 条消息时显示"📋 复制"）
- ✅ **DemoLesson TTS 变速**（慢/正常/快三档，默认 1.0，所有 `speak()` 统一使用 `ttsRate`）
- ✅ **Speaking 弱点定向练习**（`?drill=<word>` URL 参数 → 橙色 banner + 预填 AudioRecorder 目标文本）
- ✅ **ListeningTab TTS 变速**（Speaking.jsx 听力 tab 三档：慢=0.65/正常=0.82/快=1.0）
- ✅ **Profile 发音进步折线图**（`getLessonScoreHistory` 取最近20次录音分，纯 SVG polyline）
- ✅ **Profile 分享进度卡**（弹窗展示 streak/课程/得分/词汇 四格，引导截图分享）
- ✅ **Dashboard 今日单词卡**（从到期词汇随机取一个，`localStorage` 按日期缓存，可朗读/跳转复习）
- ✅ **Dashboard 本周总结卡**（本周完成课数/连续天/平均分三格，`weekTotal > 0` 时显示）

---

# 产品说明书（原始规格，供功能开发参考）

## 一、项目概览

**AI 英语陪练大师**（AI English Coach）— 面向中文母语零基础成人的 AI 英语学习 Web App。以"自然拼读 → 语音语调 → 认知重塑 → 场景实战"为课程主线，结合 AI 语音评测、对话陪练、语法练习。

核心理念：打破翻译思维 / 发音是地基 / 学+练+答+评 / 场景驱动

目标用户：开发者本人（中文母语零基础成人，对编程/技术英语有额外需求）

## 二、课程体系

```
Level 5 ── 自如交流
Level 4 ── 场景实战：10大主题 × AI角色扮演（100课）
Level 3 ── 场景演绎：示范 → 模仿 → AI评分（21课）
Level 2 ── 认知重塑：打破翻译思维（30课）
Level 1 ── 语音地基：自然拼读（22课）+ 语音语调（11课）
```

| 模块 | 课数 | 核心 AI 功能 |
|------|------|------------|
| 自然拼读 Phonics | 22 | 录音 → Gemini 分析音素 → 评分+建议 |
| 语音语调 Intonation | 11 | 录音 → Gemini 分析节奏/重音/连读 |
| 认知重塑 Mindset | 30 | DeepSeek 出题 → 评估英文思维 |
| 场景实战 Scenes | 100 | DeepSeek 角色扮演 → 实时纠错 |
| 场景演绎 Demo | 21 | TTS示范 → 跟读录音 → Gemini 相似度评分 |
| 编程英语 Tech | 额外 | 粘贴报错/命令 → DeepSeek 中英文解释 |
| 随拍学英语 Snap | 随时 | 拍照 → Gemini Vision → 词汇/语法教学 |

## 三、数据库表（Supabase PostgreSQL）

- `user_progress`：`(user_id, lesson_id)` unique，status = locked/in_progress/completed
- `recordings`：录音文件 URL + AI 评分 JSON
- `conversations`：对话历史 jsonb
- `vocabulary`：单词本，familiarity 0-3，next_review 遗忘曲线
- `check_ins`：`(user_id, check_in_date)` unique，打卡记录

全部表开启 RLS，策略：`auth.uid() = user_id`。Storage bucket 名称必须为 `recordings`（私有）。`supabase-setup.sql` 包含完整建表 SQL，需在 Supabase Dashboard → SQL Editor 手动执行。

## 四、UI 规范

**色彩**：主背景 `#f5f3ee`，卡片 `#ffffff`，边框 `#dedad0`，主文字 `#1a1917`，次文字 `#7a7870`，强调色 `#d97757`（橙）。

**字体**：系统字体栈（`-apple-system, PingFang SC, Helvetica Neue`），标题加 `.font-title`（letter-spacing -0.02em），音标/代码用 `.font-mono`。不依赖 Google Fonts。

**动画**：`.recording-pulse`（录音脉冲）、`.spin`（加载旋转）、`.fade-in`（内容出现），均在 `index.css` 定义。

## 五、开发路线图

- **Phase 2**：~~自然拼读全22课~~ ✅ / ~~语音语调模块~~ ✅ / ~~场景对话~~ ✅ / ~~随拍学英语~~ ✅ / ~~词汇本~~ ✅
- **Phase 3**：~~认知重塑~~ ✅ / ~~场景演绎~~ ✅ / ~~编程英语~~ ✅ / ~~场景实战完整84课~~ ✅ / ~~课程解锁体系~~ ✅ / ~~课程价值说明~~ ✅ / ~~PWA~~ ✅
- **Phase 4**：~~遗忘曲线复习（词汇闪卡）~~ ✅ / ~~学习数据可视化~~ ✅ / ~~AI 个性化推荐~~ ✅ / ~~登录报错中文化~~ ✅
- **Phase 5**：~~录音历史持久化~~ ✅ / ~~对话历史持久化~~ ✅ / ~~Level 5 自如交流（15课）~~ ✅ / ~~全模块前后课导航~~ ✅ / ~~场景库升级（+面试+约会，共100场景）~~ ✅ / ~~认知重塑AI出题升级~~ ✅
- **Phase 6**：~~全场景词汇存入（VocabChip）~~ ✅ / ~~语法纠错词汇提取（new_words）~~ ✅ / ~~Emma 词汇自动识别~~ ✅ / ~~Profile 词汇本统计~~ ✅ / ~~词汇来源追踪（source icon）~~ ✅
- **Phase 7**：~~录音实时波形~~ ✅ / ~~发音进步折线图~~ ✅ / ~~词汇闪卡三模式（中→英/造句）~~ ✅ / ~~词汇来源标签筛选~~ ✅ / ~~SceneLesson 语法批注~~ ✅ / ~~对话导出~~ ✅ / ~~DemoLesson TTS 变速~~ ✅ / ~~弱点定向练习（?drill=）~~ ✅ / ~~Dashboard 今日单词+本周总结~~ ✅ / ~~Profile 分享进度卡~~ ✅
