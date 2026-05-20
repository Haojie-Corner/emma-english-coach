import { useState } from 'react'

const LessonValueBanner = ({
  lesson,
  color = '#d97757',
  bg = '#fdf6f2',
  borderColor = '#f5c4a8',
}) => {
  const [collapsed, setCollapsed] = useState(false)

  const points = lesson.objectives || lesson.focusPoints || lesson.tips || []

  if (!lesson.description && points.length === 0) return null

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 14,
      padding: '14px 18px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.04em' }}>
          💡 为什么学这课
        </span>
        <button
          onClick={() => setCollapsed(v => !v)}
          style={{
            fontSize: 11, color: '#b0aea5', background: 'none',
            border: 'none', cursor: 'pointer', padding: '2px 4px',
          }}
        >
          {collapsed ? '展开 ▾' : '收起 ▴'}
        </button>
      </div>

      {!collapsed && (
        <div className="fade-in">
          {lesson.description && (
            <p style={{ fontSize: 13, color: '#4a4845', marginTop: 10, lineHeight: 1.65 }}>
              {lesson.description}
            </p>
          )}
          {points.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {points.map((pt, i) => (
                <span key={i} style={{
                  fontSize: 11, background: '#fff', color,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 20, padding: '3px 10px', lineHeight: 1.4,
                }}>
                  ✓ {pt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LessonValueBanner
