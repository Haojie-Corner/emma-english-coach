# CLAUDE.md — AI 英语陪练大师 项目说明书

> **版本**: v0.1 草稿  
> **用途**: 本文件用于指导 AI 编程助手（Claude 等）完整实现本项目。阅读全文后再开始编码。

---

## 一、项目概览

### 产品名称
**AI 英语陪练大师**（英文名：AI English Coach）

### 产品定位
一款面向中文母语零基础成人的 AI 英语学习 Web App。  
以"自然拼读（Phonics）→ 语音语调 → 认知重塑 → 场景实战"为课程主线，结合 AI 语音评测、对话陪练、语法练习，帮助用户从"会认字母"成长到"能开口流利交流"。

### 核心理念（来自参考课程）
- **打破翻译思维**：不是"想中文 → 翻成英文"，而是直接用英文思考
- **发音是地基**：先学会正确发音，记单词才不是死记硬背  
- **学 + 练 + 答 + 评**：每个知识点都走完这四步才算掌握
- **场景驱动**：所有内容都落地到真实生活/工作场景

### 目标用户
- 主要用户：开发者本人（中文母语、英语零基础成人）
- 特殊需求：对编程/技术英语有额外学习需求

---

## 二、技术架构

### 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + Vite | PWA，手机/电脑浏览器通用 |
| 样式方案 | Tailwind CSS | 快速开发，响应式布局 |
| 后端 & 数据库 | Supabase | 免费额度，自带认证、PostgreSQL、实时同步 |
| 发音分析 AI | Google Gemini Flash (gemini-2.0-flash) | 支持音频输入，分析发音并输出中英文反馈 |
| 内容生成 AI | DeepSeek Chat (deepseek-chat) | 文字内容生成、语法批改、对话陪练，成本低 |
| 语音合成 TTS | Web Speech API（浏览器内置）| 朗读标准发音示范，无需付费 |
| 部署平台 | Vercel | 免费，自动部署，国内访问稳定 |
| PWA 支持 | vite-plugin-pwa | 支持添加到手机桌面，接近原生 App 体验 |

### 系统架构图

```
用户（手机/电脑浏览器）
        ↓
  React PWA 前端
   ├── 路由：React Router
   ├── 状态：Zustand（全局）+ React Query（服务端数据）
   └── UI：Tailwind CSS + shadcn/ui 组件库
        ↓
  Supabase（后端）
   ├── Auth：邮箱/密码登录，Google OAuth
   ├── Database：PostgreSQL（用户数据、学习进度、课程内容）
   ├── Storage：用户录音文件（临时存储）
   └── Realtime：跨端进度实时同步
        ↓
  外部 AI API
   ├── Gemini Flash API：发音录音分析
   └── DeepSeek API：对话、语法批改、内容生成
```

### API 密钥配置（环境变量）

```env
# .env.local
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
VITE_GEMINI_API_KEY=你的Gemini API密钥
VITE_DEEPSEEK_API_KEY=你的DeepSeek API密钥
```

---

## 三、课程体系设计

### 参考来源
本课程结构参考"90天祖成英语口语陪练"课程体系（吴彦祖 × 杨家成），共168节。

### 课程金字塔（从底层到顶层）

```
Level 5 ── 自如交流（最终目标）：能流畅地与外国人对话
    ↑
Level 4 ── 场景实战：8大主题 × AI角色扮演对话
    ↑
Level 3 ── 场景演绎：看示范 → 模仿 → AI评分
    ↑
Level 2 ── 认知重塑：打破翻译思维，建立英文语义网络
    ↑
Level 1 ── 语音地基：自然拼读（22课）+ 语音语调（11课）
```

### 各模块课程内容

#### 模块一：自然拼读（Phonics）— 22 课
**目标**：看到单词就能读出来，不靠死记硬背

| 课次 | 内容 |
|------|------|
| 第1-3课 | 26个字母发音，元音字母与辅音字母 |
| 第4-6课 | AEIOU五个元音字母的发音规则 |
| 第7课 | 字母Y在单词中的四种发音 |
| 第8-12课 | 元音常见发音规则（长音/短音/组合音） |
| 第13-22课 | 辅音字母 B C D F G H J K L M N P Q R S T V W X Z 在单词中的发音 |

