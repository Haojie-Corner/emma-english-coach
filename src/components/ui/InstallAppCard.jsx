import { useEffect, useState } from 'react'
import Button from './Button'

const DISMISS_KEY = 'pwa_install_card_dismissed_until'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)

const InstallAppCard = ({ style = {} }) => {
  const [promptEvent, setPromptEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedUntil > Date.now()) return
    const timer = setTimeout(() => setVisible(true), 800)
    const handlePrompt = (event) => {
      event.preventDefault()
      setPromptEvent(event)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handlePrompt)
    }
  }, [])

  const dismiss = () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(Date.now() + sevenDays))
    setVisible(false)
  }

  const install = async () => {
    if (!promptEvent) {
      setShowHelp(true)
      return
    }
    await promptEvent.prompt()
    setPromptEvent(null)
    dismiss()
  }

  if (!visible) return null

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 18,
      padding: '14px 16px',
      marginBottom: 20,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      ...style,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 13,
        flexShrink: 0,
        background: '#fff3ee',
        color: '#e8672a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 900,
      }}>
        ↗
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#0f0e0c', marginBottom: 4 }}>
          添加到手机桌面
        </p>
        <p style={{ fontSize: 12, color: '#5c5850', lineHeight: 1.55 }}>
          下次像打开普通 App 一样学习，手机和电脑的进度会继续同步。
        </p>
        {showHelp && (
          <p style={{ fontSize: 11.5, color: '#e8672a', lineHeight: 1.55, marginTop: 8 }}>
            {isIos() ? '在 Safari 里点分享按钮，然后选择“添加到主屏幕”。' : '当前浏览器暂时没有弹出安装窗口，可以从浏览器菜单里选择“安装应用”。'}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <Button size="sm" onClick={install}>{promptEvent ? '立即添加' : '查看方法'}</Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>暂时不用</Button>
        </div>
      </div>
    </div>
  )
}

export default InstallAppCard
