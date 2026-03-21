import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    axios.get('/api/health/')
      .then(res => setStatus(res.data.message))
      .catch(() => setStatus('Could not reach Django'))
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>University CRM</h1>
      <p>Backend status: <strong>{status}</strong></p>
    </div>
  )
}

export default App