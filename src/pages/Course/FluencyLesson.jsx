import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFluencyLesson, fluencyLessons } from '../../data/fluency'
import { chatWithFluency } from '../../services/deepseek'
import { saveConversation, getConversations, addVocabularyWord } from '../../services/supabase'
import { expandVocabulary } from '../../services/gemini'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { speakMultilingual, stopSpeaking } from '../../utils/tts'

// Extract "💡 学到了：" or "💡 新词汇：" items from an AI message
const parseVocabFromMessage = (content) => {
  const match = content.match(/💡 (?:学到了|新词汇)[：:]\s*([\s\S]*?)(?=\n\n|\*\*|$)/)
  if (!match) return []
  return match[1].trim()
    .split(/[；;]|\n[-•]?\s*/)
    .map(s => s.replace(/^[-•*\s]+/, '').trim())
    .filter(s => s.length > 1 && s.length < 80)
    .map(item => {
      const m = item.match(/^([^（(【]+?)\s*[（(【]([^）)】]+)[）)】]/)
      if (m) return { en: m[1].trim(), zh: m[2].trim() }
      if (/[a-zA-Z]/.test(item)) return { en: item, zh: '' }
      return null
    })
    .filter(Boolean)
}

// Small inline save chip
const VocabChip = ({ en, zh, source, saved, saving, onSave, color = '#7a6bba' }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    background: saved ? '#eaf2e3' : '#f5f0ff',
    border: `1px solid ${saved ? '#b8dca8' : '#d0c0e8'}`,
    borderRadius: 10, overflow: 'hidden',
  }}>
    <span style={{ fontSize: 11, color: saved ? '#5a7a3a' : color, padding: '3px 6px 3px 9px' }}>{en}</span>
    {zh && <span style={{ fontSize: 10, color: '#a09b95', paddingRight: 4 }}>· {zh}</span>}
    <button
      onClick={() => onSave(en, zh, source)}
      disabled={saved || saving}
      title={saved ? '已保存' : '加入词汇本'}
      style={{
        fontSize: 11, fontWeight: 700,
        background: saved ? '#c4e8b0' : saving ? '#e0d8f8' : '#d8d0f8',
        color: saved ? '#5a7a3a' : color,
        border: 'none', cursor: saved ? 'default' : 'pointer',
        padding: '3px 8px', alignSelf: 'stretch', lineHeight: 1,
      }}
    >{saved ? '✓' : saving ? '…' : '+'}</button>
  </div>
)

