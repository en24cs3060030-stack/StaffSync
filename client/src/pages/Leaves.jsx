import { useState } from 'react'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { dateKey, fmtDate, LEAVE_TYPES } from '../utils'

const EMPTY = { leaveType: 'Casual', startDate: dateKey(), endDate: dateKey(), reason: '' }

export default function Leaves() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const list = useFetch(() => api.get('/leaves/my', { page, limit: 8, status }), [page, status])
  const bal = useFetch(() => api.get('/leaves/balance'))
  const refresh = () => { list.reload(); bal.reload() }

  const apply = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/leaves', form)
      toast.success('Leave request submitted')
      setShow(false)
      setForm(EMPTY)
      setPage(1)
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return
    try { await api.put(`/leaves/${id}/cancel`); toast.success('Leave cancelled'); refresh() } catch (err) { toast.error(err.message) }
  }

  const canCancel = (l) => l.status === 'Pending' || (l.status === 'Approved' && l.startDate > dateKey())

  return (
    <>
      <PageHeader title="Leave management" subtitle="Apply for leave and track your requests">
        <button className="btn btn-primary" onClick={() => setShow(true)}>+ Apply for leave</button>
      </PageHeader>

      <div className="row g-3 mb-3">
        {(bal.data?.data || []).map((b) => (
          <div className="col-6 col-lg-3" key={b.type}>
            <div className="card h-100"><div className="card-body">
              <div className="text-muted small">{b.type} leave</div>
              <div className="fs-3 fw-bold">{b.remaining === null ? '∞' : b.remaining}<span className="fs-6 text-muted fw-normal">{b.total !== null && ` / ${b.total} left`}</span></div>
              <div className="small text-muted">{b.used} used{b.pending ? ` · ${b.pending} pending` : ''}</div>
            </div></div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-3">
        <select className="form-select w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {list.loading ? <Loader /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Reviewed by</th><th /></tr></thead>
            <tbody>
              {list.data.data.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">No leave requests</td></tr>}
              {list.data.data.map((l) => (
                <tr key={l._id}>
                  <td>{l.leaveType}</td><td>{fmtDate(l.startDate)}</td><td>{fmtDate(l.endDate)}</td><td>{l.days}</td>
                  <td className="small" style={{ maxWidth: 200 }}>{l.reason}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="small">{l.reviewedBy?.name || '—'}{l.reviewComment && <div className="text-muted">“{l.reviewComment}”</div>}</td>
                  <td>{canCancel(l) && <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(l._id)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
      <Pagination pagination={list.data?.pagination} onPage={setPage} />

      <Modal show={show} title="Apply for leave" onClose={() => setShow(false)}>
        <form onSubmit={apply}>
          <div className="mb-3"><label className="form-label">Leave type</label>
            <select className="form-select" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>{LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="row">
            <div className="col-6 mb-3"><label className="form-label">From</label><input type="date" className="form-control" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} /></div>
            <div className="col-6 mb-3"><label className="form-label">To</label><input type="date" className="form-control" required min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="mb-3"><label className="form-label">Reason</label><textarea rows="3" className="form-control" required maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setShow(false)}>Close</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
