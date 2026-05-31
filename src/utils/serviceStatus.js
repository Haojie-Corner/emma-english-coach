export const SERVICE_STATUS_CHANGED = 'service-status-changed'
export const SERVICE_STATUS_KEY = 'service_status'
const SERVICE_STATUS_STALE_MS = 2 * 60 * 1000

const writeStatus = (payload) => {
  const status = {
    ...payload,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(SERVICE_STATUS_KEY, JSON.stringify(status))
  window.dispatchEvent(new Event(SERVICE_STATUS_CHANGED))
}

export const getServiceStatus = () => {
  try {
    const status = JSON.parse(localStorage.getItem(SERVICE_STATUS_KEY) || 'null')
    if (!status?.updatedAt) return status
    const age = Date.now() - Date.parse(status.updatedAt)
    if (status.state === 'issue' && age > SERVICE_STATUS_STALE_MS) {
      localStorage.removeItem(SERVICE_STATUS_KEY)
      return null
    }
    return status
  } catch {
    return null
  }
}

export const clearServiceStatus = () => {
  localStorage.removeItem(SERVICE_STATUS_KEY)
  window.dispatchEvent(new Event(SERVICE_STATUS_CHANGED))
}

export const reportServiceIssue = (service, message) => {
  writeStatus({
    state: 'issue',
    service,
    message: message || `${service} 服务暂时不可用`,
  })
}

export const reportServiceOk = (service) => {
  const current = getServiceStatus()
  if (current?.state !== 'issue') return
  if (current.service && current.service !== service) return
  writeStatus({
    state: 'recovered',
    service,
    message: `${service} 服务已恢复`,
  })
}
