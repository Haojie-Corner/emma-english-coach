import { getLearningStateItems, upsertLearningStateItems } from '../services/supabase'
import { isE2EMode } from './e2eMode'

export const LEARNING_STATE_CHANGED = 'learning-state-changed'
export const LEARNING_STATE_SYNCED = 'learning-state-synced'
export const LEARNING_SYNC_STATUS_CHANGED = 'learning-sync-status-changed'
export const LEARNING_SYNC_STATUS_KEY = 'learning_sync_status'
export const LEARNING_DEVICE_ID_KEY = 'learning_device_id'
export const LEARNING_LAST_ROUTE_KEY = 'last_route'
export const LEARNING_DEVICE_PROFILE_KEY = 'learning_device_profile'

const FIXED_KEYS = [
  'dailyGoal',
  'grammarErrors',
  'learningWeaknesses',
  'weakness_records',
  'ielts_goal_profile',
  'ielts_goal',
  'ielts_speaking_attempts',
  'english_diagnostic_profile',
  'emma_recent_messages',
  'emma_long_memory',
  'daily_learning_reviews',
  'vocab_output_challenges',
  'emma_coach_nudge_dismissed',
  'milestones_seen',
  'last_practice_tab',
  LEARNING_LAST_ROUTE_KEY,
  LEARNING_DEVICE_PROFILE_KEY,
]

export const notifyLearningStateChanged = () => {
  setLearningSyncStatus('pending', '有新的学习记录待同步')
  window.dispatchEvent(new Event(LEARNING_STATE_CHANGED))
}

export const getLearningSyncStatus = () => {
  try {
    return JSON.parse(localStorage.getItem(LEARNING_SYNC_STATUS_KEY) || 'null')
  } catch {
    return null
  }
}

