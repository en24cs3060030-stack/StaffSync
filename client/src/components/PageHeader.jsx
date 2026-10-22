export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
      <div>
        <h3 className="mb-0 fw-bold">{title}</h3>
        {subtitle && <div className="text-muted">{subtitle}</div>}
      </div>
      <div className="d-flex gap-2 flex-wrap">{children}</div>
    </div>
  )
}