const FluencyLesson = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const lesson = getFluencyLesson(lessonId)

  const currentIndex = fluencyLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? fluencyLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < fluencyLessons.length - 1 ? fluencyLessons[currentIndex + 1] : null

  const [tab, setTab] = useState('learn')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState(null)
  const [pastSessions, setPastSessions] = useState([])
  const [savedVocabs, setSavedVocabs] = useState(new Set())
  const [savingVocab, setSavingVocab] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (user && lessonId) {
      getConversations(user.id, lessonId).then(setPastSessions).catch(() => {})
    }
    return () => {
      if (user && messagesRef.current.length >= 2) {
        saveConversation(user.id, lessonId, messagesRef.current).catch(() => {})
      }
    }
  }, [user, lessonId])

  if (!lesson) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <p style={{ color: '#7a7870' }}>课程不存在</p>
      <Button onClick={() => navigate('/course/fluency')} variant="secondary" style={{ marginTop: 16 }}>返回</Button>
    </div>
  )

  const vocabSource = `自如交流·${lesson.title}`

  const handleSaveVocab = async (en, zh, source) => {
    if (!user || savedVocabs.has(en) || savingVocab === en) return
    setSavingVocab(en)
    try {
      const expanded = await expandVocabulary(en)
      await addVocabularyWord(
        user.id, en,
        expanded.phonetic || '',
        expanded.meaning || zh || en,
        expanded.example || '',
        expanded.example_zh || '',
        source,
      )
      setSavedVocabs(prev => new Set([...prev, en]))
    } catch {
      // silently ignore
    } finally {
      setSavingVocab(null)
    }
  }

  const handleStart = async () => {
    setStarted(true)
    setLoading(true)
    try {
      const greeting = await chatWithFluency(lesson.id, lesson.title, lesson.aiPrompt, [
        { role: 'user', content: 'Let\'s start the conversation practice.' }
      ])
      const aiMsg = { id: Date.now(), role: 'ai', content: greeting }
      setMessages([aiMsg])
      speakMultilingual(greeting, () => setSpeakingMsgId(null))
      setSpeakingMsgId(aiMsg.id)
    } catch {
      setMessages([{ id: Date.now(), role: 'ai', content: '连接失败，请重试' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg = { id: Date.now(), role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    inputRef.current?.focus()
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
      const reply = await chatWithFluency(lesson.id, lesson.title, lesson.aiPrompt, apiMessages)
      const aiMsg = { id: Date.now() + 1, role: 'ai', content: reply }
      setMessages(prev => [...prev, aiMsg])
      stopSpeaking()
      speakMultilingual(reply, () => setSpeakingMsgId(null))
      setSpeakingMsgId(aiMsg.id)
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: '网络问题，请重试' }])
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    if (user) {
      await updateProgress(user.id, 'fluency', lesson.id, 'completed', null)
    }
    if (user && messages.length >= 2) {
      await saveConversation(user.id, lessonId, messages).catch(() => {})
    }
    stopSpeaking()
    if (nextLesson) {
      navigate(`/course/fluency/${nextLesson.id}`)
    } else {
      navigate('/course/fluency')
    }
  }

  const handleSpeak = (msg) => {
    stopSpeaking()
    setSpeakingMsgId(msg.id)
    speakMultilingual(msg.content, () => setSpeakingMsgId(null))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>

      {/* 顶部导航 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <button onClick={() => { stopSpeaking(); navigate('/course/fluency') }} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
          onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
        >← 自如交流</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={!prevLesson} onClick={() => { stopSpeaking(); prevLesson && navigate(`/course/fluency/${prevLesson.id}`) }} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: prevLesson ? 'pointer' : 'not-allowed',
            background: prevLesson ? '#fff' : '#f5f3ee', color: prevLesson ? '#1a1917' : '#b0aea5',
          }}>‹ 上一课</button>
          <button disabled={!nextLesson} onClick={() => { stopSpeaking(); nextLesson && navigate(`/course/fluency/${nextLesson.id}`) }} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: nextLesson ? 'pointer' : 'not-allowed',
            background: nextLesson ? '#fff' : '#f5f3ee', color: nextLesson ? '#1a1917' : '#b0aea5',
          }}>下一课 ›</button>
        </div>
      </div>

      {/* 标题 */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 className="font-title" style={{ fontSize: 20, color: '#1a1917', marginBottom: 4 }}>{lesson.title}</h1>
        <p style={{ fontSize: 13, color: '#7a7870' }}>{lesson.subtitle}</p>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', background: '#ece9e0', borderRadius: 12, padding: 4, marginBottom: 20, flexShrink: 0 }}>
        {[['learn', '📖 学习要点'], ['practice', '🎙️ 开口练习']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'practice') stopSpeaking() }} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? '#1a1917' : '#7a7870',
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* 学习要点 Tab */}
      {tab === 'learn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 描述 */}
          <Card style={{ background: '#f5f0ff', border: '1px solid #d0c0e8' }}>
            <p style={{ fontSize: 13, color: '#6b5ba6', lineHeight: 1.7 }}>{lesson.description}</p>
          </Card>

          {/* 学习目标 */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>🎯 本课学习目标</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lesson.objectives.map((obj, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#7a6bba', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#1a1917' }}>{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 关键短语 — 每个都可保存到词汇本 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917' }}>💬 关键短语</p>
              <span style={{ fontSize: 11, color: '#b0aea5' }}>点 + 存入词汇本</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lesson.keyPhrases.map((phrase, i) => {
                const saved = savedVocabs.has(phrase.en)
                const saving = savingVocab === phrase.en
                return (
                  <div key={i} style={{
                    background: saved ? '#f0faf0' : '#fff',
                    border: `1.5px solid ${saved ? '#b8dca8' : '#dedad0'}`,
                    borderRadius: 12, padding: '12px 14px',
                    borderLeft: `3px solid ${saved ? '#5a7a3a' : '#7a6bba'}`,
                    transition: 'border-color 0.2s, background 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#1a1917', marginBottom: 2 }}>
                          {phrase.en}
                        </p>
                        <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 4 }}>{phrase.zh}</p>
                        <p style={{ fontSize: 11, color: '#9b7ec8', background: '#f5f0ff', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                          💡 {phrase.tip}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveVocab(phrase.en, phrase.zh, vocabSource)}
                        disabled={saved || saving}
                        title={saved ? '已保存到词汇本' : '加入词汇本'}
                        style={{
                          flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                          border: `1.5px solid ${saved ? '#b8dca8' : '#d0c0e8'}`,
                          background: saved ? '#eaf2e3' : saving ? '#e8e0f8' : '#f5f0ff',
                          color: saved ? '#5a7a3a' : '#7a6bba',
                          fontSize: 14, fontWeight: 700,
                          cursor: saved ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >{saved ? '✓' : saving ? '…' : '+'}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 常见错误 */}
          {lesson.avoidMistakes?.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1917', marginBottom: 10 }}>⚠️ 常见错误对比</p>
              {lesson.avoidMistakes.map((item, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #dedad0', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', flexShrink: 0 }}>✗ 错误</span>
                    <span style={{ fontSize: 13, color: '#dc2626', fontStyle: 'italic' }}>{item.wrong}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5a7a3a', flexShrink: 0 }}>✓ 正确</span>
                    <span className="font-mono" style={{ fontSize: 13, color: '#5a7a3a', fontWeight: 600 }}>{item.right}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#7a7870' }}>💡 {item.tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* 小贴士 */}
          {lesson.tips?.length > 0 && (
            <div style={{ background: '#fdf6e3', border: '1px solid #e8d5a0', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#c4a35a', marginBottom: 8 }}>🌟 练习贴士</p>
              {lesson.tips.map((tip, i) => (
                <p key={i} style={{ fontSize: 12, color: '#7a6010', marginBottom: 4 }}>• {tip}</p>
              ))}
            </div>
          )}

          <Button onClick={() => setTab('practice')} size="lg" style={{ width: '100%', justifyContent: 'center', background: '#7a6bba', borderColor: '#7a6bba' }}>
            开始对话练习 🎙️
          </Button>
        </div>
      )}

      {/* 对话练习 Tab */}
      {tab === 'practice' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* 角色说明 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#7a7870', background: '#f5f0ff', border: '1px solid #d0c0e8', borderRadius: 20, padding: '3px 10px' }}>
              🤖 AI：{lesson.aiRole}
            </span>
            <span style={{ fontSize: 11, color: '#7a7870', background: '#f5f3ee', border: '1px solid #dedad0', borderRadius: 20, padding: '3px 10px' }}>
              👤 你：{lesson.userRole}
            </span>
          </div>

          {/* 历史对话记录 */}
          {!started && pastSessions.length > 0 && (
            <div style={{ background: '#f5f0ff', border: '1px solid #d0c0e8', borderRadius: 12, padding: '12px 16px', marginBottom: 12, flexShrink: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9b7ec8', marginBottom: 8 }}>📖 历史练习记录</p>
              {pastSessions.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ fontSize: 12, color: '#7a7870', flex: 1, marginRight: 8 }}>{s.summary || '练习记录'}</span>
                  <span style={{ fontSize: 11, color: '#9b7ec8' }}>{s.message_count} 条 · {new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}

          {/* 对话区 */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16, minHeight: 200 }}>
            {!started && (
              <Card style={{ textAlign: 'center', padding: '28px 24px' }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>🗣️</p>
                <p className="font-title" style={{ fontSize: 16, color: '#1a1917', marginBottom: 8 }}>准备好开口了吗？</p>
                <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 16, lineHeight: 1.6 }}>
                  AI 将扮演 <strong>{lesson.aiRole}</strong>，陪你练习：<strong>{lesson.subtitle}</strong>
                </p>
                <Button onClick={handleStart} style={{ background: '#7a6bba', borderColor: '#7a6bba' }}>开始对话 💬</Button>
              </Card>
            )}

            {started && messages.map(msg => {
              const vocabChips = msg.role === 'ai' ? parseVocabFromMessage(msg.content) : []
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 8,
                }}>
                  {msg.role === 'ai' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      🤖
                    </div>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{
                      background: msg.role === 'user' ? '#7a6bba' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#1a1917',
                      border: msg.role === 'user' ? 'none' : '1px solid #dedad0',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '12px 16px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                    {msg.role === 'ai' && (
                      <>
                        <button onClick={() => handleSpeak(msg)} style={{
                          marginTop: 4, fontSize: 11, color: speakingMsgId === msg.id ? '#7a6bba' : '#b0aea5',
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                        }}>
                          {speakingMsgId === msg.id ? '🔊 播放中…' : '🔊 朗读'}
                        </button>
                        {/* 解析出的新词汇芯片 */}
                        {vocabChips.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {vocabChips.map((v, i) => (
                              <VocabChip
                                key={i} en={v.en} zh={v.zh}
                                source={vocabSource}
                                saved={savedVocabs.has(v.en)}
                                saving={savingVocab === v.en}
                                onSave={handleSaveVocab}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <div style={{ background: '#fff', border: '1px solid #dedad0', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#7a6bba', animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          {started && (
            <div style={{ flexShrink: 0, borderTop: '1px solid #ece9e0', paddingTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="用英文回复… (Enter 发送)"
                  rows={2}
                  style={{
                    flex: 1, background: '#faf9f5', border: '1.5px solid #dedad0', borderRadius: 12,
                    padding: '10px 14px', fontSize: 14, color: '#1a1917', outline: 'none',
                    resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                  }}
                  onFocus={e => e.target.style.borderColor = '#7a6bba'}
                  onBlur={e => e.target.style.borderColor = '#dedad0'}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Button onClick={handleSend} disabled={!input.trim() || loading}
                    style={{ background: '#7a6bba', borderColor: '#7a6bba', padding: '10px 18px', alignSelf: 'flex-end' }}>
                    发送
                  </Button>
                  {messages.length >= 4 && (
                    <button onClick={handleFinish} style={{
                      padding: '7px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      border: '1.5px solid #5a7a3a', color: '#5a7a3a', background: '#eaf2e3',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                      完成 ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FluencyLesson
