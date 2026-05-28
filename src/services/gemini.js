const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// 主模型 + 备用模型（503 过载时自动切换）
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite']

const geminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

const callGemini = async (parts) => {
  let lastError
  for (const model of MODELS) {
    try {
      const res = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      })
      if (res.status === 503 || res.status === 429) {
        const errBody = await res.text()
        lastError = new Error(`Gemini API error: ${res.status} — ${errBody.slice(0, 200)}`)
        continue  // 换下一个模型重试
      }
      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Gemini API error: ${res.status} — ${errBody.slice(0, 200)}`)
      }
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } catch (e) {
      if (e.message.includes('503') || e.message.includes('429')) {
        lastError = e
        continue
      }
      throw e
    }
  }
  throw lastError
}

export const analyzePronunciation = async (audioBase64, targetText) => {
  const prompt = `你是一位专业的英语发音教练，专门辅导中文母语零基础学习者。

当前练习内容：${targetText}
学习者级别：零基础初学者

请分析这段录音的发音质量，只输出 JSON，不要有任何额外文字：
{
  "overall_score": 0到100的整数（综合评分）,
  "dimension_scores": {
    "pronunciation": 0到100的整数（单音发音准确度：元音/辅音/音标是否准确）,
    "fluency": 0到100的整数（流利连贯度：是否有明显停顿/结巴/过于缓慢）,
    "stress": 0到100的整数（重音节奏：单词重音和句子重音是否正确）,
    "intonation": 0到100的整数（语调：句末升降调是否合适，语调是否自然）
  },
  "pronunciation_issues": [
    {
      "word": "发音有问题的单词",
      "issue": "具体问题描述（中文）",
      "correct_ipa": "正确音标",
      "tip": "改正建议（中文，简单易懂）",
      "tip_demo": "2到3句中文句子，其中英文单词直接嵌入用于发音示范。全部用中文写，只有发音示范时插英文。示例格式：'这个词 the 发音要注意，来听我说：the，the，舌头要轻轻放在牙齿之间，再来一次：the，对了！'"
    }
  ],
  "positive_feedback": "鼓励性反馈（中文，1-2句）",
  "next_focus": "下次重点练习的建议（中文，1句）",
  "voice_script": "用中文写4到6句口语化的老师反馈。语言规则：全部用中文，只有在需要示范英文发音的时候才插入英文单词或短句，示范完立即回到中文继续说。严格按照这个格式输出，不要整句用英文。正确示例：'你这次练习得了78分，整体发音还不错！不过 the 这个词要注意，来听我说：the，the，对，舌头轻轻碰上下牙齿。还有 think 这个词：think，think，感受一下气流从齿间穿过。进步很明显，继续加油！' 错误示例（不要这样）：'Your pronunciation is good. The word the needs work.' 请根据本次实际分析结果生成，不要markdown，不要括号。"
}`

  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常，请重试')
  return JSON.parse(match[0])
}

export const scoreSpeechSimilarity = async (audioBase64, targetText, targetZh) => {
  const prompt = `你是一位专业英语语音教练。学生正在练习模仿跟读，请对比学生录音与目标文本，评估相似度和质量。

目标句子（英文）：${targetText}
目标句子（中文）：${targetZh}

请分析学生的录音，只输出 JSON，不要任何额外文字：
{
  "similarity_score": 0到100的整数（与目标文本的内容相似度，主要看词语是否说对）,
  "pronunciation_score": 0到100的整数（发音清晰度和准确性）,
  "intonation_score": 0到100的整数（语调和节奏是否接近自然英文）,
  "overall_score": 0到100的整数（综合评分）,
  "words_missed": ["遗漏或说错的单词"],
  "highlight": "说得最好的部分（中文，1句）",
  "feedback": "具体改进建议（中文，2-3句，重点说最需要改进的地方）",
  "voice_script": "用中文写3-4句口语化老师反馈，遇到英文发音示范时直接嵌入英文词，供 speakMultilingual 朗读。格式：全中文，发音示范时插英文词，不整句英文。"
}`

  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常，请重试')
  return JSON.parse(match[0])
}

export const analyzeImage = async (imageBase64, mimeType = 'image/jpeg') => {
  const prompt = `你是一位专业且亲切的英语老师，正在辅导一位中文母语的零基础成人学习者。

学生刚刚拍了一张生活中看到的英文照片，请识别并教学。

只输出 JSON，不要有任何额外文字：
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
  "grammar_tip": "语法结构解析（中文，简单易懂）",
  "similar_expressions": ["类似场景常用表达1", "表达2"],
  "teacher_comment": "老师点评或鼓励（亲切友善语气）"
}`

  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常，请重试')
  return JSON.parse(match[0])
}


export const generateListeningExercise = async () => {
  const topics = ['咖啡店点餐', '问路指路', '自我介绍', '超市购物', '天气闲聊', '预约餐厅', '乘坐出租车', '旅馆入住', '图书馆借书', '邮局寄包裹']
  const topic = topics[Math.floor(Math.random() * topics.length)]
  const prompt = `你是英语听力练习助手，专为中文母语零基础学习者设计。

