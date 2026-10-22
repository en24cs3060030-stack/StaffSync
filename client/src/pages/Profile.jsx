import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { api } from '../api'
import { setUser } from '../store/authSlice'
import useFetch from '../hooks/useFetch'
import Loader, { ErrorBox } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { fmtDate, initials, ROLE_LABEL } from '../utils'

function ProfileForm({ initial, onSaved }) {
  const { user, profile } = initial
  const dispatch = useDispatch()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: profile?.address || '',
    gender: profile?.gender || '',
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
    ecName: profile?.emergencyContact?.name || '',
    ecPhone: profile?.emergencyContact?.phone || '',
    ecRelation: profile?.emergencyContact?.relation || '',
    skills: (profile?.skills || []).join(', '),
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = {
        name: form.name, phone: form.phone,
        ...(profile ? {
          address: form.address, gender: form.gender, dateOfBirth: form.dateOfBirth,
          emergencyContact: { name: form.ecName, phone: form.ecPhone, relation: form.ecRelation },
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        } : {}),
      }
      const res = await api.put('/profile', body)
      dispatch(setUser({ name: res.user.name, phone: res.user.phone }))
      toast.success('Profile updated')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="card mb-3"><div className="card-body">
      <h5 className="mb-3">Personal information</h5>
      <div className="row g-3">
        <div className="col-md-6"><label className="form-label">Full name</label><input className="form-control" required value={form.name} onChange={set('name')} /></div>
        <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
        {profile && (
          <>
            <div className="col-md-6"><label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={set('gender')}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div className="col-md-6"><label className="form-label">Date of birth</label><input type="date" className="form-control" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></div>
            <div className="col-12"><label className="form-label">Address</label><textarea rows="2" className="form-control" value={form.address} onChange={set('address')} /></div>
            <div className="col-md-4"><label className="form-label">Emergency contact</label><input className="form-control" placeholder="Name" value={form.ecName} onChange={set('ecName')} /></div>
            <div className="col-md-4"><label className="form-label">Contact phone</label><input className="form-control" value={form.ecPhone} onChange={set('ecPhone')} /></div>
            <div className="col-md-4"><label className="form-label">Relation</label><input className="form-control" value={form.ecRelation} onChange={set('ecRelation')} /></div>
            <div className="col-12"><label className="form-label">Skills <span className="text-muted small">(comma separated)</span></label><input className="form-control" value={form.skills} onChange={set('skills')} /></div>
          </>
        )}
      </div>
      <button className="btn btn-primary mt-3" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </div></form>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const submit = async (e) => {
    e.preventDefault()
    if (f.newPassword !== f.confirm) return toast.error('New passwords do not match')
    try {
      await api.put('/auth/password', { currentPassword: f.currentPassword, newPassword: f.newPassword })
      toast.success('Password changed')
      setF({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.message)
    }
  }
  return (
    <form onSubmit={submit} className="card"><div className="card-body">
      <h5 className="mb-3">Change password</h5>
      <div className="row g-3">
        <div className="col-md-4"><input type="password" className="form-control" placeholder="Current password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></div>
        <div className="col-md-4"><input type="password" className="form-control" placeholder="New password" required minLength={6} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></div>
        <div className="col-md-4"><input type="password" className="form-control" placeholder="Confirm new password" required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></div>
      </div>
      <button className="btn btn-outline-primary mt-3">Update password</button>
    </div></form>
  )
}

export default function Profile() {
  const { data, loading, error, reload } = useFetch(() => api.get('/profile'))
  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const { user, profile } = data
  const staffId = profile?.employeeId || profile?.managerId

  return (
    <>
      <PageHeader title="My profile" subtitle="View and update your personal details" />
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card mb-3"><div className="card-body text-center">
            <span className="avatar avatar-lg mb-3">{initials(user.name)}</span>
            <h5 className="mb-0">{user.name}</h5>
            <div className="text-muted">{profile?.designation || ROLE_LABEL[user.role]}</div>
            <hr />
            <dl className="row text-start small mb-0">
              <dt className="col-5 text-muted">Role</dt><dd className="col-7">{ROLE_LABEL[user.role]}</dd>
              {staffId && <><dt className="col-5 text-muted">ID</dt><dd className="col-7">{staffId}</dd></>}
              <dt className="col-5 text-muted">Email</dt><dd className="col-7 text-break">{user.email}</dd>
              {profile && <><dt className="col-5 text-muted">Department</dt><dd className="col-7">{profile.department}</dd>
                <dt className="col-5 text-muted">Joined</dt><dd className="col-7">{fmtDate(profile.dateOfJoining)}</dd></>}
              {profile?.manager && <><dt className="col-5 text-muted">Manager</dt><dd className="col-7">{profile.manager.user?.name}</dd></>}
            </dl>
            <div className="small text-muted mt-2">Job details are managed by HR.</div>
          </div></div>

          {profile?.performance && (
            <div className="card"><div className="card-body">
              <h6>Performance reviews</h6>
              {profile.performance.length === 0 && <div className="text-muted small">No reviews yet</div>}
              {[...profile.performance].reverse().map((p) => (
                <div key={p._id} className="border-top pt-2 mt-2">
                  <div className="rating-star">{'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)} <span className="text-muted small">{p.period}</span></div>
                  <div className="small">{p.comment || '—'}</div>
                  <div className="small text-muted">{fmtDate(p.createdAt)}</div>
                </div>
              ))}
            </div></div>
          )}
        </div>
        <div className="col-lg-8">
          <ProfileForm key={user.name + (user.phone || '')} initial={data} onSaved={reload} />
          <PasswordForm />
        </div>
      </div>
    </>
  )
}
