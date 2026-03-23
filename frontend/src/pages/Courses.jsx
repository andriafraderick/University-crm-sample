import { useState, useEffect, useCallback } from 'react'
import { coursesAPI, departmentsAPI } from '../services/api'
import Modal from '../components/Modal'
import FormField, { inputStyle } from '../components/FormField'

const EMPTY = {
  code: '', name: '', department: '', faculty: '',
  credits: 3, semester: 'fall', year: new Date().getFullYear(),
}

export default function Courses() {
  const [courses, setCourses]         = useState([])
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty]         = useState([])
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

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (search) params.search = search
      const res = await coursesAPI.getAll(params)
      const data = res.data
      setCourses(data.results ?? data)
      setTotalCount(data.count ?? data.length)
      setTotalPages(Math.ceil((data.count ?? data.length) / 10))
    } catch { setError('Failed to load courses.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchCourses() }, [fetchCourses])
  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    departmentsAPI.getAll().then(r => setDepartments(r.data.results ?? r.data))
    import('../services/api').then(({ default: api }) =>
      api.get('/faculty/').then(r => setFaculty(r.data.results ?? r.data))
    )
  }, [])

  function openAdd() {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true)
  }
  function openEdit(c) {
    setEditing(c)
    setForm({
      code: c.code, name: c.name,
      department: c.department ?? '', faculty: c.faculty ?? '',
      credits: c.credits, semester: c.semester, year: c.year,
    })
    setError(''); setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      editing ? await coursesAPI.update(editing.id, form)
               : await coursesAPI.create(form)
      setShowModal(false); fetchCourses()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object'
        ? Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(' | ')
        : 'Something went wrong.')
    } finally { setSaving(false) }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete "${c.name}"?`)) return
    await coursesAPI.delete(c.id); fetchCourses()
  }

  const SEMESTER_BADGE = {
    fall:   { background: '#fef3c7', color: '#92400e' },
    spring: { background: '#d1fae5', color: '#065f46' },
    summer: { background: '#dbeafe', color: '#1e40af' },
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, gap:10, flexWrap:'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search course code or name…"
          style={{ ...inputStyle, width:260, border:'1px solid #d1d5db' }}
        />
        <button onClick={openAdd} style={{
          background:'#3b82f6', color:'#fff', border:'none',
          borderRadius:8, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer',
        }}>+ Add course</button>
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
                  {['Code','Course name','Department','Faculty','Credits','Semester','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#6b7280', textTransform:'uppercase',
                      letterSpacing:'.04em', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>
                    No courses yet. <button onClick={openAdd}
                      style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer' }}>
                      Add one.
                    </button>
                  </td></tr>
                ) : courses.map(c => (
                  <tr key={c.id}
                    style={{ borderBottom:'1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={{ padding:'11px 14px', fontWeight:600, color:'#3b82f6', fontFamily:'monospace' }}>{c.code}</td>
                    <td style={{ padding:'11px 14px', fontWeight:500 }}>{c.name}</td>
                    <td style={{ padding:'11px 14px', color:'#6b7280' }}>{c.department_name || '—'}</td>
                    <td style={{ padding:'11px 14px', color:'#6b7280' }}>{c.faculty_name || '—'}</td>
                    <td style={{ padding:'11px 14px', textAlign:'center' }}>
                      <span style={{ background:'#f3f4f6', borderRadius:20, padding:'2px 10px', fontSize:12 }}>
                        {c.credits} cr
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{
                        ...(SEMESTER_BADGE[c.semester] || {}),
                        borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:500,
                        textTransform:'capitalize',
                      }}>{c.semester} {c.year}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => openEdit(c)} style={{
                        background:'none', border:'1px solid #d1d5db',
                        borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer', marginRight:6,
                      }}>Edit</button>
                      <button onClick={() => handleDelete(c)} style={{
                        background:'none', border:'1px solid #fca5a5',
                        borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#dc2626',
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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'12px 16px', borderTop:'1px solid #e5e7eb', fontSize:13, color:'#6b7280' }}>
            <span>Showing {(page-1)*10+1}–{Math.min(page*10, totalCount)} of {totalCount}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'5px 12px',
                  background:'#fff', cursor: page===1?'not-allowed':'pointer', opacity: page===1?0.5:1 }}>← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'5px 12px',
                  background:'#fff', cursor: page===totalPages?'not-allowed':'pointer',
                  opacity: page===totalPages?0.5:1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? `Edit — ${editing.code}` : 'Add new course'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'10px 14px',
              borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <FormField label="Course code" required>
                <input style={inputStyle} value={form.code}
                  onChange={e => setForm(f=>({...f, code:e.target.value}))} required />
              </FormField>
              <FormField label="Credits">
                <input type="number" min={1} max={6} style={inputStyle} value={form.credits}
                  onChange={e => setForm(f=>({...f, credits:+e.target.value}))} />
              </FormField>
            </div>
            <FormField label="Course name" required>
              <input style={inputStyle} value={form.name}
                onChange={e => setForm(f=>({...f, name:e.target.value}))} required />
            </FormField>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <FormField label="Department">
                <select style={inputStyle} value={form.department}
                  onChange={e => setForm(f=>({...f, department:e.target.value}))}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FormField>
              <FormField label="Faculty">
                <select style={inputStyle} value={form.faculty}
                  onChange={e => setForm(f=>({...f, faculty:e.target.value}))}>
                  <option value="">— Select —</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </FormField>
              <FormField label="Semester">
                <select style={inputStyle} value={form.semester}
                  onChange={e => setForm(f=>({...f, semester:e.target.value}))}>
                  <option value="fall">Fall</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                </select>
              </FormField>
              <FormField label="Year">
                <input type="number" min={2020} max={2030} style={inputStyle} value={form.year}
                  onChange={e => setForm(f=>({...f, year:+e.target.value}))} />
              </FormField>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                background:'none', border:'1px solid #d1d5db', borderRadius:8,
                padding:'9px 20px', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                background: saving?'#93c5fd':'#3b82f6', color:'#fff', border:'none',
                borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add course'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}