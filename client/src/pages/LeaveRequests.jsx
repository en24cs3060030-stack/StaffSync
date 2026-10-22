import { useState } from 'react'
import { useSelector } from 'react-redux'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { fmtDate, fmtDateTime, ROLE_LABEL } from '../utils'

const TABS = ['Pending', 'Approved', 'Rejected', 'Cancelled', '']

export default function LeaveRequests() {
  const { user } = useSelector((s) => s.auth)
  const toast = useToast()
  const [status, setStatus] = useState('Pending')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState(null) // { leave, decision }
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useFetch(() => api.get('/leaves', { status, page, limit: 10 }), [status, page])

  const submit = async () => {
    setBusy(true)
    try {
      await api.put(`/leaves/${target.leave._id}/review`, { status: target.decision, comment })
      toast.success(`Leave ${target.decision.toLowerCase()}`)
      setTarget(null)
      setComment('')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Leave requests" subtitle={user.role === 'hr' ? 'Requests from all employees and managers' : 'Requests from your team'} />
      <ul className="nav nav-pills mb-3">
        {TABS.map((t) => (
          <li className="nav-item" key={t || 'all'}>
            <button className={`nav-link ${status === t ? 'active' : ''}`} onClick={() => { setStatus(t); setPage(1) }}>{t || 'All'}</button>
          </li>
        ))}
      </ul>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Applicant</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No requests found</td></tr>}
              {data.data.map((l) => (
                <tr key={l._id}>
                  <td><div className="fw-semibold">{l.user?.name}</div><div className="small text-muted">{ROLE_LABEL[l.user?.role]}</div></td>
                  <td>{l.leaveType}</td>
                  <td className="small">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</td>
                  <td>{l.days}</td>
                  <td className="small" style={{ maxWidth: 220 }}>{l.reason}</td>
                  <td><StatusBadge status={l.status} />{l.reviewedBy && <div className="small text-muted">{l.reviewedBy.name} · {fmtDateTime(l.reviewedAt)}</div>}</td>
                  <td className="text-nowrap">
                    {l.status === 'Pending' && (
                      <>
                        <button className="btn btn-sm btn-success me-1" onClick={() => setTarget({ leave: l, decision: 'Approved' })}>Approve</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setTarget({ leave: l, decision: 'Rejected' })}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      <Modal show={!!target} title={target ? `${target.decision === 'Approved' ? 'Approve' : 'Reject'} leave` : ''} onClose={() => setTarget(null)}
        footer={<>
          <button className="btn btn-light" onClick={() => setTarget(null)}>Close</button>
          <button className={`btn btn-${target?.decision === 'Approved' ? 'success' : 'danger'}`} disabled={busy} onClick={submit}>Confirm {target?.decision?.toLowerCase()}</button>
        </>}>
        {target && (
          <>
            <p><strong>{target.leave.user?.name}</strong> · {target.leave.leaveType} · {target.leave.days} day(s)<br /><span className="text-muted small">{fmtDate(target.leave.startDate)} – {fmtDate(target.leave.endDate)}</span></p>
            <label className="form-label">Comment (optional)</label>
            <textarea className="form-control" rows="3" maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} />
          </>
        )}
      </Modal>
    </>
  )
}
