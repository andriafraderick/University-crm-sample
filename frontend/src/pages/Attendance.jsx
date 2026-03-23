import { useState, useEffect, useCallback } from 'react'
import { attendanceAPI, enrollmentsAPI } from '../services/api'
import Modal from '../components/Modal'
import FormField, { inputStyle } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = { enrollment: '', date: '', status: 'present' }

const STATUS_STYLES = {
  present: { background: '#dcfce7', color: '#166534' },
  absent:  { background: '#fee2e2', color: '#991b1b' },
  late:    { background: '#fef3c7', color: '#92400e' },
}

function AttendanceBadge({ status }) {
  const s = STATUS_STYLES[status] || { background: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      ...s, display: 'inline-block',
      padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

export default function Attendance() {
  const [records, setRecords]         = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState('')
  const [page, setPage]               = useState(1)
  const [totalCount, setTotalCount]   = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const { show, ToastContainer }      = useToast()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 15 }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await attendanceAPI.getAll(params)
      const data = res.data
      setRecords(data.results ?? data)
      setTotalCount(data.count ?? data.length)
      setTotalPages(Math.ceil((data.count ?? data.length) / 15))
    } catch { setError('Failed to load attendance records.') }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  useEffect(() => {
    enrollmentsAPI.getAll({ page_size: 500 })
      .then(r => setEnrollments(r.data.results ?? r.data))
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] })
    setError('')
    setShowModal(true)
  }

  function openEdit(rec) {
    setEditing(rec)
    setForm({
      enrollment: rec.enrollment,
      date:       rec.date,
      status:     rec.status,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      editing
        ? await attendanceAPI.update(editing.id, form)
        : await attendanceAPI.create(form)
      setShowModal(false)
      show(editing ? 'Record updated' : 'Attendance marked', 'success')
      fetchRecords()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object'
        ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Something went wrong.')
    } finally { setSaving(false) }
  }

  async function handleDelete(rec) {
    if (!window.confirm('Delete this attendance record?')) return
    try {
      await attendanceAPI.delete(rec.id)
      show('Record deleted', 'info')
      fetchRecords()
    } catch { show('Could not delete.', 'error') }
  }

  // Quick status toggle
  async function quickMark(rec, newStatus) {
    try {
      await attendanceAPI.update(rec.id, { ...rec, status: newStatus })
      fetchRecords()
    } catch { show('Could not update status.', 'error') }
  }

  // Summary counts from current page
  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Summary strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Present',      key: 'present', color: '#16a34a' },
          { label: 'Absent',       key: 'absent',  color: '#dc2626' },
          { label: 'Late',         key: 'late',    color: '#f59e0b' },
          { label: 'Total records',key: '_total',  color: '#374151' },
        ].map(({ label, key, color }) => (
          <div key={key} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>
              {key === '_total' ? totalCount : (counts[key] || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 16, gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or course…"
            style={{ ...inputStyle, width: 240, border: '1px solid #d1d5db' }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
        <button onClick={openAdd} style={{
          background: '#3b82f6', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 18px',
          fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>
          + Mark attendance
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Student', 'Course', 'Date', 'Status', 'Quick mark', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '.04em',
                      borderBottom: '1px solid #e5e7eb',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 0', textAlign: 'center' }}>
                      <div style={{ color: '#d1d5db', fontSize: 36, marginBottom: 8 }}>📋</div>
                      <div style={{ color: '#9ca3af', fontSize: 14 }}>No attendance records yet</div>
                      <button onClick={openAdd} style={{
                        marginTop: 12, background: '#3b82f6', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '8px 16px',
                        fontSize: 13, cursor: 'pointer', display: 'block', margin: '12px auto 0',
                      }}>Mark first attendance</button>
                    </td>
                  </tr>
                ) : records.map(rec => (
                  <tr key={rec.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '11px 14px', fontWeight: 500 }}>
                      {/* enrollment serializer gives us these via source= */}
                      {rec.student_name || `Enrollment #${rec.enrollment}`}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#6b7280' }}>
                      {rec.course_name || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: 12 }}>
                      {rec.date
                        ? new Date(rec.date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <AttendanceBadge status={rec.status} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['present', 'absent', 'late'].map(s => (
                          <button
                            key={s}
                            onClick={() => quickMark(rec, s)}
                            style={{
                              padding: '3px 8px', fontSize: 11, borderRadius: 6,
                              cursor: 'pointer', fontWeight: 500,
                              border: '1px solid',
                              background: rec.status === s
                                ? STATUS_STYLES[s].background
                                : 'transparent',
                              color: rec.status === s
                                ? STATUS_STYLES[s].color
                                : '#9ca3af',
                              borderColor: rec.status === s
                                ? STATUS_STYLES[s].color
                                : '#e5e7eb',
                            }}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => openEdit(rec)} style={{
                        background: 'none', border: '1px solid #d1d5db',
                        borderRadius: 6, padding: '4px 10px',
                        fontSize: 12, cursor: 'pointer', marginRight: 6,
                      }}>Edit</button>
                      <button onClick={() => handleDelete(rec)} style={{
                        background: 'none', border: '1px solid #fca5a5',
                        borderRadius: 6, padding: '4px 10px',
                        fontSize: 12, cursor: 'pointer', color: '#dc2626',
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid #e5e7eb',
            fontSize: 13, color: '#6b7280',
          }}>
            <span>Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, totalCount)} of {totalCount}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px',
                  background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px',
                  background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit attendance' : 'Mark attendance'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave}>
            {error && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
                borderRadius: 8, fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}
            <FormField label="Enrollment" required>
              <select
                style={inputStyle}
                value={form.enrollment}
                onChange={e => setForm(f => ({ ...f, enrollment: e.target.value }))}
                required
              >
                <option value="">— Select enrollment —</option>
                {enrollments.map(en => (
                  <option key={en.id} value={en.id}>
                    {en.student_name} → {en.course_code}
                  </option>
                ))}
              </select>
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Date" required>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Status">
                <select
                  style={inputStyle}
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </FormField>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                background: 'none', border: '1px solid #d1d5db', borderRadius: 8,
                padding: '9px 20px', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                background: saving ? '#93c5fd' : '#3b82f6', color: '#fff',
                border: 'none', borderRadius: 8, padding: '9px 20px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Mark attendance'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {ToastContainer}
    </div>
  )
}