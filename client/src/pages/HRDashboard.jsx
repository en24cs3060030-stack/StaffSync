import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import AnnouncementList from '../components/AnnouncementList'
import { fmtDate } from '../utils'

export default function HRDashboard() {
  const { user } = useSelector((s) => s.auth)
  const { data, loading, error, reload } = useFetch(() => api.get('/dashboard'))
  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const d = data.data

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Organisation overview for today">
        <Link to="/hr/employees" className="btn btn-outline-primary">Add employee</Link>
        <Link to="/announcements" className="btn btn-primary">Post announcement</Link>
      </PageHeader>

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><StatCard icon="🧑‍💼" label="Employees" value={d.employees} color="primary" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🧭" label="Managers" value={d.managers} color="info" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="✅" label="Present today" value={d.presentToday} color="success" sub={`${d.lateToday} late`} /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🌴" label="On leave today" value={d.onLeaveToday} color="secondary" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="❔" label="Not marked yet" value={d.notMarked} color="danger" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="📝" label="Pending leave requests" value={d.pendingLeaves} color="warning" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🎓" label="Upcoming trainings" value={d.upcomingTrainings} color="info" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🔔" label="Unread alerts" value={d.unreadNotifications} color="primary" /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between"><strong>Pending leave requests</strong><Link to="/leave-requests" className="small">Review</Link></div>
            <ul className="list-group list-group-flush">
              {d.pendingList.length === 0 && <li className="list-group-item text-muted">No pending requests</li>}
              {d.pendingList.map((l) => (
                <li key={l._id} className="list-group-item"><div className="fw-semibold">{l.user?.name} · {l.leaveType}</div><div className="small text-muted">{fmtDate(l.startDate)} – {fmtDate(l.endDate)} ({l.days}d)</div></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between"><strong>Newest employees</strong><Link to="/hr/employees" className="small">All employees</Link></div>
            <ul className="list-group list-group-flush">
              {d.recentHires.length === 0 && <li className="list-group-item text-muted">No employees yet</li>}
              {d.recentHires.map((e) => (
                <li key={e._id} className="list-group-item"><div className="fw-semibold">{e.user?.name}</div><div className="small text-muted">{e.employeeId} · {e.designation}, {e.department}</div></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-4"><AnnouncementList items={d.announcements} /></div>
      </div>
    </>
  )
}
