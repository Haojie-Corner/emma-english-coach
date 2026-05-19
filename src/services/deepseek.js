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

export const explainTechEnglish = async (input) => {
  const systemPrompt = `你是一位专门辅导中文母语开发者学习编程英语的老师。

用户会粘贴一段英文（可能是报错信息、命令行输出、技术文档片段、代码注释等），请：
1. 翻译并解释整体含义（中文，口语化）
2. 提取关键技术术语并逐一解释
3. 如果是报错，给出可能原因和解决思路
4. 给出1-2个相关的常用英文表达或句型

只输出 JSON：
{
  "type": "error | command | docs | code | other",
  "translation": "整体中文翻译（自然口语化）",
  "key_terms": [
    {
      "term": "技术术语",
      "phonetic": "/音标/",
      "meaning": "中文含义",
      "usage": "常见用法或例句（英文）"
    }
  ],
  "error_analysis": "如果是报错，给出原因分析和解决思路（中文）；否则为null",
  "expression_tip": "相关常用英文表达（1-2句，帮助开发者在工作中用英文沟通）",
  "tts_summary": "用中文写2-3句口语化总结，遇到英文术语直接嵌入，供 speakMultilingual 朗读"
}`

  return callDeepSeek([{ role: 'user', content: input }], systemPrompt)
}

export const generateMindsetQuiz = async (topic, quizType, previousQuestions = []) => {
  const avoidStr = previousQuestions.length > 0
    ? `\n\n请避免出和这些相同的题目：${previousQuestions.slice(-3).join(' | ')}`
    : ''

  const systemPrompt = `你是一位专门帮助中文母语零基础学习者建立英文思维的认知训练教练。

话题：${topic}
题型：${quizType}

请生成一道帮助学习者打破翻译思维、建立英文直觉的练习题。${avoidStr}

题型说明：
- chunk_translation: 给中文句子，让学习者用英文"语块"思考并表达
- direct_association: 给单词/场景，训练直接英文联想
- sentence_structure: 找出中式语序问题并改正
- tense_correction: 时态错误纠正
- article_fill: 冠词填空
- preposition_fill: 介词填空
- chinglish_correction: 中式英语识别纠正
- expression_choice: 多种表达方式选择最佳
- natural_expression: 教科书英文 vs 自然英文
- cultural_context: 文化语境理解
- idiom_comprehension: 惯用语含义理解
- free_thinking: 开放性英文思维输出
- comprehensive: 综合多种技能

只输出 JSON：
{
  "question_type": "${quizType}",
  "question": "题目内容（可包含中英文）",
  "question_en": "如果有英文原句或素材，放这里；否则为null",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "correct_answer": "正确答案（选项内容，不是ABCD）",
  "explanation": "详细解释为什么这样对/错（中文，要有启发性）",
  "thinking_tip": "一句话认知建议，帮助学习者建立正确思维方式（中文）",
  "example_in_context": "在真实场景中的应用示例（英文句子 + 中文说明）"
}`

  return callDeepSeek([{ role: 'user', content: `生成一道${quizType}类型的认知训练题，话题：${topic}` }], systemPrompt)
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
