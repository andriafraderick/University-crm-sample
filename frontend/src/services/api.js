import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const studentsAPI = {
  getAll:  (params) => api.get('/students/', { params }),
  getOne:  (id)     => api.get(`/students/${id}/`),
  create:  (data)   => api.post('/students/', data),
  update:  (id, data) => api.put(`/students/${id}/`, data),
  delete:  (id)     => api.delete(`/students/${id}/`),
  stats:   ()       => api.get('/students/stats/'),
}

export const coursesAPI = {
  getAll:       (params) => api.get('/courses/', { params }),
  getOne:       (id)     => api.get(`/courses/${id}/`),
  create:       (data)   => api.post('/courses/', data),
  update:       (id, data) => api.put(`/courses/${id}/`, data),
  delete:       (id)     => api.delete(`/courses/${id}/`),
}

export const enrollmentsAPI = {
  getAll:  (params) => api.get('/enrollments/', { params }),
  create:  (data)   => api.post('/enrollments/', data),
  update:  (id, data) => api.put(`/enrollments/${id}/`, data),
  delete:  (id)     => api.delete(`/enrollments/${id}/`),
}

export const feesAPI = {
  getAll:   (params) => api.get('/fees/', { params }),
  create:   (data)   => api.post('/fees/', data),
  update:   (id, data) => api.put(`/fees/${id}/`, data),
  delete:   (id)     => api.delete(`/fees/${id}/`),
  summary:  ()       => api.get('/fees/summary/'),
}

export const departmentsAPI = {
  getAll: () => api.get('/departments/'),
}

export default api