const setLearningSyncStatus = (status, message = '') => {
  localStorage.setItem(LEARNING_SYNC_STATUS_KEY, JSON.stringify({
    status,
    message,
    updatedAt: new Date().toISOString(),
  }))
  window.dispatchEvent(new Event(LEARNING_SYNC_STATUS_CHANGED))
}

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem(LEARNING_DEVICE_ID_KEY)
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(16).slice(2)}`
    localStorage.setItem(LEARNING_DEVICE_ID_KEY, id)
  }
  return id
}

export const getLearningDeviceProfile = () => {
  const profile = {
    id: getOrCreateDeviceId(),
    deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
    userAgent: navigator.userAgent,
    lastSeenAt: new Date().toISOString(),
  }
  localStorage.setItem(LEARNING_DEVICE_PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export const markLearningRoute = (route) => {
  if (!route || route === '/login') return
  const prev = readLocalValue(LEARNING_LAST_ROUTE_KEY)
  if (prev.exists && prev.value?.path === route) return
  localStorage.setItem(LEARNING_LAST_ROUTE_KEY, JSON.stringify({
    path: route,
    updatedAt: new Date().toISOString(),
  }))
  notifyLearningStateChanged()
}

const getSyncErrorMessage = (error) => {
  const msg = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  if (msg.includes('learning_state') || msg.includes('42p01') || msg.includes('relation')) {
    return '同步表还没创建，请先在 Supabase 运行最新 supabase-setup.sql'
  }
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('rls')) {
    return '同步权限被数据库拦截，请检查 learning_state 的 RLS 策略'
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return '网络连接不稳定，同步稍后会自动重试'
  }
  return '同步失败，请稍后重试'
}

const getSyncKeys = () => {
  const studyKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('studyMinutes_'))
    .sort()
    .slice(-30)
  return [...FIXED_KEYS, ...studyKeys]
}

const readLocalValue = (key) => {
  const raw = localStorage.getItem(key)
  if (raw === null) return { exists: false, value: null }
  try {
    return { exists: true, value: JSON.parse(raw) }
  } catch {
    const num = Number(raw)
    return { exists: true, value: Number.isFinite(num) && raw.trim() !== '' ? num : raw }
  }
}

const writeLocalValue = (key, value) => {
  if (value == null) return
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
}

const identityOf = (item) => {
  if (item?.id) return item.id
  if (item?.createdAt) return `${item.createdAt}_${item.part || ''}_${item.topic || ''}`
  if (item?.date) return `${item.date}_${item.type || ''}_${item.example || ''}`
  return JSON.stringify(item)
}

const mergeArrays = (local = [], remote = [], limit = 300) => {
  const map = new Map()
  ;[...remote, ...local].forEach(item => map.set(identityOf(item), item))
  return Array.from(map.values()).slice(-limit)
}

const newerObject = (local, remote) => {
  const localTime = Date.parse(local?.updatedAt || local?.createdAt || local?.date || '')
  const remoteTime = Date.parse(remote?.updatedAt || remote?.createdAt || remote?.date || '')
  if (!Number.isNaN(localTime) && !Number.isNaN(remoteTime)) return localTime >= remoteTime ? local : remote
  return remote ?? local
}

const mergeValue = (key, local, remote) => {
  if (Array.isArray(local) || Array.isArray(remote)) {
    const limit = key === 'emma_recent_messages' ? 20 : key === 'ielts_speaking_attempts' ? 100 : 300
    return mergeArrays(Array.isArray(local) ? local : [], Array.isArray(remote) ? remote : [], limit)
  }
  if (local && typeof local === 'object' && remote && typeof remote === 'object') {
    if (key === 'milestones_seen') return { ...remote, ...local }
    return newerObject(local, remote)
  }
  return remote ?? local
}

const collectLocalItems = () => getSyncKeys()
  .map(key => ({ key, ...readLocalValue(key) }))
  .filter(item => item.exists)
  .map(item => ({ key: item.key, value: item.value }))

export const pushLearningState = async (userId) => {
  try {
    if (isE2EMode()) {
      getLearningDeviceProfile()
      setLearningSyncStatus('synced', 'E2E 模式：学习记录已模拟同步')
      window.dispatchEvent(new Event(LEARNING_STATE_SYNCED))
      return
    }
    getLearningDeviceProfile()
    const items = collectLocalItems()
    if (items.length === 0) return
    setLearningSyncStatus('syncing', '正在把本机学习记录同步到云端')
    await upsertLearningStateItems(userId, items)
    setLearningSyncStatus('synced', '学习记录已同步')
  } catch (error) {
    setLearningSyncStatus('error', getSyncErrorMessage(error))
    throw error
  }
}

export const syncLearningState = async (userId) => {
  try {
    if (isE2EMode()) {
      getLearningDeviceProfile()
      setLearningSyncStatus('synced', 'E2E 模式：手机和电脑学习记录已模拟合并')
      window.dispatchEvent(new Event(LEARNING_STATE_SYNCED))
      return
    }
    getLearningDeviceProfile()
    setLearningSyncStatus('syncing', '正在合并手机和电脑学习记录')
    const remoteRows = await getLearningStateItems(userId)
    const remoteMap = new Map(remoteRows.map(row => [row.state_key, row.value]))
    const changed = []

    getSyncKeys().forEach(key => {
      const local = readLocalValue(key)
      const hasRemote = remoteMap.has(key)

      if (!local.exists && hasRemote) {
        writeLocalValue(key, remoteMap.get(key))
        return
      }
      if (local.exists && !hasRemote) {
        changed.push({ key, value: local.value })
        return
      }
      if (local.exists && hasRemote) {
        const merged = mergeValue(key, local.value, remoteMap.get(key))
        const localJson = JSON.stringify(local.value)
        const remoteJson = JSON.stringify(remoteMap.get(key))
        const mergedJson = JSON.stringify(merged)
        if (mergedJson !== localJson) writeLocalValue(key, merged)
        if (mergedJson !== remoteJson) changed.push({ key, value: merged })
      }
    })

    if (changed.length > 0) await upsertLearningStateItems(userId, changed)
    setLearningSyncStatus('synced', changed.length > 0 ? '学习记录已合并并同步' : '学习记录已是最新')
    window.dispatchEvent(new Event(LEARNING_STATE_SYNCED))
  } catch (error) {
    setLearningSyncStatus('error', getSyncErrorMessage(error))
    throw error
  }
}

export const getLearningSyncReadiness = () => {
  const status = getLearningSyncStatus()
  const lastRoute = readLocalValue(LEARNING_LAST_ROUTE_KEY)
  return {
    status,
    device: getLearningDeviceProfile(),
    lastRoute: lastRoute.exists ? lastRoute.value : null,
    localItemsCount: collectLocalItems().length,
    trackedKeysCount: getSyncKeys().length,
    checkedAt: new Date().toISOString(),
  }
}
