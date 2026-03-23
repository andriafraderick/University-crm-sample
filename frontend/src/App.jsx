import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }   from './context/AuthContext'
import ProtectedRoute     from './components/ProtectedRoute'
import MainLayout         from './components/layout/MainLayout'
import Login              from './pages/Login'
import Dashboard          from './pages/Dashboard'
import Students           from './pages/Students'
import Courses            from './pages/Courses'
import Enrollments        from './pages/Enrollments'
import Attendance         from './pages/Attendance'  
import Grades             from './pages/Grades'     
import Fees               from './pages/Fees'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index            element={<Dashboard />} />
            <Route path="students"    element={<Students />} />
            <Route path="courses"     element={<Courses />} />
            <Route path="enrollments" element={<Enrollments />} />
            <Route path="attendance"  element={<Attendance />} /> 
            <Route path="grades"      element={<Grades />} />     
            <Route path="fees"        element={<Fees />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}