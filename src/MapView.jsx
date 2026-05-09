import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

function MapView({ systems, onSystemClick }) {
  const svgRef = useRef(null)

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
    const zExtent = d3.extent(systems, d => d.PositionZ)

    const xScale = d3.scaleLinear().domain(xExtent).range([50, width - 50])
    const zScale = d3.scaleLinear().domain(zExtent).range([50, height - 50])

    // Build a lookup map for quick access
    const systemById = {}
    systems.forEach(s => { systemById[s.SystemId] = s })

    // Build connection pairs (avoid duplicates)
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

    // Draw connection lines first (so dots sit on top)
    g.selectAll('line')
      .data(connections)
      .join('line')
      .attr('x1', d => xScale(d.source.PositionX))
      .attr('y1', d => zScale(d.source.PositionZ))
      .attr('x2', d => xScale(d.target.PositionX))
      .attr('y2', d => zScale(d.target.PositionZ))
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6)

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

    g.selectAll('circle')
      .data(systems)
      .join('circle')
      .attr('cx', d => xScale(d.PositionX))
      .attr('cy', d => zScale(d.PositionZ))
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

    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    return () => {
      svg.selectAll('*').remove()
      tooltip.remove()
    }
  }, [systems])

  return <svg ref={svgRef} />
}

export default MapView
