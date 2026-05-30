import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import useEmmaStore from '../store/emmaStore'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import { modules, phonicsLessons } from '../data/phonics'
import { intonationLessons } from '../data/intonation'
import { mindsetLessons } from '../data/mindset'
import { demoLessons } from '../data/demo'
import { fluencyLessons } from '../data/fluency'
import { chatWithEmma } from '../services/deepseek'
import { expandVocabulary } from '../services/gemini'
import { addVocabularyWord } from '../services/supabase'
import VocabChip from './ui/VocabChip'
import { buildEmmaLearningContext } from '../utils/learningContext'
import { LEARNING_STATE_SYNCED, notifyLearningStateChanged } from '../utils/learningStateSync'
import { dismissEmmaCoachNudge, getEmmaCoachNudge } from '../utils/learningReview'
import { saveEmmaSession, getEmmaMemoryPrompt, getLastSessionHint, mergeEmmaMemoryFromCloud } from '../utils/emmaMemory'

const parseVocabFromMessage = (content) => {
  const match = content.match(/💡\s*(?:新词汇|学到了)[：:]\s*([\s\S]*?)(?=\n\n|\*\*|$)/)
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

/* ── 根据当前路由推断上下文 ── */
const getRouteContext = (pathname) => {
  const m1 = pathname.match(/^\/course\/phonics\/(.+)/)
  if (m1) {
    const lesson = phonicsLessons.find(l => l.id === m1[1])
    return {
      label: lesson ? `自然拼读 · ${lesson.title}` : '自然拼读',
      icon: '🔤',
      description: lesson ? `正在学习自然拼读「${lesson.title}」` : '正在学习自然拼读',
      quickQ: ['这节课有什么难点？', '中国人常见错误？', '有什么记忆技巧？'],
    }
  }
  const m2 = pathname.match(/^\/course\/intonation\/(.+)/)
  if (m2) {
    const lesson = intonationLessons.find(l => l.id === m2[1])
    return {
      label: lesson ? `语音语调 · ${lesson.title}` : '语音语调',
      icon: '🎵',
      description: lesson ? `正在学习语音语调「${lesson.title}」` : '正在学习语音语调',
      quickQ: ['语调有什么规律？', '怎么练得更自然？', '常见语调错误？'],
    }
  }
  const m3 = pathname.match(/^\/course\/mindset\/(.+)/)
  if (m3) {
    const lesson = mindsetLessons.find(l => l.id === m3[1])
    return {
      label: lesson ? `认知重塑 · ${lesson.title}` : '认知重塑',
      icon: '🧠',
      description: lesson ? `正在学习认知重塑「${lesson.title}」` : '正在学习认知重塑',
      quickQ: ['中英思维差异是什么？', '这个概念怎么理解？', '有什么练习方法？'],
    }
  }
  const m4 = pathname.match(/^\/course\/demo\/(.+)/)
  if (m4) {
    const lesson = demoLessons.find(l => l.id === m4[1])
    return {
      label: lesson ? `场景演绎 · ${lesson.title}` : '场景演绎',
      icon: '🎬',
      description: lesson ? `正在学习场景演绎「${lesson.title}」` : '正在学习场景演绎',
      quickQ: ['这个场景怎么说更地道？', '发音有什么要注意？', '常用表达有哪些？'],
    }
  }
  const m5 = pathname.match(/^\/course\/fluency\/(.+)/)
  if (m5) {
    const lesson = fluencyLessons.find(l => l.id === m5[1])
    return {
      label: lesson ? `自如交流 · ${lesson.title}` : '自如交流',
      icon: '🗣️',
      description: lesson ? `正在学习自如交流「${lesson.title}」` : '正在学习自如交流',
      quickQ: ['怎么让表达更流畅？', '常用连接词有哪些？', '这个话题怎么展开？'],
    }
  }
  if (pathname.match(/^\/course\/scenes\/.+/)) return {
    label: '场景实战', icon: '💬', description: '正在进行场景实战对话',
    quickQ: ['常用表达有哪些？', '更地道的说法？', '这个场景要注意什么？'],
  }
  if (pathname === '/course/phonics') return { label: '自然拼读', icon: '🔤', description: '正在浏览自然拼读模块', quickQ: ['这个模块怎么学最快？', '难点在哪里？'] }
  if (pathname === '/course/intonation') return { label: '语音语调', icon: '🎵', description: '正在浏览语音语调模块', quickQ: ['语音语调怎么提升？', '有什么练习方法？'] }
  if (pathname === '/course/mindset') return { label: '认知重塑', icon: '🧠', description: '正在浏览认知重塑模块', quickQ: ['怎么打破翻译思维？', '认知重塑是什么意思？'] }
  if (pathname === '/course/demo') return { label: '场景演绎', icon: '🎬', description: '正在浏览场景演绎模块', quickQ: ['场景演绎怎么练？', '有什么技巧？'] }
  if (pathname === '/course/scenes') return { label: '场景实战', icon: '💬', description: '正在浏览场景实战模块', quickQ: ['推荐从哪个场景开始？', '怎么有效练口语？'] }
  if (pathname === '/course/fluency') return { label: '自如交流', icon: '🗣️', description: '正在浏览自如交流模块', quickQ: ['自如交流怎么练？', '有什么建议？'] }
  if (pathname === '/dashboard') return { label: '首页', icon: '🏠', description: '正在首页', quickQ: ['我今天该学什么？', '分析我的学习进度', '我的弱点在哪里？'] }
  if (pathname === '/course') return { label: '课程总览', icon: '📚', description: '正在浏览课程总览', quickQ: ['推荐先学哪个模块？', '各模块有什么区别？'] }
  if (pathname.startsWith('/practice')) return { label: '练习中心', icon: '🎤', description: '正在练习', quickQ: ['怎么提升口语？', '语法纠错技巧？'] }
  if (pathname === '/vocabulary') return { label: '词汇本', icon: '📖', description: '正在查看词汇本', quickQ: ['怎么记单词更有效？', '遗忘曲线怎么用？'] }
  if (pathname === '/profile') return { label: '我的', icon: '👤', description: '正在查看学习数据', quickQ: ['分析我的学习数据', '制定下阶段计划', '我的弱点在哪里？'] }
  return { label: '', icon: '💬', description: '', quickQ: ['有什么可以帮你？', '学习上有什么问题？'] }
}

/* ── 子组件 ── */
const EmmaAvatar = ({ size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #e07c58, #be5530)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: size * 0.38,
  }}>E</div>
)

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

