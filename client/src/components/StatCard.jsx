export default function StatCard({ icon, label, value, color = 'primary', sub }) {
  return (
    <div className="card stat-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`stat-icon bg-${color}-subtle text-${color}`}>{icon}</div>
        <div>
          <div className="stat-value">{value ?? '—'}</div>
          <div className="text-muted small">{label}</div>
          {sub && <div className="small text-muted">{sub}</div>}
        </div>
      </div>
    </div>
  )
}
