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
│   ├── AudioRecorder.jsx  # 录音 → Gemini 分析 → Emma 老师语音反馈，核心交互组件
│   └── ui/
│       ├── Button.jsx / Card.jsx   # inline style + onMouseEnter/Leave 实现 hover
│       ├── ModuleLockGate.jsx      # 模块锁定守卫：未解锁时显示进度要求，已解锁则渲染 children
│       └── LessonValueBanner.jsx   # 课程价值卡片：显示 description + objectives/focusPoints/tips，可折叠
├── pages/
│   ├── Dashboard.jsx      # 打卡、跨模块进度环、动态"继续学习"（LEARNING_PATH 顺序查找）
│   ├── Profile.jsx        # 学习统计（完成课数、平均分、连续打卡）+ 模块进度条
│   ├── Vocabulary.jsx     # 词汇本（复习/遗忘曲线/按熟练度筛选）
│   ├── Course/            # 各模块入口页（*Module.jsx）+ 课时页（*Lesson.jsx）
│   └── Practice/
│       └── Speaking.jsx   # 4-tab 练习中心（自由录音/语法纠错/编程英语/随拍学英语）
├── store/
│   ├── userStore.js       # Zustand：user / session / loading
│   └── progressStore.js   # Zustand：进度、打卡、streak、getModuleCompletion、isModuleUnlocked
├── services/
│   ├── supabase.js        # Supabase 客户端 + DB/Storage/Auth 操作
│   ├── gemini.js          # Gemini REST API（多模型降级重试）
│   └── deepseek.js        # DeepSeek Chat API
├── hooks/
│   └── useAudioRecorder.js  # MediaRecorder → chunks → Blob → base64
├── utils/
│   └── tts.js             # ElevenLabs TTS（主力）+ Web Speech API（结构保留，不再用于降级）
└── data/
    ├── phonics.js         # 自然拼读全22课 + modules 数组（含解锁规则）
    ├── intonation.js      # 语音语调全11课
    ├── mindset.js         # 认知重塑30课（6单元），含 getMindsetUnits()
    ├── demo.js            # 场景演绎21课（4分组），含 getDemoLesson(id)
    └── scenes.js          # 场景实战84场景（8分类 accordion），含 getScene(id)
```

---

## 关键设计决策

### 样式方案
**不依赖 Tailwind 响应式类做关键布局**。`Layout.jsx` 用 `useState + useEffect + window.innerWidth` 检测是否桌面端（≥1024px），动态决定显示侧边栏还是底部导航，完全绕开 `lg:hidden / hidden lg:block`（在 Tailwind v4 CSS-first 模式下不可靠）。Card/Button 的 hover 也用 `onMouseEnter/Leave` + inline style 实现。

### TTS 架构（`src/utils/tts.js`）
**所有 TTS 都走 ElevenLabs**，声线固定为 Sarah（`EXAVITQu4vr4xnSDxMaL`），模型统一用 `eleven_multilingual_v2`（支持中英文混读，且 `speak` 和 `speakMultilingual` 用同一模型保证声音一致）。

关键机制：
- `AbortController`：每次新请求自动取消上一个进行中的请求，防止多次快速点击时多段音频叠放。
- **不降级到 Web Speech API**：一旦降级声音会完全不同，宁可静默失败。
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

**DeepSeek**：`https://api.deepseek.com/chat/completions`，model `deepseek-chat`。

### AudioRecorder 的 Emma 老师功能
分析完成后显示 `TeacherAvatar`，**不自动播放**，由用户主动点击"▶ 开始讲解"。

三态控制（`speakState: 'idle' | 'playing' | 'paused'`）：
- `idle`：首次显示橙色"▶ 开始讲解"，播过后变灰色"🔊 再听一遍"
- `playing`：显示"⏸ 暂停" + "↩ 重新讲解"，头像显示脉冲动画
- `paused`：显示绿色"▶ 继续" + "↩ 重新讲解"

每个 `pronunciation_issues` 条目有"🔊 听示范"按钮，播放 `tip_demo` 字段（`speakMultilingual`）。

### 状态管理
Zustand store 两个：`userStore`（认证）和 `progressStore`（学习进度）。页面直接 import，无 Provider 包裹。`progressStore.fetchProgress()` 依赖 `user.id`，务必在确认 user 存在后才调用。

### 课程数据

所有课程内容硬编码在 `src/data/`，按模块分文件。`lessonId` 与 `user_progress.lesson_id` 对应。

