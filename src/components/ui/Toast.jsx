import { useState, useEffect } from 'react'
import { _setToastCb } from '../../utils/toast'

const STYLES = {
  error:   { bg: '#fdeaea', border: '#e8a0a0', icon: '⚠️', color: '#b83232' },
  warning: { bg: '#fdf0ea', border: '#f5c4a8', icon: '💡', color: '#c06030' },
  success: { bg: '#eaf2e3', border: '#a8d090', icon: '✅', color: '#3a7020' },
  info:    { bg: '#f0f5ff', border: '#a8c0e8', icon: 'ℹ️', color: '#3060a8' },
}

const Toast = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _setToastCb(({ msg, type, id, durationMs }) => {
      setToasts(t => [...t, { msg, type, id }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), durationMs)
    })
    return () => _setToastCb(null)
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 320, width: 'calc(100% - 32px)',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const s = STYLES[t.type] ?? STYLES.error
        return (
          <div key={t.id} className="fade-in" style={{
            background: s.bg, border: `1.5px solid ${s.border}`,
            borderRadius: 12, padding: '11px 14px',
            display: 'flex', gap: 9, alignItems: 'flex-start',
            boxShadow: '0 4px 18px rgba(0,0,0,0.13)',
          }}>
            <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: s.color, lineHeight: 1.5, flex: 1 }}>{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}

export default Toast
