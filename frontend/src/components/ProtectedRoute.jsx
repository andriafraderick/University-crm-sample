import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Still checking localStorage on first render — show nothing
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af', fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  // No user → redirect to login
  if (!user) return <Navigate to="/login" replace />

  return children
}