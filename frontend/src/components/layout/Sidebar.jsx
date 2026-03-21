import { NavLink } from 'react-router-dom'

const NAV = [
  { group: 'Main',    items: [{ label: 'Dashboard',   to: '/' }] },
  { group: 'CRM',     items: [{ label: 'Students',    to: '/students' }] },
  { group: 'ERP',     items: [
      { label: 'Courses',     to: '/courses' },
      { label: 'Enrollments', to: '/enrollments' },
      { label: 'Attendance',  to: '/attendance' },
      { label: 'Grades',      to: '/grades' },
  ]},
  { group: 'Finance', items: [{ label: 'Fees', to: '/fees' }] },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 220, minWidth: 220,
      background: '#1a1d23',
      height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #2d3139',
        color: '#fff', fontWeight: 600, fontSize: 15,
      }}>
        🎓 UniCRM
      </div>

      {/* Nav groups */}
      {NAV.map(({ group, items }) => (
        <div key={group}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
            color: '#6b7280', textTransform: 'uppercase',
            padding: '14px 20px 4px',
          }}>
            {group}
          </p>
          {items.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 20px', fontSize: 13,
                color: isActive ? '#fff' : '#9ca3af',
                background: isActive ? '#3b82f6' : 'transparent',
                textDecoration: 'none',
                borderRadius: 6, margin: '1px 8px',
                transition: 'all 0.15s',
              })}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'currentColor', flexShrink: 0,
              }} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  )
}