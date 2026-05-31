import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AudioRecorder from '../../components/AudioRecorder'
import { correctGrammar, explainTechEnglish } from '../../services/deepseek'
import { analyzeImage, expandVocabulary, generateListeningExercise, analyzeIeltsPart2, analyzeIeltsPart1, analyzeIeltsPart3 } from '../../services/gemini'
import VocabChip from '../../components/ui/VocabChip'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { speakMultilingual, speak, stopSpeaking } from '../../utils/tts'
import useUserStore from '../../store/userStore'
import { addVocabularyWord } from '../../services/supabase'
import { recordGrammarWeaknesses } from '../../utils/weakness'
import { recordIeltsAttempt } from '../../utils/ieltsGoal'
import { notifyLearningStateChanged } from '../../utils/learningStateSync'
import { blobToBase64WithMime, buildAudioBlob, createAudioRecorder } from '../../utils/audio'

const IELTS_DIM_META = {
  fluency_coherence: {
    label: '流利连贯',
    color: '#3a9a5f',
    drills: [
      '用 first / another reason / that is why 串起 3 句话。',
      '把刚才答案重说一遍，中间停顿少于 2 次。',
      '每个观点后补一句 because，避免只给短答案。',
    ],
  },
  lexical_resource: {
    label: '词汇资源',
    color: '#e8672a',
    drills: [
      '把 good / bad 换成 specific / harmful / beneficial。',
      '给答案加入 1 个自然搭配，例如 play a crucial role。',
      '用 compared with / in terms of 做一次对比表达。',
    ],
  },
  grammar_accuracy: {
    label: '语法准确',
    color: '#7b5ea7',
    drills: [
      '用 although 开头说一句让步句。',
      '用 If people..., they will... 说一个条件句。',
      '把一个简单句升级成 because / which 连接的复合句。',
    ],
  },
  pronunciation: {
    label: '发音',
    color: '#4a7a9b',
    drills: [
      '重读关键词，弱读功能词，例如 I think it is important。',
      '把答案中的长句分成 2-3 个意群再读。',
      '录音前先慢读一次，再用正常语速回答。',
    ],
  },
}

const getLowestIeltsDimension = (scores = {}) => {
  const entries = Object.entries(scores).filter(([key, val]) => IELTS_DIM_META[key] && Number.isFinite(Number(val)))
  if (entries.length === 0) return null
  const [key, value] = entries.reduce((low, item) => Number(item[1]) < Number(low[1]) ? item : low)
  return { key, value: Number(value), ...IELTS_DIM_META[key] }
}

