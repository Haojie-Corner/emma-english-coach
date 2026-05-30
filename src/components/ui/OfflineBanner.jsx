import { useState, useEffect } from 'react'

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showBanner, setShowBanner] = useState(!navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
      setTimeout(() => {
        setShowBanner(false)
        setJustReconnected(false)
      }, 2500)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
      setJustReconnected(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      background: isOnline ? '#3a9a5f' : '#c45c5c',
      color: '#fff', textAlign: 'center',
      padding: '10px 16px',
      fontSize: 13, fontWeight: 700,
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      transition: 'background 0.3s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span>{isOnline ? '✓' : '⚠️'}</span>
      <span>
        {justReconnected
          ? '网络已恢复，继续学习！'
          : '当前离线 — AI 功能暂不可用，已学内容可正常浏览'}
      </span>
    </div>
  )
}

export default OfflineBanner