**AI 功能**：用户录音朗读单词 → Gemini 分析每个音素是否正确 → 指出问题并示范正确发音

#### 模块二：语音语调（Intonation）— 11 课
**目标**：说话有节奏感，听起来更自然

| 课次 | 内容 |
|------|------|
| 第1课 | 认识语音语调（什么是升调/降调） |
| 第2课 | 重读（哪些词需要重读） |
| 第3课 | 弱读（虚词如何弱化） |
| 第4课 | 辅元连读（consonant + vowel linking） |
| 第5课 | 辅辅连读（consonant + consonant） |
| 第6课 | 元元连读（vowel + vowel） |
| 第7课 | 缩读（I'm / don't / gonna 等） |
| 第8课 | 陈述句语调 |
| 第9课 | 封闭式问题语调 |
| 第10-11课 | 综合练习 |

**AI 功能**：用户录一段话 → Gemini 分析节奏/重音/连读是否自然 → 打分+具体反馈

#### 模块三：认知重塑（Mindset）— 30 课
**目标**：从"翻译思维"切换到"英文直觉思维"

课程形式：每课一个认知主题（短文 + 中英对照例句 + 思维练习题）

核心话题包括：
- 为什么翻译思维正在杀死你的口语
- 学校教的"标准发音"为何让你不敢开口
- 如何激活你脑中沉睡的主动词汇
- 中英文语序差异与思维重建
- 如何用英文"感受"而不是"翻译"

**AI 功能**：AI 出思维练习题 → 用户用英文回答 → DeepSeek 评估是否在用英文思维，给出提示

#### 模块四：场景实战（Scenes）— 84 课
**目标**：在真实场景中开口说话

8大主题，每个主题约10节课：

| 主题 | 示例场景 |
|------|---------|
| 🏠 家庭与朋友 | 介绍家人、聊日常、邀请朋友 |
| 🤝 社交 | 自我介绍、闲聊、交朋友 |
| ✈️ 旅行 | 机场、酒店、问路、点餐 |
| 💪 健康与健身 | 看医生、描述症状、健身 |
| 🛍️ 购物 | 逛街、砍价、退换货 |
| 🍜 饮食 | 餐厅点餐、描述口味、外卖 |
| 🎬 娱乐 | 聊电影/音乐、表达喜好 |
| 💼 职场（重点）| 开会、汇报、邮件、介绍项目 |

**AI 功能**：用户选择场景 → DeepSeek 扮演对话角色 → 用户用英文回应 → AI 实时纠错并给出更地道的表达

#### 模块五：场景演绎（Demonstration）— 21 课
**目标**：通过观看示范，学习地道表达方式

包含场景：购物、飞机点餐、机舱服务、酒店、民宿、西餐厅、麦当劳、星巴克等

**App 形式**：
1. 展示标准对话文本（中英双语）
2. TTS 朗读标准发音
3. 用户跟读录音 → Gemini 打相似度分数
4. AI 给出改进建议

#### 模块六：编程英语（Tech English）— 额外模块
**目标**：理解 CLI 命令、技术报错、编程文档

内容包括：
- 常用 Git 命令英文含义（commit / push / pull / merge / branch…）
- 常见报错信息解读（Error / Warning / Undefined / Null…）
- 编程关键词词汇表（function / variable / loop / array…）
- 终端/命令行常用指令解读
- 如何读懂英文技术文档和 Stack Overflow

**AI 功能**：用户粘贴一段报错或命令 → DeepSeek 用中英文解释含义 → 关联词汇扩展学习

#### 模块七：随拍学英语（Snap & Learn）— 随时触发
**目标**：打通线下学习场景，拍一张照片就能立刻学到东西

**适用场景举例**：
- 📍 路牌、店招、告示牌
- 🍽️ 英文菜单、饮品单
- 📦 商品包装上的英文说明
- 📰 书籍、杂志、广告里的好句子
- 💻 电脑屏幕上的报错信息（截图上传）
- 🗺️ 旅行途中任何不懂的英文

