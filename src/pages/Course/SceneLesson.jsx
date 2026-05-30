import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NavBlocker from '../../components/ui/NavBlocker'
import { getScene, getAllScenes } from '../../data/scenes'
import { chatWithScene, generateConvoReview } from '../../services/deepseek'
import { saveConversation, getConversations, addVocabularyWord } from '../../services/supabase'
import { expandVocabulary } from '../../services/gemini'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import VocabChip from '../../components/ui/VocabChip'
import { speakMultilingual, stopSpeaking } from '../../utils/tts'
import { showToast } from '../../utils/toast'
import VoiceInputButton from '../../components/ui/VoiceInputButton'
import useStudyTimer from '../../hooks/useStudyTimer'
import { recordConversationWeaknesses } from '../../utils/weakness'

const extractGrammarNote = (content) => {
  const match = content.match(/📝\s*建议[：:]\s*([^\n]+(?:\n(?!✅|💡|\*|-).*)*)/m)
  if (!match) return null
  const text = match[1].trim().replace(/\n.*/g, '').trim()
  return text.length > 4 && !text.startsWith('（') && !text.includes('说得') ? text : null
}

const exportConversation = (messages, title) => {
  const lines = messages.map(m =>
    `${m.role === 'user' ? '我' : 'AI'}：${m.content}`
  ).join('\n\n')
  const text = `【${title}】对话记录\n${new Date().toLocaleString('zh-CN')}\n\n${lines}`
  navigator.clipboard.writeText(text).then(() => showToast('对话已复制到剪贴板', 'success')).catch(() => showToast('复制失败，请手动选择文本', 'error'))
}

