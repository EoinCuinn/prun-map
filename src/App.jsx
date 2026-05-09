import { useState, useEffect } from 'react'
import MapView from './MapView'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'

function App() {
  const [systems, setSystems] = useState([])
  const [planets, setPlanets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [showLines, setShowLines] = useState(true)
  const [showSectors, setShowSectors] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/prun_universe_data.json').then(r => r.json()),
      fetch('/planet_data.json').then(r => r.json())
    ]).then(([systemData, planetData]) => {
      setSystems(systemData)
      setPlanets(planetData)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ background: '#0f1117', color: '#4f8ef7', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '24px' }}>
      Loading universe...
    </div>
  )

  return (
    <>
      <MapView
        systems={systems}
        onSystemClick={setSelectedSystem}
        showLines={showLines}
        showSectors={showSectors}
      />
      <SearchBar systems={systems} planets={planets} onSelectSystem={setSelectedSystem} />
      <Sidebar system={selectedSystem} planets={planets} onClose={() => setSelectedSystem(null)} />

      {/* Toggle buttons */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '8px',
        zIndex: 100,
        fontFamily: 'monospace',
      }}>
        <button
          onClick={() => setShowSectors(v => !v)}
          style={{
            background: showSectors ? '#1e3a5f' : '#0f1117',
            color: showSectors ? '#4f8ef7' : '#3a4a5f',
            border: `1px solid ${showSectors ? '#4f8ef7' : '#1e3a5f'}`,
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.15s ease',
          }}
        >
          ⬡ SECTORS
        </button>
        <button
          onClick={() => setShowLines(v => !v)}
          style={{
            background: showLines ? '#1e3a5f' : '#0f1117',
            color: showLines ? '#4f8ef7' : '#3a4a5f',
            border: `1px solid ${showLines ? '#4f8ef7' : '#1e3a5f'}`,
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.15s ease',
          }}
        >
          ╌ LINES
        </button>
      </div>
    </>
  )
}

export default App