**交互流程**：
```
用户拍照 / 从相册上传图片
        ↓
图片传给 Gemini Vision（multimodal）
        ↓
Gemini 自动识别图中英文文字
        ↓
以"AI 老师"身份输出教学内容：
  1. 📖 这段文字是什么意思（直接翻译）
  2. 🔤 里面有哪些值得学习的单词（带音标+词性）
  3. 🧠 语法结构解析（用简单中文解释句子构成）
  4. 💬 类似场景下还能怎么说（扩展表达）
  5. ➕ 一键将生词加入我的词汇本
```

**Gemini Vision Prompt 模板**：
```
你是一位专业且亲切的英语老师，正在辅导一位中文母语的零基础成人学习者。

学生刚刚拍了一张生活中看到的英文照片，请你：
1. 识别图片中所有英文文字
2. 以老师的口吻，用中文逐步教学，输出以下 JSON 格式：

{
  "recognized_text": "图片中识别出的原始英文文字",
  "translation": "整体翻译（中文，自然口语化）",
  "vocabulary": [
    {
      "word": "单词",
      "phonetic": "/音标/",
      "part_of_speech": "词性",
      "meaning": "中文释义",
      "example": "简单英文例句",
      "example_zh": "例句中文翻译"
    }
  ],
  "grammar_tip": "语法结构解析（中文，简单易懂，适合零基础）",
  "similar_expressions": ["类似场景常用表达1", "表达2"],
  "teacher_comment": "老师点评或鼓励（亲切友善语气）"
}

请保持语气亲切、讲解简单，避免复杂语法术语。
```

**技术实现要点**：
- 手机端使用 `<input type="file" accept="image/*" capture="environment">` 调用摄像头
- 图片压缩至 1MB 以内再传给 API（节省 token）
- 图片以 base64 格式直接传给 Gemini（无需先上传 Storage）
- 识别出的生词可一键保存到词汇本

---

## 四、功能模块详细说明

### 4.1 用户系统

- 邮箱注册/登录
- Google 一键登录（可选）
- 用户资料：昵称、头像、学习目标
- 跨端进度自动同步（Supabase Realtime）

### 4.2 学习主页（Dashboard）

显示内容：
- 今日打卡状态（连续打卡天数 🔥）
- 当前所在课程模块和进度
- 今日推荐练习（基于上次学习内容）
- 总体进度环形图（6个模块各自完成百分比）
- 最近一次 AI 发音评分

### 4.3 发音练习（核心功能）

**流程**：
1. 展示当前课程的音素/单词/句子（中英双语）
2. 播放标准发音（TTS）
3. 用户点击录音按钮，开始录音
4. 录音文件上传至 Supabase Storage
5. 调用 Gemini Flash API 分析音频
6. 返回：总评分（0-100）+ 具体音素问题 + 改进建议（中英文）
7. 用户可反复练习，直到达到目标分数解锁下一关

**Gemini 发音分析 Prompt 模板**：
```
你是一位专业的英语发音教练，专门辅导中文母语零基础学习者。

当前练习内容：[单词/句子]
学习者级别：零基础初学者

请分析这段录音的发音质量，输出 JSON 格式：
{
  "overall_score": 0-100的整数,
  "pronunciation_issues": [
    {
      "word": "发音有问题的单词",
      "issue": "具体问题描述（中文）",
      "correct_ipa": "正确音标",
      "tip": "改正建议（中文，简单易懂）"
    }
  ],
  "positive_feedback": "鼓励性反馈（中文）",
  "next_focus": "下次重点练习的建议（中文）"
}

请用鼓励和友善的语气，适合零基础学习者。
```

### 4.4 对话陪练（AI 角色扮演）

**流程**：
1. 用户选择场景（如"星巴克点单"）
2. DeepSeek 扮演场景角色，用英文开始对话
3. 用户用英文文字或语音回复
4. 若用语音：Whisper/Gemini 转文字后进入对话
5. AI 回复分两部分：
   - **正常对话继续**（保持角色沉浸感）
   - **学习反馈**（用中文标注：语法问题/更地道的说法）
6. 对话结束后，AI 给出本次会话总结：词汇使用、语法错误、地道程度评分

