import { useState, useEffect, useCallback } from 'react'
import { gradesAPI, enrollmentsAPI } from '../services/api'
import Modal from '../components/Modal'
import FormField, { inputStyle } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = { enrollment: '', marks: '', grade: 'B' }

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'F']

// Colour-code each grade letter
function gradeColor(g) {
  if (!g) return '#6b7280'
  if (g.startsWith('A')) return '#16a34a'
  if (g.startsWith('B')) return '#2563eb'
  if (g.startsWith('C')) return '#f59e0b'
  return '#dc2626'   // F
}

function GradeBadge({ grade }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: '50%',
      background: gradeColor(grade) + '1a',   // 10% opacity version of the colour
      color: gradeColor(grade),
      fontWeight: 700, fontSize: 13,
    }}>
      {grade || '—'}
    </span>
  )
}

export default function Grades() {
  const [grades, setGrades]           = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [totalCount, setTotalCount]   = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const { show, ToastContainer }      = useToast()

  const fetchGrades = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 15 }
      if (search) params.search = search
      const res = await gradesAPI.getAll(params)
      const data = res.data
      setGrades(data.results ?? data)
      setTotalCount(data.count ?? data.length)
      setTotalPages(Math.ceil((data.count ?? data.length) / 15))
    } catch { setError('Failed to load grades.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchGrades() }, [fetchGrades])
  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    enrollmentsAPI.getAll({ page_size: 500 })
      .then(r => setEnrollments(r.data.results ?? r.data))
  }, [])

  // Auto-suggest grade from marks
  function marksToGrade(marks) {
    const m = parseFloat(marks)
    if (isNaN(m))  return 'B'
    if (m >= 95)   return 'A+'
    if (m >= 90)   return 'A'
    if (m >= 85)   return 'A-'
    if (m >= 80)   return 'B+'
    if (m >= 75)   return 'B'
    if (m >= 70)   return 'B-'
    if (m >= 65)   return 'C+'
    if (m >= 60)   return 'C'
    return 'F'
  }

  function openAdd() {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true)
  }

  function openEdit(g) {
    setEditing(g)
    setForm({ enrollment: g.enrollment, marks: g.marks, grade: g.grade })
    setError(''); setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      editing
        ? await gradesAPI.update(editing.id, form)
        : await gradesAPI.create(form)
      setShowModal(false)
      show(editing ? 'Grade updated' : 'Grade recorded', 'success')
      fetchGrades()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object'
        ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Something went wrong.')
    } finally { setSaving(false) }
  }

  async function handleDelete(g) {
    if (!window.confirm('Delete this grade record?')) return
    try {
      await gradesAPI.delete(g.id)
      show('Grade deleted', 'info')
      fetchGrades()
    } catch { show('Could not delete.', 'error') }
  }

  // Summary stats from loaded grades
  const avg = grades.length
    ? (grades.reduce((sum, g) => sum + parseFloat(g.marks || 0), 0) / grades.length).toFixed(1)
    : '—'
  const passing = grades.filter(g => g.grade !== 'F').length
  const failing  = grades.filter(g => g.grade === 'F').length

  return (
    <div>
      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total grades',  value: totalCount, color: '#374151' },
          { label: 'Average marks', value: avg,        color: '#2563eb' },
          { label: 'Passing',       value: passing,    color: '#16a34a' },
          { label: 'Failing (F)',   value: failing,    color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 16, gap: 10, flexWrap: 'wrap',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student or course…"
          style={{ ...inputStyle, width: 260, border: '1px solid #d1d5db' }}
        />
        <button onClick={openAdd} style={{
          background: '#3b82f6', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 18px',
          fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>+ Add grade</button>
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
                  {['Student', 'Course', 'Marks', 'Grade', 'Actions'].map(h => (
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
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 0', textAlign: 'center' }}>
                      <div style={{ color: '#d1d5db', fontSize: 36, marginBottom: 8 }}>🎓</div>
                      <div style={{ color: '#9ca3af', fontSize: 14 }}>No grades recorded yet</div>
                      <button onClick={openAdd} style={{
                        marginTop: 12, background: '#3b82f6', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '8px 16px',
                        fontSize: 13, cursor: 'pointer', display: 'block', margin: '12px auto 0',
                      }}>Add first grade</button>
                    </td>
                  </tr>
                ) : grades.map(g => (
                  <tr key={g.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '11px 14px', fontWeight: 500 }}>
                      {g.student_name || `Enrollment #${g.enrollment}`}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#6b7280' }}>
                      {g.course_name || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {/* Marks bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          flex: 1, height: 6, background: '#f3f4f6',
                          borderRadius: 3, overflow: 'hidden', maxWidth: 100,
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${Math.min(100, parseFloat(g.marks) || 0)}%`,
                            background: gradeColor(g.grade),
                          }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>
                          {parseFloat(g.marks).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <GradeBadge grade={g.grade} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => openEdit(g)} style={{
                        background: 'none', border: '1px solid #d1d5db',
                        borderRadius: 6, padding: '4px 10px',
                        fontSize: 12, cursor: 'pointer', marginRight: 6,
                      }}>Edit</button>
                      <button onClick={() => handleDelete(g)} style={{
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
          title={editing ? 'Edit grade' : 'Record grade'}
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
              <FormField label="Marks (0–100)" required>
                <input
                  type="number" min={0} max={100} step="0.1"
                  style={inputStyle}
                  value={form.marks}
                  onChange={e => setForm(f => ({
                    ...f,
                    marks: e.target.value,
                    grade: marksToGrade(e.target.value),   // auto-fill grade
                  }))}
                  required
                />
              </FormField>
              <FormField label="Grade">
                <select
                  style={inputStyle}
                  value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                >
                  {GRADE_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </FormField>
            </div>
            {form.marks && (
              <p style={{ fontSize: 12, color: '#6b7280', margin: '-8px 0 16px' }}>
                Auto-suggested grade: <strong style={{ color: gradeColor(marksToGrade(form.marks)) }}>
                  {marksToGrade(form.marks)}
                </strong> — you can override it above.
              </p>
            )}
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
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Record grade'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {ToastContainer}
    </div>
  )
}