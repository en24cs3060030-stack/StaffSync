import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { login } from '../store/authSlice'
import { useToast } from '../components/Toast'

// quick-fill buttons for the accounts created by `npm run seed`
const DEMO = [
  { label: 'HR', email: 'hr@staffsync.com', password: 'Hr@12345' },
  { label: 'Manager', email: 'manager@staffsync.com', password: 'Manager@123' },
  { label: 'Employee', email: 'employee1@staffsync.com', password: 'Employee@123' },
]

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await dispatch(login(form)).unwrap()
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card"><div className="card-body p-4">
        <Link to="/" className="text-decoration-none"><h3 className="fw-bold mb-1">Staff<span style={{ color: 'var(--brand)' }}>Sync</span></h3></Link>
        <p className="text-muted">Sign in to your account</p>
        <form onSubmit={submit}>
          <div className="mb-3"><label className="form-label">Email</label>
            <input type="email" className="form-control" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="mb-3"><label className="form-label">Password</label>
            <input type="password" className="form-control" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        </form>
        <div className="text-center mt-3">New employee? <Link to="/register">Create an account</Link></div>
        <hr />
        <div className="small text-muted mb-2">Demo accounts (after <code>npm run seed</code>):</div>
        <div className="d-flex gap-2">
          {DEMO.map((d) => <button key={d.label} type="button" className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => setForm({ email: d.email, password: d.password })}>{d.label}</button>)}
        </div>
      </div></div>
    </div>
  )
}
