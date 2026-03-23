import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Attach access token to every request ──────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── On 401 — try refreshing, else redirect to /login ──────
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const res = await axios.post('/api/token/refresh/', { refresh })
        const newAccess = res.data.access
        localStorage.setItem('access_token', newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)   // retry the original request
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── All your existing API helpers below (unchanged) ───────
export const studentsAPI = {
  getAll:  (params)    => api.get('/students/', { params }),
  getOne:  (id)        => api.get(`/students/${id}/`),
  create:  (data)      => api.post('/students/', data),
  update:  (id, data)  => api.put(`/students/${id}/`, data),
  delete:  (id)        => api.delete(`/students/${id}/`),
  stats:   ()          => api.get('/students/stats/'),
}

export const coursesAPI = {
  getAll:  (params)    => api.get('/courses/', { params }),
  getOne:  (id)        => api.get(`/courses/${id}/`),
  create:  (data)      => api.post('/courses/', data),
  update:  (id, data)  => api.put(`/courses/${id}/`, data),
  delete:  (id)        => api.delete(`/courses/${id}/`),
}

export const enrollmentsAPI = {
  getAll:  (params)    => api.get('/enrollments/', { params }),
  create:  (data)      => api.post('/enrollments/', data),
  update:  (id, data)  => api.put(`/enrollments/${id}/`, data),
  delete:  (id)        => api.delete(`/enrollments/${id}/`),
}

export const feesAPI = {
  getAll:   (params)   => api.get('/fees/', { params }),
  create:   (data)     => api.post('/fees/', data),
  update:   (id, data) => api.put(`/fees/${id}/`, data),
  delete:   (id)       => api.delete(`/fees/${id}/`),
  summary:  ()         => api.get('/fees/summary/'),
}

export const departmentsAPI = {
  getAll: () => api.get('/departments/'),
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/'),
}

export const attendanceAPI = {
  getAll:  (params)    => api.get('/attendance/', { params }),
  create:  (data)      => api.post('/attendance/', data),
  update:  (id, data)  => api.put(`/attendance/${id}/`, data),
  delete:  (id)        => api.delete(`/attendance/${id}/`),
}

export const gradesAPI = {
  getAll:  (params)    => api.get('/grades/', { params }),
  create:  (data)      => api.post('/grades/', data),
  update:  (id, data)  => api.put(`/grades/${id}/`, data),
  delete:  (id)        => api.delete(`/grades/${id}/`),
}

export default api