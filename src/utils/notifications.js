const PREFS_KEY = 'daily_reminder_prefs'

export const getNotifPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || 'null')
  } catch {
    return null
  }
}

export const saveNotifPrefs = (prefs) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export const isNotifSupported = () => 'Notification' in window

export const requestPermission = async () => {
  if (!isNotifSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

const showNotification = (title, body) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon: '/pwa-192.png',
        badge: '/favicon.svg',
        tag: 'daily-reminder',
      })
    }).catch(() => {
      new Notification(title, { body, icon: '/pwa-192.png' })
    })
  } else {
    new Notification(title, { body, icon: '/pwa-192.png' })
  }
}

// Called on app load — fires at most once per day, only after preferred hour
export const checkAndFireReminder = () => {
  const prefs = getNotifPrefs()
  if (!prefs?.enabled) return
  if (!isNotifSupported() || Notification.permission !== 'granted') return

  const todayStr = new Date().toISOString().split('T')[0]
  if (prefs.lastFired === todayStr) return

  const now = new Date()
  const [prefHour] = (prefs.time || '20:00').split(':').map(Number)
  if (now.getHours() < prefHour) return

  saveNotifPrefs({ ...prefs, lastFired: todayStr })

  const messages = [
    '今天还没有打卡！坚持比努力更重要，来练 5 分钟吧 💪',
    '每天一课，你的英语会比昨天好一点 🎓',
    '学英语最大的敌人是中断，来保住你的连续打卡吧 🔥',
    '词汇本里可能有单词等着你复习哦 📚',
    '今天打卡了吗？AI 等你来聊天！😊',
  ]
  const body = messages[Math.floor(Math.random() * messages.length)]
  showNotification('AI 英语陪练', body)
}
