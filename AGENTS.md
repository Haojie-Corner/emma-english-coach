# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

---

## 开发命令

```bash
npm run dev      # 启动开发服务器（通常占用 5173–5185 端口，会自动递增）
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
│   ├── AudioRecorder.jsx  # 录音 → Gemini 分析 → Emma 老师语音反馈；内含 Waveform + DimensionBars
│   ├── EmmaBubble.jsx     # 全局悬浮 Emma 入口 + 情境感知对话面板（JARVIS 式助手）
│   └── ui/
│       ├── Button.jsx / Card.jsx
│       ├── VoiceInputButton.jsx    # 内联 MediaRecorder → transcribeSpeech → onResult(text)
│       ├── ModuleLockGate.jsx      # 模块锁定守卫
│       ├── LessonValueBanner.jsx   # 课程价值卡片，可折叠
│       ├── Toast.jsx               # 全局 Toast，由 toast.js 单例驱动
│       └── VocabChip.jsx          # +/✓/… 三态存词芯片
├── pages/
│   ├── Dashboard.jsx      # 打卡、进度环、继续学习、今日单词、本周总结（含今日学习分钟）、今日推荐
│   ├── Profile.jsx        # 学习统计 + 发音折线图 + 语法错误分布 + 弱点分析 + 分享进度卡
│   ├── Vocabulary.jsx     # 词汇本（全部/今日复习；闪卡三模式；来源标签筛选）
│   ├── Course/            # 各模块入口页（*Module.jsx）+ 课时页（*Lesson.jsx）
│   └── Practice/
│       └── Speaking.jsx   # 8-tab 练习中心（见下）
├── store/
│   ├── userStore.js       # Zustand：user / session / loading
│   ├── progressStore.js   # Zustand：进度、打卡、streak、checkInHistory、weeklyLessonCounts、dueVocabCount
│   └── emmaStore.js       # Zustand：Emma 面板 open/close
├── services/
│   ├── supabase.js        # Supabase 客户端 + DB/Storage/Auth
│   ├── gemini.js          # Gemini REST API（多模型降级重试）
│   └── deepseek.js        # DeepSeek Chat API
├── hooks/
│   ├── useAudioRecorder.js  # MediaRecorder → Blob → base64；返回 analyserRef
│   └── useStudyTimer.js     # useEffect 包装 startLessonTimer()，所有课时页调用
├── utils/
│   ├── tts.js             # ElevenLabs TTS（Sarah 声线）
│   ├── toast.js           # showToast 单例
│   └── studyTime.js       # localStorage 学习时长：addStudySeconds / getTodayStudyMinutes / startLessonTimer
└── data/
    ├── phonics.js         # 自然拼读全22课 + modules 数组（全局模块注册表，含解锁规则）
    ├── intonation.js      # 语音语调全11课
    ├── mindset.js         # 认知重塑30课（6单元）
    ├── demo.js            # 场景演绎21课
    ├── scenes.js          # 场景实战100场景（10分类）
    └── fluency.js         # 自如交流20课（L1–L15 对话技能 + L16–L20 Discourse Markers）
```

---

## 关键设计决策

### 样式方案
**不依赖 Tailwind 响应式类做关键布局**。`Layout.jsx` 用 `useState + useEffect + window.innerWidth` 检测桌面端（≥1024px）。hover 用 `onMouseEnter/Leave` + inline style 实现。

**UI 颜色 token（2026-05 Modern Light）**：
```
主背景: #f5f3ef  卡片: #fff  主文字: #0f0e0c  次文字: #5c5850  弱文字: #9e998e
边框: rgba(0,0,0,0.07) / #e5e1d8（强调）  强调橙: #e8672a
```
模块颜色：Fluency/Mindset = `#7b5ea7` / Intonation = `#4a7a9b` / Tech = `#9b72d0`。

渐变按钮：`linear-gradient(135deg, #f28040, #e05020)`，hover 用 `filter: brightness(1.08)`。
卡片：`borderRadius: 18`, `boxShadow: '0 2px 10px rgba(0,0,0,0.06)'`，hover `translateY(-2px)`。
难度标签四色：`入门#5a8c4a / 初级#e8672a / 中级#7b5ea7 / 进阶#d94040`（背景各自浅色）。

### Emma 全局助手（JARVIS 式）
`EmmaBubble.jsx` 渲染在 `Layout.jsx` 根节点，`useLocation()` 感知路由。`getRouteContext(pathname)` 返回 `{ label, icon, description, quickQ[] }`，传给 `chatWithEmma(messages, progressSummary, pageContext)`。面板始终 `position: fixed`，用 `transform` 滑入/滑出。导航到 `/teacher` 时隐藏。

