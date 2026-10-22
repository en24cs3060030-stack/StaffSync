import { useState } from 'react'
import { api } from '../../api'
import useFetch from '../../hooks/useFetch'
import Loader, { ErrorBox } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { dateKey, fmtTime } from '../../utils'

export default function TeamAttendance() {
  const [date, setDate] = useState(dateKey())
  const { data, loading, error, reload } = useFetch(() => api.get('/team/attendance', { date }), [date])

  return (
    <>
      <PageHeader title="Team attendance" subtitle="Who is in, late or on leave">
        <input type="date" className="form-control" value={date} max={dateKey()} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </PageHeader>
      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Employee</th><th>Department</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">You have no team members yet</td></tr>}
              {data.data.map((r) => (
                <tr key={r.employee}><td><div className="fw-semibold">{r.name}</div><div className="small text-muted">{r.employeeId}</div></td><td>{r.department}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td><td>{r.workHours}</td><td><StatusBadge status={r.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
    </>
  )
}
