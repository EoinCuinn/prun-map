import { useState, useEffect } from 'react'
import MapView from './MapView'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'

function App() {
  const [systems, setSystems] = useState([])
  const [planets, setPlanets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSystem, setSelectedSystem] = useState(null)

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
      <MapView systems={systems} onSystemClick={setSelectedSystem} />
      <SearchBar systems={systems} planets={planets} onSelectSystem={setSelectedSystem} />
      <Sidebar system={selectedSystem} planets={planets} onClose={() => setSelectedSystem(null)} />
    </>
  )
}

export default App
