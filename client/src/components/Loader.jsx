export default function Loader({ text = 'Loading…' }) {
  return (
    <div className="center-msg">
      <div className="spinner-border spinner-border-sm me-2" /> {text}
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center">
      <span>{message}</span>
      {onRetry && <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>Retry</button>}
    </div>
  )
}
