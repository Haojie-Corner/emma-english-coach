import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import { modules } from '../data/phonics'
import { chatWithEmma } from '../services/deepseek'
import { buildEmmaLearningContext } from '../utils/learningContext'

/* ── Emma 头像 ── */
const EmmaAvatar = ({ size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #e07c58, #be5530)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: size * 0.38,
    letterSpacing: '-0.01em',
  }}>E</div>
)

/* ── 打字指示器（三个跳跳点）── */
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 5, padding: '4px 2px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <div key={i} className="bounce-dot" style={{
        width: 7, height: 7, borderRadius: '50%', background: '#d97757',
        animationDelay: `${i * 0.2}s`,
      }} />
    ))}
  </div>
)

/* ── 学习路径分析卡 ── */
const PathAnalysisCard = ({ moduleProgress }) => (
  <div style={{
    background: '#fdf0ea', border: '1px solid #f5c4a8',
    borderRadius: 14, padding: '14px 16px', marginBottom: 20,
  }}>
    <p style={{ fontSize: 11, fontWeight: 700, color: '#d97757', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      学习路径分析
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {modules.map(mod => {
        const m = moduleProgress[mod.id]
        if (!m) return null
        const done = m.pct === 100
        const active = !m.locked && !done
        return (
          <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              background: done ? '#5a7a3a' : active ? '#d97757' : '#dedad0',
              border: active ? '2px solid #fdf0ea' : 'none',
              boxShadow: active ? '0 0 0 2px #d97757' : 'none',
            }} />
            <span style={{ flex: 1, fontSize: 13, color: m.locked ? '#b0aea5' : '#1a1917' }}>
              {mod.icon} {mod.name}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: done ? '#5a7a3a' : m.locked ? '#b0aea5' : '#d97757',
            }}>
              {m.locked ? '🔒 未解锁' : done ? '✓ 完成' : `${m.pct}%`}
            </span>
          </div>
        )
      })}
    </div>
  </div>
)

/* ── 规则引擎：Emma 开场白 ── */
const getOpeningMessage = (name, streak, totalCompleted, moduleProgress) => {
  if (totalCompleted === 0) {
    return `你好，${name}！我是你的专属学习顾问 Emma 😊\n\n零基础建议从「自然拼读」起步——这是英语的发音密码，掌握后你能自己读出大部分英语单词。每天学 1-2 课，2-3 周就能打好基础。\n\n有任何关于学习方法或课程内容的问题，随时问我 👇`
  }

  const phonicsPct = moduleProgress.phonics?.pct || 0
  const intonationLocked = moduleProgress.intonation?.locked

  if (phonicsPct < 30) {
    return `嗨，${name}！你已经开始了，太棒了 🎉\n\n当前拼读进度 ${phonicsPct}%，还在初期阶段。建议专注把字母发音和短元音学扎实，后面的长元音和拼读规则就会容易很多。每天 1-2 课，节奏稳就好。\n\n有不懂的直接问我！`
  }

  if (phonicsPct < 50) {
    return `嗨，${name}！拼读进度 ${phonicsPct}%，再坚持 ${Math.ceil((50 - phonicsPct) / 4.5)} 天就能解锁语音语调课了 🎵\n\n这个阶段建议重点练习「魔法E」和辅音连缀，这是中国学习者最容易出错的地方。\n\n有什么不清楚的吗？`
  }

  if (!intonationLocked && moduleProgress.intonation?.pct === 0) {
    return `嗨，${name}！语音语调课已解锁，准备好了吗？🎵\n\n现在是关键时机：拼读打了基础，语调课会让你的英语听起来更自然。建议两个模块同步推进——每天 1 课拼读 + 1 课语调，互相强化。\n\n有问题就说！`
  }

  if (streak >= 7) {
    return `嗨，${name}！连续 ${streak} 天打卡，状态非常好 🔥\n\n保持这个势头！接下来建议聚焦在你进度最低的模块集中突破，比均匀推进效果更好。\n\n现在最想练哪个方向？我帮你制定计划 👇`
  }

  if (streak === 0 && totalCompleted > 0) {
    return `${name}，好久不见！😊\n\n每天哪怕只学 10 分钟，坚持比爆发式学习有效 10 倍。今天从接下来的课继续？我来帮你找到最该练的地方。`
  }

  return `嗨，${name}！我是你的学习顾问 Emma 👩‍🏫\n\n你已完成 ${totalCompleted} 节课，进步稳定！有什么关于学习方法、发音规则、语法疑惑，或者想要我帮你制定学习计划的，都可以说 😊`
}

const QUICK_QUESTIONS = [
  '我现在应该学什么？',
  '分析我的学习弱点',
  '帮我制定学习计划',
  '自然拼读有什么技巧？',
]

