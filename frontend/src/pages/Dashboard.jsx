import { useState, useEffect } from 'react'
import { dashboardAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

// ─── colour palette ────────────────────────────────────────
const DEPT_COLORS  = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#6b7280']
const FEE_COLORS   = { paid:'#16a34a', pending:'#f59e0b', overdue:'#ef4444', waived:'#9ca3af' }
const STATUS_COLORS = { active:'#3b82f6', inactive:'#9ca3af', graduated:'#8b5cf6', suspended:'#ef4444' }

// ─── tiny helpers ──────────────────────────────────────────
function fmt$(n) {
  return Number(n).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  })
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── stat card ─────────────────────────────────────────────
function StatCard({ label, value, sub, color, loading }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 10, padding: '16px 18px',
    }}>
      <div style={{
        fontSize: 11, color: '#6b7280', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700,
        color: loading ? '#e5e7eb' : (color || '#111827'),
      }}>
        {loading ? '—' : value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}

// ─── section card wrapper ──────────────────────────────────
function Panel({ title, children, style = {} }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 10, padding: '16px 18px', ...style,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px', color: '#111827' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── custom tooltip for bar chart ─────────────────────────
function DeptTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].payload.dept}</p>
      <p style={{ margin: '2px 0 0', color: '#3b82f6' }}>{payload[0].value} enrollments</p>
    </div>
  )
}

// ─── main ──────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    dashboardAPI.stats()
      .then(res => setData(res.data))
      .catch(() => setError('Could not load dashboard data. Is Django running?'))
      .finally(() => setLoading(false))
  }, [])

  const s  = data?.students     || {}
  const e  = data?.enrollments  || {}
  const f  = data?.fees         || {}
  const depts   = data?.dept_enrollments || []
  const recent  = data?.recent_students  || []

  // Pie data: fee breakdown
  const feeSlices = (f.breakdown || []).map(row => ({
    name:  row.status.charAt(0).toUpperCase() + row.status.slice(1),
    value: Math.round(row.total),
    color: FEE_COLORS[row.status] || '#9ca3af',
  }))

  // Bar data: student status
  const statusBars = [
    { label: 'Active',    value: s.active    || 0, color: STATUS_COLORS.active },
    { label: 'Inactive',  value: s.inactive  || 0, color: STATUS_COLORS.inactive },
    { label: 'Graduated', value: s.graduated || 0, color: STATUS_COLORS.graduated },
    { label: 'Suspended', value: s.suspended || 0, color: STATUS_COLORS.suspended },
  ]

  if (error) {
    return (
      <div style={{
        background: '#fee2e2', color: '#991b1b', padding: '16px 20px',
        borderRadius: 10, fontSize: 13,
      }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        <StatCard
          label="Total students"
          value={s.total}
          sub={`${s.active || 0} active`}
          loading={loading}
        />
        <StatCard
          label="Active enrollments"
          value={e.active}
          sub={`across ${e.courses || 0} courses`}
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          label="Fee revenue"
          value={fmt$(f.paid || 0)}
          sub={`${fmt$(f.pending || 0)} pending`}
          color="#16a34a"
          loading={loading}
        />
        <StatCard
          label="Overdue fees"
          value={f.overdue_count}
          sub="records need attention"
          color={f.overdue_count > 0 ? '#dc2626' : '#16a34a'}
          loading={loading}
        />
      </div>

      {/* ── Middle row: dept bar + recent students ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)',
        gap: 16,
      }}>

        {/* Dept enrollments — horizontal bar chart */}
        <Panel title="Enrollments by department">
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
          ) : depts.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
              No enrollment data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, depts.length * 44)}>
              <BarChart
                data={depts}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="dept"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DeptTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {depts.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Recent students list */}
        <Panel title="Recent students">
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>No students yet.</div>
          ) : recent.map(student => (
            <div key={student.id} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 0',
              borderBottom: '1px solid #f3f4f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#dbeafe', color: '#1d4ed8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {initials(student.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{student.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{student.student_id}</div>
                </div>
              </div>
              <StatusBadge status={student.status} />
            </div>
          ))}
        </Panel>
      </div>

      {/* ── Bottom row: fee doughnut + status bars ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: 16,
      }}>

        {/* Fee breakdown doughnut */}
        <Panel title="Fee collection breakdown">
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
          ) : feeSlices.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
              No fee data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={feeSlices}
                  cx="50%" cy="50%"
                  innerRadius={54} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feeSlices.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt$(v)}
                  contentStyle={{
                    fontSize: 12, borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(v, entry) => `${v} — ${fmt$(entry.payload.value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Student status distribution bar chart */}
        <Panel title="Student status distribution">
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={statusBars}
                margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12, borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Students">
                  {statusBars.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

    </div>
  )
}