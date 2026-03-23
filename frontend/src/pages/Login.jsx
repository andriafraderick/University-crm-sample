import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login }       = useAuth()
  const navigate        = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, outline: 'none', background: '#f9fafb',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f6f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '0 16px',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 16, padding: '36px 40px',
        width: '100%', maxWidth: 380,
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
          <h1 style={{
            fontSize: 20, fontWeight: 700,
            margin: '0 0 4px', color: '#111827',
          }}>
            University CRM
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b',
            padding: '10px 14px', borderRadius: 8,
            fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12,
              fontWeight: 600, color: '#374151', marginBottom: 6,
            }}>
              Username
            </label>
            <input
              style={inputStyle}
              autoFocus
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: 12,
              fontWeight: 600, color: '#374151', marginBottom: 6,
            }}>
              Password
            </label>
            <input
              type="password"
              style={inputStyle}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#93c5fd' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: 11,
          color: '#9ca3af', margin: '16px 0 0',
        }}>
          University CRM/ERP system — demo
        </p>
      </div>
    </div>
  )
}