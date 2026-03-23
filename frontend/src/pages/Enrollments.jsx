import { useState, useEffect, useCallback } from 'react'
import { enrollmentsAPI, studentsAPI, coursesAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import FormField, { inputStyle } from '../components/FormField'

const EMPTY = { student: '', course: '', status: 'enrolled' }

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents]       = useState([])
  const [courses, setCourses]         = useState([])
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

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (search) params.search = search
      const res = await enrollmentsAPI.getAll(params)
      const data = res.data
      setEnrollments(data.results ?? data)
      setTotalCount(data.count ?? data.length)
      setTotalPages(Math.ceil((data.count ?? data.length) / 10))
    } catch { setError('Failed to load enrollments.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])
  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    studentsAPI.getAll({ page_size: 200 }).then(r => setStudents(r.data.results ?? r.data))
    coursesAPI.getAll({ page_size: 200 }).then(r => setCourses(r.data.results ?? r.data))
  }, [])

  function openAdd() {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true)
  }
  function openEdit(en) {
    setEditing(en)
    setForm({ student: en.student, course: en.course, status: en.status })
    setError(''); setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      editing ? await enrollmentsAPI.update(editing.id, form)
               : await enrollmentsAPI.create(form)
      setShowModal(false); fetchEnrollments()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object'
        ? Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(' | ')
        : 'Something went wrong.')
    } finally { setSaving(false) }
  }

  async function handleDelete(en) {
    if (!window.confirm('Remove this enrollment?')) return
    await enrollmentsAPI.delete(en.id); fetchEnrollments()
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, gap:10, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search student or course…"
          style={{ ...inputStyle, width:260, border:'1px solid #d1d5db' }} />
        <button onClick={openAdd} style={{
          background:'#3b82f6', color:'#fff', border:'none',
          borderRadius:8, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          + Enroll student
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>Loading…</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  {['Student','Course','Course code','Enrolled on','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#6b7280', textTransform:'uppercase',
                      letterSpacing:'.04em', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>
                    No enrollments yet.
                  </td></tr>
                ) : enrollments.map(en => (
                  <tr key={en.id}
                    style={{ borderBottom:'1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={{ padding:'11px 14px', fontWeight:500 }}>{en.student_name}</td>
                    <td style={{ padding:'11px 14px' }}>{en.course_name}</td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', color:'#3b82f6', fontSize:12 }}>
                      {en.course_code}
                    </td>
                    <td style={{ padding:'11px 14px', color:'#6b7280', fontSize:12 }}>
                      {en.enrolled_on
                        ? new Date(en.enrolled_on).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding:'11px 14px' }}><StatusBadge status={en.status} /></td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => openEdit(en)} style={{
                        background:'none', border:'1px solid #d1d5db', borderRadius:6,
                        padding:'4px 10px', fontSize:12, cursor:'pointer', marginRight:6 }}>Edit</button>
                      <button onClick={() => handleDelete(en)} style={{
                        background:'none', border:'1px solid #fca5a5', borderRadius:6,
                        padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#dc2626' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'12px 16px', borderTop:'1px solid #e5e7eb', fontSize:13, color:'#6b7280' }}>
            <span>Showing {(page-1)*10+1}–{Math.min(page*10,totalCount)} of {totalCount}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'5px 12px',
                  background:'#fff', cursor:page===1?'not-allowed':'pointer', opacity:page===1?0.5:1 }}>← Prev</button>
              <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'5px 12px',
                  background:'#fff', cursor:page===totalPages?'not-allowed':'pointer',
                  opacity:page===totalPages?0.5:1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit enrollment' : 'Enroll a student'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'10px 14px',
              borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}
            <FormField label="Student" required>
              <select style={inputStyle} value={form.student}
                onChange={e => setForm(f=>({...f, student:e.target.value}))} required>
                <option value="">— Select student —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
              </select>
            </FormField>
            <FormField label="Course" required>
              <select style={inputStyle} value={form.course}
                onChange={e => setForm(f=>({...f, course:e.target.value}))} required>
                <option value="">— Select course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select style={inputStyle} value={form.status}
                onChange={e => setForm(f=>({...f, status:e.target.value}))}>
                <option value="enrolled">Enrolled</option>
                <option value="dropped">Dropped</option>
                <option value="completed">Completed</option>
              </select>
            </FormField>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                background:'none', border:'1px solid #d1d5db', borderRadius:8,
                padding:'9px 20px', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                background:saving?'#93c5fd':'#3b82f6', color:'#fff', border:'none',
                borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Enroll'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}