**DeepSeek 对话 Prompt 模板**：
```
你是一个 AI 英语口语陪练助手，帮助中文母语零基础学习者练习英语对话。

当前场景：[场景名称，如"星巴克点单"]
场景描述：[用户走进星巴克，你是咖啡师]
用户级别：零基础初学者

对话规则：
1. 用简单、日常的英语与用户对话（避免复杂词汇）
2. 每次回复格式如下：

**[角色对话]**
（用英文正常对话，保持角色）

**[学习反馈]**
- ✅ 说得好：（如果用户说对了，给予鼓励）
- 📝 建议：（如果有语法/表达问题，给出中文说明 + 更好的英文表达）
- 💡 新词汇：（本次对话中的有用词汇，中英对照）

记住：鼓励为主，纠错为辅。让用户有信心开口说话。
```

### 4.5 语法练习

两种模式：

**模式 A：题目练习**
- 选择题（选出语法正确的句子）
- 填空题（填入正确的时态/介词）
- 改错题（找出句子中的语法错误）
- AI 即时批改 + 中文讲解原因

**模式 B：AI 对话纠错**
- 用户随意用英文写一段话或说一段话
- DeepSeek 逐句分析语法，用中文标注问题
- 给出修改后的正确版本
- 解释语法规则（简单易懂的中文）

### 4.6 词汇积累

- 与发音课程联动：学完某个音素，自动关联相关单词
- 单词卡片：正面英文+音标，背面中文+例句
- 复习算法：基于遗忘曲线（艾宾浩斯）安排复习
- 用户可以给单词标记"已掌握/需复习/不认识"

### 4.7 进度与成就系统

- 每个模块的课程完成进度（百分比）
- 连续打卡天数（中断后清零）
- 发音最高分记录
- 成就徽章（如："发音新星"、"连续打卡7天"、"完成第一个场景对话"）
- 学习时长统计

---

## 五、数据库设计（Supabase PostgreSQL）

### 用户表 `users`
```sql
id            uuid PRIMARY KEY  -- Supabase Auth 自动生成
email         text UNIQUE
display_name  text
avatar_url    text
created_at    timestamp
last_active   timestamp
```

### 学习进度表 `user_progress`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
module_id       text  -- 'phonics' | 'intonation' | 'mindset' | 'scenes' | 'demo' | 'tech'
lesson_id       text  -- 课程编号，如 'phonics_lesson_01'
status          text  -- 'locked' | 'in_progress' | 'completed'
score           int   -- 最近一次得分 0-100
best_score      int   -- 历史最高分
completed_at    timestamp
updated_at      timestamp
```

### 录音记录表 `recordings`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
lesson_id       text
audio_url       text  -- Supabase Storage 中的文件路径
duration_sec    int
ai_score        int
ai_feedback     jsonb -- Gemini 返回的完整 JSON 反馈
created_at      timestamp
```

### 对话记录表 `conversations`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
scene_id        text  -- 场景编号
messages        jsonb -- [{role, content, feedback, timestamp}]
overall_score   int
summary         text  -- AI 生成的会话总结
created_at      timestamp
```

### 词汇表 `vocabulary`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
word            text
phonetic        text  -- 音标
translation     text  -- 中文释义
example_en      text  -- 英文例句
example_zh      text  -- 中文例句
source_lesson   text  -- 从哪节课学到的
familiarity     int   -- 0=不认识 1=模糊 2=熟悉 3=掌握
next_review     timestamp -- 下次复习时间（遗忘曲线）
created_at      timestamp
```

