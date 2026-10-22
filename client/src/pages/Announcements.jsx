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
import { CATEGORIES, fmtDateTime } from '../utils'

const EMPTY = { title: '', content: '', category: 'General', isPinned: false }

export default function Announcements() {
  const { user } = useSelector((s) => s.auth)
  const isHR = user.role === 'hr'
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | announcement
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useFetch(() => api.get('/announcements', { page, limit: 6, category, search: q }), [page, category, q])

  const openForm = (a) => {
    setEditing(a || 'new')
    setForm(a ? { title: a.title, content: a.content, category: a.category, isPinned: a.isPinned } : EMPTY)
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editing === 'new') await api.post('/announcements', form)
      else await api.put(`/announcements/${editing._id}`, form)
      toast.success('Announcement saved')
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return
    try { await api.del(`/announcements/${a._id}`); toast.success('Announcement deleted'); reload() } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <PageHeader title="Announcements" subtitle="Company news, policies and events">
        {isHR && <button className="btn btn-primary" onClick={() => openForm()}>+ New announcement</button>}
      </PageHeader>

      <form className="d-flex gap-2 mb-3 flex-wrap" onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1) }}>
        <input className="form-control w-auto" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
          <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn btn-outline-secondary">Search</button>
      </form>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="row g-3">
          {data.data.length === 0 && <div className="text-center text-muted py-5">No announcements found</div>}
          {data.data.map((a) => (
            <div className="col-lg-6" key={a._id}>
              <div className="card h-100"><div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="mb-1">{a.isPinned && '📌 '}{a.title}</h5>
                  <StatusBadge status={a.category} />
                </div>
                <div className="small text-muted mb-2">{fmtDateTime(a.createdAt)} · {a.postedBy?.name}</div>
                <p style={{ whiteSpace: 'pre-wrap' }} className="mb-2">{a.content}</p>
                {isHR && <div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => openForm(a)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => remove(a)}>Delete</button></div>}
              </div></div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      <Modal show={!!editing} title={editing === 'new' ? 'New announcement' : 'Edit announcement'} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <div className="mb-3"><label className="form-label">Title</label><input className="form-control" required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="mb-3"><label className="form-label">Content</label><textarea rows="5" className="form-control" required maxLength={3000} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div className="row align-items-center">
            <div className="col-6 mb-3"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="col-6 mb-3 form-check pt-4 ps-5"><input id="pin" type="checkbox" className="form-check-input" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /><label htmlFor="pin" className="form-check-label">Pin to top</label></div>
          </div>
          <div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Close</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
      </Modal>
    </>
  )
}
