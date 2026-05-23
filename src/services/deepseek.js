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
  if (res.status === 429) throw new Error('AI 服务繁忙，请稍后重试（请求频率超限）')
  if (res.status === 402) throw new Error('AI 服务积分不足，请联系管理员')
  if (res.status === 401 || res.status === 403) throw new Error('AI 服务授权失败，请检查配置')
  if (!res.ok) throw new Error(`AI 服务暂时不可用（${res.status}），请稍后重试`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export const chatWithScene = async (sceneId, sceneName, sceneDesc, messages, userRole = '', aiRole = '', roleSwitched = false) => {
  const myRole = roleSwitched ? aiRole : userRole
  const theirRole = roleSwitched ? userRole : aiRole
  const roleDesc = myRole && theirRole
    ? `\n用户扮演：${myRole}\nAI 扮演：${theirRole}`
    : ''

  const systemPrompt = `你是一个 AI 英语口语陪练助手，帮助中文母语零基础学习者练习英语对话。

当前场景：${sceneName}
场景描述：${sceneDesc}
用户级别：零基础初学者${roleDesc}

对话规则：
1. 用简单、日常的英语与用户对话（避免复杂词汇）
2. 每次回复格式：

**[角色对话]**
（用英文正常对话，保持你扮演的角色${theirRole ? `（${theirRole}）` : ''}）

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

核心教学原则（基于对中国学习者的研究）：
- 中国学习者最大痛点：翻译思维（看到中文先翻译再说英文）、冠词盲区、时态遗忘、Chinglish直接直译
- 最有效的纠正方式：对比中英思维差异 + 给出真实语境 + 告诉"为什么"而非只说"对错"
- 题目要有实际场景，不要纯粹的语法练习
- 解释要点出中英文化/思维的本质差异，让学习者"顿悟"而不只是"记住"

话题：${topic}
题型：${quizType}

请生成一道帮助学习者打破翻译思维、建立英文直觉的练习题。${avoidStr}

题型说明（每种都要体现中英思维对比）：
- chunk_translation: 给中文句子，让学习者用英文"语块"思考（强调：不要逐字翻译）
- direct_association: 给单词/场景，训练直接英文联想（跳过母语中转）
- sentence_structure: 找出中式语序/省略主语/形容词位置等中式英语问题
- tense_correction: 时态错误纠正（中文无时态 → 英文必须标注时间信息在动词上）
- article_fill: 冠词填空（中文无冠词这一概念的深层解释）
- preposition_fill: 介词填空（中英介词使用逻辑完全不同）
- chinglish_correction: 中式英语纠正（常见的中文直译错误）
- expression_choice: 选最自然的英文表达（区分教科书英文vs真实口语）
- natural_expression: 教科书英文 vs 真实母语者说法对比
- cultural_context: 中西文化差异导致的语言使用差异
- idiom_comprehension: 惯用语/习语含义（无法用中文字面翻译）
- free_thinking: 开放性英文思维输出（不接受中文翻译式答案）
- comprehensive: 综合多种技能，模拟真实对话场景

只输出 JSON（不要任何额外文字）：
{
  "question_type": "${quizType}",
  "question": "题目内容（可包含中英文），必须有真实日常场景",
  "question_en": "如果有英文原句或素材，放这里；否则为null",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "correct_answer": "正确答案（选项内容，不是ABCD）",
  "explanation": "详细解释：1)为什么这样对 2)中英文思维的本质区别在哪 3)如何建立正确直觉（中文，200字内，要有顿悟感）",
  "thinking_tip": "一句话认知建议，直击思维方式差异（中文，最多30字）",
  "example_in_context": "真实场景应用示例：英文句子 + 中文说明，让学习者看到这个知识点在日常生活中的实际用法",
  "voice_script": "用中文写2-3句口语化老师点评，总结本题关键知识点，遇到英文发音示范时直接嵌入英文词，供 speakMultilingual 朗读。格式：全中文，英文只在示范时嵌入，不整句英文。",
  "key_vocab": [{"en": "重点英文词汇或短语", "zh": "中文释义"}]
}

key_vocab 从 correct_answer 和 example_in_context 中提取 1-3 个值得零基础学习者掌握的核心英文表达，优先选短语和地道说法。`

  return callDeepSeek([{ role: 'user', content: `生成一道${quizType}类型的认知训练题，话题：${topic}` }], systemPrompt)
}

export const chatWithFluency = async (lessonId, lessonTitle, aiPrompt, messages) => {
  const systemPrompt = `你是一个 AI 英语口语陪练助手，专门帮助中文母语零基础成人学习者练习流利表达。

当前练习主题：${lessonTitle}
你的角色设定：${aiPrompt}

对话规则：
1. 用自然、口语化的英语和用户对话（配合主题难度）
2. 每次回复格式：

**[对话回应]**
（用英文正常对话，保持角色设定）

**[语言反馈]**
- ✅ 亮点：（指出用户表达好的地方，给鼓励）
- 📝 建议：（如果有语法或表达问题，用中文说明 + 更地道的英文替换）
- 💡 学到了：（本轮新出现的有用表达，中英对照）

3. 如果用户用中文说话，用温和方式鼓励他们用英语，但不要批评
4. 保持对话流畅自然，像真实交流场景
5. 偶尔主动提问，推进对话`

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
  "new_words": [
    { "en": "值得学习的单词或短语", "zh": "中文释义" }
  ],
  "encouragement": "鼓励语（中文）"
}
new_words 提取本句中 2-4 个值得零基础学习者掌握的词汇或短语，优先选修改后的正确版本里出现的词。`

  return callDeepSeek([{ role: 'user', content: userText }], systemPrompt)
}

export const rateSentence = async (word, sentence) => {
  const systemPrompt = `你是一位鼓励型英语老师，学生正在用给定单词造句练习。简洁评价即可。
只输出 JSON：
{
  "score": 0-100,
  "word_used": true或false（单词是否出现在句中）,
  "feedback": "中文评价，鼓励为主，如有问题指出改进方向（30字内）",
  "corrected": "如果句子有语法问题给出改进版本，否则为null",
  "encouragement": "中文鼓励语（10字内）"
}`
  return callDeepSeek([{ role: 'user', content: `目标单词：${word}\n学生造句：${sentence}` }], systemPrompt)
}

export const generateConvoReview = async (messages, sceneName) => {
  const dialogue = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.role === 'user' ? '学生' : 'AI'}：${m.content.slice(0, 200)}`)
    .join('\n')

  const systemPrompt = `你是一位英语口语教练，负责对一段练习对话做整体复盘评估。
场景：${sceneName}
对话记录：
${dialogue}

请从口语练习角度进行综合评价。只输出 JSON：
{
  "overall_score": 0-100的整数（综合口语表现），
  "dimension_scores": {
    "fluency": 0-100（流利度），
    "grammar": 0-100（语法准确性），
    "vocabulary": 0-100（词汇丰富度），
    "communication": 0-100（沟通有效性）
  },
  "strengths": ["亮点1（中文，15字内）", "亮点2（中文，15字内）"],
  "top3_issues": [
    {
      "issue": "问题描述（中文，20字内）",
      "example": "对话中的原句（英文，如果有）",
      "fix": "更好的说法（英文）",
      "tip": "简短说明（中文，20字内）"
    }
  ],
  "next_step": "最值得下一步练习的一件事（中文，30字内）",
  "encouragement": "鼓励语（中文，20字内）"
}`
  return callDeepSeek([{ role: 'user', content: '请复盘这段对话练习' }], systemPrompt)
}

