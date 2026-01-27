import * as d3 from 'd3';
import { GraphNode, GraphLink } from './types';
import { GovernanceResult } from '../../types';

export function renderD3Graph(
  svgRef: SVGSVGElement | null,
  result: GovernanceResult | null,
  isDark: boolean
): void {
  try {
    if (!result || !svgRef) return;

    const width = 400;
    const height = 400;
    const svg = d3.select(svgRef);
    svg.selectAll("*").remove();

    const nodes: GraphNode[] = result.objects.map(obj => ({
      id: obj.id, name: obj.name, businessName: obj.businessName
    }));

    const links: GraphLink[] = result.relationships.map(rel => ({
      source: rel.sourceId, target: rel.targetId, label: rel.label
    }));

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 创建容器组
    const container = svg.append('g');

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    const linkColor = isDark ? "#303030" : "#f0f0f0";
    const nodeStroke = isDark ? "#177ddc" : "#1677ff";
    const textFill = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)";

    const link = container.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    container.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", linkColor);

    // 添加关系标签
    const linkLabel = container.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("class", "link-label")
      .attr("text-anchor", "middle")
      .attr("fill", isDark ? "#177ddc" : "#1677ff")
      .attr("style", "font-size: 9px; font-weight: 600; pointer-events: none;")
      .text(d => d.label || '关联');

    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation));

    node.append("circle")
      .attr("r", 14)
      .attr("fill", isDark ? "#141414" : "white")
      .attr("stroke", nodeStroke)
      .attr("stroke-width", 2)
      .attr("class", "cursor-move shadow-md");

    node.append("text")
      .attr("dx", 0)
      .attr("dy", 28)
      .attr("text-anchor", "middle")
      .attr("class", "node-label")
      .attr("fill", textFill)
      .attr("style", `font-size: 10px; font-weight: bold;`)
      .text(d => d.businessName);

    simulation.on("tick", () => {
      link.attr("x1", d => (d.source as any).x).attr("y1", d => (d.source as any).y).attr("x2", d => (d.target as any).x).attr("y2", d => (d.target as any).y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
      
      // 更新关系标签位置
      linkLabel
        .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2 - 5);
    });

    // 模拟稳定后，自动缩放
    simulation.on("end", () => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        if (n.x! < minX) minX = n.x!;
        if (n.y! < minY) minY = n.y!;
        if (n.x! > maxX) maxX = n.x!;
        if (n.y! > maxY) maxY = n.y!;
      });

      const padding = 50;
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const scale = Math.min(
        (width - padding * 2) / graphWidth,
        (height - padding * 2) / graphHeight,
        1
      );

      const translateX = (width - (minX + maxX) * scale) / 2;
      const translateY = (height - (minY + maxY) * scale) / 2;

      svg.transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
    });

    function drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;
      }
      function dragged(event: any) { event.subject.fx = event.x; event.subject.fy = event.y; }
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null; event.subject.fy = null;
      }
      return d3.drag<SVGGElement, GraphNode>().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }
  } catch (error) {
    console.error("D3 Graph Rendering Failed:", error);
  }
}