话题：${topic}

请生成一段简短的英语听力练习，只输出 JSON，不要任何额外文字：
{
  "topic": "${topic}",
  "dialogue": [
    { "speaker": "A", "text": "英文句子（最多12个词）", "zh": "中文翻译" },
    { "speaker": "B", "text": "英文回复（最多12个词）", "zh": "中文翻译" }
  ],
  "questions": [
    {
      "q": "理解问题（中文提问）",
      "options": ["选项A（中文）", "选项B（中文）", "选项C（中文）"],
      "answer": "正确选项（与options中某一项完全一致）",
      "explain": "解释（中文，1句，说清楚哪句对话里提到的）"
    },
    {
      "q": "第二道理解题（中文提问，与第一题考察不同信息点）",
      "options": ["选项A（中文）", "选项B（中文）", "选项C（中文）"],
      "answer": "正确选项",
      "explain": "解释（中文，1句）"
    }
  ]
}

要求：
- 对话3-5轮，每句不超过12个词，真正适合零基础
- 用词简单常见，不用复杂词汇
- 2道选择题，3个选项，各考察不同信息点`

  const raw = await callGemini([{ text: prompt }])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常')
  return JSON.parse(match[0])
}

export const analyzeIeltsPart2 = async (audioBase64, topic, bulletPoints) => {
  const prompt = `你是一位经验丰富的雅思口语考官，现在正在评估一位中文母语学习者的雅思口语 Part 2 作答。

题卡话题：${topic}
题卡要点：${bulletPoints.join('；')}

请根据雅思口语四大评分维度分析这段录音，只输出 JSON，不要有任何额外文字：
{
  "overall_band": 数字（0.5步进的雅思分段，如5.0/5.5/6.0/6.5/7.0，不要超过9.0）,
  "dimension_scores": {
    "fluency_coherence": 数字（流利度与连贯性，0-9，0.5步进）,
    "lexical_resource": 数字（词汇资源，0-9，0.5步进）,
    "grammar_accuracy": 数字（语法广度与准确性，0-9，0.5步进）,
    "pronunciation": 数字（发音，0-9，0.5步进）
  },
  "strengths": ["说得好的地方（中文，2-3条）"],
  "improvements": [
    {
      "dimension": "流利度/词汇/语法/发音（选一个）",
      "issue": "具体问题（中文）",
      "suggestion": "改进建议（中文，具体可操作）",
      "example": "用更好的英文表达方式举例"
    }
  ],
  "band_up_tip": "如何提升0.5分的最关键建议（中文，一句话，非常具体）",
  "voice_script": "用中文写3-4句口语化考官点评，遇到英文示范时直接嵌入英文词，供 speakMultilingual 朗读。全中文，示范时插英文，不整句英文。"
}`
  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常，请重试')
  return JSON.parse(match[0])
}

export const transcribeSpeech = async (audioBase64) => {
  const prompt = `请将这段英文语音准确转写为文字。只输出转写的英文文本，不要加任何解释、标点符号说明或额外内容。如果识别不到任何语音，返回空字符串。`
  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ])
  return raw.trim()
}

export const expandVocabulary = async (word, context = '') => {
  const contextLine = context ? `\n使用场景/来源课程：${context}（请根据此场景选择最相关的词义）` : ''
  const prompt = `你是英语词典助手，针对中文母语零基础学习者。
