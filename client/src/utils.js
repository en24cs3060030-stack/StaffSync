export const DEPARTMENTS = ['General', 'Engineering', 'Design', 'Human Resources', 'Finance', 'Sales', 'Marketing', 'Operations', 'Support']
export const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Unpaid']
export const CATEGORIES = ['General', 'Policy', 'Event', 'Holiday', 'Urgent']
export const ATTENDANCE_STATUS = ['Present', 'Late', 'Half Day', 'Absent', 'On Leave']

const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (d = new Date()) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}
export const monthKey = (d = new Date()) => dateKey(d).slice(0, 7)

// "2026-10-22" (plain key) or full ISO date -> "22 Oct 2026"
export const fmtDate = (v) => {
  if (!v) return '—'
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
export const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtDateTime = (v) => (v ? `${fmtDate(v)}, ${fmtTime(v)}` : '—')
// value for <input type="datetime-local">
export const toLocalInput = (v) => {
  if (!v) return ''
  const d = new Date(v)
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export const ROLE_LABEL = { hr: 'HR', manager: 'Manager', employee: 'Employee' }

// Bootstrap colour for each status word used in the app
export const STATUS_COLOR = {
  Present: 'success', Late: 'warning', 'Half Day': 'info', Absent: 'danger', 'On Leave': 'secondary', 'Not marked': 'light',
  Pending: 'warning', Approved: 'success', Rejected: 'danger', Cancelled: 'secondary',
  Upcoming: 'primary', Ongoing: 'success', Completed: 'secondary',
  General: 'secondary', Policy: 'primary', Event: 'info', Holiday: 'success', Urgent: 'danger',
}

export const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
