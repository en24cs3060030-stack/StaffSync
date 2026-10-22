import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import AttendanceWidget from '../components/AttendanceWidget'
import AnnouncementList from '../components/AnnouncementList'
import { fmtDate, fmtDateTime } from '../utils'

export default function EmployeeDashboard() {
  const { user } = useSelector((s) => s.auth)
  const { data, loading, error, reload } = useFetch(() => api.get('/dashboard'))
  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const d = data.data

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]} 👋`} subtitle="Here is your day at a glance" />

      <div className="row g-3 mb-3">
        <div className="col-md-6 col-lg-4"><AttendanceWidget onChange={reload} /></div>
        <div className="col-6 col-lg-2"><StatCard icon="✅" label="Present this month" value={d.monthSummary.present} color="success" /></div>
        <div className="col-6 col-lg-2"><StatCard icon="⏰" label="Late this month" value={d.monthSummary.late} color="warning" /></div>
        <div className="col-6 col-lg-2"><StatCard icon="🌴" label="Leave days taken" value={d.monthSummary.onLeave} color="secondary" /></div>
        <div className="col-6 col-lg-2"><StatCard icon="🔔" label="Unread alerts" value={d.unreadNotifications} color="primary" /></div>
      </div>

      <div className="card mb-3">
        <div className="card-header bg-white d-flex justify-content-between"><strong>Leave balance ({new Date().getFullYear()})</strong><Link to="/leaves" className="small">Apply for leave</Link></div>
        <div className="card-body"><div className="row g-3">
          {d.balance.map((b) => (
            <div className="col-6 col-lg-3" key={b.type}>
              <div className="border rounded p-3">
                <div className="text-muted small">{b.type}</div>
                <div className="fs-4 fw-bold">{b.remaining === null ? '∞' : b.remaining}<span className="fs-6 text-muted fw-normal">{b.total !== null && ` / ${b.total}`}</span></div>
                <div className="small text-muted">{b.used} used{b.pending ? ` · ${b.pending} pending` : ''}</div>
              </div>
            </div>
          ))}
        </div></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4"><AnnouncementList items={d.announcements} /></div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between"><strong>My upcoming trainings</strong><Link to="/trainings" className="small">Browse</Link></div>
            <ul className="list-group list-group-flush">
              {d.trainings.length === 0 && <li className="list-group-item text-muted">You are not enrolled in any training</li>}
              {d.trainings.map((t) => (
                <li key={t._id} className="list-group-item"><div className="fw-semibold">{t.title}</div><div className="small text-muted">{fmtDateTime(t.startDate)} · {t.mode}</div></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between"><strong>Recent leave requests</strong><span className="small text-muted">{d.pendingLeaves} pending</span></div>
            <ul className="list-group list-group-flush">
              {d.recentLeaves.length === 0 && <li className="list-group-item text-muted">No leave requests yet</li>}
              {d.recentLeaves.map((l) => (
                <li key={l._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div><div className="fw-semibold">{l.leaveType} · {l.days} day(s)</div><div className="small text-muted">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</div></div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
