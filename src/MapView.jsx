import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// Generate a consistent colour for each sector from its numeric id
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

// Convex hull using d3.polygonHull — returns null if < 3 points
function hullPoints(points) {
  if (points.length < 3) return null
  return d3.polygonHull(points)
}

function MapView({ systems, onSystemClick, showLines, showSectors }) {
  const svgRef = useRef(null)
  // Keep refs to the layer groups so we can show/hide without full redraw
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

    const xExtent = d3.extent(systems, d => d.PositionX)
    const yExtent = d3.extent(systems, d => d.PositionY)

    const xScale = d3.scaleLinear().domain(xExtent).range([50, width - 50])
    const yScale = d3.scaleLinear().domain(yExtent).range([50, height - 50])

    // ── Sector overlay ──────────────────────────────────────────────
    // Group systems by SectorId, compute convex hull, draw polygon
    const sectorMap = {}
    systems.forEach(s => {
      if (!s.SectorId) return
      if (!sectorMap[s.SectorId]) sectorMap[s.SectorId] = []
      sectorMap[s.SectorId].push([xScale(s.PositionX), yScale(s.PositionY)])
    })

    const sectorsGroup = g.append('g').attr('class', 'sectors-layer')
    sectorsGroupRef.current = sectorsGroup

    Object.entries(sectorMap).forEach(([sectorId, points]) => {
      const hull = hullPoints(points)
      if (!hull) {
        // Fewer than 3 systems: draw a circle around the single/pair point
        const cx = d3.mean(points, p => p[0])
        const cy = d3.mean(points, p => p[1])
        sectorsGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 18)
          .attr('fill', sectorColour(sectorId))
          .attr('fill-opacity', 0.08)
          .attr('stroke', sectorColour(sectorId))
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 1)
      } else {
        const colour = sectorColour(sectorId)
        // Expand the hull slightly for visual padding
        const centroid = d3.polygonCentroid(hull)
        const padded = hull.map(([px, py]) => {
          const dx = px - centroid[0]
          const dy = py - centroid[1]
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          return [px + (dx / len) * 14, py + (dy / len) * 14]
        })

        sectorsGroup.append('path')
          .attr('d', `M${padded.map(p => p.join(',')).join('L')}Z`)
          .attr('fill', colour)
          .attr('fill-opacity', 0.07)
          .attr('stroke', colour)
          .attr('stroke-opacity', 0.3)
          .attr('stroke-width', 1)
          .attr('stroke-linejoin', 'round')
      }
    })

    // ── Connection lines ────────────────────────────────────────────
    const systemById = {}
    systems.forEach(s => { systemById[s.SystemId] = s })

    const connections = []
    const seen = new Set()
    systems.forEach(s => {
      if (!s.Connections) return
      s.Connections.forEach(conn => {
        const connId = conn.ConnectingId
        const key = [s.SystemId, connId].sort().join('|')
        if (!seen.has(key) && systemById[connId]) {
          seen.add(key)
          connections.push({ source: s, target: systemById[connId] })
        }
      })
    })

    const linesGroup = g.append('g').attr('class', 'lines-layer')
    linesGroupRef.current = linesGroup

    linesGroup.selectAll('line')
      .data(connections)
      .join('line')
      .attr('x1', d => xScale(d.source.PositionX))
      .attr('y1', d => yScale(d.source.PositionY))
      .attr('x2', d => xScale(d.target.PositionX))
      .attr('y2', d => yScale(d.target.PositionY))
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6)

    // ── Tooltip ─────────────────────────────────────────────────────
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

    // ── System dots ─────────────────────────────────────────────────
    g.selectAll('circle.system')
      .data(systems)
      .join('circle')
      .attr('class', 'system')
      .attr('cx', d => xScale(d.PositionX))
      .attr('cy', d => yScale(d.PositionY))
      .attr('r', 3)
      .attr('fill', '#4f8ef7')
      .attr('opacity', 0.8)
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(d.Name)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        onSystemClick(d)
      })

    // ── Zoom & pan ──────────────────────────────────────────────────
    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    return () => {
      svg.selectAll('*').remove()
      tooltip.remove()
      sectorsGroupRef.current = null
      linesGroupRef.current = null
    }
  }, [systems])

  // Toggle visibility without redrawing — fast & clean
  useEffect(() => {
    if (sectorsGroupRef.current) {
      sectorsGroupRef.current.style('display', showSectors ? null : 'none')
    }
  }, [showSectors])

  useEffect(() => {
    if (linesGroupRef.current) {
      linesGroupRef.current.style('display', showLines ? null : 'none')
    }
  }, [showLines])

  return <svg ref={svgRef} />
}

export default MapView
