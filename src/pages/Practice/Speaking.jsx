import { useState, useRef } from 'react'
import AudioRecorder from '../../components/AudioRecorder'
import { correctGrammar, explainTechEnglish } from '../../services/deepseek'
import { analyzeImage, expandVocabulary } from '../../services/gemini'
import VocabChip from '../../components/ui/VocabChip'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { speakMultilingual, speak } from '../../utils/tts'
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
      if (match) setResult(JSON.parse(match[0]))
      else setError('AI 解析失败，请重试')
    } catch (e) {
      setError('请求失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-[#b0aea5] mb-3">输入一段英文，AI 帮你找出语法问题并给出修改建议</p>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Type your English here... e.g. I go to school yesterday."
          rows={4}
          className="w-full bg-[#faf9f5] border border-[#e8e6dc] rounded-xl px-4 py-3 text-sm text-[#141413] outline-none focus:border-[#d97757] transition-colors resize-none"
        />
        <Button onClick={handleCheck} disabled={loading || !text.trim()} className="w-full mt-3">
          {loading ? '分析中…' : '🤖 AI 语法检查'}
        </Button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </Card>
      {result && (
        <div className="space-y-3 fade-in">
          <Card>
            <p className="text-xs text-[#b0aea5] mb-1">修改后的正确版本</p>
            <p className="text-[#141413] font-medium">{result.corrected}</p>
          </Card>
          {result.issues?.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-[#141413] mb-3">📝 语法问题</p>
              <div className="space-y-3">
                {result.issues.map((issue, i) => (
                  <div key={i} className="border-l-2 border-[#d97757] pl-3">
                    <p className="text-sm"><span className="line-through text-[#b0aea5]">{issue.error}</span> → <span className="text-[#d97757] font-medium">{issue.correction}</span></p>
                    <p className="text-xs text-[#b0aea5]">{issue.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {result.grammar_tip && (
            <Card className="bg-[#f5e6df] border-[#f5e6df]">
              <p className="text-sm text-[#d97757]">💡 语法小贴士：{result.grammar_tip}</p>
            </Card>
          )}
          {result.new_words?.length > 0 && (
            <Card>
              <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 8 }}>📚 本句词汇（点 + 存入词汇本）</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.new_words.map(({ en, zh }) => (
                  <VocabChip key={en} en={en} zh={zh}
                    saved={savedVocabs.has(en)} saving={savingVocab === en}
                    onSave={handleSaveVocab} />
                ))}
              </div>
            </Card>
          )}
          {result.encouragement && <p className="text-sm text-[#788c5d] text-center">{result.encouragement}</p>}
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
    <div className="space-y-4">
      <Card className="bg-[#f0eeff] border-[#d0c8f0]">
        <p className="text-sm text-[#7a6bba]">💻 粘贴报错信息、命令行输出、技术文档片段或代码注释，AI 帮你理解</p>
      </Card>
      <Card>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="粘贴英文报错、命令或技术文档…&#10;e.g. TypeError: Cannot read properties of undefined (reading 'map')"
          rows={5}
          className="w-full bg-[#faf9f5] border border-[#e8e6dc] rounded-xl px-4 py-3 text-sm text-[#141413] outline-none focus:border-[#7a6bba] transition-colors resize-none font-mono"
        />
        <Button onClick={handleAnalyze} disabled={loading || !input.trim()} className="w-full mt-3" style={{ background: loading ? '#d0c8f0' : '#7a6bba' }}>
          {loading ? '分析中…' : '🔍 AI 解析'}
        </Button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </Card>

      {result && (
        <div className="space-y-3 fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: '#f0eeff', color: '#7a6bba' }}>
              {typeLabels[result.type] || result.type}
            </span>
          </div>

          <Card>
            <p className="text-xs text-[#b0aea5] mb-2">整体含义</p>
            <p className="text-sm text-[#141413] leading-relaxed">{result.translation}</p>
          </Card>

          {result.key_terms?.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-[#141413] mb-3">🔑 关键术语</p>
              <div className="space-y-4">
                {result.key_terms.map((term, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #7a6bba', paddingLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1917', cursor: 'pointer' }} onClick={() => speak(term.term)}>
                        {term.term}
                      </span>
                      <span style={{ fontSize: 12, color: '#b0aea5', fontFamily: 'monospace' }}>{term.phonetic}</span>
                      <span style={{ fontSize: 11, color: '#7a7870' }}>— {term.meaning}</span>
                    </div>
                    {term.usage && <p style={{ fontSize: 12, color: '#7a7870', fontStyle: 'italic' }}>{term.usage}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.error_analysis && (
            <Card style={{ background: '#fdf0ea', border: '1px solid #f5c4a8' }}>
              <p className="text-sm font-semibold text-[#d97757] mb-2">🔧 报错分析与解决思路</p>
              <p className="text-sm text-[#1a1917] leading-relaxed">{result.error_analysis}</p>
            </Card>
          )}

          {result.expression_tip && (
            <Card style={{ background: '#f0eeff', border: '1px solid #d0c8f0' }}>
              <p className="text-xs text-[#b0aea5] mb-1">工作中常用英文表达</p>
              <p className="text-sm text-[#7a6bba]">{result.expression_tip}</p>
            </Card>
          )}

          {result.tts_summary && (
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => speakMultilingual(result.tts_summary)} style={{ fontSize: 12, color: '#7a6bba', background: 'none', border: 'none', cursor: 'pointer' }}>
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
    } catch (e) {
      // silently fail
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[#fdf0ea] border-[#f5c4a8]">
        <p className="text-sm text-[#d97757]">📸 拍一张生活中看到的英文照片，AI 帮你识别并讲解词汇和语法</p>
      </Card>

      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #dedad0', borderRadius: 16, padding: '32px 24px',
          textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#d97757'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#dedad0'}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', margin: '0 auto' }} />
        ) : (
          <>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📷</p>
            <p style={{ fontSize: 14, color: '#7a7870' }}>点击上传图片</p>
            <p style={{ fontSize: 12, color: '#b0aea5', marginTop: 4 }}>支持 JPG、PNG、WEBP</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />

      {loading && (
        <Card style={{ textAlign: 'center', padding: '32px' }}>
          <p className="spin" style={{ fontSize: 28, display: 'inline-block' }}>📖</p>
          <p style={{ fontSize: 13, color: '#7a7870', marginTop: 8 }}>AI 正在识别图片内容…</p>
        </Card>
      )}

      {error && <p style={{ color: '#c45c5c', fontSize: 13, textAlign: 'center' }}>{error}</p>}

      {result && (
        <div className="space-y-3 fade-in">
          {result.recognized_text && (
            <Card>
              <p className="text-xs text-[#b0aea5] mb-1">识别到的英文</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1917' }}>{result.recognized_text}</p>
              <p style={{ fontSize: 13, color: '#7a7870', marginTop: 4 }}>{result.translation}</p>
            </Card>
          )}

          {result.vocabulary?.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-[#141413] mb-3">📚 词汇讲解</p>
              <div className="space-y-4">
                {result.vocabulary.map((vocab, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #d97757', paddingLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1917', cursor: 'pointer' }} onClick={() => speak(vocab.word)}>{vocab.word}</span>
                        <span style={{ fontSize: 11, color: '#b0aea5' }}>{vocab.phonetic}</span>
                        <span style={{ fontSize: 11, color: '#7a7870' }}>{vocab.part_of_speech}</span>
                      </div>
                      <button
                        onClick={() => handleSaveWord(vocab)}
                        disabled={savedWords.has(vocab.word)}
                        style={{ fontSize: 11, color: savedWords.has(vocab.word) ? '#788c5d' : '#d97757', background: 'none', border: 'none', cursor: savedWords.has(vocab.word) ? 'default' : 'pointer' }}
                      >
                        {savedWords.has(vocab.word) ? '✅ 已保存' : '+ 加入词汇本'}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#7a7870' }}>{vocab.meaning}</p>
                    <p style={{ fontSize: 12, color: '#b0aea5', marginTop: 2 }}>{vocab.example} — {vocab.example_zh}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.grammar_tip && (
            <Card style={{ background: '#f0eeff', border: '1px solid #d0c8f0' }}>
              <p className="text-sm font-semibold text-[#7a6bba] mb-1">📐 语法解析</p>
              <p className="text-sm text-[#7a7870]">{result.grammar_tip}</p>
            </Card>
          )}

          {result.similar_expressions?.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-[#141413] mb-2">💬 类似表达</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.similar_expressions.map((exp, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#1a1917', flex: 1 }}>{exp}</span>
                    <button onClick={() => speak(exp)} style={{ fontSize: 11, color: '#b0aea5', background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.teacher_comment && (
            <Card style={{ background: '#eaf2e3', border: '1px solid #c4ddb0' }}>
              <p className="text-sm text-[#5a7a3a]">👩‍🏫 {result.teacher_comment}</p>
            </Card>
          )}

          <button onClick={() => { setPreview(null); setResult(null); setSavedWords(new Set()) }}
            style={{ width: '100%', textAlign: 'center', fontSize: 13, color: '#b0aea5', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            重新上传图片
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────────────────
const TABS = [
  ['free', '🎤 自由录音'],
  ['grammar', '📝 语法纠错'],
  ['tech', '💻 编程英语'],
  ['snap', '📸 随拍'],
]

const Speaking = () => {
  const [mode, setMode] = useState('free')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#141413] mb-2" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        💬 练习中心
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">口语练习 · 语法纠错 · 编程英语 · 随拍学英语</p>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', background: '#f0ede4', borderRadius: 14, padding: 4, marginBottom: 24, gap: 2 }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: mode === key ? '#fff' : 'transparent',
              color: mode === key ? '#141413' : '#b0aea5',
              boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'free' && (
        <div>
          <Card className="mb-4 bg-[#f5e6df] border-[#f5e6df]">
            <p className="text-sm text-[#d97757]">💡 用英文说任何你想说的，AI 会分析你的发音并给出反馈</p>
          </Card>
          <AudioRecorder targetText="Say anything in English!" targetZh="用英文说任何你想说的话" lessonId="free_practice" />
        </div>
      )}

      {mode === 'grammar' && <GrammarTab />}
      {mode === 'tech' && <TechTab />}
      {mode === 'snap' && <SnapTab />}
    </div>
  )
}

export default Speaking
