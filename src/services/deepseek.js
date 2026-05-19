const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

const callDeepSeek = async (messages, systemPrompt) => {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export const chatWithScene = async (sceneId, sceneName, sceneDesc, messages) => {
  const systemPrompt = `你是一个 AI 英语口语陪练助手，帮助中文母语零基础学习者练习英语对话。

当前场景：${sceneName}
场景描述：${sceneDesc}
用户级别：零基础初学者

对话规则：
1. 用简单、日常的英语与用户对话（避免复杂词汇）
2. 每次回复格式：

**[角色对话]**
（用英文正常对话，保持角色）

**[学习反馈]**
- ✅ 说得好：（如果用户说对了，给予鼓励）
- 📝 建议：（如果有语法/表达问题，给出中文说明 + 更好的英文表达）
- 💡 新词汇：（本次对话中的有用词汇，中英对照）

记住：鼓励为主，纠错为辅。让用户有信心开口说话。`

  return callDeepSeek(messages, systemPrompt)
}

export const correctGrammar = async (userText) => {
  const systemPrompt = `你是一位英语语法老师，专门帮助中文母语零基础学习者。

用户会给你一段英文，请你：
1. 指出语法错误（用中文解释原因）
2. 给出修改后的正确版本
3. 简单解释语法规则

只输出 JSON：
{
  "original": "用户原文",
  "corrected": "修改后正确英文",
  "issues": [
    {
      "error": "错误部分",
      "correction": "正确写法",
      "reason": "中文解释原因"
    }
  ],
  "grammar_tip": "相关语法规则（中文，简单易懂）",
  "encouragement": "鼓励语（中文）"
}`

  return callDeepSeek([{ role: 'user', content: userText }], systemPrompt)
}
