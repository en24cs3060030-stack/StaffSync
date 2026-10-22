// Top bar: page toggle for mobile, notification bell, user menu
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '../api'
import { logout } from '../store/authSlice'
import { initials, ROLE_LABEL } from '../utils'

export default function Navbar({ onMenu }) {
  const { user } = useSelector((s) => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  // poll the unread count once a minute
  useEffect(() => {
    let active = true
    const load = () => api.get('/notifications/unread-count').then((d) => active && setUnread(d.unread)).catch(() => {})
    load()
    const t = setInterval(load, 60000)
    return () => { active = false; clearInterval(t) }
  }, [])

  const doLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="topbar">
      <button className="btn btn-light d-lg-none" onClick={onMenu} aria-label="Menu">☰</button>
      <div className="ms-auto d-flex align-items-center gap-3">
        <Link to="/notifications" className="position-relative text-decoration-none fs-5" title="Notifications">
          🔔
          {unread > 0 && <span className="badge rounded-pill text-bg-danger position-absolute top-0 start-100 translate-middle">{unread > 99 ? '99+' : unread}</span>}
        </Link>
        <div className="position-relative">
          <button className="btn btn-light d-flex align-items-center gap-2" onClick={() => setOpen(!open)}>
            <span className="avatar">{initials(user.name)}</span>
            <span className="d-none d-md-block text-start lh-sm">
              <span className="d-block fw-semibold small">{user.name}</span>
              <span className="d-block text-muted" style={{ fontSize: 11 }}>{ROLE_LABEL[user.role]}</span>
            </span>
          </button>
          {open && (
            <div className="dropdown-menu dropdown-menu-end show" onClick={() => setOpen(false)}>
              <Link className="dropdown-item" to="/profile">My profile</Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item text-danger" onClick={doLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
