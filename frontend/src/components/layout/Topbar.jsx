import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TITLES = {
  '/':            'Dashboard',
  '/students':    'Students',
  '/courses':     'Courses',
  '/enrollments': 'Enrollments',
  '/attendance':  'Attendance',
  '/grades':      'Grades',
  '/fees':        'Fees',
}

export default function Topbar() {
  const { pathname }    = useLocation()
  const { user, logout } = useAuth()
  const navigate        = useNavigate()
  const title           = TITLES[pathname] || 'University CRM'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Initials from username
  const initials = (user?.username || 'AD')
    .split(/[\s._-]/).map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header style={{
      height: 56, background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Username label */}
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {user?.username}
        </span>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#3b82f6', color: '#fff',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 600, fontSize: 13,
        }}>
          {initials}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '5px 12px',
            fontSize: 12, color: '#6b7280', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}