import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '24px', background: '#f4f6f9',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}