### 打卡记录表 `check_ins`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
check_in_date   date
study_minutes   int
lessons_done    int
created_at      timestamp
```

---

## 六、页面路由结构

```
/                   → 登录/注册页（未登录时）/ 首页 Dashboard（已登录）
/login              → 登录页
/register           → 注册页
/dashboard          → 学习主页（进度总览）
/course             → 课程总览（7个模块入口）
/course/phonics     → 自然拼读模块
/course/phonics/:id → 具体课程页（含录音练习）
/course/intonation  → 语音语调模块
/course/mindset     → 认知重塑模块
/course/scenes      → 场景实战模块
/course/scenes/:id  → 具体场景对话页
/course/demo        → 场景演绎模块
/course/tech        → 编程英语模块
/snap               → 随拍学英语（拍照/上传图片）
/snap/:id           → 某次拍照的学习详情（可回看历史）
/practice/speaking  → 口语自由练习
/practice/grammar   → 语法练习
/vocabulary         → 词汇本
/profile            → 个人中心 & 设置
```

---

## 六·五、多模态输入统一设计

> 这个 App 支持三种输入方式，共同构成一个无缝的学习闭环：

```
┌──────────────────────────────────────────────┐
│          三种输入方式，一个 AI 老师             │
├──────────────┬──────────────┬─────────────────┤
│  ⌨️ 文字输入  │  🎤 语音输入  │  📷 拍照输入     │
│             │              │                 │
│ 直接打字提问  │ 录音→Gemini  │ 拍照→Gemini     │
│ 语法练习答题  │ 语音转文字    │ 识别图中英文     │
│ 对话陪练输入  │ → 发音评分   │ → AI教学讲解    │
│             │ → 对话继续   │ → 生词存词汇本   │
└──────────────┴──────────────┴─────────────────┘
                       ↓
             DeepSeek / Gemini
             统一 AI 教学输出（中文）
```

**三种输入的技术实现**：

| 输入类型 | 技术方案 | 调用的 AI |
|---------|---------|----------|
| 文字 | 普通 `<textarea>` | DeepSeek Chat |
| 语音 | `MediaRecorder API` → base64 音频 | Gemini Flash（音频理解）|
| 拍照 | `<input capture="environment">` → base64 图片 | Gemini Flash（视觉理解）|

**底部统一输入栏（移动端核心 UI）**：

在练习页和对话页，底部设计一个统一输入栏，三种模式一键切换：
```
┌──────────────────────────────────────────┐
│  说点什么，或者上传图片...                 │  ← 输入框
│                            [📷] [🎤] [➤] │  ← 功能按钮
└──────────────────────────────────────────┘
   📷 = 调用相机/相册（触发随拍功能）
   🎤 = 录音（语音输入，长按录音）
   ➤ = 发送文字
```

---

## 七、UI/UX 设计规范

> 整体风格参考 **Claude 桌面端**（claude.ai desktop）的设计语言：
> 温暖奶油色背景、克制的排版、柔和的圆角卡片、橙色作为唯一强调色。
> 目标是"高级感 + 沉浸感"，让用户专注于学习内容本身，而不是被花哨的 UI 分心。

---

### 语言设置
- 界面语言：中英双语（所有 UI 元素都有中文标注，内容本身是英文）
- 学习内容展示：英文为主，中文翻译辅助展示
- AI 反馈：统一用中文输出（对零基础用户友好）

---

### 色彩系统（Claude 官方品牌色）

```css
:root {
  /* 背景层 */
  --color-bg-primary:    #faf9f5;   /* 主背景：温暖奶油白（Claude 标志性底色） */
  --color-bg-secondary:  #f0ede4;   /* 次级背景：侧边栏、卡片 */
  --color-bg-elevated:   #ffffff;   /* 悬浮层：弹窗、输入框、高亮卡片 */
  --color-bg-dark:       #141413;   /* 深色背景：深色模式主背景 */

  /* 文字层 */
  --color-text-primary:  #141413;   /* 主文字：深近黑色 */
  --color-text-secondary:#b0aea5;   /* 次文字：中灰，用于标签、说明 */
  --color-text-light:    #faf9f5;   /* 浅色文字：用于深色背景上 */

  /* 边框与分割线 */
  --color-border:        #e8e6dc;   /* 浅灰边框：卡片边框、分割线 */

  /* 强调色（仅一个，不滥用） */
  --color-accent:        #d97757;   /* Claude 橙：按钮、高亮、进度条、徽章 */
  --color-accent-hover:  #c4633e;   /* 橙色深版：hover 状态 */
  --color-accent-light:  #f5e6df;   /* 橙色浅版：标签背景、提示框底色 */

  /* 辅助功能色 */
  --color-success:       #788c5d;   /* Claude 绿：答对、完成、达标 */
  --color-info:          #6a9bcc;   /* Claude 蓝：提示、信息、链接 */
  --color-warning:       #d97757;   /* 复用橙色作为警示 */
}
```

**使用原则**：
- 背景 90% 使用 `--color-bg-primary`（奶油白），绝不用纯白 `#ffffff` 作为主背景
- 橙色 `--color-accent` 只用于：主要按钮、当前选中状态、进度条、重要评分
- 不使用多种彩色图标，保持克制的单色系 + 一个橙色强调

