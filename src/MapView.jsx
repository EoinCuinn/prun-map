import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

function sectorColour(sectorId) {
  const palette = [
    '#4f8ef7', '#f7814f', '#4ff7a0', '#f74f8e', '#f7e14f',
    '#a04ff7', '#4ff7e1', '#f7a04f', '#8ef74f', '#f74fa0',
    '#4fa0f7', '#f7cf4f', '#cf4ff7', '#4ff7cf', '#f74f4f',
    '#4fcff7', '#f7f74f', '#4f4ff7', '#f74fcf', '#4ff74f',
    '#e14f4f', '#4fe1f7', '#f7e14f', '#4ff7e1', '#e14ff7',
  ]
  const num = parseInt(sectorId.replace('sector-', ''), 10) || 0
  return palette[num % palette.length]
}

function axialRound(q, r) {
  const s = -q - r
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s)
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return [rq, rr]
}

function pixelToAxial(x, y, r) {
  const q = (2 / 3 * x) / r
  const rCoord = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / r
  return axialRound(q, rCoord)
}

// Flat-top hex: pixel centre from axial coords
function axialToPixel(q, r, size) {
  const x = size * (3 / 2 * q)
  const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r)
  return [x, y]
}

// Flat-top hexagon path
function hexPath(cx, cy, r) {
  const pts = [0, 60, 120, 180, 240, 300].map(a => {
    const rad = a * Math.PI / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  })
  return `M${pts.map(p => p.join(',')).join('L')}Z`
}