const SIDEBAR_W = 220

const TeacherChat = () => {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { progress, streak, getModuleCompletion, isModuleUnlocked, dueVocabCount } = useProgressStore()
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'
  const totalCompleted = progress.filter(p => p.status === 'completed').length

  const moduleProgress = {}
  modules.forEach(mod => {
    moduleProgress[mod.id] = {
      pct: getModuleCompletion(mod.id, mod.totalLessons),
      completed: progress.filter(p => p.module_id === mod.id && p.status === 'completed').length,
      total: mod.totalLessons,
      locked: !isModuleUnlocked(mod.id),
    }
  })

  const progressSummary = { name, streak, totalCompleted, moduleProgress, dueVocabCount }

  const [messages, setMessages] = useState([
    { role: 'emma', content: getOpeningMessage(name, streak, totalCompleted, moduleProgress) }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPath, setShowPath] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = newMsgs.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))
      const reply = await chatWithEmma(apiMessages, progressSummary, '', buildEmmaLearningContext())
      setMessages(prev => [...prev, { role: 'emma', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'emma', content: '抱歉，连接出了点问题，请稍后再试 😅' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── 顶部 Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,243,239,0.88)', backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34, height: 34, borderRadius: 10, border: 'none',
            background: '#fff', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#6b6760" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <EmmaAvatar size={36} />

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f0e0c', lineHeight: 1.2 }}>Emma 老师</p>
          <p style={{ fontSize: 11, color: '#9e998e' }}>AI 学习顾问 · 随时解答</p>
        </div>

        <button
          onClick={() => setShowPath(v => !v)}
          style={{
            fontSize: 12, fontWeight: 600,
            color: showPath ? '#d97757' : '#6b6760',
            background: showPath ? '#fdf0ea' : '#fff',
            border: `1px solid ${showPath ? '#f5c4a8' : '#e8e4dc'}`,
            borderRadius: 8, padding: '5px 11px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {showPath ? '收起分析' : '学习分析'}
        </button>
      </div>

      {/* ── 学习路径分析（展开/收起）── */}
      {showPath && (
        <div style={{ padding: '16px 20px 0' }} className="fade-in">
          <PathAnalysisCard moduleProgress={moduleProgress} />
        </div>
      )}

      {/* ── 消息区 ── */}
      <div style={{ padding: '20px 20px 8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-start',
            gap: 10, marginBottom: 16,
          }}>
            {msg.role === 'emma' && <EmmaAvatar size={34} />}
            <div style={{
              maxWidth: '78%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #f28040, #e05020)'
                : '#fff',
              color: msg.role === 'user' ? '#fff' : '#0f0e0c',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: 14, lineHeight: 1.6,
              border: msg.role === 'emma' ? '1px solid rgba(0,0,0,0.07)' : 'none',
              whiteSpace: 'pre-wrap',
              boxShadow: msg.role === 'emma'
                ? '0 1px 4px rgba(0,0,0,0.06)'
                : '0 2px 10px rgba(232,103,42,0.28)',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
            <EmmaAvatar size={34} />
            <div style={{
              background: '#fff', border: '1px solid #e8e4dc',
              borderRadius: '18px 18px 18px 4px', padding: '14px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── 快捷问题（仅对话初期显示）── */}
      {messages.length <= 1 && !loading && (
        <div style={{ padding: '0 20px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                fontSize: 12.5, fontWeight: 500,
                color: '#5c5850', background: '#fff',
                border: '1px solid #e5e1d8', borderRadius: 20,
                padding: '6px 14px', cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8672a'; e.currentTarget.style.color = '#e8672a' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e1d8'; e.currentTarget.style.color = '#5c5850' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── 输入框（fixed 铺满内容区底部）── */}
      <div style={{
        position: 'fixed', bottom: 0, left: isDesktop ? SIDEBAR_W : 0, right: 0, zIndex: 20,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -8px 24px rgba(0,0,0,0.06)',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
            }}
            placeholder="问 Emma 任何关于学习的问题…"
            rows={1}
            style={{
              flex: 1, border: '1.5px solid #e5e1d8', borderRadius: 14,
              padding: '10px 14px', fontSize: 14, resize: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
              background: '#f5f3ef', outline: 'none',
              transition: 'border-color 0.15s',
              maxHeight: 120, overflowY: 'auto',
            }}
            onFocus={e => e.target.style.borderColor = '#e8672a'}
            onBlur={e => e.target.style.borderColor = '#e5e1d8'}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 40, height: 40, borderRadius: 12, border: 'none',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #f28040, #e05020)'
                : '#e5e1d8',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
              boxShadow: input.trim() && !loading ? '0 2px 8px rgba(232,103,42,0.35)' : 'none',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}

export default TeacherChat
