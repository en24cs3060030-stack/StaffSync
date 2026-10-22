import { useState } from 'react'
import { api } from '../../api'
import useFetch from '../../hooks/useFetch'
import Loader, { ErrorBox } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { ATTENDANCE_STATUS, dateKey, fmtDate, fmtTime, ROLE_LABEL } from '../../utils'

export default function AttendanceTracking() {
  const toast = useToast()
  const [filters, setFilters] = useState({ date: dateKey(), status: '', search: '' })
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ user: '', date: dateKey(), status: 'Present', checkIn: '', checkOut: '', note: '' })
  const [people, setPeople] = useState([])

  const { data, loading, error, reload } = useFetch(() => api.get('/attendance', { page, limit: 12, date: filters.date, status: filters.status, search: q }), [page, filters.date, filters.status, q])

  const openManual = async () => {
    try {
      const [e, m] = await Promise.all([api.get('/employees/all'), api.get('/managers/all')])
      setPeople([...e.data, ...m.data].map((p) => ({ id: p.user._id, name: p.user.name })))
      setShow(true)
    } catch (err) { toast.error(err.message) }
  }

  const saveManual = async (e) => {
    e.preventDefault()
    try {
      const body = { ...form }
      if (!body.checkIn) delete body.checkIn
      if (!body.checkOut) delete body.checkOut
      await api.post('/attendance/manual', body)
      toast.success('Attendance saved')
      setShow(false)
      reload()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (r) => {
    if (!window.confirm('Delete this attendance record?')) return
    try { await api.del(`/attendance/${r._id}`); reload() } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <PageHeader title="Attendance tracking" subtitle="Daily attendance of everyone in the organisation">
        <button className="btn btn-primary" onClick={openManual}>+ Mark / correct attendance</button>
      </PageHeader>

      <form className="d-flex gap-2 mb-3 flex-wrap" onSubmit={(e) => { e.preventDefault(); setQ(filters.search); setPage(1) }}>
        <input type="date" className="form-control w-auto" value={filters.date} onChange={(e) => { setFilters({ ...filters, date: e.target.value }); setPage(1) }} />
        <select className="form-select w-auto" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
          <option value="">All statuses</option>{ATTENDANCE_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="form-control w-auto" placeholder="Search person" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <button className="btn btn-outline-secondary">Search</button>
        <button type="button" className="btn btn-link" onClick={() => { setFilters({ date: '', status: '', search: '' }); setQ(''); setPage(1) }}>Show all dates</button>
      </form>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Person</th><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No attendance records</td></tr>}
              {data.data.map((r) => (
                <tr key={r._id}>
                  <td><div className="fw-semibold">{r.user?.name}</div><div className="small text-muted">{ROLE_LABEL[r.user?.role]}</div></td>
                  <td>{fmtDate(r.date)}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td><td>{r.workHours || 0}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => remove(r)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      <Modal show={show} title="Mark / correct attendance" onClose={() => setShow(false)}>
        <form onSubmit={saveManual}>
          <div className="mb-3"><label className="form-label">Person</label>
            <select className="form-select" required value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}><option value="">Select…</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="row">
            <div className="col-6 mb-3"><label className="form-label">Date</label><input type="date" className="form-control" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="col-6 mb-3"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{ATTENDANCE_STATUS.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="col-6 mb-3"><label className="form-label">Check in</label><input type="time" className="form-control" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
            <div className="col-6 mb-3"><label className="form-label">Check out</label><input type="time" className="form-control" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
          </div>
          <div className="mb-3"><label className="form-label">Note</label><input className="form-control" maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-light" onClick={() => setShow(false)}>Close</button><button className="btn btn-primary">Save</button></div>
        </form>
      </Modal>
    </>
  )
}