---

### 字体系统

```css
/* 标题字体 */
font-family: 'Poppins', Arial, sans-serif;

/* 正文字体 */
font-family: 'Lora', Georgia, serif;

/* 等宽字体（用于音标、代码）*/
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

**字体引入**（在 `index.html` 中）：
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

**字阶**：
| 用途 | 字号 | 字重 | 字体 |
|------|------|------|------|
| 页面大标题 | 28px | 700 | Poppins |
| 模块标题 | 20px | 600 | Poppins |
| 卡片标题 | 16px | 500 | Poppins |
| 正文内容 | 15px | 400 | Lora |
| 辅助说明 | 13px | 400 | Lora |
| 音标/代码 | 14px | 400 | JetBrains Mono |

---

### 布局与圆角规范

```css
/* 圆角 */
--radius-sm:   6px;    /* 小元素：标签、徽章 */
--radius-md:   12px;   /* 卡片、输入框、按钮 */
--radius-lg:   16px;   /* 大卡片、面板 */
--radius-xl:   24px;   /* 录音按钮、弹窗 */
--radius-full: 9999px; /* 完整圆形：头像、圆形按钮 */

/* 阴影（极其克制，只在需要层次感时使用）*/
--shadow-sm: 0 1px 3px rgba(20, 20, 19, 0.06);
--shadow-md: 0 4px 12px rgba(20, 20, 19, 0.08);
--shadow-lg: 0 8px 24px rgba(20, 20, 19, 0.10);
```

---

### 核心组件规范

#### 主按钮（Primary Button）
```css
/* 橙色实心按钮，用于最主要操作 */
background: #d97757;
color: #faf9f5;
border-radius: 12px;
padding: 10px 20px;
font-family: Poppins;
font-weight: 500;
transition: background 0.15s ease;

/* Hover */
background: #c4633e;
```

#### 次要按钮（Secondary Button）
```css
/* 边框按钮，用于次级操作 */
background: transparent;
border: 1.5px solid #e8e6dc;
color: #141413;
border-radius: 12px;
```

#### 内容卡片（Card）
```css
background: #ffffff;
border: 1px solid #e8e6dc;
border-radius: 16px;
padding: 20px;
box-shadow: 0 1px 3px rgba(20,20,19,0.06);
```

#### 录音按钮（核心交互）
```css
/* 默认状态 */
width: 72px; height: 72px;
border-radius: 9999px;
background: #d97757;
color: white;

/* 录音中：脉冲动画（橙色扩散光圈）*/
animation: pulse-orange 1.5s ease-in-out infinite;

/* 上传分析中：旋转加载圈 */
/* 完成：缩小并显示评分卡片（弹出动画）*/
```

#### 进度条
```css
background: #e8e6dc;  /* 轨道：边框灰 */
fill: #d97757;        /* 进度：Claude 橙 */
border-radius: 9999px;
height: 6px;
```

---

### 侧边栏导航（桌面端）

参考 Claude 桌面端左侧导航的设计：

```
┌─────────────────┐
│  🎓 AI英语陪练   │  ← App Logo，Poppins 字体
│─────────────────│
│  ▶ 首页          │  ← 选中时：左侧橙色竖线 + 背景 #f0ede4
│  📚 课程          │
│  💬 练习          │
│  📖 词汇本        │
│  👤 我的          │
│─────────────────│
│  今日进度         │  ← 底部小组件：今日打卡状态
│  🔥 连续 12 天    │
└─────────────────┘
```

- 侧边栏背景：`#f0ede4`（比主背景稍深一点的奶油色）
- 选中项：左侧 3px 橙色竖线 + 文字加粗
- 未选中：`#b0aea5` 灰色文字
- 宽度：240px（桌面端）

---

### 底部导航栏（移动端）

```
┌──────────────────────────────────────┐
│  🏠首页   📚课程   💬练习   📖词汇   👤我的  │
└──────────────────────────────────────┘
```

