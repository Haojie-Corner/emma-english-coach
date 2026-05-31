import { useEffect, useState } from 'react'
import { clearServiceStatus, getServiceStatus, SERVICE_STATUS_CHANGED } from '../../utils/serviceStatus'

const ServiceStatusBanner = () => {
  const [status, setStatus] = useState(() => getServiceStatus())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const visible = status?.state === 'issue' || status?.state === 'recovered'

  useEffect(() => {
    const refresh = () => setStatus(getServiceStatus())
    window.addEventListener(SERVICE_STATUS_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(SERVICE_STATUS_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  useEffect(() => {
    if (status?.state !== 'recovered') return undefined
    const timer = window.setTimeout(() => setStatus(null), 2600)
    return () => window.clearTimeout(timer)
  }, [status?.state, status?.updatedAt])

  if (!visible) return null

  const isIssue = status.state === 'issue'

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed',
      top: isOnline ? 12 : 54,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9997,
      width: 'min(92vw, 560px)',
      minHeight: 42,
      padding: '9px 14px',
      borderRadius: 14,
      background: isIssue ? '#fff8ea' : '#edf8f2',
      border: `1px solid ${isIssue ? '#f5d280' : '#b5e0c8'}`,
      color: isIssue ? '#8a5b08' : '#2f7a4d',
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.45,
      pointerEvents: 'auto',
    }}>
      <span style={{ fontSize: 15 }}>{isIssue ? '!' : '✓'}</span>
      <span style={{ flex: 1, overflowWrap: 'anywhere' }}>
        {status.message || (isIssue ? 'AI 服务暂时不可用，请稍后重试' : 'AI 服务已恢复')}
      </span>
      <button
        onClick={clearServiceStatus}
        aria-label="关闭服务状态提示"
        style={{
          width: 24,
          height: 24,
          border: 'none',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.55)',
          color: isIssue ? '#8a5b08' : '#2f7a4d',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export default ServiceStatusBanner
