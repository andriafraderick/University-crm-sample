import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // still checking on mount

  // On app load — restore user from stored token
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // Decode the JWT payload (middle section) to get username/role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.username ?? payload.user_id, token })
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await api.post('/token/', { username, password })
    const { access, refresh } = res.data
    localStorage.setItem('access_token',  access)
    localStorage.setItem('refresh_token', refresh)
    const payload = JSON.parse(atob(access.split('.')[1]))
    setUser({ username: payload.username ?? username, token: access })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}