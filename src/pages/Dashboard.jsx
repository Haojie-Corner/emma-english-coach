import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import { modules, phonicsLessons } from '../data/phonics'
import { intonationLessons } from '../data/intonation'
import { mindsetLessons } from '../data/mindset'
import { demoLessons } from '../data/demo'

/* ── 进度环 ── */
const ProgressRing = ({ pct, size = 52, color = '#d97757' }) => {
  const r = (size - 7) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#dedad0" strokeWidth="5.5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5.5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      <text x={size/2} y={size/2 + 4.5} textAnchor="middle"
        fontSize="11" fontWeight="700" fill={color}
        fontFamily="-apple-system,Arial,sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

/* ── 通用卡片 ── */
const Card = ({ children, onClick, style = {} }) => (
  <div onClick={onClick} style={{
    background: '#ffffff',
    border: '1px solid #dedad0',
    borderRadius: 14,
    padding: '16px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    cursor: onClick ? 'pointer' : 'default',
    transition: onClick ? 'box-shadow 0.15s, transform 0.15s' : 'none',
    ...style,
  }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' } }}
  >
    {children}
  </div>
)

/* 学习主线顺序 */
const LEARNING_PATH = [
  { moduleId: 'phonics',    lessons: phonicsLessons,    getPath: id => `/course/phonics/${id}`,    label: '自然拼读 · Phonics',    icon: '🔤' },
  { moduleId: 'intonation', lessons: intonationLessons, getPath: id => `/course/intonation/${id}`, label: '语音语调 · Intonation',  icon: '🎵' },
  { moduleId: 'mindset',    lessons: mindsetLessons,    getPath: id => `/course/mindset/${id}`,    label: '认知重塑 · Mindset',    icon: '🧠' },
  { moduleId: 'demo',       lessons: demoLessons,       getPath: id => `/course/demo/${id}`,       label: '场景演绎 · Demo',       icon: '🎬' },
]

const Dashboard = () => {
  const { user } = useUserStore()
  const { progress, streak, checkedInToday, fetchProgress, doCheckIn, getModuleCompletion, isModuleUnlocked } = useProgressStore()
  const navigate = useNavigate()

  useEffect(() => { if (user) fetchProgress(user.id) }, [user])

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  /* 跨模块找下一课（只在已解锁的模块中找） */
  const nextLessonInfo = useMemo(() => {
    for (const track of LEARNING_PATH) {
      if (!isModuleUnlocked(track.moduleId)) continue
      const lesson = track.lessons.find(l => {
        const p = progress.find(p => p.lesson_id === l.id)
        return !p || p.status !== 'completed'
      })
      if (lesson) return { lesson, ...track }
    }
    // 全部完成或全部锁定，回到拼读第一课
    const first = LEARNING_PATH[0]
    return { lesson: first.lessons[0], ...first }
  }, [progress, isModuleUnlocked])

  /* 今日推荐（动态，基于进度和解锁状态） */
  const recommendations = useMemo(() => {
    const list = []
    // 当前主线模块
    list.push({
      icon: nextLessonInfo.icon,
      title: nextLessonInfo.lesson.title,
      sub: nextLessonInfo.label,
      to: nextLessonInfo.getPath(nextLessonInfo.lesson.id),
      tag: '主线',
    })
    // 额外推荐
    if (isModuleUnlocked('scenes')) {
      list.push({ icon: '💬', title: '场景实战对话', sub: '8大主题 · AI角色扮演', to: '/course/scenes', tag: '练习' })
    } else {
      list.push({ icon: '📝', title: '语法纠错练习', sub: '输入英文，AI 实时批改', to: '/practice/speaking', tag: '练习' })
    }
    return list.slice(0, 2)
  }, [progress, nextLessonInfo, isModuleUnlocked])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px' }}>

      {/* ── 欢迎语 ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 4 }}>Good day · 你好，</p>
        <h1 className="font-title" style={{ fontSize: 26, color: '#1a1917', lineHeight: 1.2 }}>
          {displayName} 👋
        </h1>
      </div>

      {/* ── 打卡卡片 ── */}
      <Card style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: checkedInToday ? '#f0f7ea' : '#fff', borderColor: checkedInToday ? '#b8d4a0' : '#dedad0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32 }}>🔥</span>
          <div>
            <p className="font-title" style={{ fontSize: 16, color: '#1a1917' }}>
              连续打卡 <span style={{ color: '#d97757' }}>{streak}</span> 天
            </p>
            <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>
              {checkedInToday ? '✅ 今天已完成打卡' : '今天还没打卡，快来！'}
            </p>
          </div>
        </div>
        {!checkedInToday && (
          <button onClick={() => doCheckIn(user.id)} style={{
            background: '#d97757', color: '#fff', border: 'none',
            borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#b85f3e'}
            onMouseLeave={e => e.currentTarget.style.background = '#d97757'}
          >打卡</button>
        )}
      </Card>

      {/* ── 继续学习 ── */}
      <div onClick={() => navigate(nextLessonInfo.getPath(nextLessonInfo.lesson.id))} style={{
        background: 'linear-gradient(135deg, #d97757 0%, #c05e3a 100%)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 28,
        cursor: 'pointer', boxShadow: '0 4px 16px rgba(217,119,87,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(217,119,87,0.45)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(217,119,87,0.35)' }}
      >
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>继续学习</p>
          <p className="font-title" style={{ fontSize: 17, color: '#fff', lineHeight: 1.3 }}>
            {nextLessonInfo.lesson.title}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {nextLessonInfo.icon} {nextLessonInfo.label}
          </p>
        </div>
        <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.9)' }}>▶</span>
      </div>

      {/* ── 模块进度 ── */}
      <h2 className="font-title" style={{ fontSize: 15, color: '#1a1917', marginBottom: 12 }}>
        学习进度
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {modules.map(mod => {
          const pct = getModuleCompletion(mod.id, mod.totalLessons)
          return (
            <Card key={mod.id} onClick={() => navigate(`/course/${mod.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <ProgressRing pct={pct} color={mod.color} />
              <div style={{ minWidth: 0 }}>
                <p className="font-title" style={{ fontSize: 13, color: '#1a1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mod.icon} {mod.name}
                </p>
                <p style={{ fontSize: 11, color: '#7a7870', marginTop: 2 }}>{mod.totalLessons} 节课</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── 今日推荐 ── */}
      <h2 className="font-title" style={{ fontSize: 15, color: '#1a1917', marginBottom: 12 }}>
        今日推荐
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recommendations.map((item, i) => (
          <Card key={i} onClick={() => navigate(item.to)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
            <span style={{ fontSize: 24 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p className="font-title" style={{ fontSize: 14, color: '#1a1917' }}>{item.title}</p>
              <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{item.sub}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, background: '#fdf0ea', color: '#d97757', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{item.tag}</span>
              <span style={{ color: '#7a7870', fontSize: 16 }}>›</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
