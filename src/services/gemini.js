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
  "overall_score": 0到100的整数,
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
