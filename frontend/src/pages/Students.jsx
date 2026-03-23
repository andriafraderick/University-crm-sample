import { useState, useEffect, useCallback } from 'react'
import { studentsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import FormField, { inputStyle } from '../components/FormField'
import { useToast } from '../components/Toast' 

// ─── helpers ───────────────────────────────────────────────
const EMPTY_FORM = {
  student_id: '', name: '', email: '',
  phone: '', date_of_birth: '', address: '', status: 'active',
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: '50%',
      background: '#dbeafe', color: '#1d4ed8',
      fontSize: 11, fontWeight: 700, marginRight: 10, flexShrink: 0,
    }}>
      {initials(name || '?')}
    </span>
  )
}

// ─── stat card ─────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || '#111827' }}>{value}</div>
    </div>
  )
}

// ─── main page ─────────────────────────────────────────────
export default function Students() {
  const [students, setStudents]   = useState([])
  const [stats, setStats]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)   // null = add, object = edit
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const { show, ToastContainer } = useToast()

  // ── fetch list ──
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await studentsAPI.getAll(params)
      const data = res.data
      // DRF pagination wraps results in { count, results }
      setStudents(data.results ?? data)
      setTotalCount(data.count ?? data.length)
      setTotalPages(Math.ceil((data.count ?? data.length) / 10))
    } catch {
      setError('Failed to load students.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  // ── fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await studentsAPI.stats()
      setStats(res.data)
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchStats() },   [fetchStats])

  // Reset to page 1 when search/filter changes
  useEffect(() => { setPage(1) }, [search, statusFilter])

  // ── open modal ──
  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  function openEdit(student) {
    setEditing(student)
    setForm({
      student_id:    student.student_id,
      name:          student.name,
      email:         student.email,
      phone:         student.phone         || '',
      date_of_birth: student.date_of_birth || '',
      address:       student.address       || '',
      status:        student.status,
    })
    setError('')
    setShowModal(true)
  }

  // ── save (create or update) ──
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await studentsAPI.update(editing.id, form)
      } else {
        await studentsAPI.create(form)
      }
      setShowModal(false)
      fetchStudents()
      fetchStats()
    } catch (err) {
      const detail = err.response?.data
      setError(typeof detail === 'object'
        ? Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // ── delete ──
  async function handleDelete(student) {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return
    try {
      await studentsAPI.delete(student.id)
      fetchStudents()
      fetchStats()
    } catch {
      alert('Could not delete this student.')
    }
  }

  // ── render ──
  return (
    <div>
      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        <StatCard label="Total students" value={stats.total      ?? '—'} />
        <StatCard label="Active"         value={stats.active     ?? '—'} color="#16a34a" />
        <StatCard label="Graduated"      value={stats.graduated  ?? '—'} color="#7c3aed" />
        <StatCard label="Inactive / Other"
          value={(stats.total && stats.active && stats.graduated)
            ? stats.total - stats.active - stats.graduated
            : '—'}
          color="#dc2626"
        />
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, ID, email…"
            style={{
              ...inputStyle, width: 240,
              border: '1px solid #d1d5db',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            style={{ ...inputStyle, width: 150 }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '9px 18px', fontWeight: 600,
            fontSize: 13, cursor: 'pointer',
          }}
        >
          + Add student
        </button>
      </div>

      {/* Table card */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            Loading…
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            No students found.{' '}
            <button
              onClick={openAdd}
              style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Add the first one.
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Student', 'ID', 'Email', 'Phone', 'Status', 'Enrolled', 'Actions'].map(h => (
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
                {students.map(s => (
                  <tr key={s.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar name={s.name} />
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: 12 }}>
                      {s.student_id}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#374151' }}>{s.email}</td>
                    <td style={{ padding: '11px 14px', color: '#6b7280' }}>{s.phone || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: 12 }}>
                      {s.enrolled_date
                        ? new Date(s.enrolled_date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => openEdit(s)}
                        style={{
                          background: 'none', border: '1px solid #d1d5db',
                          borderRadius: 6, padding: '4px 10px',
                          fontSize: 12, cursor: 'pointer', marginRight: 6,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        style={{
                          background: 'none', border: '1px solid #fca5a5',
                          borderRadius: 6, padding: '4px 10px',
                          fontSize: 12, cursor: 'pointer', color: '#dc2626',
                        }}
                      >
                        Delete
                      </button>
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
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid #e5e7eb',
            fontSize: 13, color: '#6b7280',
          }}>
            <span>
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalCount)} of {totalCount} students
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  border: '1px solid #e5e7eb', borderRadius: 6,
                  padding: '5px 12px', background: '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{
                    border: '1px solid',
                    borderColor: page === n ? '#3b82f6' : '#e5e7eb',
                    borderRadius: 6, padding: '5px 10px',
                    background: page === n ? '#3b82f6' : '#fff',
                    color: page === n ? '#fff' : '#374151',
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  border: '1px solid #e5e7eb', borderRadius: 6,
                  padding: '5px 12px', background: '#fff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? `Edit — ${editing.name}` : 'Add new student'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave}>
            {error && (
              <div style={{
                background: '#fee2e2', color: '#991b1b',
                padding: '10px 14px', borderRadius: 8,
                fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Full name" required>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </FormField>

              <FormField label="Student ID" required>
                <input
                  style={inputStyle}
                  value={form.student_id}
                  onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  required
                />
              </FormField>

              <FormField label="Email" required>
                <input
                  type="email"
                  style={inputStyle}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </FormField>

              <FormField label="Phone">
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </FormField>

              <FormField label="Date of birth">
                <input
                  type="date"
                  style={inputStyle}
                  value={form.date_of_birth}
                  onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                />
              </FormField>

              <FormField label="Status">
                <select
                  style={inputStyle}
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                </select>
              </FormField>
            </div>

            <FormField label="Address">
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </FormField>

            {/* Buttons */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              gap: 10, marginTop: 8,
            }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: '1px solid #d1d5db',
                  borderRadius: 8, padding: '9px 20px',
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saving ? '#93c5fd' : '#3b82f6',
                  color: '#fff', border: 'none',
                  borderRadius: 8, padding: '9px 20px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add student'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {ToastContainer}
    </div>
  )
}