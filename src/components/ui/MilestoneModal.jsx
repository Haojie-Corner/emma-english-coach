const MILESTONES = {
  first_lesson:  { icon: '🌱', title: '完成第一课！',       desc: '英语之旅正式启航，发音地基从这里打起！' },
  streak_7:      { icon: '🔥', title: '连续打卡 7 天！',    desc: '一周不间断，学习习惯已经养成了 💪' },
  streak_30:     { icon: '🏆', title: '连续打卡 30 天！',   desc: '一个月坚持，你已经超越了 90% 的学习者！' },
  score_90:      { icon: '⭐', title: '发音评分 90+！',     desc: '这个发音准确度，已经相当标准了！' },
  vocab_50:      { icon: '📚', title: '词汇本突破 50 词！', desc: '50个词汇是属于你的战利品，继续收集！' },
  vocab_100:     { icon: '📖', title: '词汇本破百！',       desc: '100词，零基础学习者中的佼佼者！' },
  first_module:  { icon: '🎓', title: '完成整个模块！',     desc: '一整个模块拿下了，下一关等你来解锁！' },
}

export const checkMilestone = (key) => {
  try {
    const seen = JSON.parse(localStorage.getItem('milestones_seen') || '{}')
    if (seen[key]) return false
    seen[key] = Date.now()
    localStorage.setItem('milestones_seen', JSON.stringify(seen))
    return true
  } catch { return false }
}

const MilestoneModal = ({ milestoneKey, onClose }) => {
  const m = MILESTONES[milestoneKey]
  if (!m) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          background: '#fff', borderRadius: 24, padding: '40px 32px',
          textAlign: 'center', maxWidth: 340, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>{m.icon}</div>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: '#d97757', background: '#fdf0ea', border: '1px solid #f5c4a8',
          borderRadius: 20, padding: '3px 12px', marginBottom: 14,
        }}>
          🏅 新成就解锁
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1917', marginBottom: 8, lineHeight: 1.3 }}>
          {m.title}
        </h2>
        <p style={{ fontSize: 14, color: '#7a7870', lineHeight: 1.6, marginBottom: 28 }}>
          {m.desc}
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #d97757, #c05e3a)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          继续加油 →
        </button>
      </div>
    </div>
  )
}

export default MilestoneModal
