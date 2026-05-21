import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import { modules, phonicsLessons } from '../data/phonics'
import { intonationLessons } from '../data/intonation'
import { mindsetLessons } from '../data/mindset'
import { demoLessons } from '../data/demo'
import { fluencyLessons } from '../data/fluency'

/* ── 进度环 ── */
const ProgressRing = ({ pct, size = 48, color = '#d97757' }) => {
  const r = (size - 7) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ece9e0" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
        fontSize="10" fontWeight="700" fill={color}
        fontFamily="-apple-system,Arial,sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

/* 学习主线顺序 */
const LEARNING_PATH = [
  { moduleId: 'phonics',    lessons: phonicsLessons,    getPath: id => `/course/phonics/${id}`,    label: '自然拼读 · Phonics',   icon: '🔤' },
  { moduleId: 'intonation', lessons: intonationLessons, getPath: id => `/course/intonation/${id}`, label: '语音语调 · Intonation', icon: '🎵' },
  { moduleId: 'mindset',    lessons: mindsetLessons,    getPath: id => `/course/mindset/${id}`,    label: '认知重塑 · Mindset',   icon: '🧠' },
  { moduleId: 'demo',       lessons: demoLessons,       getPath: id => `/course/demo/${id}`,       label: '场景演绎 · Demo',      icon: '🎬' },
  { moduleId: 'fluency',    lessons: fluencyLessons,    getPath: id => `/course/fluency/${id}`,    label: '自如交流 · Fluency',   icon: '🗣️' },
]

const Dashboard = () => {
  const { user } = useUserStore()
  const { progress, streak, checkedInToday, fetchProgress, doCheckIn, getModuleCompletion, isModuleUnlocked, dueVocabCount } = useProgressStore()
  const navigate = useNavigate()

  useEffect(() => { if (user) fetchProgress(user.id) }, [user])

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  const nextLessonInfo = useMemo(() => {
    for (const track of LEARNING_PATH) {
      if (!isModuleUnlocked(track.moduleId)) continue
      const lesson = track.lessons.find(l => {
        const p = progress.find(p => p.lesson_id === l.id)
        return !p || p.status !== 'completed'
      })
      if (lesson) return { lesson, ...track }
    }
    const first = LEARNING_PATH[0]
    return { lesson: first.lessons[0], ...first }
  }, [progress, isModuleUnlocked])

  const weakModule = useMemo(() => {
    const scored = LEARNING_PATH
      .filter(t => isModuleUnlocked(t.moduleId))
      .map(t => {
        const modProgress = progress.filter(p => p.module_id === t.moduleId && p.score)
        if (modProgress.length < 2) return null
        const avg = Math.round(modProgress.reduce((s, p) => s + p.score, 0) / modProgress.length)
        return { ...t, avg }
      })
      .filter(Boolean)
    if (scored.length === 0) return null
    return scored.reduce((a, b) => a.avg < b.avg ? a : b)
  }, [progress, isModuleUnlocked])

  const recommendations = useMemo(() => {
    const list = []
    list.push({
      icon: nextLessonInfo.icon, title: nextLessonInfo.lesson.title,
      sub: nextLessonInfo.label, to: nextLessonInfo.getPath(nextLessonInfo.lesson.id),
      tag: '主线', tagColor: '#d97757',
    })
    if (dueVocabCount > 0) {
      list.push({ icon: '📚', title: `复习 ${dueVocabCount} 个单词`, sub: '到期词汇 · 遗忘曲线复习', to: '/vocabulary', tag: '复习', tagColor: '#788c5d' })
    }
    if (weakModule && weakModule.avg < 75 && list.length < 3) {
      list.push({ icon: weakModule.icon, title: `加强 ${weakModule.label.split('·')[0].trim()}`, sub: `当前平均 ${weakModule.avg} 分 · 建议多练`, to: `/course/${weakModule.moduleId}`, tag: '加强', tagColor: '#c4a35a' })
    }
    if (list.length < 3) {
      if (isModuleUnlocked('scenes')) {
        list.push({ icon: '💬', title: '场景实战对话', sub: '100场景 · AI角色扮演', to: '/course/scenes', tag: '练习', tagColor: '#7a6bba' })
      } else {
        list.push({ icon: '📝', title: '语法纠错练习', sub: '输入英文，AI 实时批改', to: '/practice/speaking', tag: '练习', tagColor: '#7a6bba' })
      }
    }
    return list.slice(0, 3)
  }, [progress, nextLessonInfo, isModuleUnlocked, dueVocabCount, weakModule])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px' }}>

      {/* ── 头部：问候 + 打卡/连胜 ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 12, color: '#a09b95', marginBottom: 4, letterSpacing: '0.02em' }}>
            Good day · 你好，
          </p>
          <h1 className="font-title" style={{ fontSize: 26, color: '#1a1917', lineHeight: 1.2 }}>
            {displayName} 👋
          </h1>
        </div>

        {checkedInToday ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fdf0ea', border: '1px solid #f5c4a8',
            borderRadius: 20, padding: '7px 13px', flexShrink: 0,
          }}>
            <span style={{ fontSize: 17 }}>🔥</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#d97757', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 11, color: '#d97757', fontWeight: 500 }}>天</span>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => doCheckIn(user.id)}
          >
            🔥 打卡
          </button>
        )}
      </div>

      {/* ── 继续学习 ── */}
      <div
        onClick={() => navigate(nextLessonInfo.getPath(nextLessonInfo.lesson.id))}
        style={{
          background: 'linear-gradient(135deg, #e07c58 0%, #be5530 100%)',
          borderRadius: 18, padding: '22px 24px', marginBottom: 28,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginBottom: 6,
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
          }}>
            继续学习
          </p>
          <p className="font-title" style={{ fontSize: 18, color: '#fff', lineHeight: 1.35, marginBottom: 6 }}>
            {nextLessonInfo.lesson.title}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
            {nextLessonInfo.icon} {nextLessonInfo.label}
          </p>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0, marginLeft: 16,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── 学习进度 ── */}
      <p className="section-title">学习进度</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {modules.map(mod => {
          const pct = getModuleCompletion(mod.id, mod.totalLessons)
          return (
            <div
              key={mod.id}
              onClick={() => navigate(`/course/${mod.id}`)}
              style={{
                background: '#fff', border: '1px solid #e8e4dc', borderRadius: 14,
                padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = mod.color; e.currentTarget.style.boxShadow = `0 2px 12px ${mod.color}25` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e4dc'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <ProgressRing pct={pct} color={mod.color} />
              <div style={{ minWidth: 0 }}>
                <p className="font-title" style={{ fontSize: 12.5, color: '#1a1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mod.icon} {mod.name}
                </p>
                <p style={{ fontSize: 11, color: '#a09b95', marginTop: 2 }}>{mod.totalLessons} 节课</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 今日推荐 ── */}
      <p className="section-title">今日推荐</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recommendations.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.to)}
            style={{
              background: '#fff', border: '1px solid #e8e4dc', borderRadius: 14,
              padding: '14px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = item.tagColor || '#d97757'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e4dc'}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `${item.tagColor || '#d97757'}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1917' }}>{item.title}</p>
              <p style={{ fontSize: 12, color: '#a09b95', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: `${item.tagColor || '#d97757'}16`,
                color: item.tagColor || '#d97757',
                padding: '3px 9px', borderRadius: 20,
              }}>{item.tag}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#c0bdb8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Dashboard
