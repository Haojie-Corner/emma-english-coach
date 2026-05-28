import { getLearningStateItems, upsertLearningStateItems } from '../services/supabase'

export const LEARNING_STATE_CHANGED = 'learning-state-changed'
export const LEARNING_STATE_SYNCED = 'learning-state-synced'

const FIXED_KEYS = [
  'dailyGoal',
  'grammarErrors',
  'learningWeaknesses',
  'ielts_goal_profile',
  'ielts_speaking_attempts',
  'english_diagnostic_profile',
  'emma_recent_messages',
  'milestones_seen',
]

export const notifyLearningStateChanged = () => {
  window.dispatchEvent(new Event(LEARNING_STATE_CHANGED))
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
  const items = collectLocalItems()
  if (items.length > 0) await upsertLearningStateItems(userId, items)
}

export const syncLearningState = async (userId) => {
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
  window.dispatchEvent(new Event(LEARNING_STATE_SYNCED))
}
