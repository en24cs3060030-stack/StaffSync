// HR screen used for both Employees and Managers (same CRUD, slightly different fields)
import { useState } from 'react'
import { api } from '../api'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from './Loader'
import PageHeader from './PageHeader'
import Pagination from './Pagination'
import Modal from './Modal'
import { useToast } from './Toast'
import { DEPARTMENTS, fmtDate, initials } from '../utils'

const blank = (isEmp) => ({ name: '', email: '', phone: '', password: '', department: 'General', designation: isEmp ? 'Staff' : 'Manager', gender: '', dateOfJoining: '', manager: '', isActive: true })

export default function StaffManager({ kind }) {
  const isEmp = kind === 'employee'
  const base = isEmp ? '/employees' : '/managers'
  const label = isEmp ? 'employee' : 'manager'
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [department, setDepartment] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | profile
  const [form, setForm] = useState(blank(isEmp))
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useFetch(() => api.get(base, { page, limit: 8, search: q, department }), [page, q, department, base])
  const managers = useFetch(() => (isEmp ? api.get('/managers/all') : Promise.resolve({ data: [] })), [isEmp])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const openForm = (p) => {
    setEditing(p || 'new')
    setForm(p ? {
      name: p.user.name, email: p.user.email, phone: p.user.phone || '', password: '', department: p.department, designation: p.designation,
      gender: p.gender || '', dateOfJoining: p.dateOfJoining ? p.dateOfJoining.slice(0, 10) : '', manager: p.manager?._id || '', isActive: p.user.isActive,
    } : blank(isEmp))
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = { ...form }
      if (editing !== 'new' && !body.password) delete body.password
      if (editing === 'new') await api.post(base, body)
      else await api.put(`${base}/${editing._id}`, body)
      toast.success(`${label[0].toUpperCase() + label.slice(1)} saved`)
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.user.name}? Their attendance, leaves and notifications will be removed too.`)) return
    try { await api.del(`${base}/${p._id}`); toast.success('Deleted'); reload() } catch (err) { toast.error(err.message) }
  }

  const toggle = async (p) => {
    try { await api.put(`${base}/${p._id}`, { isActive: !p.user.isActive }); reload() } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <PageHeader title={isEmp ? 'Employees' : 'Managers'} subtitle={`Add, update and remove ${label}s`}>
        <button className="btn btn-primary" onClick={() => openForm()}>+ Add {label}</button>
      </PageHeader>

      <form className="d-flex gap-2 mb-3 flex-wrap" onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1) }}>
        <input className="form-control w-auto" placeholder="Search name, email or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select w-auto" value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1) }}>
          <option value="">All departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button className="btn btn-outline-secondary">Search</button>
      </form>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card"><div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>{isEmp ? 'Employee' : 'Manager'}</th><th>Department</th><th>Contact</th>{isEmp && <th>Reports to</th>}<th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No {label}s found</td></tr>}
              {data.data.map((p) => (
                <tr key={p._id}>
                  <td><div className="d-flex align-items-center gap-2"><span className="avatar">{initials(p.user.name)}</span><div><div className="fw-semibold">{p.user.name}</div><div className="small text-muted">{p.employeeId || p.managerId} · {p.designation}</div></div></div></td>
                  <td>{p.department}</td>
                  <td className="small">{p.user.email}<div className="text-muted">{p.user.phone}</div></td>
                  {isEmp && <td>{p.manager?.user?.name || <span className="text-muted">Unassigned</span>}</td>}
                  <td className="small">{fmtDate(p.dateOfJoining)}</td>
                  <td><div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={p.user.isActive} onChange={() => toggle(p)} /></div></td>
                  <td className="text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => openForm(p)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => remove(p)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      <Modal show={!!editing} size="modal-lg" title={editing === 'new' ? `Add ${label}` : `Edit ${label}`} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">Full name</label><input className="form-control" required value={form.name} onChange={set('name')} /></div>
            <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" required value={form.email} onChange={set('email')} /></div>
            <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
            <div className="col-md-6"><label className="form-label">{editing === 'new' ? 'Password' : 'Reset password (optional)'}</label><input type="password" className="form-control" minLength={6} required={editing === 'new'} value={form.password} onChange={set('password')} /></div>
            <div className="col-md-4"><label className="form-label">Department</label><select className="form-select" value={form.department} onChange={set('department')}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div className="col-md-4"><label className="form-label">Designation</label><input className="form-control" value={form.designation} onChange={set('designation')} /></div>
            <div className="col-md-4"><label className="form-label">Date of joining</label><input type="date" className="form-control" value={form.dateOfJoining} onChange={set('dateOfJoining')} /></div>
            <div className="col-md-4"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={set('gender')}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            {isEmp && (
              <div className="col-md-4"><label className="form-label">Manager</label>
                <select className="form-select" value={form.manager} onChange={set('manager')}>
                  <option value="">Unassigned</option>
                  {(managers.data?.data || []).map((m) => <option key={m._id} value={m._id}>{m.user?.name}</option>)}
                </select></div>
            )}
            <div className="col-md-4 d-flex align-items-end"><div className="form-check form-switch"><input id="active" type="checkbox" className="form-check-input" checked={form.isActive} onChange={set('isActive')} /><label htmlFor="active" className="form-check-label">Account active</label></div></div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Close</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
      </Modal>
    </>
  )
}
