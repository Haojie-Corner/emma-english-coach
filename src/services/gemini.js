const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const callGemini = async (parts) => {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
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
      "tip": "改正建议（中文，简单易懂）"
    }
  ],
  "positive_feedback": "鼓励性反馈（中文，1-2句）",
  "next_focus": "下次重点练习的建议（中文，1句）"
}

请用鼓励和友善的语气，适合零基础学习者。`

  const parts = [
    { text: prompt },
    { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
  ]

  const raw = await callGemini(parts)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Gemini 返回格式错误')
  return JSON.parse(jsonMatch[0])
}

export const analyzeImage = async (imageBase64, mimeType = 'image/jpeg') => {
  const prompt = `你是一位专业且亲切的英语老师，正在辅导一位中文母语的零基础成人学习者。

学生刚刚拍了一张生活中看到的英文照片，请你：
1. 识别图片中所有英文文字
2. 以老师的口吻，用中文逐步教学

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

  const parts = [
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ]

  const raw = await callGemini(parts)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Gemini 返回格式错误')
  return JSON.parse(jsonMatch[0])
}
