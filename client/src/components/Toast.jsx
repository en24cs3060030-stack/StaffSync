import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setItems((list) => [...list, { id, type, message }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

  const toast = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('danger', m), info: (m) => push('primary', m) }), [push])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className={`alert alert-${t.type} shadow-sm py-2 px-3 mb-2`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
