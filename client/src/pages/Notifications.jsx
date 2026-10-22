import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import { useToast } from '../components/Toast'
import { fmtDateTime } from '../utils'

const ICON = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '❌' }

export default function Notifications() {
  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get('/notifications', { page, limit: 12, unread: unreadOnly ? 'true' : '' }), [page, unreadOnly])

  const open = async (n) => {
    if (!n.read) await api.put(`/notifications/${n._id}/read`).catch(() => {})
    if (n.link) navigate(n.link)
    else reload()
  }
  const markAll = async () => { await api.put('/notifications/read-all'); toast.success('All marked as read'); reload() }
  const remove = async (id) => { await api.del(`/notifications/${id}`); reload() }

  return (
    <>
      <PageHeader title="Notifications" subtitle={data ? `${data.unread} unread` : ''}>
        <div className="form-check form-switch pt-2"><input id="un" className="form-check-input" type="checkbox" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1) }} /><label htmlFor="un" className="form-check-label">Unread only</label></div>
        <button className="btn btn-outline-primary" onClick={markAll}>Mark all as read</button>
      </PageHeader>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><ul className="list-group list-group-flush">
          {data.data.length === 0 && <li className="list-group-item text-center text-muted py-4">You are all caught up 🎉</li>}
          {data.data.map((n) => (
            <li key={n._id} className={`list-group-item d-flex justify-content-between align-items-start ${n.read ? '' : 'notif-unread'}`}>
              <div role="button" onClick={() => open(n)} style={{ cursor: 'pointer' }}>
                <div className="fw-semibold">{ICON[n.type]} {n.title}</div>
                <div className="small">{n.message}</div>
                <div className="small text-muted">{fmtDateTime(n.createdAt)}</div>
              </div>
              <button className="btn btn-sm btn-link text-danger" onClick={() => remove(n._id)}>Delete</button>
            </li>
          ))}
        </ul></div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </>
  )
}