const IeltsDrillCard = ({ scores }) => {
  const weak = getLowestIeltsDimension(scores)
  if (!weak) return null
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${weak.color}35`,
      borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: weak.color, marginBottom: 6 }}>🎯 立刻提分训练：{weak.label}</p>
      <p style={{ fontSize: 12, color: '#5c5850', lineHeight: 1.5, marginBottom: 10 }}>
        这次最低维度是 {weak.value} 分。不要只看建议，马上做下面 3 个小练习。
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {weak.drills.map((drill, i) => (
          <div key={drill} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: `${weak.color}10`, borderRadius: 10, padding: '8px 10px',
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: weak.color, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 12.5, color: '#0f0e0c', lineHeight: 1.45 }}>{drill}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
          notifyLearningStateChanged()
          recordGrammarWeaknesses(parsed.issues, '语法练习')
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
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [ttsRate, setTtsRate] = useState(0.82)

  const handleGenerate = async () => {
    setLoading(true); setError(''); setExercise(null)
    setUserAnswers({}); setSubmitted(false)
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
  const [cardIndex, setCardIndex] = useState(() => Math.floor(Math.random() * IELTS_CARDS.length))
  const [phase, setPhase] = useState('ready') // ready | prep | speaking | done
  const [countdown, setCountdown] = useState(60)
  const [speakingTime, setSpeakingTime] = useState(0)
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const timerRef = useRef(null)
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
      const recorder = createAudioRecorder(stream)
      mediaRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      timerRef.current = setInterval(() => {
        setSpeakingTime(t => t + 1)
      }, 1000)
    } catch {
      setAnalyzeError('无法访问麦克风，请检查权限')
      setPhase('ready')
    }
  }

  const stopSpeakingAndAnalyze = async () => {
    clearTimer()
    if (mediaRef.current) {
      mediaRef.current.onstop = async () => {
        const blob = buildAudioBlob(chunksRef.current, mediaRef.current?.mimeType)
        setAnalyzing(true)
        try {
          const { base64, mimeType } = await blobToBase64WithMime(blob)
          const r = await analyzeIeltsPart2(base64, card.topic, card.bullets, mimeType)
          recordIeltsAttempt({
            part: 'Part 2',
            band: r.overall_band,
            topic: card.topic,
            question: card.bullets.join(' | '),
            dimensionScores: r.dimension_scores,
            improvements: r.improvements,
          })
          setResult(r)
          setPhase('done')
        } catch (e) {
          setAnalyzeError('AI 分析失败：' + e.message)
          setPhase('done')
        } finally {
          setAnalyzing(false)
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

          <IeltsDrillCard scores={result.dimension_scores} />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {result.voice_script && (
              <button onClick={() => speakMultilingual(result.voice_script)} style={{
                flex: '1 1 150px', minHeight: 46, borderRadius: 14,
                background: '#f0ede6', color: '#5c5850',
                border: '1px solid #e5e1d8', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                🔊 听考官点评
              </button>
            )}

            <button onClick={reset} style={{
              flex: '2 1 180px', minHeight: 46,
              background: 'linear-gradient(135deg, #9b72d0, #7b5ea7)', color: '#fff',
              border: 'none', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>换题再练 🔄</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 听写练习 ────────────────────────────────────────────────────────────
const DICTATION_SENTENCES = [
  { text: 'She works at a hospital.', zh: '她在医院工作。', level: '入门' },
  { text: 'I like to eat pizza on weekends.', zh: '我喜欢周末吃披萨。', level: '入门' },
  { text: 'What time does the bus leave?', zh: '公共汽车几点出发？', level: '入门' },
  { text: 'He has been studying English for two years.', zh: '他已经学英语两年了。', level: '初级' },
  { text: 'Could you please help me find the nearest subway station?', zh: '您能帮我找到最近的地铁站吗？', level: '初级' },
  { text: 'I need to finish this report before the deadline.', zh: '我需要在截止日期前完成这份报告。', level: '初级' },
  { text: 'The weather forecast says it will rain tomorrow morning.', zh: '天气预报说明天早上会下雨。', level: '初级' },
  { text: 'She decided to change her career after working in finance for ten years.', zh: '她在金融行业工作十年后决定转行。', level: '中级' },
  { text: 'Despite the heavy traffic, we managed to arrive at the airport on time.', zh: '尽管交通拥堵，我们还是准时到达了机场。', level: '中级' },
  { text: 'Technology has significantly changed the way we communicate with each other.', zh: '技术极大地改变了我们相互交流的方式。', level: '中级' },
  { text: 'The government is implementing new policies to reduce carbon emissions.', zh: '政府正在实施新政策以减少碳排放。', level: '中级' },
  { text: 'In my opinion, maintaining a healthy work-life balance is essential for long-term success.', zh: '在我看来，保持健康的工作生活平衡对长期成功至关重要。', level: '进阶' },
  { text: 'The research indicates that regular exercise can significantly improve mental health outcomes.', zh: '研究表明，定期锻炼可以显著改善心理健康状况。', level: '进阶' },
  { text: 'Although she had little experience, her enthusiasm and dedication impressed the entire team.', zh: '尽管她经验不足，但她的热情和奉献精神给整个团队留下了深刻印象。', level: '进阶' },
  { text: 'The economic downturn has forced many companies to reconsider their expansion strategies.', zh: '经济低迷迫使许多公司重新考虑其扩张战略。', level: '进阶' },
  { text: 'Can I have a coffee, please?', zh: '请给我一杯咖啡好吗？', level: '入门' },
  { text: 'My name is David and I am from Canada.', zh: '我叫大卫，来自加拿大。', level: '入门' },
  { text: 'She forgot to bring her umbrella and got wet in the rain.', zh: '她忘了带伞，被雨淋湿了。', level: '初级' },
  { text: 'Learning a new language requires patience and consistent practice every day.', zh: '学习一门新语言需要耐心和每天坚持不懈的练习。', level: '中级' },
  { text: 'The conference will bring together experts from various fields to discuss climate change.', zh: '本次会议将汇聚来自各领域的专家，讨论气候变化问题。', level: '进阶' },
]

const LEVEL_COLOR = { '入门': '#5a8c4a', '初级': '#e8672a', '中级': '#7b5ea7', '进阶': '#d94040' }
const LEVEL_BG = { '入门': '#eaf5ef', '初级': '#fff3ee', '中级': '#f3eeff', '进阶': '#fdf0f0' }

const scoreWords = (input, target) => {
  const normalize = s => s.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const inputWords = normalize(input).split(/\s+/).filter(Boolean)
  const targetWords = normalize(target).split(/\s+/).filter(Boolean)
  let correct = 0
  const result = targetWords.map(word => {
    const idx = inputWords.indexOf(word)
    if (idx !== -1) { inputWords.splice(idx, 1); correct++; return { word, ok: true } }
    return { word, ok: false }
  })
  return { result, score: Math.round((correct / targetWords.length) * 100) }
}

const DictationTab = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * DICTATION_SENTENCES.length))
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)
  const [playCount, setPlayCount] = useState(0)
  const [levelFilter, setLevelFilter] = useState('全部')

  const filtered = levelFilter === '全部' ? DICTATION_SENTENCES
    : DICTATION_SENTENCES.filter(s => s.level === levelFilter)
  const sentence = filtered[index % filtered.length]

  const handlePlay = () => {
    speak(sentence.text, 0.85)
    setPlayCount(c => c + 1)
  }

  const handleCheck = () => {
    if (!input.trim()) return
    setScoreResult(scoreWords(input, sentence.text))
    setChecked(true)
  }

  const handleNext = () => {
    setIndex(i => (i + 1) % filtered.length)
    setInput('')
    setChecked(false)
    setScoreResult(null)
    setPlayCount(0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#f0f5fb', border: '1px solid #b8d8f0', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#4a7a9b' }}>
          ✍️ 听一遍英文，把你听到的打出来。训练听力+拼写+发音三合一，是雅思备考最有效的方式之一。
        </p>
      </div>

      {/* 难度筛选 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['全部', '入门', '初级', '中级', '进阶'].map(lv => (
          <button key={lv} onClick={() => { setLevelFilter(lv); setIndex(0); setInput(''); setChecked(false); setScoreResult(null); setPlayCount(0) }} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: levelFilter === lv ? '#0f0e0c' : '#f0ede6',
            color: levelFilter === lv ? '#fff' : '#5c5850',
          }}>{lv}</button>
        ))}
      </div>

      {/* 题目卡 */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 18, padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            color: LEVEL_COLOR[sentence.level], background: LEVEL_BG[sentence.level],
          }}>{sentence.level}</span>
          <span style={{ fontSize: 12, color: '#9e998e' }}>第 {(index % filtered.length) + 1} / {filtered.length} 句</span>
        </div>

        {/* 播放按钮 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={handlePlay} style={{
            flex: 1, padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #f28040, #e05020)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 3px 12px rgba(232,103,42,0.28)',
          }}>
            {playCount === 0 ? '▶ 播放音频' : '🔁 再听一遍'}
          </button>
          {playCount > 0 && (
            <button onClick={() => speak(sentence.text, 0.65)} style={{
              padding: '14px 16px', borderRadius: 14, background: '#f0ede6',
              color: '#5c5850', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>🐢 慢速</button>
          )}
        </div>

        {/* 输入框 */}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={playCount === 0 ? '先播放音频，再输入你听到的内容…' : '把你听到的英文打在这里…'}
          disabled={checked}
          rows={3}
          style={{
            width: '100%', background: checked ? '#faf9f5' : '#f5f3ef',
            border: `1.5px solid ${checked ? '#e5e1d8' : '#dedad0'}`,
            borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#0f0e0c',
            outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit',
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !checked) { e.preventDefault(); handleCheck() } }}
        />

        {/* 检查按钮 */}
        {!checked && (
          <button onClick={handleCheck} disabled={!input.trim() || playCount === 0} style={{
            marginTop: 10, width: '100%', padding: '13px', borderRadius: 14,
            background: (!input.trim() || playCount === 0) ? '#e5e1d8' : '#0f0e0c',
            color: (!input.trim() || playCount === 0) ? '#9e998e' : '#fff',
            border: 'none', fontSize: 14, fontWeight: 700,
            cursor: (!input.trim() || playCount === 0) ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>检查答案</button>
        )}

        {/* 结果 */}
        {checked && scoreResult && (
          <div className="fade-in" style={{ marginTop: 14 }}>
            {/* 分数 */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 42, fontWeight: 800, color: scoreResult.score >= 90 ? '#3a9a5f' : scoreResult.score >= 60 ? '#e8672a' : '#d94040', lineHeight: 1 }}>
                {scoreResult.score}
              </p>
              <p style={{ fontSize: 12, color: '#9e998e', marginTop: 4 }}>
                {scoreResult.score === 100 ? '完美！🎉' : scoreResult.score >= 80 ? '很棒！继续 💪' : scoreResult.score >= 60 ? '不错，再练一次 🔁' : '多听几遍，慢慢来 🐢'}
              </p>
            </div>

            {/* 逐词对比 */}
            <div style={{ background: '#f5f3ef', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#9e998e', marginBottom: 8 }}>逐词对比</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {scoreResult.result.map((item, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: item.ok ? '#eaf5ef' : '#fdf0f0',
                    color: item.ok ? '#3a9a5f' : '#d94040',
                  }}>{item.word}</span>
                ))}
              </div>
            </div>

            {/* 正确答案 */}
            <div style={{ background: '#eaf5ef', border: '1px solid #c4ddb0', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: '#5a8c4a', fontWeight: 700, marginBottom: 4 }}>✅ 正确答案</p>
              <p style={{ fontSize: 14, color: '#0f0e0c', fontWeight: 600 }}>{sentence.text}</p>
              <p style={{ fontSize: 12, color: '#5c5850', marginTop: 4 }}>{sentence.zh}</p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handlePlay} style={{
                flex: 1, padding: '12px', borderRadius: 12, background: '#f0ede6',
                color: '#5c5850', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>🔁 再听一遍</button>
              <button onClick={handleNext} style={{
                flex: 2, padding: '12px', borderRadius: 12,
                background: 'linear-gradient(135deg, #f28040, #e05020)',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 3px 10px rgba(232,103,42,0.28)',
              }}>下一句 →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 雅思口语 Part 1 ─────────────────────────────────────────────────────
const PART1_TOPICS = [
  { category: '个人信息', questions: ['Can you tell me your name and where you\'re from?', 'Do you work or study? What do you do?', 'Where do you live now? Do you like it there?'] },
  { category: '家庭', questions: ['Do you have a large family or a small family?', 'How much time do you spend with your family?', 'What do you usually do together as a family?'] },
  { category: '爱好', questions: ['What do you like to do in your free time?', 'Have your hobbies changed since you were a child?', 'Is there a hobby you\'ve always wanted to try?'] },
  { category: '饮食', questions: ['What\'s your favourite food?', 'Do you prefer eating at home or at a restaurant? Why?', 'Do you think people eat healthily in your country?'] },
  { category: '旅行', questions: ['Do you like travelling? Why or why not?', 'What\'s the most interesting place you\'ve visited?', 'Do you prefer travelling alone or with others?'] },
  { category: '科技', questions: ['How often do you use your phone? What for?', 'Do you think technology has made our lives better or worse?', 'What\'s your favourite app and why?'] },
  { category: '学习', questions: ['Did you enjoy school when you were a child?', 'What subject did you like most at school?', 'Do you prefer studying alone or with others?'] },
  { category: '运动', questions: ['Do you do any sports or physical exercise?', 'Did you play any sports as a child?', 'Do you think sport is important? Why?'] },
  { category: '天气', questions: ['What\'s the weather like where you live?', 'What\'s your favourite season and why?', 'Does the weather affect your mood?'] },
  { category: '音乐', questions: ['Do you like music? What kind?', 'Do you play a musical instrument?', 'When do you usually listen to music?'] },
]

const DIM_LABELS_P1 = [
  { key: 'fluency_coherence', label: '流利连贯', color: '#3a9a5f' },
  { key: 'lexical_resource', label: '词汇丰富', color: '#e8672a' },
  { key: 'grammar_accuracy', label: '语法准确', color: '#7b5ea7' },
  { key: 'pronunciation', label: '发音', color: '#4a7a9b' },
]

const Part1Tab = () => {
  const [topicIndex, setTopicIndex] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | recording | analyzing | done
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const mediaRef = useRef(null)

  const topic = PART1_TOPICS[topicIndex]
  const question = topic.questions[qIndex]

  const startRecording = async () => {
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = stream
      const recorder = createAudioRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setPhase('analyzing')
        try {
          const blob = buildAudioBlob(chunksRef.current, recorder.mimeType)
          const { base64, mimeType } = await blobToBase64WithMime(blob)
          const data = await analyzeIeltsPart1(base64, question, mimeType)
          recordIeltsAttempt({
            part: 'Part 1',
            band: data.overall_band,
            topic: topic.category,
            question,
            dimensionScores: data.dimension_scores,
            improvements: data.improvements,
          })
          setResult(data)
          setPhase('done')
          if (data.voice_script) speakMultilingual(data.voice_script)
        } catch (e) {
          setError('分析失败：' + e.message)
          setPhase('ready')
        }
      }
      recorder.start()
      setPhase('recording')
    } catch {
      setError('无法访问麦克风，请检查权限')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

  const handleNext = () => {
    const nextQ = qIndex + 1
    if (nextQ < topic.questions.length) {
      setQIndex(nextQ)
    } else {
      setTopicIndex(i => (i + 1) % PART1_TOPICS.length)
      setQIndex(0)
    }
    setPhase('ready')
    setResult(null)
    setError('')
  }

  const bandColor = (band) => band >= 7 ? '#3a9a5f' : band >= 5.5 ? '#e8672a' : '#d94040'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#f3eeff', border: '1px solid #d0c8f0', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#7b5ea7' }}>
          🎓 随机抽取雅思 Part 1 常见问题，录音作答，AI 给出 Band Score 和改进建议。Part 1 占总口语时长 4-5 分钟。
        </p>
      </div>

      {/* 话题选择 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {PART1_TOPICS.map((t, i) => (
          <button key={i} onClick={() => { setTopicIndex(i); setQIndex(0); setPhase('ready'); setResult(null); setError('') }} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: topicIndex === i ? '#7b5ea7' : '#f0ede6',
            color: topicIndex === i ? '#fff' : '#5c5850',
          }}>{t.category}</button>
        ))}
      </div>

      {/* 问题卡 */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 18, padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7b5ea7', background: '#f3eeff', padding: '3px 10px', borderRadius: 20 }}>
            {topic.category} — Part 1
          </span>
          <span style={{ fontSize: 12, color: '#9e998e' }}>第 {qIndex + 1} / {topic.questions.length} 题</span>
        </div>

        {/* 朗读问题 */}
        <div style={{ background: '#f5f3ef', borderRadius: 14, padding: '16px', marginBottom: 16, cursor: 'pointer' }}
          onClick={() => speak(question)}>
          <p style={{ fontSize: 16, color: '#0f0e0c', fontWeight: 600, lineHeight: 1.6 }}>{question}</p>
          <p style={{ fontSize: 11, color: '#9e998e', marginTop: 6 }}>🔊 点击听题目读音</p>
        </div>

        {/* 录音控制 */}
        {phase === 'ready' && (
          <button onClick={startRecording} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #f28040, #e05020)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 3px 12px rgba(232,103,42,0.28)',
          }}>🎤 开始回答</button>
        )}

        {phase === 'recording' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#d94040', fontWeight: 700, marginBottom: 12 }} className="recording-pulse">
              ● 正在录音… 说完后点击停止
            </p>
            <button onClick={stopRecording} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: '#d94040', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>⏹ 停止录音</button>
          </div>
        )}

        {phase === 'analyzing' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p className="spin" style={{ fontSize: 32, display: 'inline-block' }}>🤔</p>
            <p style={{ fontSize: 13, color: '#9e998e', marginTop: 8 }}>AI 考官正在评分…</p>
          </div>
        )}

        {error && <p style={{ color: '#d94040', fontSize: 13, marginTop: 8 }}>{error}</p>}
      </div>

      {/* 结果 */}
      {phase === 'done' && result && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Band Score */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 18, padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 8 }}>雅思口语 Band Score</p>
            <p style={{ fontSize: 56, fontWeight: 800, color: bandColor(result.overall_band), lineHeight: 1 }}>{result.overall_band}</p>
            {result.what_you_said && <p style={{ fontSize: 13, color: '#5c5850', marginTop: 8 }}>💬 {result.what_you_said}</p>}

            {/* 4维度 */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DIM_LABELS_P1.map(({ key, label, color }) => {
                const val = result.dimension_scores?.[key] ?? 0
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#5c5850', width: 56, textAlign: 'right', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, background: '#f0ede6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${(val / 9) * 100}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color, width: 28, textAlign: 'left', flexShrink: 0 }}>{val}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 亮点 */}
          {result.strengths?.length > 0 && (
            <div style={{ background: '#eaf5ef', border: '1px solid #c4ddb0', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3a9a5f', marginBottom: 8 }}>✅ 做得好</p>
              {result.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, color: '#0f0e0c', lineHeight: 1.5 }}>· {s}</p>)}
            </div>
          )}

          {/* 改进建议 */}
          {result.improvements?.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0f0e0c', marginBottom: 10 }}>📈 改进建议</p>
              {result.improvements.map((imp, i) => (
                <div key={i} style={{ borderLeft: '3px solid #7b5ea7', paddingLeft: 10, marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: '#0f0e0c', fontWeight: 600 }}>{imp.issue}</p>
                  <p style={{ fontSize: 12, color: '#5c5850', marginTop: 2 }}>{imp.suggestion}</p>
                  {imp.example && <p style={{ fontSize: 12, color: '#7b5ea7', marginTop: 4, fontStyle: 'italic' }}>→ "{imp.example}"</p>}
                </div>
              ))}
            </div>
          )}

          {/* 提分秘诀 */}
          {result.band_up_tip && (
            <div style={{ background: '#fdf6e3', border: '1px solid #f0d080', borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#7a6000' }}>⭐ 提升关键：{result.band_up_tip}</p>
            </div>
          )}

          <IeltsDrillCard scores={result.dimension_scores} />

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {result.voice_script && (
              <button onClick={() => speakMultilingual(result.voice_script)} style={{
                flex: '1 1 140px', minHeight: 46, padding: '12px', borderRadius: 12, background: '#f0ede6',
                color: '#5c5850', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>🔊 听点评</button>
            )}
            <button onClick={handleNext} style={{
              flex: '2 1 170px', minHeight: 46, padding: '12px', borderRadius: 12,
              background: 'linear-gradient(135deg, #f28040, #e05020)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 3px 10px rgba(232,103,42,0.25)',
            }}>下一题 →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 雅思口语 Part 3 深度讨论 ─────────────────────────────────────────────
const PART3_TOPICS = [
  {
    category: '教育',
    questions: [
      'How has education changed in your country in recent years?',
      'Do you think online learning can replace traditional classrooms?',
      'What skills should schools teach students for the future?',
    ],
  },
  {
    category: '科技',
    questions: [
      'How has technology changed the way people communicate?',
      'Do you think people rely too much on smartphones?',
      'What kinds of jobs might disappear because of artificial intelligence?',
    ],
  },
  {
    category: '城市生活',
    questions: [
      'What are the advantages and disadvantages of living in a big city?',
      'How can governments improve public transport?',
      'Why do many young people prefer to move to large cities?',
    ],
  },
  {
    category: '工作',
    questions: [
      'What makes a job satisfying for most people?',
      'Do you think people will change jobs more often in the future?',
      'Is work-life balance more important than salary?',
    ],
  },
  {
    category: '环境',
    questions: [
      'What can individuals do to protect the environment?',
      'Should governments punish companies that pollute the environment?',
      'Why is it difficult for people to change their daily habits?',
    ],
  },
  {
    category: '文化',
    questions: [
      'Why is it important to protect traditional culture?',
      'How does globalization affect local traditions?',
      'Should children learn about other cultures at school?',
    ],
  },
]

const PART3_FRAMEWORK = [
  { label: '观点', text: 'I believe that...' },
  { label: '原因', text: 'The main reason is that...' },
  { label: '例子', text: 'For example...' },
  { label: '让步', text: 'However, it is also true that...' },
]

const Part3Tab = () => {
  const [topicIndex, setTopicIndex] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState('ready')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const mediaRef = useRef(null)

  const topic = PART3_TOPICS[topicIndex]
  const question = topic.questions[qIndex]

  const resetQuestionState = () => {
    setPhase('ready')
    setResult(null)
    setError('')
  }

  const startRecording = async () => {
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = stream
      const recorder = createAudioRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setPhase('analyzing')
        try {
          const blob = buildAudioBlob(chunksRef.current, recorder.mimeType)
          const { base64, mimeType } = await blobToBase64WithMime(blob)
          const data = await analyzeIeltsPart3(base64, topic.category, question, mimeType)
          recordIeltsAttempt({
            part: 'Part 3',
            band: data.overall_band,
            topic: topic.category,
            question,
            dimensionScores: data.dimension_scores,
            improvements: data.improvements,
          })
          setResult(data)
          setPhase('done')
          if (data.voice_script) speakMultilingual(data.voice_script)
        } catch (e) {
          setError('分析失败：' + e.message)
          setPhase('ready')
        }
      }
      recorder.start()
      setPhase('recording')
    } catch {
      setError('无法访问麦克风，请检查权限')
    }
  }

  const stopRecording = () => recorderRef.current?.stop()

  const handleNext = () => {
    const nextQ = qIndex + 1
    if (nextQ < topic.questions.length) {
      setQIndex(nextQ)
    } else {
      setTopicIndex(i => (i + 1) % PART3_TOPICS.length)
      setQIndex(0)
    }
    resetQuestionState()
  }

  const bandColor = (band) => band >= 7 ? '#3a9a5f' : band >= 5.5 ? '#e8672a' : '#d94040'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#f0f5fb', border: '1px solid #b8d8f0', borderRadius: 16, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#4a7a9b', lineHeight: 1.6 }}>
          🎓 Part 3 是深度讨论题，重点练抽象观点、原因结果、对比和让步，是 6.5 冲 7 的关键。
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {PART3_TOPICS.map((t, i) => (
          <button key={t.category} onClick={() => { setTopicIndex(i); setQIndex(0); resetQuestionState() }} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: topicIndex === i ? '#4a7a9b' : '#f0ede6',
            color: topicIndex === i ? '#fff' : '#5c5850',
          }}>{t.category}</button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1.5px solid #d7e6f0', borderRadius: 18, padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4a7a9b', background: '#f0f5fb', padding: '3px 10px', borderRadius: 20 }}>
            {topic.category} — Part 3
          </span>
          <span style={{ fontSize: 12, color: '#9e998e' }}>第 {qIndex + 1} / {topic.questions.length} 题</span>
        </div>

        <div style={{ background: '#f5f3ef', borderRadius: 14, padding: '16px', marginBottom: 14, cursor: 'pointer' }}
          onClick={() => speak(question)}>
          <p style={{ fontSize: 16, color: '#0f0e0c', fontWeight: 700, lineHeight: 1.6 }}>{question}</p>
          <p style={{ fontSize: 11, color: '#9e998e', marginTop: 6 }}>🔊 点击听题目读音</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {PART3_FRAMEWORK.map(item => (
            <div key={item.label} style={{ background: '#f0f5fb', borderRadius: 12, padding: '9px 10px', border: '1px solid #d7e6f0' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#4a7a9b', marginBottom: 3 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: '#0f0e0c' }}>{item.text}</p>
            </div>
          ))}
        </div>

        {phase === 'ready' && (
          <button onClick={startRecording} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #5f95b5, #4a7a9b)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 3px 12px rgba(74,122,155,0.28)',
          }}>🎤 开始回答</button>
        )}

        {phase === 'recording' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#d94040', fontWeight: 700, marginBottom: 12 }} className="recording-pulse">
              ● 正在录音… 建议回答 45-75 秒
            </p>
            <button onClick={stopRecording} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: '#d94040', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>⏹ 停止录音</button>
          </div>
        )}

        {phase === 'analyzing' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p className="spin" style={{ fontSize: 32, display: 'inline-block' }}>🤔</p>
            <p style={{ fontSize: 13, color: '#9e998e', marginTop: 8 }}>AI 考官正在分析观点深度…</p>
          </div>
        )}

        {error && <p style={{ color: '#d94040', fontSize: 13, marginTop: 8 }}>{error}</p>}
      </div>

      {phase === 'done' && result && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '1.5px solid #d7e6f0', borderRadius: 18, padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 8 }}>雅思 Part 3 Band Score</p>
            <p style={{ fontSize: 56, fontWeight: 800, color: bandColor(result.overall_band), lineHeight: 1 }}>{result.overall_band}</p>
            {result.argument_summary && <p style={{ fontSize: 13, color: '#5c5850', marginTop: 8 }}>💬 {result.argument_summary}</p>}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DIM_LABELS_P1.map(({ key, label, color }) => {
                const val = result.dimension_scores?.[key] ?? 0
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#5c5850', width: 56, textAlign: 'right', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, background: '#f0ede6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${(val / 9) * 100}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color, width: 28, textAlign: 'left', flexShrink: 0 }}>{val}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {result.strengths?.length > 0 && (
            <div style={{ background: '#eaf5ef', border: '1px solid #c4ddb0', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3a9a5f', marginBottom: 8 }}>✅ 做得好</p>
              {result.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, color: '#0f0e0c', lineHeight: 1.5 }}>· {s}</p>)}
            </div>
          )}

          {result.improvements?.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0f0e0c', marginBottom: 10 }}>📈 深度讨论改进建议</p>
              {result.improvements.map((imp, i) => (
                <div key={i} style={{ borderLeft: '3px solid #4a7a9b', paddingLeft: 10, marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: '#0f0e0c', fontWeight: 600 }}>{imp.issue}</p>
                  <p style={{ fontSize: 12, color: '#5c5850', marginTop: 2 }}>{imp.suggestion}</p>
                  {imp.example && <p style={{ fontSize: 12, color: '#4a7a9b', marginTop: 4, fontStyle: 'italic' }}>→ "{imp.example}"</p>}
                </div>
              ))}
            </div>
          )}

          {result.band_up_tip && (
            <div style={{ background: '#fdf6e3', border: '1px solid #f0d080', borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#7a6000' }}>⭐ 提升关键：{result.band_up_tip}</p>
            </div>
          )}

          <IeltsDrillCard scores={result.dimension_scores} />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {result.voice_script && (
              <button onClick={() => speakMultilingual(result.voice_script)} style={{
                flex: '1 1 140px', minHeight: 46, padding: '12px', borderRadius: 12, background: '#f0ede6',
                color: '#5c5850', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>🔊 听点评</button>
            )}
            <button onClick={handleNext} style={{
              flex: '2 1 170px', minHeight: 46, padding: '12px', borderRadius: 12,
              background: 'linear-gradient(135deg, #5f95b5, #4a7a9b)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 3px 10px rgba(74,122,155,0.25)',
            }}>下一题 →</button>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS = [
  { key: 'free', label: '录音', icon: '🎤', group: '口语', desc: '自由开口，AI 会分析发音、流利度、重音和语调。' },
  { key: 'grammar', label: '语法', icon: '📝', group: '表达', desc: '输入英文句子，马上看到错误、改法和可积累的新词。' },
  { key: 'dictation', label: '听写', icon: '✍️', group: '输入', desc: '听一句、写一句，训练耳朵和拼写的连接。' },
  { key: 'listening', label: '听力', icon: '🎧', group: '输入', desc: '生成分级对话和理解题，练真实场景里的抓重点能力。' },
  { key: 'part1', label: 'Part 1', icon: '🗣️', group: '雅思', desc: '短问短答，先把日常话题说稳、说自然。' },
  { key: 'cuecard', label: 'Part 2', icon: '🎓', group: '雅思', desc: 'Cue Card 独白训练，重点练结构、展开和时间控制。' },
  { key: 'part3', label: 'Part 3', icon: '🎯', group: '雅思', desc: '深度讨论训练，重点练观点、原因、对比和让步。' },
  { key: 'snap', label: '随拍', icon: '📸', group: '工具', desc: '拍照识物学英语，把身边东西变成可用表达。' },
  { key: 'tech', label: '编程', icon: '💻', group: '工具', desc: '看懂英文报错、命令和技术文档里的关键表达。' },
]

const getTabMeta = (key) => TABS.find(tab => tab.key === key) || TABS[0]

const GOAL_RECOMMENDED_TAB = {
  pronunciation: 'free',
  conversation: 'free',
  grammar: 'grammar',
  ielts: 'part1',
}

const getRecommendedTab = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('english_diagnostic_profile') || 'null')
    return profile?.goal ? (GOAL_RECOMMENDED_TAB[profile.goal] || null) : null
  } catch {
    return null
  }
}

const Speaking = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const drillWord = searchParams.get('drill') || ''
  const queryTab = searchParams.get('tab')
  const initialTab = TABS.some(tab => tab.key === queryTab) ? queryTab : 'free'
  const [mode, setMode] = useState(initialTab)
  const tabRefs = useRef({})
  const activeTab = getTabMeta(mode)
  const recommendedTab = getRecommendedTab()

  const ieltsTabCounts = (() => {
    try {
      const attempts = JSON.parse(localStorage.getItem('ielts_speaking_attempts') || '[]')
      const today = new Date().toISOString().split('T')[0]
      return {
        part1: attempts.filter(a => a.part === 'Part 1' && a.createdAt?.startsWith(today)).length,
        cuecard: attempts.filter(a => a.part === 'Part 2' && a.createdAt?.startsWith(today)).length,
        part3: attempts.filter(a => a.part === 'Part 3' && a.createdAt?.startsWith(today)).length,
      }
    } catch { return {} }
  })()

  useEffect(() => {
    if (!queryTab || !TABS.some(tab => tab.key === queryTab) || queryTab === mode) return
    setMode(queryTab)
  }, [queryTab, mode])

  useEffect(() => {
    tabRefs.current[mode]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [mode])

  const changeMode = (key) => {
    setMode(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'free') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', padding: '28px clamp(14px, 4vw, 20px)', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>练习中心</h1>
            <p style={{ fontSize: 13, color: '#9e998e', lineHeight: 1.55 }}>{activeTab.desc}</p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 800, color: '#e8672a',
            background: '#fff3ee', border: '1px solid #f5c4a8',
            borderRadius: 999, padding: '5px 9px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{activeTab.group}</span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', background: 'rgba(240,237,230,0.92)', borderRadius: 16, padding: 5,
        marginBottom: 22, gap: 4, overflowX: 'auto', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch', scrollSnapType: 'x proximity',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
      }} role="tablist" aria-label="练习模式">
        {TABS.map(({ key, label, icon, group }) => {
          const isRecommended = key === recommendedTab && mode !== key
          return (
            <button
              key={key}
              ref={el => { tabRefs.current[key] = el }}
              onClick={() => changeMode(key)}
              role="tab"
              aria-selected={mode === key}
              style={{
                flex: '0 0 auto', minWidth: 78, minHeight: 46, padding: '8px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                border: isRecommended ? '1.5px solid #f3c4a2' : 'none',
                cursor: 'pointer', transition: 'all 0.15s',
                background: mode === key ? '#fff' : isRecommended ? '#fff8f4' : 'transparent',
                color: mode === key ? '#0f0e0c' : '#9e998e',
                boxShadow: mode === key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'inherit', whiteSpace: 'nowrap', scrollSnapAlign: 'start',
                WebkitTapHighlightColor: 'transparent', position: 'relative',
              }}
            >
              <span style={{ display: 'block', fontSize: 15, lineHeight: 1.05, marginBottom: 3 }}>{icon}</span>
              <span>{label}</span>
              {mode === key && (
                <span style={{ display: 'block', fontSize: 9.5, color: '#e8672a', marginTop: 1, lineHeight: 1.1 }}>{group}</span>
              )}
              {ieltsTabCounts[key] > 0 && (
                <span style={{
                  position: 'absolute', bottom: 4, right: 5, fontSize: 8, fontWeight: 900,
                  color: '#7b5ea7', lineHeight: 1,
                }}>{ieltsTabCounts[key]}次</span>
              )}
              {isRecommended && (
                <span style={{
                  position: 'absolute', top: -1, right: -1, fontSize: 8, fontWeight: 900,
                  background: '#e8672a', color: '#fff', borderRadius: '0 12px 0 8px',
                  padding: '2px 5px', lineHeight: 1.2,
                }}>推荐</span>
              )}
            </button>
          )
        })}
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
      {mode === 'dictation' && <DictationTab />}
      {mode === 'part1' && <Part1Tab />}
      {mode === 'cuecard' && <CueCardTab />}
      {mode === 'part3' && <Part3Tab />}
    </div>
  )
}

export default Speaking
