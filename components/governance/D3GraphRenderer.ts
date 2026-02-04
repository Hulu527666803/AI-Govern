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

    const nodes: GraphNode[] = (result.objects || []).map(obj => ({
      id: String(obj.id ?? obj.name ?? '').trim() || `node-${Math.random().toString(36).slice(2, 9)}`,
      name: obj.name ?? '',
      businessName: obj.businessName ?? obj.name ?? '未命名',
    })).filter(n => n.id);

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const nodeByName = new Map(nodes.map(n => [n.name, n]));

    const links: GraphLink[] = [];
    const rawRels = result.relationships || [];
    for (const rel of rawRels) {
      const sid = rel.sourceId ?? (rel as any).source ?? (rel as any).sourceName;
      const tid = rel.targetId ?? (rel as any).target ?? (rel as any).targetName;
      if (!sid || !tid) continue;
      const sourceNode = nodeById.get(sid) ?? nodeByName.get(sid) ?? nodeById.get(String(sid)) ?? nodeByName.get(String(sid));
      const targetNode = nodeById.get(tid) ?? nodeByName.get(tid) ?? nodeById.get(String(tid)) ?? nodeByName.get(String(tid));
      if (sourceNode && targetNode) {
        links.push({
          source: sourceNode,
          target: targetNode,
          label: rel.label ?? (rel as any).cardinality ?? '关联',
        });
      }
    }

    if (nodes.length === 0) {
      const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", isDark ? "#666" : "#999")
        .attr("style", "font-size: 12px;")
        .text("暂无业务对象，无法绘制图谱");
      return;
    }

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 创建容器组
    const container = svg.append('g');

    // 星空图布局：环形均匀分布，半径随节点数增加，力导向仅微调
    const cx = width / 2;
    const cy = height / 2;
    const n = nodes.length;
    const baseR = Math.min(width, height) * 0.32;
    const radius = n <= 3 ? baseR : baseR + Math.min(n * 6, 80);
    const collisionR = 38 + Math.min(n * 2, 30);
    nodes.forEach((node, i) => {
      const angle = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2;
      (node as any).x = cx + radius * Math.cos(angle);
      (node as any).y = cy + radius * Math.sin(angle);
    });

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).distance(80))
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(cx, cy))
      .force("collision", d3.forceCollide().radius(collisionR));

    const linkColor = isDark ? "#5eb3f6" : "#1677ff";
    const linkStrokeOpacity = 0.7;
    const nodeStroke = isDark ? "#5eb3f6" : "#1677ff";
    const textFill = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
    const nodeGlow = isDark ? "#177ddc" : "#94c5ff";

    // 发光滤镜（星空感）
    const defs = container.append("defs");
    defs.append("filter").attr("id", "star-glow")
      .append("feGaussianBlur").attr("stdDeviation", 2).attr("result", "blur");
    defs.select("filter#star-glow").append("feMerge")
      .selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", d => d);
    defs.append("marker")
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
      .attr("fill", isDark ? "#0f172a" : "white")
      .attr("stroke", nodeStroke)
      .attr("stroke-width", 2)
      .attr("filter", isDark ? "url(#star-glow)" : null)
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

    // 模拟稳定后，自动缩放（避免单节点或零范围导致 NaN）
    simulation.on("end", () => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        if (n.x != null && n.x < minX) minX = n.x;
        if (n.y != null && n.y < minY) minY = n.y;
        if (n.x != null && n.x > maxX) maxX = n.x;
        if (n.y != null && n.y > maxY) maxY = n.y;
      });

      const padding = 50;
      let graphWidth = maxX - minX;
      let graphHeight = maxY - minY;
      if (!Number.isFinite(graphWidth) || graphWidth <= 0) graphWidth = 100;
      if (!Number.isFinite(graphHeight) || graphHeight <= 0) graphHeight = 100;

      const scale = Math.min(
        (width - padding * 2) / graphWidth,
        (height - padding * 2) / graphHeight,
        1
      );
      const translateX = width / 2 - ((minX + maxX) / 2) * scale;
      const translateY = height / 2 - ((minY + maxY) / 2) * scale;

      if (Number.isFinite(scale) && Number.isFinite(translateX) && Number.isFinite(translateY)) {
        svg.transition()
          .duration(750)
          .call(
            zoom.transform as any,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
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
