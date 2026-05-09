import { useState } from 'react'

function SearchBar({ systems, planets, onSelectSystem }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)

    if (q.length < 2) {
      setResults([])
      return
    }

    const lower = q.toLowerCase()

    const matchedSystems = systems.filter(s =>
      s.Name.toLowerCase().includes(lower) ||
      s.NaturalId.toLowerCase().includes(lower)
    ).slice(0, 5).map(s => ({ type: 'system', label: `${s.Name} (${s.NaturalId})`, data: s }))

    const matchedPlanets = planets.filter(p =>
      p.PlanetName.toLowerCase().includes(lower) ||
      p.PlanetNaturalId.toLowerCase().includes(lower)
    ).slice(0, 5).map(p => ({ type: 'planet', label: `${p.PlanetName} (${p.PlanetNaturalId})`, data: p }))

    setResults([...matchedSystems, ...matchedPlanets])
  }

  const handleSelect = (result) => {
    if (result.type === 'system') {
      onSelectSystem(result.data)
    } else {
      const system = systems.find(s => s.SystemId === result.data.SystemId)
      if (system) onSelectSystem(system)
    }
    setQuery('')
    setResults([])
  }

  return (
    <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 1000, width: '280px' }}>
      <input
        value={query}
        onChange={handleChange}
        placeholder="Search system or planet..."
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#1a1f2e',
          border: '1px solid #4f8ef7',
          borderRadius: '6px',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {results.length > 0 && (
        <div style={{
          background: '#1a1f2e',
          border: '1px solid #333',
          borderRadius: '6px',
          marginTop: '4px',
          overflow: 'hidden'
        }}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                color: r.type === 'system' ? '#4f8ef7' : '#aaa',
                fontSize: '12px',
                fontFamily: 'monospace',
                borderBottom: '1px solid #222'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0f1117'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {r.type === 'planet' && <span style={{ color: '#555', marginRight: '6px' }}>◆</span>}
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
