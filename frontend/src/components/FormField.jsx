export default function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 12,
        fontWeight: 600, color: '#374151', marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// Shared input style — import and spread this where needed
export const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 13, outline: 'none',
  background: '#fff', color: '#111827',
}