- 背景：`#faf9f5` + 顶部细边框 `#e8e6dc`
- 选中图标：橙色 `#d97757`
- 未选中图标：灰色 `#b0aea5`
- 高度：60px + safe-area-inset-bottom（适配 iPhone）

---

### 深色模式（Dark Mode）

```css
@media (prefers-color-scheme: dark) {
  --color-bg-primary:    #1a1917;   /* 深暖黑背景 */
  --color-bg-secondary:  #141413;   /* 侧边栏深色 */
  --color-bg-elevated:   #242320;   /* 卡片深色 */
  --color-text-primary:  #faf9f5;   /* 主文字变浅 */
  --color-text-secondary:#b0aea5;   /* 次文字不变 */
  --color-border:        #2e2c29;   /* 边框深色版 */
  /* 强调色不变：橙色在深色背景上依然好看 */
}
```

---

### 响应式断点

```css
/* Mobile First 设计 */
/* 默认（手机）：< 768px */
/* 平板：768px - 1024px */
/* 桌面：> 1024px */

@media (min-width: 1024px) {
  /* 显示左侧边栏，隐藏底部导航 */
  /* 内容区居中，最大宽度 900px */
}
```

---

### 动画规范

保持克制，只在关键节点有动画：

| 场景 | 动画 |
|------|------|
| 页面切换 | fade + slide（150ms ease-out）|
| 卡片出现 | fade + scale from 0.97（200ms）|
| 录音中 | 橙色脉冲光圈（1.5s infinite）|
| AI 评分出现 | 数字滚动计数（1s ease-out）|
| 成就解锁 | 弹出 + 短暂金光闪烁 |
| 按钮 hover | 背景色过渡（150ms）|

---

## 八、开发优先级 & 里程碑

### Phase 1 — MVP（先做这些，能用就行）
- [ ] 项目初始化（React + Vite + Tailwind + Supabase）
- [ ] 用户注册/登录
- [ ] 自然拼读模块（前5课）+ 录音 + Gemini 发音分析
- [ ] 基础学习进度保存
- [ ] 简单的 Dashboard 首页

**目标**：能登录、能上课、能录音、能得到 AI 反馈

### Phase 2 — 核心功能完善
- [ ] 完成自然拼读全部22课
- [ ] 语音语调模块（11课）
- [ ] 场景对话（先上3个场景：星巴克/职场会议/自我介绍）
- [ ] **随拍学英语**（图片上传 + Gemini 识别教学）
- [ ] 词汇本（含随拍生词一键保存）
- [ ] 连续打卡 + 成就系统

### Phase 3 — 全模块上线
- [ ] 认知重塑30课
- [ ] 场景实战全部84节
- [ ] 语法练习模块
- [ ] 编程英语模块
- [ ] PWA 配置（可添加到手机桌面）

### Phase 4 — 体验优化
- [ ] 遗忘曲线复习算法
- [ ] 学习数据可视化（图表）
- [ ] AI 个性化学习计划推荐
- [ ] 动画和交互优化

---

## 八·五、扩展性设计原则

> 这个 App 从一开始就要为"未来能加新功能"留好空间，避免以后改代码改得一团糟。

### 功能模块插件化

每个功能模块独立成一个文件夹，新增功能只需新增模块，不影响现有代码：

```
src/modules/
├── phonics/           ← 自然拼读（独立）
├── intonation/        ← 语音语调（独立）
├── scenes/            ← 场景实战（独立）
├── snap/              ← 随拍学英语（独立）
├── tech-english/      ← 编程英语（独立）
└── [future-module]/   ← 未来新模块，直接加在这里即可
```

### AI 服务统一封装

`src/services/ai.js` 封装所有 AI 调用，页面层不直接调用 API，未来切换模型只改这一个文件：

```javascript
// src/services/ai.js
export const analyzeAudio = (audioBase64, prompt) => { /* Gemini */ }
export const analyzeImage = (imageBase64, prompt) => { /* Gemini Vision */ }
export const chatWithAI   = (messages, systemPrompt) => { /* DeepSeek */ }
export const generateText = (prompt) => { /* DeepSeek */ }
// 未来新增 AI 能力：只在这里加函数，页面层零改动
```