| 文件 | 导出 | 课数 |
|------|------|------|
| `phonics.js` | `phonicsLessons`, `modules`, `getLesson(id)` | 22 |
| `intonation.js` | `intonationLessons`, `getIntonationLesson(id)` | 11 |
| `mindset.js` | `mindsetLessons`, `getMindsetLesson(id)`, `getMindsetUnits()` | 30 |
| `demo.js` | `demoLessons`, `getDemoLesson(id)` | 21 |
| `scenes.js` | `sceneCategories`, `getScene(id)` | 84 |

**`phonics.js` 还导出 `modules` 数组**，是全局模块注册表（含解锁规则），被 `progressStore`、`CourseOverview`、`ModuleLockGate` 共同引用。每个 module 对象含：
```js
{
  id, name, nameEn, icon, totalLessons, color,
  requires: { moduleId, pct, label } | null,  // 解锁前置条件
  levelTag, desc,
}
```

**解锁路径**（硬闸）：phonics(无) → intonation(phonics≥50%) → mindset(intonation≥55%) → demo(mindset≥30%) → scenes(demo≥50%)。`tech` 模块无前置。

**LessonValueBanner**（`src/components/ui/LessonValueBanner.jsx`）在每个 *Lesson 页顶部显示"为什么学这课"，自动读取 `lesson.objectives || lesson.focusPoints || lesson.tips`，可折叠，颜色由父页面传入。

**Dashboard 的"继续学习"**：定义 `LEARNING_PATH`（phonics→intonation→mindset→demo），用 `useMemo` + `isModuleUnlocked` 找首个未完成课程，而非硬编码。

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
- ✅ 场景实战 **84场景**（ScenesModule 8分类 accordion + SceneLesson DeepSeek 角色扮演）
- ✅ 练习页（自由录音 / 语法纠错 / 编程英语 / 随拍学英语，4-tab）
- ✅ Emma 老师语音反馈（中英混合口播，暂停/继续/重新讲解/按词听示范）
- ✅ 词汇本（Vocabulary 全功能：添加/复习/遗忘曲线/按熟练度筛选）
- ✅ 课程解锁体系（ModuleLockGate 守卫，5级前置门槛）
- ✅ 课程价值说明（LessonValueBanner 显示"为什么学这课"，含目标标签，可折叠）
- ✅ Profile 学习统计（完成课数/练习记录/平均分/连续打卡 + 模块进度条）
- 🚧 PWA（离线支持、添加到主屏幕）
- 🚧 学习数据可视化（按日统计图表）
- 🚧 AI 个性化推荐（基于进度的智能路径推荐）

---

# 产品说明书（原始规格，供功能开发参考）

## 一、项目概览

**AI 英语陪练大师**（AI English Coach）— 面向中文母语零基础成人的 AI 英语学习 Web App。以"自然拼读 → 语音语调 → 认知重塑 → 场景实战"为课程主线，结合 AI 语音评测、对话陪练、语法练习。

核心理念：打破翻译思维 / 发音是地基 / 学+练+答+评 / 场景驱动

目标用户：开发者本人（中文母语零基础成人，对编程/技术英语有额外需求）

## 二、课程体系

```
Level 5 ── 自如交流
Level 4 ── 场景实战：8大主题 × AI角色扮演（84课）
Level 3 ── 场景演绎：示范 → 模仿 → AI评分（21课）
Level 2 ── 认知重塑：打破翻译思维（30课）
Level 1 ── 语音地基：自然拼读（22课）+ 语音语调（11课）
```

| 模块 | 课数 | 核心 AI 功能 |
|------|------|------------|
| 自然拼读 Phonics | 22 | 录音 → Gemini 分析音素 → 评分+建议 |
| 语音语调 Intonation | 11 | 录音 → Gemini 分析节奏/重音/连读 |
| 认知重塑 Mindset | 30 | DeepSeek 出题 → 评估英文思维 |
| 场景实战 Scenes | 84 | DeepSeek 角色扮演 → 实时纠错 |
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
- **Phase 3**：~~认知重塑~~ ✅ / ~~场景演绎~~ ✅ / ~~编程英语~~ ✅ / ~~场景实战完整84课~~ ✅ / ~~课程解锁体系~~ ✅ / ~~课程价值说明~~ ✅ / PWA
- **Phase 4**：遗忘曲线复习 / 学习数据可视化 / AI 个性化推荐
