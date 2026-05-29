# AI English Teacher

面向中文母语者的 AI 英语学习应用，覆盖自然拼读、语音语调、认知重塑、场景演绎、真实场景对话、自如交流、词汇复习和雅思口语练习。

## 当前完成度

- 课程体系：自然拼读 22 课、语音语调 11 课、认知重塑 30 课、场景演绎 21 课、场景实战 100 个、自如交流 20 课
- 练习中心：自由录音、语法纠错、听写、听力理解、编程英语、随拍学英语、雅思 Part 1、雅思 Part 2
- AI 能力：Gemini 发音/视觉/听力/雅思评分，DeepSeek 对话/纠错/复盘，ElevenLabs TTS
- 学习数据：Supabase 登录、课程进度、录音记录、对话记录、词汇本、打卡统计
- App 能力：PWA、响应式布局、Emma 全局学习助手、手机/电脑学习状态同步

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
- 跨设备学习状态表 `learning_state`
- Row Level Security 策略
- `recordings` Storage bucket 和用户目录读写策略

## 手机和电脑同步

同一个账号在手机和电脑登录后，会自动同步这些学习状态：

- 雅思目标和最近口语练习
- 今日学习分钟、每日目标、诊断档案
- 语法错题、综合弱点档案
- Emma 最近对话记忆和里程碑状态

注意：必须先在 Supabase SQL Editor 运行最新的 `supabase-setup.sql`，让 `learning_state` 表真实存在。否则应用仍可使用，但这些本地学习档案无法跨设备持久同步。

## 部署建议

临时手机预览可以用 Cloudflare quick tunnel，但这类地址会随本地进程关闭而失效。长期使用建议部署到 Vercel 或 Cloudflare Pages，并配置同一套环境变量。

公开上线前，优先把 Gemini、DeepSeek、ElevenLabs 调用迁移到后端代理或 Supabase Edge Functions，避免浏览器暴露 API Key。

## 上线前重点

当前项目适合本地自用或小范围内测。正式公开上线前，建议优先完成：

- 把 Gemini、DeepSeek、ElevenLabs 调用迁移到后端代理，避免浏览器暴露 API Key
- 部署到稳定公网域名，替代临时 tunnel 预览地址
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