### 预留的扩展方向（未来可加）

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 🎵 听力训练 | 听英文短文/播客，选择题测理解 | 中 |
| ✍️ 写作练习 | 写英文日记，AI 批改 | 中 |
| 📊 每周学习报告 | AI 生成个人学习总结与建议 | 低 |
| 🌐 离线模式 | PWA 缓存课程，无网络也能学 | 低 |
| 🔔 智能提醒 | 根据学习计划推送每日练习通知 | 低 |
| 📚 外部内容导入 | 粘贴文章/视频链接，AI 帮你学 | 低 |
| 👥 学习打卡社群 | 与朋友互相监督、比拼分数 | 待定 |

---

## 九、项目文件结构

```
ai-english-coach/
├── public/
│   ├── manifest.json          # PWA 配置
│   └── icons/                 # App 图标
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── router.jsx             # React Router 配置
│   ├── components/            # 可复用组件
│   │   ├── ui/                # 基础 UI 组件（Button, Card 等）
│   │   ├── AudioRecorder.jsx  # 录音组件（核心）
│   │   ├── ScoreDisplay.jsx   # AI 评分展示
│   │   ├── ChatBubble.jsx     # 对话气泡
│   │   └── ProgressRing.jsx   # 进度环形图
│   ├── pages/                 # 页面组件
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Course/
│   │   │   ├── CourseOverview.jsx
│   │   │   ├── PhonicsLesson.jsx
│   │   │   ├── ScenePractice.jsx
│   │   │   └── TechEnglish.jsx
│   │   ├── Practice/
│   │   │   ├── Speaking.jsx
│   │   │   └── Grammar.jsx
│   │   └── Vocabulary.jsx
│   ├── store/                 # Zustand 状态管理
│   │   ├── userStore.js
│   │   └── progressStore.js
│   ├── services/              # API 调用
│   │   ├── supabase.js        # Supabase 客户端
│   │   ├── gemini.js          # Gemini API（发音分析）
│   │   └── deepseek.js        # DeepSeek API（对话/语法）
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAudioRecorder.js
│   │   └── useProgress.js
│   └── data/                  # 课程内容数据
│       ├── phonics.js         # 自然拼读课程数据
│       ├── intonation.js
│       ├── scenes.js
│       └── techEnglish.js
├── .env.local                 # 环境变量（不上传 Git）
├── .env.example               # 环境变量示例
├── package.json
├── vite.config.js
├── tailwind.config.js
└── CLAUDE.md                  # 本文件
```

---

## 十、注意事项 & 开发规范

### 关于 AI API 调用
1. **Gemini**：发音分析时，音频文件先上传到 Supabase Storage，再将 URL 传给 Gemini，或直接传 base64 编码
2. **DeepSeek**：对话内容不要在前端直接暴露 API Key，Phase 1 可以先在前端直接调用（个人使用可接受），后期加 Supabase Edge Function 做中转
3. 所有 AI 调用都要有 loading 状态和错误处理

### 关于录音
- 使用浏览器 `MediaRecorder API`
- 格式：WebM（浏览器兼容性最好）
- 录音文件临时存储，分析完成后可删除以节省 Supabase Storage 空间

### 关于跨端同步
- 所有学习进度存储在 Supabase，不用 localStorage
- 用 Supabase Realtime 监听进度变化，实现跨端即时同步

### 关于课程内容
- 课程文本内容写在 `src/data/` 目录下的 JS 文件中
- Phase 1 先手动录入前5课的内容，后期可考虑存到 Supabase 数据库

---

## 十一、快速启动命令

```bash
# 1. 创建项目
npm create vite@latest ai-english-coach -- --template react
cd ai-english-coach

# 2. 安装依赖
npm install
npm install @supabase/supabase-js
npm install zustand
npm install @tanstack/react-query
npm install react-router-dom
npm install tailwindcss @tailwindcss/vite
npm install @google/generative-ai

# 3. 配置 Tailwind（按官方文档）

# 4. 配置 .env.local（填入真实密钥）

# 5. 启动开发服务器
npm run dev
```

---

*本文件为 v0.1 草稿，随项目推进持续更新。*  
*最后更新：2026年5月*
