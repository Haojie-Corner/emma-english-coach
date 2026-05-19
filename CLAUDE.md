# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 开发命令

```bash
npm run dev      # 启动开发服务器（通常占用 5173 或 5174 端口）
npm run build    # 生产构建（构建前用它验证是否有语法错误）
npm run lint     # ESLint 检查
npm run preview  # 预览生产构建
```

依赖安装时若遇到 exit code 137（内存不足被 kill），**分批安装**，不要一次 `npm install all`。若构建报 rolldown binding 错误，删除 `node_modules` 和 `package-lock.json` 后重新 `npm install`。

---

## 架构总览

**React 19 + Vite 8 + Tailwind CSS v4**（无测试框架）。后端全部由 Supabase 托管，前端直接调用外部 AI API。

```
src/
├── main.jsx          # 入口：初始化 Supabase session（useEffect → userStore.init()），session 加载期间显示 loading
├── router.jsx        # 路由：/login 公开，其余路由用 ProtectedRoute 守卫
├── components/
│   ├── Layout.jsx        # 桌面侧边栏（fixed，宽220px）+ 移动端底部导航，用 inline style 而非 Tailwind 类控制定位
│   ├── ProtectedRoute.jsx# 未登录跳 /login
│   ├── AudioRecorder.jsx # 录音 → base64 → Gemini → 评分展示，核心交互组件
│   └── ui/Button.jsx Card.jsx  # 用 inline style + onMouseEnter/Leave 实现 hover，不依赖 Tailwind
├── pages/            # 页面组件，直接 import store 和 service
├── store/
│   ├── userStore.js      # Zustand：user / session / loading，init() 订阅 Supabase auth 变化
│   └── progressStore.js  # Zustand：进度、打卡、streak，fetchProgress() 在 Dashboard useEffect 中调用
├── services/
│   ├── supabase.js   # Supabase 客户端 + 所有 DB/Storage/Auth 操作
│   ├── gemini.js     # Gemini REST API（直接 fetch，不用 SDK）
│   └── deepseek.js   # DeepSeek Chat API（直接 fetch）
├── hooks/
│   └── useAudioRecorder.js  # MediaRecorder → chunks → Blob → URL，暴露 start/stop/reset/getBase64
├── utils/
│   └── tts.js        # Web Speech API 女声 TTS，缓存选中的 voice，处理 voiceschanged 异步加载
└── data/
    └── phonics.js    # 课程内容硬编码（Phase 1）：lessonId、sections、practice targets
```

---

## 关键设计决策

### 样式方案
**不依赖 Tailwind 类做关键布局**。Layout 的 fixed 侧边栏和主内容区 `marginLeft` 用 inline style 写死像素值，因为 Tailwind v4 的 CSS-first 模式下 `lg:ml-60` 等响应式类有时无法可靠生效。Card/Button 组件的 hover 状态也用 `onMouseEnter/Leave` + inline style 实现。Tailwind 只用于少量辅助类（`hidden lg:block` 等断点切换）。

### AI 服务调用
- **Gemini**：使用 `gemini-1.5-flash`（非 `gemini-2.0-flash`，后者会 404）。直接 fetch REST API，音频以 `audio/webm` base64 inline_data 发送，图片同理。AI 回复要用 `raw.match(/\{[\s\S]*\}/)` 提取 JSON，因为模型可能包裹额外文字。
- **DeepSeek**：`https://api.deepseek.com/chat/completions`，model `deepseek-chat`。
- **TTS**：`src/utils/tts.js` 的 `speak(text, rate)` 统一调用，不要在各页面内联写 `SpeechSynthesisUtterance`。

### 状态管理
Zustand store 只有两个：`userStore`（认证）和 `progressStore`（学习进度）。页面直接 import store，无 Provider 包裹。`progressStore.fetchProgress()` 依赖 `user.id`，务必在确认 user 存在后才调用。

### 路由守卫
`ProtectedRoute` 检查 `userStore.user`，为 null 就跳 `/login`。`main.jsx` 的 `loading` 状态防止 session 未恢复时提前渲染 ProtectedRoute 导致误跳转。

### 课程数据
`src/data/phonics.js` 硬编码课程内容，`lessonId` 格式为 `phonics_01`，与数据库 `user_progress.lesson_id` 字段对应。新增课程只需在此文件追加，`PhonicsModule.jsx` 自动渲染。

### 数据库
`supabase-setup.sql` 包含完整建表和 RLS 策略，需在 Supabase Dashboard → SQL Editor 手动执行。Storage bucket 名称必须为 `recordings`（私有）。

---

