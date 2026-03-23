import { useState, useEffect } from 'react'

const STYLES = {
  success: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  error:   { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  info:    { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' },
}

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 10, fontSize: 13,
      fontWeight: 500, maxWidth: 340,
      display: 'flex', alignItems: 'center', gap: 10,
      ...STYLES[type],
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 16, color: 'inherit', opacity: 0.6,
        lineHeight: 1, padding: 0,
      }}>×</button>
    </div>
  )
}

// Simple hook: const { show, ToastContainer } = useToast()
export function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => setToast({ message, type })
  const ToastContainer = toast
    ? <Toast {...toast} onClose={() => setToast(null)} />
    : null
  return { show, ToastContainer }
}