import { useState, useEffect, useCallback } from 'react'
import { feesAPI, studentsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import FormField, { inputStyle } from '../components/FormField'

const EMPTY = {
  student: '', fee_type: 'tuition', amount: '',
  status: 'pending', due_date: '', paid_date: '', note: '',
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'16px 18px' }}>
      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color: color||'#111827' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

export default function Fees() {
  const [fees, setFees]               = useState([])
  const [summary, setSummary]         = useState({})
  const [students, setStudents]       = useState([])
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

  const fetchFees = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await feesAPI.getAll(params)
      const data = res.data
      setFees(data.results ?? data)
      setTotalCount(data.count ?? data.length)
      setTotalPages(Math.ceil((data.count ?? data.length) / 10))
    } catch { setError('Failed to load fees.') }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await feesAPI.summary()
      setSummary(res.data)
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { fetchFees() },    [fetchFees])
  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => { setPage(1) },     [search, statusFilter])

  useEffect(() => {
    studentsAPI.getAll({ page_size: 200 }).then(r => setStudents(r.data.results ?? r.data))
  }, [])

  function openAdd() {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true)
  }
  function openEdit(f) {
    setEditing(f)
    setForm({
      student:   f.student,
      fee_type:  f.fee_type,
      amount:    f.amount,
      status:    f.status,
      due_date:  f.due_date  || '',
      paid_date: f.paid_date || '',
      note:      f.note      || '',
    })
    setError(''); setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
    // Clear paid_date if not paid
    const payload = { ...form }
    if (payload.status !== 'paid') payload.paid_date = null

    try {
      editing ? await feesAPI.update(editing.id, payload)
               : await feesAPI.create(payload)
      setShowModal(false); fetchFees(); fetchSummary()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object'
        ? Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(' | ')
        : 'Something went wrong.')
    } finally { setSaving(false) }
  }

  async function handleDelete(f) {
    if (!window.confirm('Delete this fee record?')) return
    await feesAPI.delete(f.id); fetchFees(); fetchSummary()
  }

  // Quick mark-as-paid button
  async function markPaid(f) {
    await feesAPI.update(f.id, {
      ...f,
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    })
    fetchFees(); fetchSummary()
  }

  const fmt = n => Number(n).toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 })

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
        <SummaryCard label="Total paid"    value={fmt(summary.total_paid  ?? 0)} color="#16a34a" />
        <SummaryCard label="Total due"     value={fmt(summary.total_due   ?? 0)} color="#f59e0b" />
        <SummaryCard label="Overdue records" value={summary.overdue_count ?? 0}  color="#dc2626" />
        <SummaryCard label="Fee types"
          value={(summary.by_type ?? []).length}
          sub={(summary.by_type ?? []).map(t => t.fee_type).join(', ') || '—'}
        />
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, gap:10, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student name or ID…"
            style={{ ...inputStyle, width:240, border:'1px solid #d1d5db' }} />
          <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width:150 }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="waived">Waived</option>
          </select>
        </div>
        <button onClick={openAdd} style={{
          background:'#3b82f6', color:'#fff', border:'none',
          borderRadius:8, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          + Add fee record
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
                  {['Student','Type','Amount','Status','Due date','Paid date','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#6b7280', textTransform:'uppercase',
                      letterSpacing:'.04em', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>
                    No fee records yet.
                  </td></tr>
                ) : fees.map(f => (
                  <tr key={f.id}
                    style={{ borderBottom:'1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontWeight:500 }}>{f.student_name}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{f.student_id}</div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:'#f3f4f6', borderRadius:20,
                        padding:'2px 10px', fontSize:11, textTransform:'capitalize' }}>
                        {f.fee_type}
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px', fontWeight:600, fontFamily:'monospace' }}>
                      {fmt(f.amount)}
                    </td>
                    <td style={{ padding:'11px 14px' }}><StatusBadge status={f.status} /></td>
                    <td style={{ padding:'11px 14px', color:'#6b7280', fontSize:12 }}>
                      {f.due_date
                        ? new Date(f.due_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding:'11px 14px', color: f.paid_date ? '#16a34a' : '#9ca3af', fontSize:12 }}>
                      {f.paid_date
                        ? new Date(f.paid_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {f.status !== 'paid' && (
                        <button onClick={() => markPaid(f)} style={{
                          background:'#dcfce7', color:'#166534', border:'none',
                          borderRadius:6, padding:'4px 10px', fontSize:11,
                          cursor:'pointer', marginRight:6, fontWeight:500 }}>
                          Mark paid
                        </button>
                      )}
                      <button onClick={() => openEdit(f)} style={{
                        background:'none', border:'1px solid #d1d5db', borderRadius:6,
                        padding:'4px 10px', fontSize:12, cursor:'pointer', marginRight:6 }}>Edit</button>
                      <button onClick={() => handleDelete(f)} style={{
                        background:'none', border:'1px solid #fca5a5', borderRadius:6,
                        padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#dc2626' }}>Delete</button>
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
        <Modal title={editing ? 'Edit fee record' : 'Add fee record'} onClose={() => setShowModal(false)}>
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
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <FormField label="Fee type">
                <select style={inputStyle} value={form.fee_type}
                  onChange={e => setForm(f=>({...f, fee_type:e.target.value}))}>
                  {['tuition','hostel','library','exam','other'].map(t =>
                    <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                  )}
                </select>
              </FormField>
              <FormField label="Amount ($)" required>
                <input type="number" min={0} step="0.01" style={inputStyle} value={form.amount}
                  onChange={e => setForm(f=>({...f, amount:e.target.value}))} required />
              </FormField>
              <FormField label="Status">
                <select style={inputStyle} value={form.status}
                  onChange={e => setForm(f=>({...f, status:e.target.value}))}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="waived">Waived</option>
                </select>
              </FormField>
              <FormField label="Due date" required>
                <input type="date" style={inputStyle} value={form.due_date}
                  onChange={e => setForm(f=>({...f, due_date:e.target.value}))} required />
              </FormField>
              {form.status === 'paid' && (
                <FormField label="Paid date">
                  <input type="date" style={inputStyle} value={form.paid_date}
                    onChange={e => setForm(f=>({...f, paid_date:e.target.value}))} />
                </FormField>
              )}
            </div>
            <FormField label="Note">
              <textarea rows={2} style={{ ...inputStyle, resize:'vertical' }} value={form.note}
                onChange={e => setForm(f=>({...f, note:e.target.value}))} />
            </FormField>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                background:'none', border:'1px solid #d1d5db', borderRadius:8,
                padding:'9px 20px', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                background:saving?'#93c5fd':'#3b82f6', color:'#fff', border:'none',
                borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}