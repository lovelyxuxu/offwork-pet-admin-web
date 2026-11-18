export function formatDuration(seconds) {
  if (seconds == null) return '—'
  const s = Math.max(0, Math.floor(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return d + ' 天 ' + h + ' 时'
  if (h > 0) return h + ' 时 ' + m + ' 分'
  if (m > 0) return m + ' 分 ' + sec + ' 秒'
  return sec + ' 秒'
}

const pad = (n) => String(n).padStart(2, '0')

export function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatClock(ts) {
  const d = ts ? new Date(ts * 1000) : new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const STATUS_META = {
  available: { label: '在线', type: 'success', color: '#10b981' },
  paused: { label: '暂停', type: 'warning', color: '#f59e0b' },
  offline: { label: '离线', type: 'info', color: '#b3adbd' },
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.offline
}
export function clientTypeLabel(value) { return ({ mobile: "手机端", desktop: "电脑端" })[value] || "未知终端" }
