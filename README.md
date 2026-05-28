# AI English Teacher

面向中文母语者的 AI 英语学习应用，覆盖自然拼读、语音语调、认知重塑、场景演绎、真实场景对话、自如交流、词汇复习和雅思口语练习。

## 当前完成度

- 课程体系：自然拼读 22 课、语音语调 11 课、认知重塑 30 课、场景演绎 21 课、场景实战 100 个、自如交流 20 课
- 练习中心：自由录音、语法纠错、听写、听力理解、编程英语、随拍学英语、雅思 Part 1、雅思 Part 2
- AI 能力：Gemini 发音/视觉/听力/雅思评分，DeepSeek 对话/纠错/复盘，ElevenLabs TTS
- 学习数据：Supabase 登录、课程进度、录音记录、对话记录、词汇本、打卡统计
- App 能力：PWA、响应式布局、Emma 全局学习助手

## 技术栈

- React 19
- Vite 8
- Tailwind CSS v4
- Zustand
- Supabase
- Gemini API
- DeepSeek API
- ElevenLabs API

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run lint
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并填入真实服务配置：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_ELEVENLABS_API_KEY=
```

## Supabase 初始化

在 Supabase Dashboard 的 SQL Editor 中运行：

```bash
supabase-setup.sql
```

脚本包含：

- 用户课程进度表
- 录音记录表
- 对话记录表
- 词汇表
- 打卡表
- Row Level Security 策略
- `recordings` Storage bucket 和用户目录读写策略

## 上线前重点

当前项目适合本地自用或小范围内测。正式公开上线前，建议优先完成：

- 把 Gemini、DeepSeek、ElevenLabs 调用迁移到后端代理，避免浏览器暴露 API Key
- 在 Supabase 上跑通完整冒烟流程：注册、登录、完成课程、录音评分、保存词汇、对话复盘
- 为核心服务函数补测试或至少补手动 QA 清单
- 根据真实用户反馈精简课程入口和学习路径

## 质量检查

当前构建可用：

```bash
npm run build
```

代码检查：

```bash
npm run lint
```