const BREAKPOINT = 1024

const getVisualViewportState = () => {
  const vv = window.visualViewport
  return {
    height: vv?.height || window.innerHeight,
    offsetTop: vv?.offsetTop || 0,
    width: vv?.width || window.innerWidth,
  }
}

/* ── 主组件 ── */
const EmmaBubble = () => {
  const { isOpen, close, toggle } = useEmmaStore()
  const { user } = useUserStore()
  const { progress, streak, getModuleCompletion, isModuleUnlocked, dueVocabCount } = useProgressStore()
  const location = useLocation()

  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('emma_recent_messages') || '[]')
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT)
  const [viewport, setViewport] = useState(() => getVisualViewportState())
  const [savedVocabs, setSavedVocabs] = useState(new Set())
  const [savingVocab, setSavingVocab] = useState(null)
  const [coachNudge, setCoachNudge] = useState(() => getEmmaCoachNudge())
  const bottomRef = useRef(null)

  const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
  const isKeyboardOpen = !isDesktop && keyboardInset > 90
  const mobilePanelHeight = isKeyboardOpen
    ? Math.max(330, Math.min(viewport.height - 8, window.innerHeight - keyboardInset - 8))
    : null

  const handleSaveVocab = async (en, zh) => {
    if (!user || savedVocabs.has(en)) return
    setSavingVocab(en)
    try {
      const expanded = await expandVocabulary(en)
      const src = routeCtx.label ? `Emma·${routeCtx.label}` : 'Emma 老师'
      await addVocabularyWord(user.id, en, expanded.phonetic, expanded.meaning || zh, expanded.example, expanded.example_zh, src)
      setSavedVocabs(prev => new Set([...prev, en]))
    } catch { /* silently fail */ }
    finally { setSavingVocab(null) }
  }

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
  const routeCtx = getRouteContext(location.pathname)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const updateViewport = () => setViewport(getVisualViewportState())
    const vv = window.visualViewport
    updateViewport()
    window.addEventListener('resize', updateViewport)
    vv?.addEventListener('resize', updateViewport)
    vv?.addEventListener('scroll', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      vv?.removeEventListener('resize', updateViewport)
      vv?.removeEventListener('scroll', updateViewport)
    }
  }, [])

  /* 首次打开时，从云端同步 Emma 记忆（静默，不阻塞 UI） */
  useEffect(() => {
    if (isOpen && user?.id) {
      mergeEmmaMemoryFromCloud(user.id).catch(() => {})
    }
  }, [isOpen, user?.id])

  /* 每次打开时根据当前情境 + 记忆生成开场白 */
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const lastSession = getLastSessionHint()
      let greeting
      if (lastSession) {
        const daysSince = Math.round((Date.now() - new Date(lastSession.date)) / 86400000)
        const when = daysSince === 0 ? '今天早些时候' : daysSince === 1 ? '昨天' : `${daysSince}天前`
        if (lastSession.tags?.length) {
          const tagLabel = { pronunciation:'发音', grammar:'语法', fluency:'流利度', vocabulary:'词汇', ielts:'雅思', intonation:'语调' }[lastSession.tags[0]] || lastSession.tags[0]
          greeting = `嗨 ${name}！${when}你问过关于${tagLabel}的问题，今天继续还是有新问题？😊`
        } else {
          greeting = `嗨 ${name}！${when}我们聊过，今天又来练英语了，有什么可以帮你的？😊`
        }
      } else if (routeCtx.description) {
        greeting = `嗨 ${name}！我看到你${routeCtx.description.replace(/^正在/, '正在')}，有什么可以帮你的？😊`
      } else {
        greeting = `嗨 ${name}！有什么可以帮你的？😊`
      }
      setMessages([{ role: 'emma', content: greeting }])
    }
  }, [isOpen, messages.length, name, routeCtx.description])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('emma_recent_messages', JSON.stringify(messages.slice(-20)))
      notifyLearningStateChanged()
    }
  }, [messages])

  useEffect(() => {
    const refreshMessages = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('emma_recent_messages') || '[]')
        if (saved.length > 0) setMessages(saved)
      } catch { /* ignore stale cloud state */ }
      setCoachNudge(getEmmaCoachNudge())
    }
    window.addEventListener(LEARNING_STATE_SYNCED, refreshMessages)
    return () => window.removeEventListener(LEARNING_STATE_SYNCED, refreshMessages)
  }, [])

  useEffect(() => {
    const refreshNudge = () => setCoachNudge(getEmmaCoachNudge())
    window.addEventListener('focus', refreshNudge)
    return () => window.removeEventListener('focus', refreshNudge)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isKeyboardOpen ? 'auto' : 'smooth', block: 'end' })
  }, [messages, loading, isKeyboardOpen, viewport.height])

  const handleClose = () => {
    if (messages.length >= 2) {
      saveEmmaSession(messages, routeCtx.label, progressSummary, user?.id)
    }
    close()
    setInput('')
  }

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
      const memoryContext = getEmmaMemoryPrompt()
      const reply = await chatWithEmma(apiMessages, progressSummary, routeCtx.description, buildEmmaLearningContext(), memoryContext)
      setMessages(prev => [...prev, { role: 'emma', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'emma', content: '抱歉，连接出了问题，请稍后再试 😅' }])
    } finally {
      setLoading(false)
    }
  }

  const handleDismissNudge = () => {
    dismissEmmaCoachNudge()
    setCoachNudge(null)
  }

  const handleNudgePractice = () => {
    if (!coachNudge?.prompt) return
    sendMessage(coachNudge.prompt)
  }

  /* 在 /teacher 全屏页隐藏气泡 */
  if (location.pathname === '/teacher') return null

  const panelStyle = isDesktop ? {
    position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
    background: '#fff',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.1)',
    zIndex: 200,
    display: 'flex', flexDirection: 'column',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
  } : {
    position: 'fixed', left: 0, right: 0,
    bottom: isKeyboardOpen ? keyboardInset : 0,
    height: isKeyboardOpen ? mobilePanelHeight : 'min(82dvh, 640px)',
    maxHeight: isKeyboardOpen ? mobilePanelHeight : 'calc(100dvh - 18px)',
    background: '#fff',
    borderRadius: isKeyboardOpen ? '18px 18px 0 0' : '22px 22px 0 0',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
    zIndex: 200,
    display: 'flex', flexDirection: 'column',
    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {!isDesktop && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 199,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.28s',
          }}
        />
      )}

      {/* 悬浮按钮 */}
      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          right: isDesktop ? 24 : 14,
          bottom: isDesktop ? 28 : 'calc(88px + env(safe-area-inset-bottom))',
          width: isDesktop ? 52 : 48,
          height: isDesktop ? 52 : 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e07c58, #be5530)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(217,119,87,0.5)',
          zIndex: 198,
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.2s',
        }}
        onMouseEnter={e => {
          if (!isDesktop) return
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,119,87,0.65)'
        }}
        onMouseLeave={e => {
          if (!isDesktop) return
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(217,119,87,0.5)'
        }}
      >
        <span style={{ color: '#fff', fontWeight: 800, fontSize: isDesktop ? 20 : 18, letterSpacing: '-0.01em' }}>E</span>
        {coachNudge && !isOpen && (
          <span style={{
            position: 'absolute', right: 2, top: 2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#3a9a5f', border: '2px solid #fff',
          }} />
        )}
      </button>

      {/* 聊天面板 */}
      <div style={panelStyle}>

        {/* 移动端拖拽手柄 */}
        {!isDesktop && !isKeyboardOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#dedad0' }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `${isDesktop ? 14 : isKeyboardOpen ? 9 : 10}px 16px`,
          borderBottom: '1px solid #e8e4dc',
          flexShrink: 0,
          background: '#fff',
        }}>
          <EmmaAvatar size={34} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1917', lineHeight: 1.2 }}>Emma 老师</p>
            <p style={{
              fontSize: 10.5, marginTop: 1, fontWeight: routeCtx.label ? 600 : 400,
              color: routeCtx.label ? '#d97757' : '#a09b95',
            }}>
              {routeCtx.label ? `${routeCtx.icon} ${routeCtx.label}` : 'AI 学习顾问'}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: '#f5f3ee', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#6b6760" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 消息区 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: isKeyboardOpen ? '10px 12px 8px' : '14px 14px 8px',
          background: '#fbfaf7',
          WebkitOverflowScrolling: 'touch',
        }}>
          {coachNudge && (
            <div style={{
              background: '#fff8ea', border: '1px solid #f1dca3',
              borderRadius: 14, padding: '12px 12px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 11, flexShrink: 0,
                  background: '#fff', color: '#d48a10',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 900,
                }}>!</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: '#0f0e0c', lineHeight: 1.45, marginBottom: 4 }}>
                    {coachNudge.title}
                  </p>
                  <p style={{ fontSize: 11.5, color: '#5c5850', lineHeight: 1.55 }}>
                    {coachNudge.message}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <button onClick={handleNudgePractice} style={{
                      fontSize: 11, fontWeight: 800, color: '#fff',
                      background: '#d48a10', border: 'none',
                      borderRadius: 9, minHeight: 32, padding: '6px 10px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>让 Emma 带我练</button>
                    <button onClick={handleDismissNudge} style={{
                      fontSize: 11, fontWeight: 700, color: '#8a6b1d',
                      background: '#fff', border: '1px solid #ecd28e',
                      borderRadius: 9, minHeight: 32, padding: '6px 10px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>今天先不提醒</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => {
            const vocabs = msg.role === 'emma' ? parseVocabFromMessage(msg.content) : []
            const displayContent = msg.role === 'emma'
              ? msg.content.replace(/💡\s*(?:新词汇|学到了)[：:]\s*[\s\S]*$/, '').trim()
              : msg.content
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  {msg.role === 'emma' && <EmmaAvatar size={26} />}
                  <div style={{
                    maxWidth: '82%',
                    background: msg.role === 'user' ? '#d97757' : '#f5f3ee',
                    color: msg.role === 'user' ? '#fff' : '#1a1917',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '9px 12px',
                    fontSize: 13.5, lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(217,119,87,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    {displayContent}
                  </div>
                </div>
                {vocabs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5, marginLeft: 34, paddingRight: 8 }}>
                    {vocabs.map(({ en, zh }) => (
                      <VocabChip key={`${i}-${en}`} en={en} zh={zh}
                        saved={savedVocabs.has(en)} saving={savingVocab === en}
                        onSave={handleSaveVocab} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
              <EmmaAvatar size={26} />
              <div style={{ background: '#f5f3ee', borderRadius: '14px 14px 14px 4px', padding: '12px 14px' }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 快捷问题（仅初始状态）*/}
        {messages.length <= 1 && !loading && !isKeyboardOpen && routeCtx.quickQ?.length > 0 && (
          <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {routeCtx.quickQ.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  fontSize: 11.5, color: '#6b6760', background: '#fff',
                  border: '1px solid #e8e4dc', borderRadius: 14,
                  padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#d97757'; e.currentTarget.style.color = '#d97757' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e4dc'; e.currentTarget.style.color = '#6b6760' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 输入框 */}
        <div style={{
          padding: isDesktop ? '10px 12px' : '10px 12px calc(10px + env(safe-area-inset-bottom))',
          borderTop: '1px solid #e8e4dc',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 -4px 18px rgba(0,0,0,0.04)',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
            }}
            placeholder="问 Emma 任何问题…"
            rows={1}
            style={{
              flex: 1, border: '1.5px solid #e8e4dc', borderRadius: 16,
              minHeight: 42, padding: '10px 13px', fontSize: 15, resize: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
              background: '#f5f3ee', outline: 'none',
              maxHeight: 96, overflowY: 'auto',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#d97757'}
            onBlur={e => e.target.style.borderColor = '#e8e4dc'}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: 15, border: 'none',
              background: input.trim() && !loading ? '#d97757' : '#e8e4dc',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

      </div>
    </>
  )
}

export default EmmaBubble
