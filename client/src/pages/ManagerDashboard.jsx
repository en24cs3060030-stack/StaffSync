import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import AttendanceWidget from '../components/AttendanceWidget'
import AnnouncementList from '../components/AnnouncementList'
import { fmtDate } from '../utils'

export default function ManagerDashboard() {
  const { user } = useSelector((s) => s.auth)
  const { data, loading, error, reload } = useFetch(() => api.get('/dashboard'))
  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const d = data.data

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Your team overview">
        <Link to="/team" className="btn btn-outline-primary">Manage team</Link>
        <Link to="/trainings" className="btn btn-primary">Manage trainings</Link>
      </PageHeader>

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><StatCard icon="👥" label="Team members" value={d.teamSize} color="primary" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="✅" label="Present today" value={d.presentToday} color="success" sub={`${d.lateToday} late`} /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🌴" label="On leave today" value={d.onLeaveToday} color="secondary" sub={`${d.notMarked} not marked yet`} /></div>
        <div className="col-6 col-lg-3"><StatCard icon="📝" label="Pending leave requests" value={d.pendingLeaves} color="warning" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🎓" label="Upcoming trainings" value={d.upcomingTrainings} color="info" sub={`${d.totalTrainings} created in total`} /></div>
        <div className="col-6 col-lg-3"><StatCard icon="⭐" label="Team avg. rating" value={d.avgRating ?? 'N/A'} color="warning" /></div>
        <div className="col-lg-6"><AttendanceWidget onChange={reload} /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between"><strong>Pending leave requests</strong><Link to="/leave-requests" className="small">Review all</Link></div>
            <ul className="list-group list-group-flush">
              {d.pendingList.length === 0 && <li className="list-group-item text-muted">Nothing waiting for your approval 🎉</li>}
              {d.pendingList.map((l) => (
                <li key={l._id} className="list-group-item"><div className="fw-semibold">{l.user?.name} · {l.leaveType} · {l.days} day(s)</div><div className="small text-muted">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</div></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-6"><AnnouncementList items={d.announcements} /></div>
      </div>
    </>
  )
}
