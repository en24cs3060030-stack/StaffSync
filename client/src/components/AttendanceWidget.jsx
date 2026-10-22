import { useState } from 'react'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import { useToast } from './Toast'
import StatusBadge from './StatusBadge'
import { fmtDate, fmtTime } from '../utils'

// Check-in / check-out card used on dashboards and the attendance page
export default function AttendanceWidget({ onChange }) {
  const toast = useToast()
  const { data, loading, reload } = useFetch(() => api.get('/attendance/today'))
  const [busy, setBusy] = useState(false)
  const rec = data?.data

  const act = async (path) => {
    setBusy(true)
    try {
      const res = await api.post(`/attendance/${path}`)
      toast.success(res.message)
      reload()
      onChange && onChange()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Today · {fmtDate(new Date())}</h6>
          {rec && <StatusBadge status={rec.status} />}
        </div>
        {loading ? <div className="text-muted">Loading…</div> : (
          <>
            <div className="d-flex gap-4 my-3">
              <div><div className="text-muted small">Check in</div><div className="fs-5 fw-semibold">{fmtTime(rec?.checkIn)}</div></div>
              <div><div className="text-muted small">Check out</div><div className="fs-5 fw-semibold">{fmtTime(rec?.checkOut)}</div></div>
              <div><div className="text-muted small">Hours</div><div className="fs-5 fw-semibold">{rec?.workHours || 0}</div></div>
            </div>
            {!rec?.checkIn && <button className="btn btn-primary w-100" disabled={busy || rec?.status === 'On Leave'} onClick={() => act('check-in')}>{rec?.status === 'On Leave' ? 'On approved leave' : 'Check in'}</button>}
            {rec?.checkIn && !rec.checkOut && <button className="btn btn-warning w-100" disabled={busy} onClick={() => act('check-out')}>Check out</button>}
            {rec?.checkOut && <div className="alert alert-success py-2 mb-0 text-center">Day completed 🎉</div>}
          </>
        )}
      </div>
    </div>
  )
}
