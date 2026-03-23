export default function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid #e5e7eb`,
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}