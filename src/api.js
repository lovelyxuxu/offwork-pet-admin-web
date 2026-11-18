let unauthorizedHandler = () => {}

export function onUnauthorized(fn) {
  unauthorizedHandler = fn
}

async function request(path, options = {}) {
  const res = await fetch('/admin' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (res.status === 401 && path !== '/login') {
    unauthorizedHandler()
    throw new Error('请先登录')
  }
  if (!res.ok) {
    let detail = '请求失败 (' + res.status + ')'
    try {
      const body = await res.json()
      if (body && body.detail) detail = body.detail
    } catch (e) { /* non-JSON error body */ }
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  login: (username, password) => request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/logout', { method: 'POST' }),
  overview: () => request('/api/overview'),
  devices: () => request('/api/devices'),
  setDeviceNote: (device, note) => request('/api/devices/' + device + '/note', { method: 'POST', body: JSON.stringify({ note }) }),
  rallies: () => request('/api/rallies'),
  trend: () => request('/api/trend'),
  kick: (device) => request('/api/devices/' + device + '/kick', { method: 'POST' }),
  dissolve: (code) => request('/api/rallies/' + code + '/dissolve', { method: 'POST' }),
  setLimit: (code, limit) => request('/api/rallies/' + code + '/limit', { method: 'POST', body: JSON.stringify({ limit }) }),
}
