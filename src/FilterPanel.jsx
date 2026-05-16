import { useState } from 'react'

const COGC_TYPES = [
  { key: 'ADVERTISING_AGRICULTURE',        label: 'Agriculture' },
  { key: 'ADVERTISING_CHEMISTRY',          label: 'Chemistry' },
  { key: 'ADVERTISING_CONSTRUCTION',       label: 'Construction' },
  { key: 'ADVERTISING_ELECTRONICS',        label: 'Electronics' },
  { key: 'ADVERTISING_FOOD_INDUSTRIES',    label: 'Food Industries' },
  { key: 'ADVERTISING_FUEL_REFINING',      label: 'Fuel Refining' },
  { key: 'ADVERTISING_MANUFACTURING',      label: 'Manufacturing' },
  { key: 'ADVERTISING_METALLURGY',         label: 'Metallurgy' },
  { key: 'ADVERTISING_RESOURCE_EXTRACTION',label: 'Resource Extraction' },
  { key: 'WORKFORCE_PIONEERS',             label: 'Workforce: Pioneers' },
  { key: 'WORKFORCE_SETTLERS',             label: 'Workforce: Settlers' },
]

function FilterPanel({ activeCogc, onCogcChange }) {
  const [open, setOpen] = useState(false)

  const toggle = (key) => {
    if (activeCogc.includes(key)) {
      onCogcChange(activeCogc.filter(k => k !== key))
    } else {
      onCogcChange([...activeCogc, key])
    }
  }

  const hasActive = activeCogc.length > 0

  return (
    <div style={{
      position: 'fixed',
      top: '52px',
      left: '10px',
      zIndex: 200,
      fontFamily: 'monospace',
      width: '220px',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: hasActive ? '#1e3a5f' : '#0f1117',
          color: hasActive ? '#4f8ef7' : '#6a8aaa',
          border: `1px solid ${hasActive ? '#4f8ef7' : '#1e3a5f'}`,
          borderRadius: open ? '4px 4px 0 0' : '4px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>▼ FILTERS {hasActive ? `(${activeCogc.length})` : ''}</span>
        {hasActive && (
          <span
            onClick={e => { e.stopPropagation(); onCogcChange([]) }}
            style={{ color: '#888', fontSize: '11px', marginLeft: '8px' }}
          >
            clear
          </span>
        )}
      </button>

      {open && (
        <div style={{
          background: '#1a1f2e',
          border: '1px solid #1e3a5f',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          padding: '8px 0',
        }}>
          <div style={{ color: '#4a5a7a', fontSize: '10px', padding: '2px 12px 6px', letterSpacing: '0.1em' }}>
            COGC PROGRAM
          </div>
          {COGC_TYPES.map(({ key, label }) => {
            const active = activeCogc.includes(key)
            return (
              <div
                key={key}
                onClick={() => toggle(key)}
                style={{
                  padding: '4px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: active ? '#4f8ef7' : '#6a8aaa',
                  background: active ? 'rgba(79,142,247,0.08)' : 'transparent',
                  fontSize: '12px',
                }}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  border: `1px solid ${active ? '#4f8ef7' : '#3a4a5f'}`,
                  borderRadius: '2px',
                  background: active ? '#4f8ef7' : 'transparent',
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                {label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FilterPanel
