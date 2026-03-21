import { useLocation } from 'react-router-dom'

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
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'University CRM'

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
        <input
          placeholder="Search…"
          style={{
            border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '6px 12px', fontSize: 13,
            background: '#f9fafb', width: 200, outline: 'none',
          }}
        />
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#3b82f6', color: '#fff',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 600, fontSize: 13,
        }}>
          AD
        </div>
      </div>
    </header>
  )
}