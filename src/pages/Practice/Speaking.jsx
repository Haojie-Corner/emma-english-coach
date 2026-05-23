import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AudioRecorder from '../../components/AudioRecorder'
import { correctGrammar, explainTechEnglish } from '../../services/deepseek'
import { analyzeImage, expandVocabulary, generateListeningExercise, analyzeIeltsPart2 } from '../../services/gemini'
import VocabChip from '../../components/ui/VocabChip'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { speakMultilingual, speak, stopSpeaking } from '../../utils/tts'
import useUserStore from '../../store/userStore'
import { addVocabularyWord } from '../../services/supabase'

// ─── 语法纠错 ────────────────────────────────────────────────────────────
const GrammarTab = () => {
  const { user } = useUserStore()
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedVocabs, setSavedVocabs] = useState(new Set())
  const [savingVocab, setSavingVocab] = useState(null)

  const handleSaveVocab = async (en, zh) => {
    if (!user || savedVocabs.has(en)) return
    setSavingVocab(en)
    try {
      const expanded = await expandVocabulary(en)
      await addVocabularyWord(user.id, en, expanded.phonetic, expanded.meaning || zh, expanded.example, expanded.example_zh, '语法练习')
      setSavedVocabs(prev => new Set([...prev, en]))
    } catch { /* silently fail */ }
    finally { setSavingVocab(null) }
  }

  const handleCheck = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const raw = await correctGrammar(text)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        setResult(parsed)
        // 保存语法错误类型到 localStorage（用于 Profile 统计）
        if (parsed.issues?.length > 0) {
          const key = 'grammarErrors'
          const existing = JSON.parse(localStorage.getItem(key) || '[]')
          parsed.issues.forEach(issue => {
            existing.push({
              date: new Date().toISOString().split('T')[0],
              error: issue.error,
              correction: issue.correction,
              reason: issue.reason,
            })
          })
          // 只保留最近 200 条
          localStorage.setItem(key, JSON.stringify(existing.slice(-200)))
        }
      } else {
        setError('AI 解析失败，请重试')
      }
    } catch (e) {
      setError('请求失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <p style={{ fontSize: 13, color: '#9e998e', marginBottom: 14 }}>输入一段英文，AI 帮你找出语法问题并给出修改建议</p>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Type your English here... e.g. I go to school yesterday."
          rows={4}
          style={{
            width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
            borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#0f0e0c',
            outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#e8672a'}
          onBlur={e => e.target.style.borderColor = '#e5e1d8'}
        />
        <Button onClick={handleCheck} disabled={loading || !text.trim()} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
          {loading ? '分析中…' : '🤖 AI 语法检查'}
        </Button>
        {error && (
          <div style={{ background: '#fdf0f0', border: '1px solid #f5b0b0', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#d94040', marginTop: 10 }}>
            {error}
          </div>
        )}
      </Card>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
          <Card>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>修改后的正确版本</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f0e0c', lineHeight: 1.6 }}>{result.corrected}</p>
          </Card>
          {result.issues?.length > 0 && (
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c', marginBottom: 14 }}>📝 语法问题</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #e8672a', paddingLeft: 14 }}>
                    <p style={{ fontSize: 13, marginBottom: 4 }}>
                      <span style={{ textDecoration: 'line-through', color: '#9e998e' }}>{issue.error}</span>
                      <span style={{ color: '#9e998e', margin: '0 6px' }}>→</span>
                      <span style={{ color: '#e8672a', fontWeight: 700 }}>{issue.correction}</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#5c5850' }}>{issue.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {result.grammar_tip && (
            <div style={{ background: '#fff3ee', border: '1px solid #f5c4a8', borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#e8672a' }}>💡 语法小贴士：{result.grammar_tip}</p>
            </div>
          )}
          {result.new_words?.length > 0 && (
            <Card>
              <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 10 }}>📚 本句词汇（点 + 存入词汇本）</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.new_words.map(({ en, zh }) => (
                  <VocabChip key={en} en={en} zh={zh}
                    saved={savedVocabs.has(en)} saving={savingVocab === en}
                    onSave={handleSaveVocab} />
                ))}
              </div>
            </Card>
          )}
          {result.encouragement && (
            <p style={{ fontSize: 13, color: '#3a9a5f', textAlign: 'center', fontWeight: 600 }}>{result.encouragement}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 编程英语 ────────────────────────────────────────────────────────────
const TechTab = () => {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const typeLabels = { error: '🔴 报错信息', command: '⌨️ 命令行', docs: '📄 文档', code: '💻 代码', other: '📌 其他' }

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const raw = await explainTechEnglish(input)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) setResult(JSON.parse(match[0]))
      else setError('AI 解析失败，请重试')
    } catch (e) {
      setError('请求失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#f3eeff', border: '1px solid #d5c5f0', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#7b5ea7' }}>💻 粘贴报错信息、命令行输出、技术文档片段或代码注释，AI 帮你理解</p>
      </div>
      <Card>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          placeholder={'粘贴英文报错、命令或技术文档…\ne.g. TypeError: Cannot read properties of undefined (reading \'map\')'}
          rows={5}
          style={{
            width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
            borderRadius: 14, padding: '12px 16px', fontSize: 13, color: '#0f0e0c',
            outline: 'none', boxSizing: 'border-box', resize: 'none',
            fontFamily: 'monospace', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#7b5ea7'}
          onBlur={e => e.target.style.borderColor = '#e5e1d8'}
        />
        <button onClick={handleAnalyze} disabled={loading || !input.trim()} style={{
          width: '100%', marginTop: 12, padding: '12px',
          borderRadius: 12,
          background: loading || !input.trim() ? '#e5e1d8' : 'linear-gradient(135deg, #9b72d0, #7b5ea7)',
          color: loading || !input.trim() ? '#9e998e' : '#fff',
          border: 'none', fontSize: 14, fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: !loading && input.trim() ? '0 3px 12px rgba(123,94,167,0.28)' : 'none',
        }}>
          {loading ? '分析中…' : '🔍 AI 解析'}
        </button>
        {error && (
          <div style={{ background: '#fdf0f0', border: '1px solid #f5b0b0', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#d94040', marginTop: 10 }}>
            {error}
          </div>
        )}
      </Card>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: '#f3eeff', color: '#7b5ea7' }}>
              {typeLabels[result.type] || result.type}
            </span>
          </div>
          <Card>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>整体含义</p>
            <p style={{ fontSize: 14, color: '#0f0e0c', lineHeight: 1.7 }}>{result.translation}</p>
          </Card>
          {result.key_terms?.length > 0 && (
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c', marginBottom: 14 }}>🔑 关键术语</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {result.key_terms.map((term, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #7b5ea7', paddingLeft: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#0f0e0c', cursor: 'pointer' }} onClick={() => speak(term.term)}>
                        {term.term}
                      </span>
                      <span style={{ fontSize: 12, color: '#9e998e', fontFamily: 'monospace' }}>{term.phonetic}</span>
                      <span style={{ fontSize: 12, color: '#5c5850' }}>— {term.meaning}</span>
                    </div>
                    {term.usage && <p style={{ fontSize: 12, color: '#5c5850', fontStyle: 'italic' }}>{term.usage}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {result.error_analysis && (
            <div style={{ background: '#fff3ee', border: '1px solid #f5c4a8', borderRadius: 16, padding: '14px 16px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e8672a', marginBottom: 8 }}>🔧 报错分析与解决思路</p>
              <p style={{ fontSize: 13, color: '#0f0e0c', lineHeight: 1.7 }}>{result.error_analysis}</p>
            </div>
          )}
          {result.expression_tip && (
            <div style={{ background: '#f3eeff', border: '1px solid #d5c5f0', borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>工作中常用英文表达</p>
              <p style={{ fontSize: 13, color: '#7b5ea7' }}>{result.expression_tip}</p>
            </div>
          )}
          {result.tts_summary && (
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => speakMultilingual(result.tts_summary)} style={{ fontSize: 13, color: '#7b5ea7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                🔊 听老师讲解
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 随拍学英语 ──────────────────────────────────────────────────────────
const SnapTab = () => {
  const { user } = useUserStore()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedWords, setSavedWords] = useState(new Set())

  const handleFile = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = async () => {
      const dataUrl = reader.result
      setPreview(dataUrl)
      setResult(null); setError(''); setLoading(true)
      try {
        const base64 = dataUrl.split(',')[1]
        const mimeType = file.type || 'image/jpeg'
        const data = await analyzeImage(base64, mimeType)
        setResult(data)
      } catch (e) {
        setError('图片分析失败：' + e.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveWord = async (vocab) => {
    if (!user) return
    try {
      await addVocabularyWord(user.id, vocab.word, vocab.phonetic, vocab.meaning, vocab.example, vocab.example_zh, 'snap')
      setSavedWords(prev => new Set([...prev, vocab.word]))
    } catch { /* silently fail */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#fff3ee', border: '1px solid #f5c4a8', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#e8672a' }}>📸 拍一张生活中看到的英文照片，AI 帮你识别并讲解词汇和语法</p>
      </div>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #e5e1d8', borderRadius: 18, padding: '32px 24px',
          textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
          background: '#fff',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8672a'; e.currentTarget.style.background = '#fff8f4' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e1d8'; e.currentTarget.style.background = '#fff' }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 12, objectFit: 'contain', margin: '0 auto' }} />
        ) : (
          <>
            <p style={{ fontSize: 44, marginBottom: 10 }}>📷</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#5c5850' }}>点击上传图片</p>
            <p style={{ fontSize: 12, color: '#9e998e', marginTop: 4 }}>支持 JPG、PNG、WEBP</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
      {loading && (
        <Card style={{ textAlign: 'center', padding: '32px' }}>
          <p className="spin" style={{ fontSize: 28, display: 'inline-block' }}>📖</p>
          <p style={{ fontSize: 13, color: '#9e998e', marginTop: 10 }}>AI 正在识别图片内容…</p>
        </Card>
      )}
      {error && <p style={{ color: '#d94040', fontSize: 13, textAlign: 'center' }}>{error}</p>}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
          {result.recognized_text && (
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>识别到的英文</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#0f0e0c' }}>{result.recognized_text}</p>
              <p style={{ fontSize: 13, color: '#5c5850', marginTop: 6 }}>{result.translation}</p>
            </Card>
          )}
          {result.vocabulary?.length > 0 && (
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c', marginBottom: 14 }}>📚 词汇讲解</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {result.vocabulary.map((vocab, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #e8672a', paddingLeft: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: '#0f0e0c', cursor: 'pointer' }} onClick={() => speak(vocab.word)}>{vocab.word}</span>
                        <span style={{ fontSize: 11, color: '#9e998e', fontFamily: 'monospace' }}>{vocab.phonetic}</span>
                        <span style={{ fontSize: 11, color: '#5c5850' }}>{vocab.part_of_speech}</span>
                      </div>
                      <button onClick={() => handleSaveWord(vocab)} disabled={savedWords.has(vocab.word)}
                        style={{
                          fontSize: 11, fontWeight: 700,
                          color: savedWords.has(vocab.word) ? '#3a9a5f' : '#e8672a',
                          background: savedWords.has(vocab.word) ? '#eaf5ef' : '#fff3ee',
                          border: `1px solid ${savedWords.has(vocab.word) ? '#3a9a5f40' : '#f5c4a8'}`,
                          borderRadius: 20, padding: '3px 10px',
                          cursor: savedWords.has(vocab.word) ? 'default' : 'pointer', fontFamily: 'inherit',
                        }}>
                        {savedWords.has(vocab.word) ? '✅ 已保存' : '+ 加入词汇本'}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#5c5850' }}>{vocab.meaning}</p>
                    <p style={{ fontSize: 12, color: '#9e998e', marginTop: 3 }}>{vocab.example} — {vocab.example_zh}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {result.grammar_tip && (
            <div style={{ background: '#f3eeff', border: '1px solid #d5c5f0', borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#7b5ea7', marginBottom: 6 }}>📐 语法解析</p>
              <p style={{ fontSize: 13, color: '#5c5850' }}>{result.grammar_tip}</p>
            </div>
          )}
          {result.similar_expressions?.length > 0 && (
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c', marginBottom: 10 }}>💬 类似表达</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.similar_expressions.map((exp, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#0f0e0c', flex: 1 }}>{exp}</span>
                    <button onClick={() => speak(exp)} style={{ fontSize: 12, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {result.teacher_comment && (
            <div style={{ background: '#eaf5ef', border: '1px solid #3a9a5f30', borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#3a9a5f' }}>👩‍🏫 {result.teacher_comment}</p>
            </div>
          )}
          <button onClick={() => { setPreview(null); setResult(null); setSavedWords(new Set()) }}
            style={{ width: '100%', textAlign: 'center', fontSize: 13, color: '#9e998e', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', fontFamily: 'inherit' }}>
            重新上传图片
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 听力理解 ─────────────────────────────────────────────────────────────
const ListeningTab = () => {
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [ttsRate, setTtsRate] = useState(0.82)

  const handleGenerate = async () => {
    setLoading(true); setError(''); setExercise(null)
    setShowAnswers(false); setUserAnswers({}); setSubmitted(false)
    stopSpeaking()
    try {
      const data = await generateListeningExercise()
      setExercise(data)
    } catch (e) {
      setError('生成失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = () => {
    if (!exercise?.dialogue?.length) return
    stopSpeaking()
    setPlaying(true)
    setShowAnswers(false)
    let i = 0
    const playNext = () => {
      if (i >= exercise.dialogue.length) { setPlaying(false); return }
      const line = exercise.dialogue[i]
      speak(line.text, ttsRate, () => { i++; setTimeout(playNext, 600) })
    }
    playNext()
  }

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < exercise.questions.length) return
    setSubmitted(true)
  }

  const score = submitted
    ? exercise?.questions?.filter((q, i) => userAnswers[i] === q.answer).length
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#e8f4ff', border: '1px solid #b8d8f0', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#4a7a9b' }}>
          🎧 听一段真实场景对话，用中文回答理解问题。训练"听懂英语"的能力，不只是会说。
        </p>
      </div>

      <button onClick={handleGenerate} disabled={loading} style={{
        width: '100%', padding: '13px', borderRadius: 14,
        background: loading ? '#e5e1d8' : 'linear-gradient(135deg, #4a9bb8, #2a7a9b)',
        color: loading ? '#9e998e' : '#fff',
        border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
        fontFamily: 'inherit',
        boxShadow: !loading ? '0 3px 12px rgba(74,122,155,0.28)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {loading ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 生成中…</> : '🎲 随机生成听力练习'}
      </button>
      {error && <p style={{ color: '#d94040', fontSize: 13, textAlign: 'center' }}>{error}</p>}

      {exercise && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>本次话题</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0f0e0c' }}>🗂 {exercise.topic}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <button
                  onClick={handlePlay}
                  disabled={playing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: playing ? '#f5f3ef' : 'linear-gradient(135deg, #4a9bb8, #2a7a9b)',
                    color: playing ? '#9e998e' : '#fff',
                    border: 'none', cursor: playing ? 'default' : 'pointer',
                    boxShadow: !playing ? '0 3px 10px rgba(74,122,155,0.25)' : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {playing ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> 播放中…</> : '▶ 播放对话'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[[0.65, '慢'], [0.82, '正常'], [1.0, '快']].map(([r, label]) => (
                    <button key={r} onClick={() => setTtsRate(r)} style={{
                      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      border: `1.5px solid ${ttsRate === r ? '#4a7a9b' : '#e5e1d8'}`,
                      background: ttsRate === r ? '#e8f4ff' : '#f5f3ef',
                      color: ttsRate === r ? '#4a7a9b' : '#9e998e', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 10 }}>
              💡 先播放，尽量不看文字。听完再作答，可重复播放。
            </p>

            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 12, color: '#5c5850', cursor: 'pointer', userSelect: 'none', fontFamily: 'inherit' }}>
                📄 查看对话原文（建议先听再看）
              </summary>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {exercise.dialogue.map((line, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    flexDirection: line.speaker === 'B' ? 'row-reverse' : 'row',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: line.speaker === 'A' ? '#fff3ee' : '#f3eeff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: line.speaker === 'A' ? '#e8672a' : '#7b5ea7',
                      border: `1.5px solid ${line.speaker === 'A' ? '#f5c4a8' : '#d5c5f0'}`,
                    }}>{line.speaker}</div>
                    <div style={{ maxWidth: '80%' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f0e0c', lineHeight: 1.5 }}>{line.text}</p>
                      <p style={{ fontSize: 11, color: '#9e998e', marginTop: 2 }}>{line.zh}</p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </Card>

          <Card>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c', marginBottom: 16 }}>📝 理解问题</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {exercise.questions.map((q, qi) => (
                <div key={qi}>
                  <p style={{ fontSize: 13, color: '#0f0e0c', marginBottom: 10, fontWeight: 600 }}>
                    {qi + 1}. {q.q}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {q.options.map((opt, oi) => {
                      const selected = userAnswers[qi] === opt
                      const correct = opt === q.answer
                      let bg = '#f5f3ef', border = '#e5e1d8', color = '#0f0e0c'
                      if (submitted) {
                        if (correct) { bg = '#eaf5ef'; border = '#3a9a5f50'; color = '#3a9a5f' }
                        else if (selected && !correct) { bg = '#fdf0f0'; border = '#d9404050'; color = '#d94040' }
                      } else if (selected) {
                        bg = '#fff3ee'; border = '#f5c4a8'; color = '#e8672a'
                      }
                      return (
                        <button key={oi} onClick={() => !submitted && setUserAnswers(prev => ({ ...prev, [qi]: opt }))}
                          style={{
                            textAlign: 'left', padding: '11px 16px', borderRadius: 12,
                            background: bg, border: `1.5px solid ${border}`, color,
                            fontSize: 13, fontWeight: selected || (submitted && correct) ? 600 : 400,
                            cursor: submitted ? 'default' : 'pointer',
                            transition: 'all 0.15s', fontFamily: 'inherit',
                          }}>
                          {opt} {submitted && correct && '✓'}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && (
                    <p style={{ fontSize: 12, color: '#3a9a5f', marginTop: 8, lineHeight: 1.5 }}>
                      💡 {q.explain}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length < exercise.questions.length}
                style={{
                  marginTop: 18, width: '100%', padding: '13px 0', borderRadius: 14,
                  background: Object.keys(userAnswers).length < exercise.questions.length
                    ? '#e5e1d8'
                    : 'linear-gradient(135deg, #f28040, #e05020)',
                  color: Object.keys(userAnswers).length < exercise.questions.length ? '#9e998e' : '#fff',
                  border: 'none', fontSize: 14, fontWeight: 700,
                  cursor: Object.keys(userAnswers).length < exercise.questions.length ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: Object.keys(userAnswers).length >= exercise.questions.length ? '0 3px 12px rgba(232,103,42,0.28)' : 'none',
                }}
              >
                提交答案
              </button>
            ) : (
              <div style={{ marginTop: 18, textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: score === exercise.questions.length ? '#3a9a5f' : '#e8672a', marginBottom: 6 }}>
                  {score}/{exercise.questions.length} 题正确 {score === exercise.questions.length ? '🎉' : '💪'}
                </p>
                <button onClick={handleGenerate} style={{
                  marginTop: 10, padding: '11px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #4a9bb8, #2a7a9b)',
                  color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 3px 10px rgba(74,122,155,0.25)',
                }}>
                  再来一题
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────────────────
// ─── 雅思口语 Part 2 闯关 ─────────────────────────────────────────────────
const IELTS_CARDS = [
  { topic: 'Describe a person who has influenced you', bullets: ['Who this person is', 'How you know them', 'What they did or said', 'And explain how they influenced you'] },
  { topic: 'Describe a memorable trip or holiday', bullets: ['Where you went', 'When you went there', 'Who you went with', 'And explain why it was memorable'] },
  { topic: 'Describe a book or movie you enjoyed', bullets: ['What it was about', 'When you read/watched it', 'What you liked about it', 'And explain why you would recommend it'] },
  { topic: 'Describe a skill you would like to learn', bullets: ['What the skill is', 'Why you want to learn it', 'How you would learn it', 'And explain how useful it would be'] },
  { topic: 'Describe a place in your city you enjoy visiting', bullets: ['Where it is', 'What you can do there', 'Who you go there with', 'And explain why you enjoy it'] },
  { topic: 'Describe a time when you helped someone', bullets: ['Who you helped', 'What the situation was', 'How you helped them', 'And explain how you felt afterwards'] },
  { topic: 'Describe a piece of technology you use every day', bullets: ['What it is', 'How long you have had it', 'How often you use it', 'And explain why it is important to you'] },
  { topic: 'Describe an achievement you are proud of', bullets: ['What the achievement was', 'When it happened', 'How you achieved it', 'And explain why you are proud of it'] },
  { topic: 'Describe a traditional festival in your country', bullets: ['What the festival is', 'When it takes place', 'What people do during it', 'And explain why it is important'] },
  { topic: 'Describe a time when you had to make an important decision', bullets: ['What the decision was', 'When you had to make it', 'How you made the decision', 'And explain whether it was the right choice'] },
  { topic: 'Describe a sport or physical activity you enjoy', bullets: ['What it is', 'Where and when you do it', 'Who you do it with', 'And explain why you enjoy it'] },
  { topic: 'Describe a piece of art, music, or creative work you like', bullets: ['What it is', 'Who created it', 'When you first experienced it', 'And explain why you like it'] },
]

const CueCardTab = () => {
  const { user } = useUserStore()
  const [cardIndex, setCardIndex] = useState(() => Math.floor(Math.random() * IELTS_CARDS.length))
  const [phase, setPhase] = useState('ready') // ready | prep | speaking | done
  const [countdown, setCountdown] = useState(60)
  const [speakingTime, setSpeakingTime] = useState(0)
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const timerRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const mediaRef = useRef(null)

  const card = IELTS_CARDS[cardIndex]

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }

  const startPrep = () => {
    setPhase('prep')
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearTimer(); startSpeaking(); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const startSpeaking = async () => {
    setPhase('speaking')
    setSpeakingTime(0)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      timerRef.current = setInterval(() => {
        setSpeakingTime(t => t + 1)
      }, 1000)
    } catch {
      setPhase('ready')
    }
  }

  const stopSpeakingAndAnalyze = async () => {
    clearTimer()
    if (mediaRef.current) {
      mediaRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1]
          setAnalyzing(true)
          try {
            const r = await analyzeIeltsPart2(base64, card.topic, card.bullets)
            setResult(r)
            setPhase('done')
          } catch (e) {
            setAnalyzeError('AI 分析失败：' + e.message)
            setPhase('done')
          } finally {
            setAnalyzing(false)
          }
        }
      }
      mediaRef.current.stop()
      mediaRef.current.stream?.getTracks().forEach(t => t.stop())
    }
  }

  useEffect(() => () => clearTimer(), [])

  const reset = () => {
    clearTimer()
    setPhase('ready')
    setResult(null)
    setAnalyzeError('')
    setSpeakingTime(0)
    setCardIndex(Math.floor(Math.random() * IELTS_CARDS.length))
  }

  const dimLabels = { fluency_coherence: '流利连贯', lexical_resource: '词汇资源', grammar_accuracy: '语法准确', pronunciation: '发音' }
  const dimColors = { fluency_coherence: '#e8672a', lexical_resource: '#3a9a5f', grammar_accuracy: '#7b5ea7', pronunciation: '#4a7a9b' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#f0eeff', border: '1px solid #c8b8f0', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#7b5ea7', lineHeight: 1.6 }}>
          🎓 模拟雅思口语 Part 2：看题卡准备 1 分钟，然后独立发言 2 分钟，AI 按雅思四维度打分。
        </p>
      </div>

      {/* 题卡 */}
      <div style={{ background: '#fff', border: '2px solid #c8b8f0', borderRadius: 18, padding: '20px 22px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9e998e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>IELTS Speaking Part 2 · Cue Card</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#0f0e0c', marginBottom: 14, lineHeight: 1.4 }}>{card.topic}</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#7b5ea7', marginBottom: 8 }}>You should say:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
          {card.bullets.map((b, i) => (
            <p key={i} style={{ fontSize: 13, color: '#5c5850' }}>• {b}</p>
          ))}
        </div>
      </div>

      {/* 状态机 */}
      {phase === 'ready' && (
        <button onClick={startPrep} style={{
          background: 'linear-gradient(135deg, #9b72d0, #7b5ea7)', color: '#fff',
          border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(123,94,167,0.32)',
        }}>
          开始准备（1分钟倒计时）
        </button>
      )}

      {phase === 'prep' && (
        <div style={{ textAlign: 'center', background: '#f0eeff', border: '1.5px solid #c8b8f0', borderRadius: 18, padding: '24px' }}>
          <p style={{ fontSize: 13, color: '#7b5ea7', marginBottom: 8 }}>准备时间</p>
          <p style={{ fontSize: 60, fontWeight: 800, color: countdown <= 10 ? '#dc2626' : '#7b5ea7', lineHeight: 1 }}>{countdown}</p>
          <p style={{ fontSize: 12, color: '#9e998e', marginTop: 8 }}>思考你要说的内容…</p>
          <button onClick={() => { clearTimer(); startSpeaking() }} style={{
            marginTop: 16, padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: '#fff', border: '1.5px solid #c8b8f0', color: '#7b5ea7', cursor: 'pointer',
          }}>跳过准备，直接开始</button>
        </div>
      )}

      {phase === 'speaking' && (
        <div style={{ textAlign: 'center', background: '#fff3ee', border: '1.5px solid #f5c4a8', borderRadius: 18, padding: '24px' }}>
          <p style={{ fontSize: 13, color: '#e8672a', marginBottom: 8 }}>🔴 录音中 — 正在发言</p>
          <p style={{ fontSize: 48, fontWeight: 800, color: '#e8672a', lineHeight: 1 }}>
            {Math.floor(speakingTime / 60)}:{String(speakingTime % 60).padStart(2, '0')}
          </p>
          <p style={{ fontSize: 12, color: '#9e998e', marginTop: 8 }}>建议发言约 2 分钟（{120 - speakingTime > 0 ? `还剩 ${120 - speakingTime}s` : '已超时，可随时停止'}）</p>
          <button onClick={stopSpeakingAndAnalyze} style={{
            marginTop: 16, background: '#dc2626', color: '#fff',
            border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 3px 10px rgba(220,38,38,0.3)',
          }}>停止并分析</button>
        </div>
      )}

      {(analyzing || (phase === 'done' && !result && !analyzeError)) && (
        <div style={{ textAlign: 'center', padding: 24, color: '#7b5ea7' }}>
          <span className="spin" style={{ display: 'inline-block', fontSize: 28 }}>⟳</span>
          <p style={{ marginTop: 8, fontSize: 13 }}>雅思考官正在评分…</p>
        </div>
      )}

      {analyzeError && (
        <div style={{ background: '#fdf0f0', border: '1px solid #f5b0b0', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#d94040' }}>
          {analyzeError}
        </div>
      )}

      {phase === 'done' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
          {/* 总分 */}
          <div style={{ background: '#f0eeff', border: '2px solid #c8b8f0', borderRadius: 18, padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#9b7ec8', fontWeight: 700, marginBottom: 6 }}>雅思口语 Part 2 综合得分</p>
            <p style={{ fontSize: 64, fontWeight: 800, color: '#7b5ea7', lineHeight: 1 }}>{result.overall_band}</p>
            <p style={{ fontSize: 11, color: '#9e998e', marginTop: 4 }}>满分 9.0 分</p>
          </div>

          {/* 四维度 */}
          {result.dimension_scores && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#5c5850', marginBottom: 12 }}>四维度评分（满分 9.0）</p>
              {Object.entries(result.dimension_scores).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#7a7870', width: 56, flexShrink: 0 }}>{dimLabels[key]}</span>
                  <div style={{ flex: 1, height: 8, background: '#f0ede6', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(val / 9) * 100}%`, background: dimColors[key], borderRadius: 6, transition: 'width 1s ease-out' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: dimColors[key], width: 28, textAlign: 'right', flexShrink: 0 }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* 亮点 */}
          {result.strengths?.length > 0 && (
            <div style={{ background: '#eaf5ef', border: '1px solid #b8dca8', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3a9a5f', marginBottom: 8 }}>✅ 你做得好的地方</p>
              {result.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, color: '#2d7a50', marginBottom: 4 }}>• {s}</p>)}
            </div>
          )}

          {/* 改进建议 */}
          {result.improvements?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#5c5850', marginBottom: 10 }}>📈 提升建议</p>
              {result.improvements.map((item, i) => (
                <div key={i} style={{ borderLeft: '3px solid #c8b8f0', paddingLeft: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7b5ea7', marginBottom: 3 }}>{item.dimension}</p>
                  <p style={{ fontSize: 13, color: '#0f0e0c', marginBottom: 4 }}>{item.issue}</p>
                  <p style={{ fontSize: 12, color: '#3a9a5f', marginBottom: 4 }}>💡 {item.suggestion}</p>
                  {item.example && <p style={{ fontSize: 12, color: '#7b5ea7', fontStyle: 'italic' }}>示例：{item.example}</p>}
                </div>
              ))}
            </div>
          )}

          {/* 提升0.5分关键提示 */}
          {result.band_up_tip && (
            <div style={{ background: '#fffbea', border: '1.5px solid #f0d060', borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#7a5c00', fontWeight: 600 }}>🎯 冲分关键：{result.band_up_tip}</p>
            </div>
          )}

          {result.voice_script && (
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => speakMultilingual(result.voice_script)} style={{ fontSize: 13, color: '#7b5ea7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                🔊 听考官点评
              </button>
            </div>
          )}

          <button onClick={reset} style={{
            background: 'linear-gradient(135deg, #9b72d0, #7b5ea7)', color: '#fff',
            border: 'none', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}>换题再练 🔄</button>
        </div>
      )}
    </div>
  )
}

const TABS = [
  ['free', '🎤 录音'],
  ['grammar', '📝 语法'],
  ['listening', '🎧 听力'],
  ['tech', '💻 编程'],
  ['snap', '📸 随拍'],
  ['cuecard', '🎓 雅思'],
]

const Speaking = () => {
  const [searchParams] = useSearchParams()
  const drillWord = searchParams.get('drill') || ''
  const [mode, setMode] = useState('free')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>练习中心</h1>
        <p style={{ fontSize: 13, color: '#9e998e' }}>口语录音 · 语法纠错 · 听力理解 · 编程英语 · 随拍识词</p>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', background: '#f0ede6', borderRadius: 14, padding: 4, marginBottom: 24, gap: 2 }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              flex: 1, padding: '8px 2px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: mode === key ? '#fff' : 'transparent',
              color: mode === key ? '#0f0e0c' : '#9e998e',
              boxShadow: mode === key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'free' && (
        <div>
          {drillWord ? (
            <div style={{
              background: '#fff3ee', border: '1.5px solid #f5c4a8',
              borderRadius: 18, padding: '16px 20px', marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#e8672a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 弱点定向练习</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f0e0c', marginBottom: 6 }}>{drillWord}</p>
              <p style={{ fontSize: 13, color: '#5c5850' }}>
                请朗读这个单词，尽量发音清晰准确。可以多录几次查看 AI 分析结果。
              </p>
            </div>
          ) : (
            <div style={{ background: '#fff3ee', border: '1px solid #f5c4a8', borderRadius: 16, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#e8672a' }}>💡 用英文说任何你想说的，AI 会分析你的发音并给出反馈</p>
            </div>
          )}
          <AudioRecorder
            targetText={drillWord || "Say anything in English!"}
            targetZh={drillWord ? `练习发音：${drillWord}` : "用英文说任何你想说的话"}
            lessonId={drillWord ? `drill_${drillWord}` : "free_practice"}
          />
        </div>
      )}

      {mode === 'grammar' && <GrammarTab />}
      {mode === 'listening' && <ListeningTab />}
      {mode === 'tech' && <TechTab />}
      {mode === 'snap' && <SnapTab />}
      {mode === 'cuecard' && <CueCardTab />}
    </div>
  )
}

export default Speaking
