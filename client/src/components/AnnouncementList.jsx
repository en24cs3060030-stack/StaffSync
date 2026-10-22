import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { fmtDate } from '../utils'

// compact list of the latest announcements for dashboards
export default function AnnouncementList({ items = [] }) {
  return (
    <div className="card h-100">
      <div className="card-header bg-white d-flex justify-content-between">
        <strong>Latest announcements</strong>
        <Link to="/announcements" className="small">View all</Link>
      </div>
      <ul className="list-group list-group-flush">
        {items.length === 0 && <li className="list-group-item text-muted">No announcements yet</li>}
        {items.map((a) => (
          <li key={a._id} className="list-group-item">
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">{a.isPinned && '📌 '}{a.title}</span>
              <StatusBadge status={a.category} />
            </div>
            <div className="small text-muted">{fmtDate(a.createdAt)} · {a.postedBy?.name}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
