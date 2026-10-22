import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

const FEATURES = [
  { icon: '🧑‍💼', title: 'Employee records', text: 'HR keeps every employee and manager profile in one secure place.' },
  { icon: '🕒', title: 'Attendance', text: 'One-click check-in and check-out with automatic late and half-day marking.' },
  { icon: '🌴', title: 'Leave management', text: 'Apply, track balances and let managers approve or reject in seconds.' },
  { icon: '📢', title: 'Announcements', text: 'Company news and policies reach everyone instantly with notifications.' },
  { icon: '🎓', title: 'Training programmes', text: 'Managers publish trainings, teams enrol and progress is visible.' },
  { icon: '📊', title: 'Reports & analytics', text: 'Headcount, attendance trends and leave reports for HR decisions.' },
]

export default function Home() {
  const { user } = useSelector((s) => s.auth)
  return (
    <>
      <nav className="public-nav navbar py-3">
        <div className="container">
          <span className="navbar-brand fw-bold fs-4 m-0">Staff<span style={{ color: 'var(--brand)' }}>Sync</span></span>
          <div className="d-flex gap-2">
            {user ? <Link className="btn btn-primary" to="/dashboard">Go to dashboard</Link> : (
              <>
                <Link className="btn btn-outline-primary" to="/login">Login</Link>
                <Link className="btn btn-primary" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container text-center">
          <h1>Modern human resource management,<br />all in one place</h1>
          <p className="lead mt-3 mb-4 mx-auto" style={{ maxWidth: 640, opacity: 0.9 }}>
            StaffSync streamlines attendance, leaves, announcements and training for HR, managers and employees with secure role-based access.
          </p>
          <Link to={user ? '/dashboard' : '/register'} className="btn btn-light btn-lg me-2">{user ? 'Open dashboard' : 'Get started'}</Link>
          {!user && <Link to="/login" className="btn btn-outline-light btn-lg">Login</Link>}
        </div>
      </section>

      <section className="container py-5">
        <h3 className="text-center fw-bold mb-4">Everything your team needs</h3>
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div className="col-md-6 col-lg-4" key={f.title}>
              <div className="card feature-card"><div className="card-body">
                <div className="emoji mb-2">{f.icon}</div>
                <h5>{f.title}</h5>
                <p className="text-muted mb-0">{f.text}</p>
              </div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-5">
        <div className="row g-4 text-center">
          {[['HR', 'Manage people, post announcements, track attendance and view reports.'], ['Managers', 'Lead your team, approve leaves, run trainings and review performance.'], ['Employees', 'Mark attendance, apply for leave, join trainings and stay informed.']].map(([t, d]) => (
            <div className="col-md-4" key={t}><div className="card h-100"><div className="card-body"><h5 className="text-primary">{t}</h5><p className="text-muted mb-0">{d}</p></div></div></div>
          ))}
        </div>
      </section>
      <footer className="text-center text-muted py-4 border-top bg-white">© {new Date().getFullYear()} StaffSync · Human Resource Management System</footer>
    </>
  )
}
