import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { register } from '../store/authSlice'
import { useToast } from '../components/Toast'
import { DEPARTMENTS } from '../utils'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: 'General', password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    setBusy(true)
    try {
      const { confirm, ...body } = form // eslint-disable-line no-unused-vars
      await dispatch(register(body)).unwrap()
      toast.success('Welcome to StaffSync!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card"><div className="card-body p-4">
        <Link to="/" className="text-decoration-none"><h3 className="fw-bold mb-1">Staff<span style={{ color: 'var(--brand)' }}>Sync</span></h3></Link>
        <p className="text-muted">Create your employee account</p>
        <form onSubmit={submit}>
          <div className="mb-3"><label className="form-label">Full name</label><input className="form-control" required value={form.name} onChange={set('name')} /></div>
          <div className="mb-3"><label className="form-label">Email</label><input type="email" className="form-control" required value={form.email} onChange={set('email')} /></div>
          <div className="row">
            <div className="col-6 mb-3"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
            <div className="col-6 mb-3"><label className="form-label">Department</label>
              <select className="form-select" value={form.department} onChange={set('department')}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          </div>
          <div className="row">
            <div className="col-6 mb-3"><label className="form-label">Password</label><input type="password" className="form-control" required value={form.password} onChange={set('password')} /></div>
            <div className="col-6 mb-3"><label className="form-label">Confirm</label><input type="password" className="form-control" required value={form.confirm} onChange={set('confirm')} /></div>
          </div>
          <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        </form>
        <div className="text-center mt-3">Already registered? <Link to="/login">Login</Link></div>
      </div></div>
    </div>
  )
}
