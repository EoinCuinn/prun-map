import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    Promise.all([
      fetch('/prun_universe_data.json').then(r => r.json()),
      fetch('/planet_data.json').then(r => r.json())
    ]).then(([systems, planets]) => {
      setStatus(`Loaded ${systems.length} systems and ${planets.length} planets`)
    }).catch(err => {
      setStatus(`Error: ${err.message}`)
    })
  }, [])

  return (
    <div style={{ background: '#0f1117', color: '#4f8ef7', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '24px' }}>
      {status}
    </div>
  )
}

export default App