请为单词「${word}」提供以下信息${contextLine}，只输出 JSON，不要任何额外文字：
{
  "phonetic": "/国际音标/",
  "meaning": "中文释义（简洁，10字以内）",
  "example": "一句简单英文例句（适合零基础，不超过12个词）",
  "example_zh": "例句中文翻译"
}`
  const raw = await callGemini([{ text: prompt }])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常')
  return JSON.parse(match[0])
}

export const analyzeIeltsPart1 = async (audioBase64, question) => {
  const prompt = `你是一位专业雅思口语考官，正在评估考生回答 Part 1 问题的表现。

问题：${question}

请从以下4个维度评分（每项0-9分，可用0.5步进）：
- 流利度与连贯性（Fluency & Coherence）：语速是否自然、是否卡顿、是否有逻辑
- 词汇丰富程度（Lexical Resource）：用词是否多样准确，有无地道表达
- 语法范围与准确性（Grammatical Range & Accuracy）：句式是否多样，有无明显语法错误
- 发音（Pronunciation）：是否清晰易懂，语调自然

只输出 JSON：
{
  "overall_band": 综合分（0-9的数字，可用0.5步进，如6.5）,
  "dimension_scores": {
    "fluency_coherence": 0-9的数字,
    "lexical_resource": 0-9的数字,
    "grammar_accuracy": 0-9的数字,
    "pronunciation": 0-9的数字
  },
  "what_you_said": "简短总结考生回答的内容要点（中文，30字内）",
  "strengths": ["做得好的具体点1（中文）", "做得好的具体点2（中文）"],
  "improvements": [
    {
      "issue": "问题描述（中文，15字内）",
      "suggestion": "改进建议（中文，20字内）",
      "example": "更好的英文表达示例"
    }
  ],
  "band_up_tip": "提升0.5分的最关键一个建议（中文，25字内）",
  "voice_script": "用中文写2句老师点评口播，遇到英文示范时直接嵌入英文词，供speakMultilingual朗读"
}`
  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常')
  return JSON.parse(match[0])
}

export const analyzeIeltsPart3 = async (audioBase64, topic, question) => {
  const prompt = `你是一位专业雅思口语考官，正在评估考生回答 Part 3 深度讨论题的表现。

话题：${topic}
问题：${question}

Part 3 重点考察抽象观点、原因结果、对比、让步和例证。请比 Part 1 更严格，尤其看回答是否有深度、是否能展开观点。

只输出 JSON：
{
  "overall_band": 综合分（0-9的数字，可用0.5步进，如6.5）,
  "dimension_scores": {
    "fluency_coherence": 0-9的数字,
    "lexical_resource": 0-9的数字,
    "grammar_accuracy": 0-9的数字,
    "pronunciation": 0-9的数字
  },
  "argument_summary": "用中文概括考生核心观点（40字内）",
  "strengths": ["做得好的具体点1（中文）", "做得好的具体点2（中文）"],
  "improvements": [
    {
      "dimension": "流利度/词汇/语法/发音/观点展开（选一个）",
      "issue": "具体问题（中文，20字内）",
      "suggestion": "改进建议（中文，30字内）",
      "example": "更好的英文表达示例"
    }
  ],
  "band_up_tip": "提升0.5分的最关键一个建议（中文，30字内）",
  "voice_script": "用中文写2-3句考官点评口播，遇到英文示范时直接嵌入英文词，供speakMultilingual朗读"
}`
  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 返回格式异常')
  return JSON.parse(match[0])
}
