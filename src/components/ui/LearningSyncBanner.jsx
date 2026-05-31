import { useEffect, useState } from 'react'
import useUserStore from '../../store/userStore'
import { getLearningSyncStatus, LEARNING_SYNC_STATUS_CHANGED, syncLearningState } from '../../utils/learningStateSync'

const LearningSyncBanner = () => {
  const { user } = useUserStore()
  const [syncStatus, setSyncStatus] = useState(() => getLearningSyncStatus())
  const [dismissedAt, setDismissedAt] = useState(null)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setSyncStatus(getLearningSyncStatus())
      setDismissedAt(null)
    }
    window.addEventListener(LEARNING_SYNC_STATUS_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(LEARNING_SYNC_STATUS_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  if (!user?.id || syncStatus?.status !== 'error' || dismissedAt === syncStatus?.updatedAt) return null

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await syncLearningState(user.id)
    } catch {
      // syncLearningState already updates the visible sync error state.
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed',
      left: '50%',
      bottom: 'calc(104px + env(safe-area-inset-bottom))',
      transform: 'translateX(-50%)',
      zIndex: 9996,
      width: 'min(92vw, 520px)',
      padding: '10px 12px',
      borderRadius: 16,
      background: '#fdf0f0',
      border: '1px solid #f5b0b0',
      boxShadow: '0 12px 34px rgba(0,0,0,0.14)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: '#8d2828',
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 10,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        flexShrink: 0,
      }}>!</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}>学习记录同步需要检查</p>
        <p style={{ fontSize: 11.5, color: '#9d4a4a', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
          {syncStatus.message || '手机和电脑同步失败，请稍后重试'}
        </p>
      </div>
      <button
        onClick={handleRetry}
        disabled={retrying}
        style={{
          minHeight: 32,
          borderRadius: 10,
          border: 'none',
          background: retrying ? '#e8d1d1' : '#d94040',
          color: '#fff',
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 900,
          cursor: retrying ? 'default' : 'pointer',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
      >
        {retrying ? '同步中' : '重试'}
      </button>
      <button
        onClick={() => setDismissedAt(syncStatus.updatedAt)}
        aria-label="关闭同步提示"
        style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          border: '1px solid #f0c2c2',
          background: '#fff',
          color: '#8d2828',
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

export default LearningSyncBanner