const parseVocabFromMessage = (content) => {
  const match = content.match(/💡 新词汇[：:]\s*([\s\S]*?)(?=\n\n|\*\*|$)/)
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

const SceneLesson = () => {
  useStudyTimer()
  const { sceneId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [review, setReview] = useState(null)
  const [roleSwitched, setRoleSwitched] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState(null)
  const [pastSessions, setPastSessions] = useState([])
  const [savedVocabs, setSavedVocabs] = useState(new Set())
  const [savingVocab, setSavingVocab] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    if (user && sceneId) {
      getConversations(user.id, sceneId).then(setPastSessions).catch(() => {})
    }
    return () => {
      if (user && messagesRef.current.length >= 2) {
        saveConversation(user.id, sceneId, messagesRef.current).catch(() => {})
      }
    }
  }, [user, sceneId])

  const scene = getScene(sceneId)
  const allScenes = getAllScenes()
  const currentSceneIndex = allScenes.findIndex(s => s.id === sceneId)
  const prevScene = currentSceneIndex > 0 ? allScenes[currentSceneIndex - 1] : null
  const nextScene = currentSceneIndex < allScenes.length - 1 ? allScenes[currentSceneIndex + 1] : null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!scene) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <p style={{ color: '#7a7870' }}>场景不存在</p>
      <Button onClick={() => navigate('/course/scenes')} variant="secondary" style={{ marginTop: 16 }}>返回</Button>
    </div>
  )

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

  const handleFinish = async () => {
    if (user) {
      await updateProgress(user.id, 'scenes', sceneId, 'completed', null)
    }
    if (user && messages.length >= 2) {
      saveConversation(user.id, sceneId, messages).catch(() => {})
    }
    stopSpeaking()
    setCompleted(true)
    if (messages.length >= 4) {
      setReviewing(true)
      try {
        const apiMsgs = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
        const raw = await generateConvoReview(apiMsgs, scene.title)
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          setReview(parsed)
          recordConversationWeaknesses(parsed, `场景实战·${scene.title}`)
        }
      } catch { /* silently skip review */ }
      finally { setReviewing(false) }
    }
  }

  const myRole = roleSwitched ? scene.aiRole : scene.role
  const theirRole = roleSwitched ? scene.role : scene.aiRole

  const handleStart = async () => {
    setStarted(true)
    setLoading(true)
    try {
      const greeting = await chatWithScene(
        scene.id, scene.title, scene.description,
        [{ role: 'user', content: 'Hello, let\'s start the conversation practice.' }],
        scene.role, scene.aiRole, roleSwitched,
      )
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
      const reply = await chatWithScene(scene.id, scene.title, scene.description, apiMessages, scene.role, scene.aiRole, roleSwitched)
      const grammarNote = extractGrammarNote(reply)
      if (grammarNote) {
        setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, grammarNote } : m))
      }
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSpeak = (msg) => {
    stopSpeaking()
    setSpeakingMsgId(msg.id)
    speakMultilingual(msg.content, () => setSpeakingMsgId(null))
  }

  const vocabSource = `场景实战·${scene.title}`

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <NavBlocker when={started && messages.length > 1 && !completed} />
      {/* 顶部导航 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => { stopSpeaking(); navigate('/course/scenes') }} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
          onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
        >← 场景实战</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={!prevScene} onClick={() => { stopSpeaking(); prevScene && navigate(`/course/scenes/${prevScene.id}`) }} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: prevScene ? 'pointer' : 'not-allowed',
            background: prevScene ? '#fff' : '#f5f3ee', color: prevScene ? '#1a1917' : '#b0aea5',
          }}>‹ 上一场景</button>
          <button disabled={!nextScene} onClick={() => { stopSpeaking(); nextScene && navigate(`/course/scenes/${nextScene.id}`) }} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #dedad0', cursor: nextScene ? 'pointer' : 'not-allowed',
            background: nextScene ? '#fff' : '#f5f3ee', color: nextScene ? '#1a1917' : '#b0aea5',
          }}>下一场景 ›</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 className="font-title" style={{ fontSize: 20, color: '#1a1917' }}>{scene.title}</h1>
          <span style={{ fontSize: 11, color: '#d97757', background: '#fdf0ea', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{scene.difficulty}</span>
        </div>
        <p style={{ fontSize: 13, color: '#7a7870' }}>{scene.description}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#7a7870' }}>👤 你的角色：<strong style={{ color: roleSwitched ? '#7a6bba' : '#d97757' }}>{myRole}</strong></span>
          <span style={{ fontSize: 11, color: '#7a7870' }}>🤖 AI 扮演：<strong>{theirRole}</strong></span>
          <span style={{ fontSize: 11, color: '#7a7870' }}>⏱ {scene.duration}</span>
          {!started && scene.role && scene.aiRole && (
            <button
              onClick={() => setRoleSwitched(v => !v)}
              style={{
                fontSize: 11, fontWeight: 600,
                background: roleSwitched ? '#f0eeff' : '#faf9f5',
                color: roleSwitched ? '#7a6bba' : '#7a7870',
                border: `1px solid ${roleSwitched ? '#c0b0e8' : '#dedad0'}`,
                borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              🔄 {roleSwitched ? '已换角色' : '换角色试试'}
            </button>
          )}
        </div>

        {/* 核心词汇 — 每个词可一键存入词汇本 */}
        {scene.keyVocab?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11, color: '#9b7ec8', fontWeight: 600, marginBottom: 6 }}>
              📚 核心词汇 <span style={{ fontWeight: 400, color: '#b0aea5' }}>（点 + 存入词汇本）</span>
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {scene.keyVocab.map((v, i) => (
                <VocabChip
                  key={i} en={v} zh=""
                  saved={savedVocabs.has(v)}
                  saving={savingVocab === v}
                  onSave={(en, zh) => handleSaveVocab(en, zh, vocabSource)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 对话区 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
        {!started && pastSessions.length > 0 && (
          <div style={{ background: '#f5f0ff', border: '1px solid #d0c0e8', borderRadius: 12, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9b7ec8', marginBottom: 8 }}>📖 历史对话记录</p>
            {pastSessions.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < pastSessions.length - 1 ? '1px solid #e8dff8' : 'none' }}>
                <span style={{ fontSize: 12, color: '#7a7870', flex: 1, marginRight: 8 }}>{s.summary || '对话记录'}</span>
                <span style={{ fontSize: 11, color: '#9b7ec8', flexShrink: 0 }}>{s.message_count} 条 · {new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            ))}
          </div>
        )}

        {!started && (
          <Card style={{ textAlign: 'center', padding: '28px 24px' }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>🎭</p>
            <p className="font-title" style={{ fontSize: 16, color: '#1a1917', marginBottom: 8 }}>准备好了吗？</p>
            <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 12, lineHeight: 1.6 }}>
              AI 会扮演 <strong>{theirRole}</strong>，你扮演 <strong style={{ color: '#d97757' }}>{myRole}</strong>。<br />
              {roleSwitched && <span style={{ fontSize: 11, color: '#7a6bba' }}>🔄 已换角色 · </span>}
              尽量用英语对话，不会的单词可以先猜猜！
            </p>
            {scene.objectives?.length > 0 && (
              <div style={{ textAlign: 'left', background: '#f5f0ff', border: '1px solid #d0c0e8', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9b7ec8', marginBottom: 6 }}>💡 本场景你将练习</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {scene.objectives.map((obj, i) => (
                    <span key={i} style={{ fontSize: 11, color: '#9b7ec8', background: '#fff', border: '1px solid #d0c0e8', borderRadius: 16, padding: '2px 8px' }}>
                      ✓ {obj}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleStart} size="lg">开始对话 🎬</Button>
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
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fdf0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  🤖
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: msg.role === 'user' ? '#d97757' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1a1917',
                  border: msg.role === 'user' ? 'none' : '1px solid #dedad0',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
                {msg.role === 'user' && msg.grammarNote && (
                  <div className="fade-in" style={{
                    marginTop: 5, padding: '6px 10px', borderRadius: '10px 10px 10px 4px',
                    background: '#fdf6e3', border: '1px solid #f0d080', fontSize: 11,
                    color: '#7a6020', lineHeight: 1.5, maxWidth: '100%',
                  }}>
                    📝 {msg.grammarNote}
                  </div>
                )}
                {msg.role === 'ai' && (
                  <>
                    <button
                      onClick={() => handleSpeak(msg)}
                      style={{
                        marginTop: 4, fontSize: 11, color: speakingMsgId === msg.id ? '#d97757' : '#b0aea5',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                      }}
                    >
                      {speakingMsgId === msg.id ? '🔊 播放中…' : '🔊 朗读'}
                    </button>
                    {vocabChips.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {vocabChips.map((v, i) => (
                          <VocabChip
                            key={i} en={v.en} zh={v.zh}
                            saved={savedVocabs.has(v.en)}
                            saving={savingVocab === v.en}
                            onSave={(en, zh) => handleSaveVocab(en, zh, vocabSource)}
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
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fdf0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div style={{ background: '#fff', border: '1px solid #dedad0', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97757', animationDelay: `${delay}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 完成卡片 + 复盘 */}
      {completed && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#eaf2e3', border: '1px solid #c4ddb0', borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 6 }}>🎉</p>
            <p className="font-title" style={{ fontSize: 15, color: '#5a7a3a', marginBottom: 4 }}>场景练习完成！</p>
            <p style={{ fontSize: 13, color: '#7a7870' }}>AI 正在为你生成本次对话复盘…</p>
          </div>

          {reviewing && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <p className="spin" style={{ fontSize: 28, display: 'inline-block' }}>🤔</p>
              <p style={{ fontSize: 13, color: '#9e998e', marginTop: 8 }}>AI 正在分析你的对话表现…</p>
            </div>
          )}

          {review && !reviewing && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 综合得分 */}
              <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 8 }}>本次对话综合评分</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <p style={{ fontSize: 48, fontWeight: 800, color: review.overall_score >= 80 ? '#3a9a5f' : review.overall_score >= 60 ? '#e8672a' : '#d94040', lineHeight: 1 }}>
                    {review.overall_score}
                  </p>
                  <div style={{ flex: 1 }}>
                    {[
                      { key: 'fluency', label: '流利度', color: '#3a9a5f' },
                      { key: 'grammar', label: '语法', color: '#e8672a' },
                      { key: 'vocabulary', label: '词汇', color: '#7b5ea7' },
                      { key: 'communication', label: '沟通', color: '#4a7a9b' },
                    ].map(({ key, label, color }) => {
                      const val = review.dimension_scores?.[key] ?? 0
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: '#5c5850', width: 36, flexShrink: 0 }}>{label}</span>
                          <div style={{ flex: 1, background: '#f0ede6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${val}%`, background: color, height: '100%', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color, width: 26, flexShrink: 0 }}>{val}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {review.encouragement && <p style={{ fontSize: 13, color: '#5c5850', marginTop: 10 }}>💬 {review.encouragement}</p>}
              </div>

              {/* 亮点 */}
              {review.strengths?.length > 0 && (
                <div style={{ background: '#eaf5ef', border: '1px solid #c4ddb0', borderRadius: 14, padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#3a9a5f', marginBottom: 8 }}>✅ 本次亮点</p>
                  {review.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, color: '#0f0e0c', lineHeight: 1.5 }}>· {s}</p>)}
                </div>
              )}

              {/* Top 3 问题 */}
              {review.top3_issues?.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid #e5e1d8', borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0f0e0c', marginBottom: 10 }}>📈 需要改进的3个点</p>
                  {review.top3_issues.map((issue, i) => (
                    <div key={i} style={{ borderLeft: '3px solid #e8672a', paddingLeft: 10, marginBottom: 10 }}>
                      <p style={{ fontSize: 13, color: '#0f0e0c', fontWeight: 600 }}>{issue.issue}</p>
                      {issue.example && <p style={{ fontSize: 12, color: '#d94040', marginTop: 2, fontStyle: 'italic' }}>原句："{issue.example}"</p>}
                      {issue.fix && <p style={{ fontSize: 12, color: '#3a9a5f', marginTop: 2 }}>→ 更好："{issue.fix}"</p>}
                      {issue.tip && <p style={{ fontSize: 12, color: '#5c5850', marginTop: 2 }}>{issue.tip}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* 下一步 */}
              {review.next_step && (
                <div style={{ background: '#fdf6e3', border: '1px solid #f0d080', borderRadius: 14, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: '#7a6000' }}>⭐ 下一步建议：{review.next_step}</p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {nextScene && (
              <Button
                onClick={() => navigate(`/course/scenes/${nextScene.id}`)}
                style={{ background: 'linear-gradient(135deg, #f28040, #e05020)', color: '#fff', border: 'none' }}
              >
                下一个场景 →
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/course/scenes')}>场景列表</Button>
          </div>
        </div>
      )}

      {/* 输入区 */}
      {started && !completed && (
        <div style={{ paddingTop: 12, borderTop: '1px solid #ece9e0' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="用英文回复…（Enter 发送，Shift+Enter 换行）"
              rows={2}
              style={{
                flex: 1, background: '#faf9f5', border: '1.5px solid #dedad0', borderRadius: 12,
                padding: '10px 14px', fontSize: 14, color: '#1a1917', outline: 'none',
                resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = '#d97757'}
              onBlur={e => e.target.style.borderColor = '#dedad0'}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
                <VoiceInputButton
                  disabled={loading}
                  onResult={text => { setInput(prev => prev ? prev + ' ' + text : text) }}
                />
                <Button onClick={handleSend} disabled={!input.trim() || loading} style={{ padding: '10px 20px' }}>
                  发送
                </Button>
              </div>
              {messages.length >= 4 && (
                <button onClick={handleFinish} style={{
                  padding: '7px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  border: '1.5px solid #5a7a3a', color: '#5a7a3a', background: '#eaf2e3',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>完成 ✓</button>
              )}
              {messages.length >= 2 && (
                <button onClick={() => exportConversation(messages, scene.title)} style={{
                  padding: '7px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  border: '1.5px solid #dedad0', color: '#7a7870', background: '#faf9f5',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>📋 复制</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SceneLesson
