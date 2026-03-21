import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout   from './components/layout/MainLayout'
import Dashboard    from './pages/Dashboard'
import Students     from './pages/Students'
import Courses      from './pages/Courses'
import Enrollments  from './pages/Enrollments'
import Fees         from './pages/Fees'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index          element={<Dashboard />} />
          <Route path="students"    element={<Students />} />
          <Route path="courses"     element={<Courses />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="fees"        element={<Fees />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}