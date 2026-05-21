import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getScene } from '../../data/scenes'
import { chatWithScene } from '../../services/deepseek'
import { saveConversation, getConversations } from '../../services/supabase'
import useUserStore from '../../store/userStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { speakMultilingual, stopSpeaking } from '../../utils/tts'

const SceneLesson = () => {
  const { sceneId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState(null)
  const [pastSessions, setPastSessions] = useState([])
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!scene) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <p style={{ color: '#7a7870' }}>场景不存在</p>
      <Button onClick={() => navigate('/course/scenes')} variant="secondary" style={{ marginTop: 16 }}>返回</Button>
    </div>
  )

  const handleStart = async () => {
    setStarted(true)
    setLoading(true)
    try {
      const greeting = await chatWithScene(scene.id, scene.title, scene.description, [
        { role: 'user', content: 'Hello, let\'s start the conversation practice.' }
      ])
      const aiMsg = { id: Date.now(), role: 'ai', content: greeting }
      setMessages([aiMsg])
      speakMultilingual(greeting, () => setSpeakingMsgId(null))
      setSpeakingMsgId(aiMsg.id)
    } catch (e) {
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
      const reply = await chatWithScene(scene.id, scene.title, scene.description, apiMessages)
      const aiMsg = { id: Date.now() + 1, role: 'ai', content: reply }
      setMessages(prev => [...prev, aiMsg])
      stopSpeaking()
      speakMultilingual(reply, () => setSpeakingMsgId(null))
      setSpeakingMsgId(aiMsg.id)
    } catch (e) {
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

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* 顶部 */}
      <button onClick={() => { stopSpeaking(); navigate('/course/scenes') }} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer',
        marginBottom: 12, padding: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
        onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
      >← 场景实战</button>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 className="font-title" style={{ fontSize: 20, color: '#1a1917' }}>{scene.title}</h1>
          <span style={{ fontSize: 11, color: '#d97757', background: '#fdf0ea', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{scene.difficulty}</span>
        </div>
        <p style={{ fontSize: 13, color: '#7a7870' }}>{scene.description}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#7a7870' }}>👤 你的角色：<strong>{scene.role}</strong></span>
          <span style={{ fontSize: 11, color: '#7a7870' }}>🤖 AI 扮演：<strong>{scene.aiRole}</strong></span>
          <span style={{ fontSize: 11, color: '#7a7870' }}>⏱ {scene.duration}</span>
        </div>
        {scene.keyVocab?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {scene.keyVocab.map((v, i) => (
              <span key={i} style={{ fontSize: 11, color: '#7a6bba', background: '#f0eeff', padding: '2px 8px', borderRadius: 12 }}>{v}</span>
            ))}
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
              AI 会扮演 <strong>{scene.aiRole}</strong>，你扮演 <strong>{scene.role}</strong>。<br />
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

        {started && messages.map(msg => (
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
              {msg.role === 'ai' && (
                <button
                  onClick={() => handleSpeak(msg)}
                  style={{
                    marginTop: 4, fontSize: 11, color: speakingMsgId === msg.id ? '#d97757' : '#b0aea5',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                  }}
                >
                  {speakingMsgId === msg.id ? '🔊 播放中…' : '🔊 朗读'}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fdf0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div style={{ background: '#fff', border: '1px solid #dedad0', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <span className="spin" style={{ display: 'inline-block' }}>⏳</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      {started && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #ece9e0' }}>
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
          <Button onClick={handleSend} disabled={!input.trim() || loading} style={{ alignSelf: 'flex-end', padding: '10px 20px' }}>
            发送
          </Button>
        </div>
      )}
    </div>
  )
}

export default SceneLesson
