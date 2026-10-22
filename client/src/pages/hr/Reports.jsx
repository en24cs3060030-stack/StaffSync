import { useState } from 'react'
import { api } from '../../api'
import useFetch from '../../hooks/useFetch'
import Loader, { ErrorBox } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { downloadCsv, fmtDate, monthKey } from '../../utils'

const SEG = [['present', '#22c55e', 'Present'], ['late', '#f59e0b', 'Late'], ['halfDay', '#0ea5e9', 'Half day'], ['onLeave', '#9ca3af', 'On leave']]

export default function Reports() {
  const [month, setMonth] = useState(monthKey())
  const { data, loading, error, reload } = useFetch(() => api.get('/reports/analytics', { month }), [month])

  const exportCsv = () => {
    const rows = [['Name', 'Role', 'Present', 'Late', 'Half day', 'On leave', 'Hours'], ...data.data.monthlyAttendance.map((r) => [r.name, r.role, r.present, r.late, r.halfDay, r.onLeave, r.hours])]
    downloadCsv(`attendance-${month}.csv`, rows)
  }

  return (
    <>
      <PageHeader title="Reports & analytics" subtitle="Headcount, attendance and leave insights">
        <input type="month" className="form-control" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </PageHeader>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (() => {
        const d = data.data
        const maxHead = Math.max(...d.headcount.map((h) => h.count), 1)
        const maxDay = Math.max(...d.attendanceTrend.map((t) => t.present + t.late + t.halfDay + t.onLeave), 1)
        return (
          <>
            <div className="row g-3 mb-3">
              <div className="col-lg-6"><div className="card h-100"><div className="card-body">
                <h6>Headcount by department</h6>
                {d.headcount.length === 0 && <div className="text-muted">No data</div>}
                {d.headcount.map((h) => (
                  <div key={h.department} className="mb-2">
                    <div className="d-flex justify-content-between small"><span>{h.department}</span><strong>{h.count}</strong></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(h.count / maxHead) * 100}%` }} /></div>
                  </div>
                ))}
              </div></div></div>

              <div className="col-lg-6"><div className="card h-100"><div className="card-body">
                <h6>Attendance · last 7 days</h6>
                <div className="d-flex gap-2 align-items-end mt-3">
                  {d.attendanceTrend.map((t) => (
                    <div key={t.date} className="flex-fill text-center">
                      <div className="trend-col">
                        {SEG.map(([k, color]) => <div key={k} title={`${k}: ${t[k]}`} style={{ height: `${(t[k] / maxDay) * 100}%`, background: color }} />)}
                      </div>
                      <div className="small text-muted mt-1">{fmtDate(t.date).slice(0, 6)}</div>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-3 flex-wrap small mt-3">{SEG.map(([k, c, l]) => <span key={k}><span style={{ background: c }} className="d-inline-block rounded me-1" ><span className="invisible">__</span></span>{l}</span>)}</div>
              </div></div></div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-lg-6"><div className="card h-100"><div className="card-body">
                <h6>Approved leaves by type</h6>
                <table className="table table-sm mb-0"><thead><tr><th>Type</th><th>Requests</th><th>Days</th></tr></thead>
                  <tbody>{d.leaveByType.length === 0 && <tr><td colSpan="3" className="text-muted">No approved leaves</td></tr>}
                    {d.leaveByType.map((l) => <tr key={l.type}><td>{l.type}</td><td>{l.requests}</td><td>{l.days}</td></tr>)}</tbody></table>
              </div></div></div>
              <div className="col-lg-3"><div className="card h-100"><div className="card-body">
                <h6>Leave requests by status</h6>
                {d.leaveByStatus.length === 0 && <div className="text-muted">No data</div>}
                {d.leaveByStatus.map((l) => <div key={l.status} className="d-flex justify-content-between border-bottom py-1"><span>{l.status}</span><strong>{l.count}</strong></div>)}
              </div></div></div>
              <div className="col-lg-3"><div className="card h-100"><div className="card-body">
                <h6>Training</h6>
                <div className="fs-2 fw-bold">{d.trainings.total}</div><div className="text-muted small mb-2">programmes</div>
                <div className="fs-2 fw-bold">{d.trainings.enrollments}</div><div className="text-muted small">total enrolments</div>
              </div></div></div>
            </div>

            <div className="card"><div className="card-header bg-white d-flex justify-content-between align-items-center"><strong>Monthly attendance · {month}</strong><button className="btn btn-sm btn-outline-primary" disabled={!d.monthlyAttendance.length} onClick={exportCsv}>Export CSV</button></div>
              <div className="table-responsive"><table className="table mb-0">
                <thead><tr><th>Name</th><th>Present</th><th>Late</th><th>Half day</th><th>On leave</th><th>Hours</th></tr></thead>
                <tbody>
                  {d.monthlyAttendance.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No attendance recorded for this month</td></tr>}
                  {d.monthlyAttendance.map((r) => <tr key={r.name + r.role}><td>{r.name}</td><td>{r.present}</td><td>{r.late}</td><td>{r.halfDay}</td><td>{r.onLeave}</td><td>{r.hours}</td></tr>)}
                </tbody></table></div></div>
          </>
        )
      })()}
    </>
  )
}
