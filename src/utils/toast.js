let _cb = null

export const _setToastCb = (cb) => { _cb = cb }

export const showToast = (msg, type = 'error', durationMs = 4500) => {
  _cb?.({ msg, type, id: Date.now() + Math.random(), durationMs })
}
