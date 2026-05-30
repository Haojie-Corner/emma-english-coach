import { useBlocker } from 'react-router-dom'

const NavBlocker = ({ when, title = '离开对话？', body = '对话进度将不会保存，确定要离开吗？' }) => {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    when && currentLocation.pathname !== nextLocation.pathname
  )

  if (blocker.state !== 'blocked') return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.48)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) blocker.reset() }}
    >
      <div style={{
        background: '#fff', borderRadius: 22,
        padding: '28px 24px', maxWidth: 340, width: '100%',
        boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
        animation: 'fadeInUp 0.18s ease-out',
      }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#0f0e0c', marginBottom: 10 }}>
          {title}
        </p>
        <p style={{ fontSize: 13.5, color: '#5c5850', lineHeight: 1.6, marginBottom: 24 }}>
          {body}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => blocker.reset()}
            style={{
              flex: 1, minHeight: 44, borderRadius: 14, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg, #f28040, #e05020)', color: '#fff',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 3px 12px rgba(232,103,42,0.3)',
            }}
          >
            继续对话
          </button>
          <button
            onClick={() => blocker.proceed()}
            style={{
              flex: 1, minHeight: 44, borderRadius: 14, fontSize: 14, fontWeight: 700,
              background: '#f5f3ef', color: '#5c5850',
              border: '1.5px solid #e5e1d8', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            确认离开
          </button>
        </div>
      </div>
    </div>
  )
}

export default NavBlocker