### TTS 架构（`src/utils/tts.js`）
所有 TTS 走 ElevenLabs，声线 Sarah（`EXAVITQu4vr4xnSDxMaL`），模型 `eleven_multilingual_v2`。`AbortController` 自动取消上一请求。**不降级 Web Speech API**（声音不一致宁可静默失败）。
- `speak(text, rate, onEnd)` — 英文
- `speakMultilingual(text, onEnd)` — 中英混合（rate 固定 1.0）
- 错误 Toast：402/401/403/网络错误 → 各显中文提示，5 秒防抖

### AI 服务（`src/services/`）

**gemini.js** — `callGemini` 自动降级：`gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.0-flash-lite`（503/429 触发）。`gemini-1.5-flash` / `gemini-2.0-flash` 已对新用户下线，勿使用。

主要导出：
| 函数 | 用途 |
|------|------|
| `analyzePronunciation(audio, target)` | 发音评分，返回4维度scores + voice_script |
| `analyzeIeltsPart2(audio, topic, bullets)` | 雅思Part2评分，Band 0-9 |
| `analyzeIeltsPart1(audio, question)` | 雅思Part1评分，Band 0-9，4维度 |
| `transcribeSpeech(audio)` | 语音转文字，供 VoiceInputButton 使用 |
| `generateListeningExercise()` | 生成听力对话 + 问题 |
| `expandVocabulary(word, context?)` | 返回 `{ phonetic, meaning, example, example_zh }` |
| `analyzeImage(base64, mime)` | 随拍学英语 |
| `scoreSpeechSimilarity(audio, target, zh)` | DemoLesson 跟读评分 |

`analyzePronunciation` 返回包含 `dimension_scores: { pronunciation, fluency, stress, intonation }`（均0-100）。`voice_script` / `tip_demo` prompt 必须强调**中文为主，英文只在示范时嵌入**。

**deepseek.js** — model `deepseek-chat`，HTTP 错误已中文化（429/402/401/403）。

主要导出：
| 函数 | 用途 |
|------|------|
| `chatWithScene(...)` | 场景实战角色扮演 |
| `chatWithFluency(...)` | 自如交流开放对话 |
| `chatWithEmma(...)` | Emma 助手 |
| `generateMindsetQuiz(topic, type, prev)` | 认知重塑出题 |
| `correctGrammar(text)` | 语法纠错，返回 issues + new_words |
| `rateSentence(word, sentence)` | 词汇造句评分 |
| `explainTechEnglish(input)` | 编程英语解释 |
| `generateConvoReview(messages, sceneName)` | 对话整体复盘，返回评分+Top3问题+建议 |

`generateConvoReview` 返回：`{ overall_score, dimension_scores:{fluency,grammar,vocabulary,communication}, strengths, top3_issues:[{issue,example,fix,tip}], next_step, encouragement }`

### AudioRecorder 核心机制
- **分析阶段状态机**：`analyzePhase: null | 'processing' | 'analyzing'`
- **DimensionBars**（`AudioRecorder.jsx` 内定义）：4维度横向条形图，与 ScoreRing 并排显示
- **对比听区域**：用户录音 `<audio>` 播放器 + 示范发音按钮并排
- **TTS 三态**：`speakState: 'idle' | 'playing' | 'paused'`，不自动播放
- **Waveform**：录音时 20 根 div 竖条，rAF 驱动，直接操作 DOM 高度

### Speaking.jsx 8-Tab 结构
| Tab key | 功能 |
|---------|------|
| `free` | 自由录音 + `?drill=<word>` 弱点定向 |
| `grammar` | 语法纠错（保存错误到 localStorage → Profile 统计） |
| `dictation` | **听写练习**：20句分级，TTS播放 → 打字 → 逐词评分 |
| `listening` | AI生成听力对话 + 理解问题 |
| `tech` | 编程英语解释 |
| `snap` | 随拍学英语（Gemini Vision） |
| `part1` | **雅思Part 1**：10话题×3题，录音 → `analyzeIeltsPart1` → Band Score |
| `cuecard` | **雅思Part 2**：12张Cue Card，1分钟准备+2分钟录音 → `analyzeIeltsPart2` |

### 对话复盘（SceneLesson + FluencyLesson）
点"完成"后触发 `generateConvoReview`（≥4条消息才分析）：显示综合分 + 4维度条 + 亮点 + Top3问题（含原句/改法）+ 下一步建议。失败时静默跳过，不影响主流程。

### 课程数据

