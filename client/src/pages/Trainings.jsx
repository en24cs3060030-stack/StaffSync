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
import { fmtDateTime, toLocalInput } from '../utils'

const EMPTY = { title: '', description: '', trainer: '', mode: 'Online', location: '', startDate: '', endDate: '', capacity: 30 }

// Employees browse + enrol. Managers and HR also create, edit, delete and assign people.
export default function Trainings() {
  const { user } = useSelector((s) => s.auth)
  const canManage = user.role === 'manager' || user.role === 'hr'
  const toast = useToast()
  const [tab, setTab] = useState('all') // all | enrolled | mine
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // null | 'new' | training
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [participants, setParticipants] = useState(null) // training details for the participants modal
  const [candidates, setCandidates] = useState([])
  const [picked, setPicked] = useState([])

  const { data, loading, error, reload } = useFetch(
    () => api.get('/trainings', { page, limit: 6, status, enrolled: tab === 'enrolled' ? 'true' : '', mine: tab === 'mine' ? 'true' : '' }),
    [page, status, tab],
  )

  const openForm = (t) => {
    setEditing(t || 'new')
    setForm(t ? { title: t.title, description: t.description || '', trainer: t.trainer || '', mode: t.mode, location: t.location || '', startDate: toLocalInput(t.startDate), endDate: toLocalInput(t.endDate), capacity: t.capacity } : EMPTY)
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editing === 'new') await api.post('/trainings', form)
      else await api.put(`/trainings/${editing._id}`, form)
      toast.success('Training saved')
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const act = async (fn, okMsg) => {
    try { await fn(); toast.success(okMsg); reload() } catch (err) { toast.error(err.message) }
  }

  const remove = (t) => window.confirm(`Delete "${t.title}"?`) && act(() => api.del(`/trainings/${t._id}`), 'Training deleted')

  const openParticipants = async (t) => {
    try {
      const [detail, people] = await Promise.all([
        api.get(`/trainings/${t._id}`),
        user.role === 'manager' ? api.get('/team') : api.get('/employees/all'),
      ])
      setParticipants(detail.data)
      setCandidates(people.data.map((p) => ({ id: p.user._id, name: p.user.name })))
      setPicked([])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const assign = async () => {
    try {
      const res = await api.post(`/trainings/${participants._id}/assign`, { userIds: picked })
      toast.success(res.message)
      setParticipants(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const canEdit = (t) => user.role === 'hr' || t.createdBy?._id === user._id
  const enrolledIds = (participants?.enrolled || []).map((p) => p._id)
  const freeCandidates = candidates.filter((c) => !enrolledIds.includes(c.id))

  const tabs = [['all', 'All trainings'], ['enrolled', 'My enrolments'], ...(user.role === 'manager' ? [['mine', 'Created by me']] : [])]

  return (
    <>
      <PageHeader title="Training & development" subtitle="Learning programmes for your growth">
        {canManage && <button className="btn btn-primary" onClick={() => openForm()}>+ New training</button>}
      </PageHeader>

      <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
        <ul className="nav nav-pills">
          {tabs.map(([k, l]) => <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); setPage(1) }}>{l}</button></li>)}
        </ul>
        <select className="form-select w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Any status</option><option>Upcoming</option><option>Ongoing</option><option>Completed</option>
        </select>
      </div>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="row g-3">
          {data.data.length === 0 && <div className="text-center text-muted py-5">No trainings found</div>}
          {data.data.map((t) => (
            <div className="col-lg-6" key={t._id}>
              <div className="card h-100"><div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="mb-1">{t.title}</h5><StatusBadge status={t.status} />
                </div>
                <div className="small text-muted mb-2">by {t.trainer || t.createdBy?.name} · {t.mode}{t.location && ` · ${t.location}`}</div>
                {t.description && <p className="mb-2">{t.description}</p>}
                <div className="small mb-3">🗓 {fmtDateTime(t.startDate)} → {fmtDateTime(t.endDate)}<br />👥 {t.enrolledCount} / {t.capacity} enrolled</div>
                <div className="mt-auto d-flex gap-2 flex-wrap">
                  {t.status !== 'Completed' && (t.isEnrolled
                    ? <button className="btn btn-sm btn-outline-secondary" onClick={() => act(() => api.post(`/trainings/${t._id}/unenroll`), 'You left the training')}>Leave</button>
                    : <button className="btn btn-sm btn-primary" disabled={t.enrolledCount >= t.capacity} onClick={() => act(() => api.post(`/trainings/${t._id}/enroll`), 'Enrolled successfully')}>{t.enrolledCount >= t.capacity ? 'Full' : 'Enrol'}</button>)}
                  {t.isEnrolled && <span className="badge text-bg-success align-self-center">Enrolled</span>}
                  {canManage && <button className="btn btn-sm btn-outline-primary" onClick={() => openParticipants(t)}>Participants</button>}
                  {canManage && canEdit(t) && <button className="btn btn-sm btn-outline-secondary" onClick={() => openForm(t)}>Edit</button>}
                  {canManage && canEdit(t) && <button className="btn btn-sm btn-outline-danger" onClick={() => remove(t)}>Delete</button>}
                </div>
              </div></div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      <Modal show={!!editing} title={editing === 'new' ? 'New training' : 'Edit training'} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <div className="mb-3"><label className="form-label">Title</label><input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="mb-3"><label className="form-label">Description</label><textarea rows="3" className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="row">
            <div className="col-md-6 mb-3"><label className="form-label">Trainer</label><input className="form-control" value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></div>
            <div className="col-md-6 mb-3"><label className="form-label">Mode</label><select className="form-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>Online</option><option>Offline</option><option>Hybrid</option></select></div>
            <div className="col-md-8 mb-3"><label className="form-label">Location / meeting link</label><input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="col-md-4 mb-3"><label className="form-label">Capacity</label><input type="number" min="1" className="form-control" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div className="col-md-6 mb-3"><label className="form-label">Starts</label><input type="datetime-local" className="form-control" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="col-md-6 mb-3"><label className="form-label">Ends</label><input type="datetime-local" className="form-control" required min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Close</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
      </Modal>

      <Modal show={!!participants} title={participants ? `Participants · ${participants.title}` : ''} onClose={() => setParticipants(null)}
        footer={<><button className="btn btn-light" onClick={() => setParticipants(null)}>Close</button><button className="btn btn-primary" disabled={!picked.length} onClick={assign}>Enrol selected ({picked.length})</button></>}>
        {participants && (
          <>
            <h6>Enrolled ({participants.enrolled.length} / {participants.capacity})</h6>
            <ul className="list-group mb-3">
              {participants.enrolled.length === 0 && <li className="list-group-item text-muted">Nobody yet</li>}
              {participants.enrolled.map((p) => <li key={p._id} className="list-group-item small">{p.name} <span className="text-muted">· {p.email}</span></li>)}
            </ul>
            <h6>{user.role === 'manager' ? 'Add team members' : 'Add employees'}</h6>
            {freeCandidates.length === 0 && <div className="text-muted small">No one left to add</div>}
            {freeCandidates.map((c) => (
              <div className="form-check" key={c.id}>
                <input id={`c${c.id}`} type="checkbox" className="form-check-input" checked={picked.includes(c.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))} />
                <label htmlFor={`c${c.id}`} className="form-check-label">{c.name}</label>
              </div>
            ))}
          </>
        )}
      </Modal>
    </>
  )
}
