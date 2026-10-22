import { useState } from 'react'
import { api } from '../../api'
import useFetch from '../../hooks/useFetch'
import Loader, { ErrorBox } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { fmtDate, initials } from '../../utils'

export default function Team() {
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get('/team'))
  const [detail, setDetail] = useState(null) // { data, leaves }
  const [review, setReview] = useState({ rating: 4, period: '', comment: '' })
  const [adding, setAdding] = useState(false)
  const [unassigned, setUnassigned] = useState([])

  const openMember = async (id) => {
    try { setDetail(await api.get(`/team/${id}`)); setReview({ rating: 4, period: '', comment: '' }) } catch (err) { toast.error(err.message) }
  }

  const saveReview = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/team/${detail.data._id}/performance`, review)
      toast.success('Performance review saved')
      await openMember(detail.data._id)
      reload()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.user.name} from your team?`)) return
    try { await api.del(`/team/members/${m._id}`); toast.success('Member removed'); reload() } catch (err) { toast.error(err.message) }
  }

  const openAdd = async () => {
    try { setUnassigned((await api.get('/team/unassigned')).data); setAdding(true) } catch (err) { toast.error(err.message) }
  }
  const add = async (id) => {
    try { await api.post('/team/members', { employeeId: id }); toast.success('Added to your team'); setAdding(false); reload() } catch (err) { toast.error(err.message) }
  }

  const avg = (m) => (m.performance?.length ? (m.performance.reduce((s, p) => s + p.rating, 0) / m.performance.length).toFixed(1) : '—')

  return (
    <>
      <PageHeader title="My team" subtitle="Manage members and monitor performance">
        <button className="btn btn-primary" onClick={openAdd}>+ Add member</button>
      </PageHeader>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Employee</th><th>Department</th><th>Today</th><th>Avg. rating</th><th /></tr></thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No team members yet. Use “Add member”.</td></tr>}
              {data.data.map((m) => (
                <tr key={m._id}>
                  <td><div className="d-flex align-items-center gap-2"><span className="avatar">{initials(m.user.name)}</span><div><div className="fw-semibold">{m.user.name}</div><div className="small text-muted">{m.employeeId} · {m.designation}</div></div></div></td>
                  <td>{m.department}</td>
                  <td><StatusBadge status={m.todayStatus} /></td>
                  <td><span className="rating-star">★</span> {avg(m)}</td>
                  <td className="text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => openMember(m._id)}>View / Review</button><button className="btn btn-sm btn-outline-danger" onClick={() => remove(m)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      <Modal show={!!detail} size="modal-lg" title={detail ? detail.data.user.name : ''} onClose={() => setDetail(null)}>
        {detail && (
          <div className="row g-3">
            <div className="col-md-5">
              <dl className="row small mb-3">
                <dt className="col-5 text-muted">ID</dt><dd className="col-7">{detail.data.employeeId}</dd>
                <dt className="col-5 text-muted">Email</dt><dd className="col-7 text-break">{detail.data.user.email}</dd>
                <dt className="col-5 text-muted">Phone</dt><dd className="col-7">{detail.data.user.phone || '—'}</dd>
                <dt className="col-5 text-muted">Role</dt><dd className="col-7">{detail.data.designation}</dd>
                <dt className="col-5 text-muted">Joined</dt><dd className="col-7">{fmtDate(detail.data.dateOfJoining)}</dd>
              </dl>
              <h6>Recent leaves</h6>
              {detail.leaves.length === 0 && <div className="small text-muted">None</div>}
              {detail.leaves.map((l) => <div key={l._id} className="small d-flex justify-content-between border-top py-1"><span>{l.leaveType} · {fmtDate(l.startDate)}</span><StatusBadge status={l.status} /></div>)}
            </div>
            <div className="col-md-7">
              <h6>Add performance review</h6>
              <form onSubmit={saveReview} className="mb-3">
                <div className="row g-2">
                  <div className="col-4"><select className="form-select" value={review.rating} onChange={(e) => setReview({ ...review, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}</select></div>
                  <div className="col-8"><input className="form-control" placeholder="Period e.g. Q3 2026" value={review.period} onChange={(e) => setReview({ ...review, period: e.target.value })} /></div>
                  <div className="col-12"><textarea rows="2" className="form-control" placeholder="Feedback" maxLength={500} value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} /></div>
                </div>
                <button className="btn btn-primary btn-sm mt-2">Save review</button>
              </form>
              <h6>History</h6>
              {detail.data.performance.length === 0 && <div className="small text-muted">No reviews yet</div>}
              {[...detail.data.performance].reverse().map((p) => (
                <div key={p._id} className="border-top py-2 small">
                  <span className="rating-star">{'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}</span> <span className="text-muted">{p.period} · {fmtDate(p.createdAt)} · {p.reviewedBy?.name}</span>
                  <div>{p.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal show={adding} title="Add team member" onClose={() => setAdding(false)}>
        <ul className="list-group">
          {unassigned.length === 0 && <li className="list-group-item text-muted">Every employee already has a manager</li>}
          {unassigned.map((e) => (
            <li key={e._id} className="list-group-item d-flex justify-content-between align-items-center">
              <div><div className="fw-semibold">{e.user.name}</div><div className="small text-muted">{e.employeeId} · {e.department}</div></div>
              <button className="btn btn-sm btn-primary" onClick={() => add(e._id)}>Add</button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