| 文件 | 课数 | 关键导出 |
|------|------|---------|
| `phonics.js` | 22 | `phonicsLessons`, `modules`（全局模块注册表）, `getLesson(id)` |
| `intonation.js` | 11 | `intonationLessons`, `getIntonationLesson(id)` |
| `mindset.js` | 30 | `mindsetLessons`, `getMindsetLesson(id)`, `getMindsetUnits()` |
| `demo.js` | 21 | `demoLessons`, `getDemoLesson(id)` |
| `scenes.js` | 100 | `sceneCategories`, `getScene(id)`, `getAllScenes()` |
| `fluency.js` | **20** | `fluencyLessons`, `getFluencyLesson(id)` |

`phonics.js` 的 `modules` 数组是全局模块注册表，被 `progressStore`、`CourseOverview`、`ModuleLockGate` 共同引用，每个 module 含 `requires: { moduleId, pct }` 解锁规则。

**解锁路径**：phonics(无) → intonation(phonics≥50%) → mindset(intonation≥55%) → demo(mindset≥30%) → scenes(demo≥50%) → fluency(scenes≥50%)。`tech` 无前置。

### 状态管理
Zustand，无 Provider。`progressStore.fetchProgress()` 有并发防护（`if (get().loading) return`）。`useStudyTimer()` 在所有6个课时页（Phonics/Intonation/Mindset/Demo/Scene/Fluency）的组件首行调用。

### localStorage 数据
| key | 内容 |
|-----|------|
| `studyMinutes_YYYY-MM-DD` | 当天学习秒数（由 `studyTime.js` 管理） |
| `grammarErrors` | 最近200条语法错误记录（由 Speaking.jsx GrammarTab 写入，Profile 读取） |
| `wod_YYYY-MM-DD` | 今日单词缓存 |
| milestone keys | `ms_first_lesson` / `ms_streak_7` / `ms_streak_30` |

### VocabChip source 字符串规范
`'语法练习'` / `'场景演绎·{title}'` / `'场景实战·{title}'` / `'自如交流·{title}'` / `'Emma·{pageLabel}'` / `'Emma 老师'` / `'语音语调·{title}'` / `'认知重塑·{title}'`

### 已知待完善（P1/P2 优化）
- **今日结构化学习计划**：Dashboard 缺少"今日20分钟计划"（发音→词汇→口语→总结）
- **Fluency 3课新增**：Hedging（模糊策略）/ Repair策略 / Vague Language
- **词汇搭配（Collocation）训练**：词汇本缺少词组搭配练习模式
- **Band Score 目标设置**：用户无法设定目标雅思分，系统无法据此调整难度
- **Emma 跨 Session 记忆**：每次重开 Emma 完全失忆

---

## 环境变量（`.env.local`）

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_ELEVENLABS_API_KEY=    # sk_ 开头
```

ElevenLabs 可用声线（2026-05）：Sarah（当前）/ Laura / Jessica / Matilda。

---

## 数据库表（Supabase PostgreSQL）

- `user_progress`：`(user_id, lesson_id)` unique，status = locked/in_progress/completed，score
- `recordings`：录音 URL + AI 评分 JSON（`getLessonScoreHistory` 取最近20条）
- `conversations`：对话历史 jsonb
- `vocabulary`：familiarity 0-3，next_review 遗忘曲线
- `check_ins`：`(user_id, check_in_date)` unique

全部表 RLS，策略 `auth.uid() = user_id`。Storage bucket `recordings`（私有）。

---

## 当前完整功能状态

**课程体系**：Phonics 22课 / Intonation 11课 / Mindset 30课 / Demo 21课 / Scenes 100场景 / Fluency 20课（含 L16–L20 Discourse Markers）

**AI 功能**：发音4维度评分 / 雅思Part1+Part2 Band Score / 对话复盘 / 语法纠错+词汇提取 / 听写评分 / 语音输入转文字 / 随拍学英语 / 听力理解生成 / 认知重塑出题 / 词汇AI填词

**练习中心**：8 Tab（录音/语法/听写/听力/编程/随拍/Part1/Part2）

**数据追踪**：学习时长（localStorage）/ 语法错误分类统计 / 发音进步折线图 / 30天打卡热图 / 本周课程柱状图

**词汇系统**：遗忘曲线 / 闪卡三模式（英→中/中→英/造句）/ 来源标签筛选 / VocabChip 全场景存入

**其他**：PWA / Emma 情境感知 / 课程解锁体系 / 对话导出 / 弱点定向练习 `?drill=` / TTS 变速 / Toast 通知 / 里程碑弹窗
