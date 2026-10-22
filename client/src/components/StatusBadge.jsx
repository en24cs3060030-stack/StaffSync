import { STATUS_COLOR } from '../utils'

export default function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] || 'secondary'
  return <span className={`badge ${color === 'light' ? 'text-bg-light border' : `text-bg-${color}`}`}>{status}</span>
}
