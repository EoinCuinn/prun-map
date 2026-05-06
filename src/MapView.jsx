import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

function MapView({ systems }) {
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

    // Use X and Z coordinates for 2D map (Y is vertical, mostly irrelevant)
    const xExtent = d3.extent(systems, d => d.PositionX)
    const zExtent = d3.extent(systems, d => d.PositionZ)

    const xScale = d3.scaleLinear().domain(xExtent).range([50, width - 50])
    const zScale = d3.scaleLinear().domain(zExtent).range([50, height - 50])

    // Draw systems as dots
    g.selectAll('circle')
      .data(systems)
      .join('circle')
      .attr('cx', d => xScale(d.PositionX))
      .attr('cy', d => zScale(d.PositionZ))
      .attr('r', 3)
      .attr('fill', '#4f8ef7')
      .attr('opacity', 0.8)

    // Pan and zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    return () => {
      svg.selectAll('*').remove()
    }
  }, [systems])

  return <svg ref={svgRef} />
}

export default MapView