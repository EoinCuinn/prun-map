function Sidebar({ system, planets, onClose }) {
  if (!system) return null

  const systemPlanets = planets.filter(p => p.SystemId === system.SystemId)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      background: '#1a1f2e',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '13px',
      overflowY: 'auto',
      zIndex: 1000,
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#4f8ef7', fontSize: '16px', fontWeight: 'bold' }}>{system.Name}</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#888' }}>✕</span>
      </div>

      <div style={{ color: '#888', marginBottom: '16px' }}>
        {system.NaturalId} · {systemPlanets.length} planet{systemPlanets.length !== 1 ? 's' : ''}
      </div>

      {systemPlanets.map(planet => {
        const cogcTypes = planet.COGCPrograms
          ? [...new Set(planet.COGCPrograms.map(p => p.ProgramType).filter(Boolean))]
          : []

        return (
          <div key={planet.PlanetNaturalId} style={{
            marginBottom: '16px',
            padding: '10px',
            background: '#0f1117',
            borderRadius: '6px',
            borderLeft: '3px solid #4f8ef7'
          }}>
            <div style={{ color: '#4f8ef7', marginBottom: '6px', fontWeight: 'bold' }}>
              {planet.PlanetName}
              <span style={{ color: '#888', fontWeight: 'normal', marginLeft: '8px' }}>{planet.PlanetNaturalId}</span>
            </div>

            <div style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>
              {[
                planet.HasLocalMarket && 'LM',
                planet.HasWarehouse && 'WH',
                planet.HasShipyard && 'SY',
                planet.HasChamberOfCommerce && 'CoC',
                planet.HasAdministrationCenter && 'ADM'
              ].filter(Boolean).join(' · ') || 'No facilities'}
            </div>

            {cogcTypes.length > 0 && (
              <div style={{ color: '#f7a84f', fontSize: '11px', marginBottom: '6px' }}>
                COGC: {cogcTypes.join(', ')}
              </div>
            )}

            <a
              href={`https://prunplanner.org/plan/${planet.PlanetNaturalId}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4f8ef7', fontSize: '11px' }}
            >
              Open in PRunplanner →
            </a>
          </div>
        )
      })}
    </div>
  )
}

export default Sidebar
