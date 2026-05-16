import { useState, useEffect, useMemo } from 'react'
import MapView from './MapView'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'

function App() {
  const [systems, setSystems] = useState([])
  const [planets, setPlanets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [highlightedSystem, setHighlightedSystem] = useState(null)
  const [hoveredSystem, setHoveredSystem] = useState(null)
  const [showLines, setShowLines] = useState(true)
  const [showSectors, setShowSectors] = useState(true)
  const [showSystemNames, setShowSystemNames] = useState(false)
  const [activeCogc, setActiveCogc] = useState([])

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

  // Compute the set of SystemIds that match active filters
  const filteredSystemIds = useMemo(() => {
    if (activeCogc.length === 0) return null // null = no filter active
    const matched = new Set()
    planets.forEach(p => {
      if (!p.SystemId || !p.COGCPrograms) return
      const types = p.COGCPrograms.map(c => c.ProgramType).filter(Boolean)
      if (activeCogc.some(f => types.includes(f))) {
        matched.add(p.SystemId)
      }
    })
    return matched
  }, [activeCogc, planets])

  if (loading) return (
    <div style={{ background: '#0f1117', color: '#4f8ef7', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '24px' }}>
      Loading universe...
    </div>
  )

  const btnStyle = (active) => ({
    background: active ? '#1e3a5f' : '#0f1117',
    color: active ? '#4f8ef7' : '#3a4a5f',
    border: `1px solid ${active ? '#4f8ef7' : '#1e3a5f'}`,
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'all 0.15s ease',
    fontFamily: 'monospace',
  })

  return (
    <>
      <MapView
        systems={systems}
        planets={planets}
        onSystemClick={setSelectedSystem}
        onBackgroundClick={() => { setSelectedSystem(null); setHighlightedSystem(null) }}
        showLines={showLines}
        showSectors={showSectors}
        showSystemNames={showSystemNames}
        highlightedSystem={highlightedSystem}
        hoveredSystem={hoveredSystem}
        filteredSystemIds={filteredSystemIds}
      />
      <SearchBar
        systems={systems}
        planets={planets}
        onSelectSystem={(system) => {
          setSelectedSystem(system)
          setHighlightedSystem(system)
          setHoveredSystem(null)
        }}
        onHoverSystem={setHoveredSystem}
      />
      <FilterPanel
        activeCogc={activeCogc}
        onCogcChange={setActiveCogc}
      />
      <Sidebar system={selectedSystem} planets={planets} onClose={() => setSelectedSystem(null)} />

      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '8px',
        zIndex: 100,
      }}>
        <button onClick={() => setShowSectors(v => !v)} style={btnStyle(showSectors)}>
          ⬡ SECTORS
        </button>
        <button onClick={() => setShowLines(v => !v)} style={btnStyle(showLines)}>
          ╌ LINES
        </button>
        <button onClick={() => setShowSystemNames(v => !v)} style={btnStyle(showSystemNames)}>
          ✦ NAMES
        </button>
      </div>
    </>
  )
}

export default App