function MapView({ systems, onSystemClick, showLines, showSectors }) {
  const svgRef = useRef(null)
  const sectorsGroupRef = useRef(null)
  const linesGroupRef = useRef(null)

  useEffect(() => {
    if (!systems || systems.length === 0) return

    const width = window.innerWidth
    const height = window.innerHeight

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', '#0f1117')

    const g = svg.append('g')

    // ── Compute sector centroids in data-space ───────────────────────
    const HEX_DATA_R = 140 / Math.sqrt(3) // ~80.8 data units

    const sectorSystems = {}
    systems.forEach(s => {
      if (!s.SectorId) return
      if (!sectorSystems[s.SectorId]) sectorSystems[s.SectorId] = []
      sectorSystems[s.SectorId].push(s)
    })

    // Map each sector to axial grid coords from its centroid
    const sectorAxial = {}
    Object.entries(sectorSystems).forEach(([sid, sysList]) => {
      const cx = sysList.reduce((a, s) => a + s.PositionX, 0) / sysList.length
      const cy = sysList.reduce((a, s) => a + s.PositionY, 0) / sysList.length
      sectorAxial[sid] = pixelToAxial(cx, -cy, HEX_DATA_R) // negate Y: game Y-up
    })

    // ── Convert axial coords to screen pixels ────────────────────────
    // Find extent of axial coords to centre on screen
    const allAxial = Object.values(sectorAxial)
    const qVals = allAxial.map(a => a[0])
    const rVals = allAxial.map(a => a[1])

    // Hex size in screen pixels — fit to screen
    const qExtent = [Math.min(...qVals), Math.max(...qVals)]
    const rExtent = [Math.min(...rVals), Math.max(...rVals)]

    // Width needed for flat-top hex grid: (qRange + 1) * 1.5 * size
    // Height needed: (rRange + 1) * sqrt(3) * size
    const qRange = qExtent[1] - qExtent[0] + 2
    const rRange = rExtent[1] - rExtent[0] + 2
    const hexSize = Math.min(
      (width - 100) / (qRange * 1.5),
      (height - 100) / (rRange * Math.sqrt(3))
    )

    // Centre offset
    const [originX, originY] = axialToPixel(
      (qExtent[0] + qExtent[1]) / 2,
      (rExtent[0] + rExtent[1]) / 2,
      hexSize
    )
    const offsetX = width / 2 - originX
    const offsetY = height / 2 - originY

    // Screen position of each sector's hex centre
    const sectorScreenPos = {}
    Object.entries(sectorAxial).forEach(([sid, [q, r]]) => {
      const [px, py] = axialToPixel(q, r, hexSize)
      sectorScreenPos[sid] = [px + offsetX, py + offsetY]
    })

    // Systems are positioned relative to their sector hex centre
    // Pre-compute sector centroid data positions once
    const sectorCentroidData = {}
    Object.entries(sectorSystems).forEach(([sid, sysList]) => {
      sectorCentroidData[sid] = {
        cx: sysList.reduce((a, x) => a + x.PositionX, 0) / sysList.length,
        cy: sysList.reduce((a, x) => a + x.PositionY, 0) / sysList.length,
        xExtent: d3.extent(sysList, x => x.PositionX),
        yExtent: d3.extent(sysList, x => x.PositionY),
      }
    })

    const systemScreenPos = (s) => {
      const sid = s.SectorId
      if (!sid || !sectorScreenPos[sid]) return [width / 2, height / 2]

      const [hcx, hcy] = sectorScreenPos[sid]
      const { cx: cxData, cy: cyData, xExtent: lxe, yExtent: lye } = sectorCentroidData[sid]

      const localRange = Math.max(lxe[1] - lxe[0], lye[1] - lye[0], 1)
      const maxOffset = (Math.sqrt(3) / 2 * hexSize) * 0.82
      const scale = (maxOffset * 2) / localRange

      let lx = (s.PositionX - cxData) * scale
      let ly = -(s.PositionY - cyData) * scale

      const dist = Math.sqrt(lx * lx + ly * ly)
      if (dist > maxOffset) {
        lx = (lx / dist) * maxOffset
        ly = (ly / dist) * maxOffset
      }

      return [hcx + lx, hcy + ly]
    }

    // ── Sector hex layer ─────────────────────────────────────────────
    const sectorsGroup = g.append('g').attr('class', 'sectors-layer')
    sectorsGroupRef.current = sectorsGroup

    Object.entries(sectorScreenPos).forEach(([sid, [scx, scy]]) => {
      const colour = sectorColour(sid)
      sectorsGroup.append('path')
        .attr('d', hexPath(scx, scy, hexSize - 2))
        .attr('fill', colour)
        .attr('fill-opacity', 0.07)
        .attr('stroke', colour)
        .attr('stroke-opacity', 0.35)
        .attr('stroke-width', 1)

      sectorsGroup.append('text')
        .attr('x', scx)
        .attr('y', scy)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', colour)
        .attr('fill-opacity', 0.2)
        .attr('font-family', 'monospace')
        .attr('font-size', hexSize * 0.3)
        .attr('pointer-events', 'none')
        .text(sid.replace('sector-', 'S'))
    })

    // ── Connection lines ─────────────────────────────────────────────
    const systemById = {}
    systems.forEach(s => { systemById[s.SystemId] = s })

    const connections = []
    const seen = new Set()
    systems.forEach(s => {
      if (!s.Connections) return
      s.Connections.forEach(conn => {
        const key = [s.SystemId, conn.ConnectingId].sort().join('|')
        if (!seen.has(key) && systemById[conn.ConnectingId]) {
          seen.add(key)
          connections.push({ source: s, target: systemById[conn.ConnectingId] })
        }
      })
    })

    const linesGroup = g.append('g').attr('class', 'lines-layer')
    linesGroupRef.current = linesGroup

    linesGroup.selectAll('line')
      .data(connections)
      .join('line')
      .attr('x1', d => systemScreenPos(d.source)[0])
      .attr('y1', d => systemScreenPos(d.source)[1])
      .attr('x2', d => systemScreenPos(d.target)[0])
      .attr('y2', d => systemScreenPos(d.target)[1])
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6)

    // ── Tooltip ──────────────────────────────────────────────────────
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('background', '#1a1f2e')
      .style('color', '#4f8ef7')
      .style('padding', '4px 8px')
      .style('border-radius', '4px')
      .style('font-family', 'monospace')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)

    // ── System dots ──────────────────────────────────────────────────
    g.selectAll('circle.system')
      .data(systems)
      .join('circle')
      .attr('class', 'system')
      .attr('cx', d => systemScreenPos(d)[0])
      .attr('cy', d => systemScreenPos(d)[1])
      .attr('r', 3)
      .attr('fill', '#4f8ef7')
      .attr('opacity', 0.8)
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1).html(d.Name)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', 0))
      .on('click', (event, d) => { event.stopPropagation(); onSystemClick(d) })

    // ── Zoom & pan ───────────────────────────────────────────────────
    const zoom = d3.zoom()
      .scaleExtent([0.3, 20])
      .on('zoom', (event) => { g.attr('transform', event.transform) })

    svg.call(zoom)

    return () => {
      svg.selectAll('*').remove()
      tooltip.remove()
      sectorsGroupRef.current = null
      linesGroupRef.current = null
    }
  }, [systems])

  useEffect(() => {
    if (sectorsGroupRef.current)
      sectorsGroupRef.current.style('display', showSectors ? null : 'none')
  }, [showSectors])

  useEffect(() => {
    if (linesGroupRef.current)
      linesGroupRef.current.style('display', showLines ? null : 'none')
  }, [showLines])

  return <svg ref={svgRef} />
}

export default MapView
