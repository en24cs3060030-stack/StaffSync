import { useState } from 'react'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import AttendanceWidget from '../components/AttendanceWidget'
import { fmtDate, fmtTime, monthKey } from '../utils'

export default function Attendance() {
  const [month, setMonth] = useState(monthKey())
  const { data, loading, error, reload } = useFetch(() => api.get('/attendance/my', { month }), [month])
  const s = data?.summary

  return (
    <>
      <PageHeader title="My attendance" subtitle="Mark your attendance and review your history">
        <input type="month" className="form-control" value={month} max={monthKey()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </PageHeader>

      <div className="row g-3 mb-3">
        <div className="col-lg-4"><AttendanceWidget onChange={reload} /></div>
        <div className="col-lg-8">
          <div className="card h-100"><div className="card-body">
            <h6>Summary for {month}</h6>
            {s ? (
              <div className="row text-center g-2 mt-1">
                {[['Present', s.Present, 'success'], ['Late', s.Late, 'warning'], ['Half day', s['Half Day'], 'info'], ['On leave', s['On Leave'], 'secondary'], ['Absent', s.Absent, 'danger'], ['Hours', s.totalHours, 'primary']].map(([l, v, c]) => (
                  <div className="col-4 col-md-2" key={l}><div className={`rounded p-2 bg-${c}-subtle`}><div className="fs-4 fw-bold">{v}</div><div className="small text-muted">{l}</div></div></div>
                ))}
              </div>
            ) : <div className="text-muted">Loading…</div>}
          </div></div>
        </div>
      </div>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No records for this month</td></tr>}
              {data.data.map((r) => (
                <tr key={r._id}><td>{fmtDate(r.date)}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td><td>{r.workHours || 0}</td><td><StatusBadge status={r.status} /></td><td className="text-muted small">{r.note}</td></tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
    </>
  )
}
