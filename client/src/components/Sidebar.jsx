import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const COMMON_TAIL = [
  { to: '/announcements', icon: '📢', label: 'Announcements' },
  { to: '/trainings', icon: '🎓', label: 'Training' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
]

const MENUS = {
  employee: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/attendance', icon: '🕒', label: 'Attendance' },
    { to: '/leaves', icon: '🌴', label: 'My Leaves' },
    ...COMMON_TAIL,
  ],
  manager: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/team', icon: '👥', label: 'My Team' },
    { to: '/team/attendance', icon: '📋', label: 'Team Attendance' },
    { to: '/leave-requests', icon: '✅', label: 'Leave Requests' },
    { to: '/attendance', icon: '🕒', label: 'My Attendance' },
    { to: '/leaves', icon: '🌴', label: 'My Leaves' },
    ...COMMON_TAIL,
  ],
  hr: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/hr/employees', icon: '🧑‍💼', label: 'Employees' },
    { to: '/hr/managers', icon: '🧭', label: 'Managers' },
    { to: '/hr/attendance', icon: '📋', label: 'Track Attendance' },
    { to: '/leave-requests', icon: '✅', label: 'Leave Requests' },
    { to: '/hr/reports', icon: '📊', label: 'Reports & Analytics' },
    { to: '/attendance', icon: '🕒', label: 'My Attendance' },
    { to: '/leaves', icon: '🌴', label: 'My Leaves' },
    ...COMMON_TAIL,
  ],
}

export default function Sidebar({ open, onClose }) {
  const { user } = useSelector((s) => s.auth)
  return (
    <>
      {open && <div className="sidebar-backdrop d-lg-none" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">Staff<span>Sync</span></div>
        <nav className="nav flex-column" onClick={onClose}>
          {MENUS[user.role].map((m) => (
            <NavLink key={m.to} to={m.to} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="me-2">{m.icon}</span>{m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