export const chatWithEmma = async (messages, progressSummary, pageContext = '') => {
  const { name, streak, totalCompleted, moduleProgress, dueVocabCount } = progressSummary

  const modLines = Object.entries(moduleProgress)
    .map(([id, m]) => `${id}：${m.locked ? '未解锁' : `${m.pct}%（${m.completed}/${m.total}课）`}`)
    .join('；')

  const contextLine = pageContext ? `\n当前情境：用户${pageContext}，请根据情境给出针对性回答。` : ''

  const systemPrompt = `你是 Emma，一位专业的 AI 英语学习顾问，专门帮助中文母语零基础成人学习英语。你了解用户的完整学习档案，能给出个性化、具体可执行的建议。

用户学习档案：
- 昵称：${name}
- 连续打卡：${streak} 天
- 已完成课程：${totalCompleted} 节
- 各模块进度：${modLines}
- 到期词汇：${dueVocabCount} 个${contextLine}

你的三大职责：
1. **学习路径建议**：根据当前进度，告诉用户接下来应该学什么、为什么、大概需要多久
2. **知识点讲解**：当用户对某个语法/发音/词汇有疑问时，用中文+例子清晰解释（帮教功能）
3. **练习指导**：根据用户薄弱点，设计简单练习，帮助巩固（如造句/发音练习/词汇测试）

回复原则：
- 每次回复 3-5 句话，具体有用，不说"多听多说"这类废话
- 中文为主，仅在示范英语时使用英文
- 鼓励为主，给具体行动建议（"去学第X课"而非"继续努力"）
- 适当用 emoji 增加亲切感
- 如果是知识点问题，给一个简单例句帮助理解
- 当解释词汇或常用表达时，可在回答末尾加一行（可选）：💡 新词汇：word（释义）；word2（释义2）`

  return callDeepSeek(messages, systemPrompt)
}