## 环境变量（`.env.local`）

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_DEEPSEEK_API_KEY=
```

---

## 当前实现状态（Phase 1 已完成）

- ✅ 登录/注册（Supabase Auth，邮箱验证）
- ✅ Dashboard（打卡、进度环、继续学习入口）
- ✅ 自然拼读 Lesson 1（26字母，TTS 女声示范，录音 + Gemini 评分）
- ✅ 练习页（语法纠错，DeepSeek 批改）
- 🚧 其余模块（Intonation / Mindset / Scenes / Demo / Tech）—— 路由已占位，内容待填

---

---

# 产品说明书（原始规格，供功能开发参考）

> **版本**: v0.1 草稿

## 一、项目概览

**AI 英语陪练大师**（AI English Coach）— 面向中文母语零基础成人的 AI 英语学习 Web App。以"自然拼读 → 语音语调 → 认知重塑 → 场景实战"为课程主线，结合 AI 语音评测、对话陪练、语法练习。

核心理念：打破翻译思维 / 发音是地基 / 学+练+答+评 / 场景驱动

目标用户：开发者本人（中文母语零基础成人，对编程/技术英语有额外需求）

---

## 二、课程体系

```
Level 5 ── 自如交流
Level 4 ── 场景实战：8大主题 × AI角色扮演（84课）
Level 3 ── 场景演绎：示范 → 模仿 → AI评分（21课）
Level 2 ── 认知重塑：打破翻译思维（30课）
Level 1 ── 语音地基：自然拼读（22课）+ 语音语调（11课）
```

### 各模块

| 模块 | 课数 | 核心 AI 功能 |
|------|------|------------|
| 自然拼读 Phonics | 22 | 录音 → Gemini 分析音素 → 评分+建议 |
| 语音语调 Intonation | 11 | 录音 → Gemini 分析节奏/重音/连读 |
| 认知重塑 Mindset | 30 | DeepSeek 出题 → 评估英文思维 |
| 场景实战 Scenes | 84 | DeepSeek 角色扮演 → 实时纠错 |
| 场景演绎 Demo | 21 | TTS示范 → 跟读录音 → Gemini 相似度评分 |
| 编程英语 Tech | 额外 | 粘贴报错/命令 → DeepSeek 中英文解释 |
| 随拍学英语 Snap | 随时 | 拍照 → Gemini Vision → 词汇/语法教学 |

---

## 三、数据库表（Supabase PostgreSQL）

- `user_progress`：`(user_id, lesson_id)` unique，status = locked/in_progress/completed
- `recordings`：录音文件 URL + AI 评分 JSON
- `conversations`：对话历史 jsonb
- `vocabulary`：单词本，familiarity 0-3，next_review 遗忘曲线
- `check_ins`：`(user_id, check_in_date)` unique，打卡记录

全部表开启 RLS，策略：`auth.uid() = user_id`。

---

## 四、AI Prompt 规范

**Gemini 发音分析**（输出 JSON）：
```json
{
  "overall_score": 0-100,
  "pronunciation_issues": [{"word","issue","correct_ipa","tip"}],
  "positive_feedback": "中文鼓励",
  "next_focus": "中文建议"
}
```

**DeepSeek 场景对话**（每次回复双段格式）：
```
**[角色对话]** 英文继续对话
**[学习反馈]** ✅说得好 / 📝建议 / 💡新词汇
```

**Gemini 随拍教学**（输出 JSON）：
```json
{
  "recognized_text","translation","vocabulary":[{"word","phonetic","part_of_speech","meaning","example","example_zh"}],
  "grammar_tip","similar_expressions","teacher_comment"
}
```

---

## 五、UI 规范（已实现版本）

**色彩**：主背景 `#f5f3ee`，卡片 `#ffffff`，边框 `#dedad0`，主文字 `#1a1917`，次文字 `#7a7870`，唯一强调色 `#d97757`（橙）。

**字体**：系统字体栈（`-apple-system, PingFang SC, Helvetica Neue`），标题加 `.font-title` class（letter-spacing -0.02em），音标/代码用 `.font-mono`。不依赖 Google Fonts（国内加载不稳定）。

**布局**：桌面端 220px 固定侧边栏 + 主内容区；移动端底部 60px 导航。断点：`lg` = 1024px。

**动画**：录音脉冲 `.recording-pulse`，加载旋转 `.spin`，内容出现 `.fade-in`，均在 `index.css` 定义。

---

## 六、开发路线图

- **Phase 2**：自然拼读全22课 / 语音语调模块 / 3个场景对话 / 随拍学英语 / 词汇本
- **Phase 3**：认知重塑 / 场景实战全部 / 语法练习 / 编程英语 / PWA
- **Phase 4**：遗忘曲线复习算法 / 学习数据可视化 / AI 个性化推荐
