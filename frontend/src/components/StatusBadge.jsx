const STYLES = {
  active:     { background: '#dcfce7', color: '#166534' },
  inactive:   { background: '#fef3c7', color: '#92400e' },
  graduated:  { background: '#ede9fe', color: '#5b21b6' },
  suspended:  { background: '#fee2e2', color: '#991b1b' },
  enrolled:   { background: '#dbeafe', color: '#1d4ed8' },
  dropped:    { background: '#fee2e2', color: '#991b1b' },
  completed:  { background: '#dcfce7', color: '#166534' },
  paid:       { background: '#dcfce7', color: '#166534' },
  pending:    { background: '#fef3c7', color: '#92400e' },
  overdue:    { background: '#fee2e2', color: '#991b1b' },
  waived:     { background: '#f3f4f6', color: '#6b7280' },
}

export default function StatusBadge({ status }) {
  const s = STYLES[status] || { background: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      ...s,
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 500,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}