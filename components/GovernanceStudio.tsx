
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GovernanceResult, OntologyObject, Relationship } from '../types';
import { ICONS } from '../constants';
import { 
  ChevronDown, ChevronRight, Layers, Network, Table as TableIcon, Download, Lightbulb, Hash, AlertCircle, FileSearch, Share2, Move, CloudUpload, CheckCircle, Loader2 
} from 'lucide-react';

interface GovernanceStudioProps {
  result: GovernanceResult | null;
  theme?: 'light' | 'dark';
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  businessName: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  label: string;
}

export const GovernanceStudio: React.FC<GovernanceStudioProps> = ({ result, theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'ONTOLOGY' | 'GLOSSARY' | 'METRICS' | 'SAMPLES'>('ONTOLOGY');
  const [showGraph, setShowGraph] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');
  const svgRef = useRef<SVGSVGElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (showGraph && result && svgRef.current) {
      renderD3Graph();
    }
  }, [showGraph, result, theme]);

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishStatus('SUCCESS');
      setTimeout(() => setPublishStatus('IDLE'), 3000);
    }, 2500);
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UINO_治理包_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderD3Graph = () => {
    if (!result || !svgRef.current) return;

    const width = 400;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes: GraphNode[] = result.objects.map(obj => ({
      id: obj.id, name: obj.name, businessName: obj.businessName
    }));

    const links: GraphLink[] = result.relationships.map(rel => ({
      source: rel.sourceId, target: rel.targetId, label: rel.label
    }));

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    const linkColor = isDark ? "#303030" : "#f0f0f0";
    const nodeStroke = isDark ? "#177ddc" : "#1677ff";
    const textFill = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)";

    const link = svg.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    svg.append("defs").append("marker")
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

    const node = svg.append("g")
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
  };

  if (!result) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-12 text-center transition-colors ${isDark ? 'bg-[#141414]/60' : 'bg-gray-50'}`}>
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 border transition-colors ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-400' : 'bg-white border-gray-100 text-slate-400 shadow-sm'}`}>
          <Layers className="w-7 h-7" />
        </div>
        <h3 className={`text-xs font-black mb-3 uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>治理成果展示中心</h3>
        <p className={`text-[11px] max-w-[220px] leading-relaxed font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          请在中间对话框发起指令。系统将基于 G-ABC 范式构建业务本体及知识图谱。
        </p>
      </div>
    );
  }

  const domains: string[] = Array.from(new Set(result.objects.map(o => o.domain || '通用业务域')));

  return (
    <div className={`flex flex-col h-full transition-colors ${isDark ? 'bg-[#141414]' : 'bg-white'}`}>
      <div className={`px-5 pt-5 border-b transition-colors ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'ONTOLOGY', label: '业务本体', icon: <Network size={14} /> },
            { id: 'GLOSSARY', label: '业务术语', icon: <FileSearch size={14} /> },
            { id: 'METRICS', label: '业务知识', icon: <Lightbulb size={14} /> },
            { id: 'SAMPLES', label: '对象样例', icon: <TableIcon size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
                activeTab === tab.id 
                  ? (isDark ? 'border-[#177ddc] text-[#177ddc] bg-blue-500/5' : 'border-blue-600 text-blue-600 bg-blue-50') 
                  : (isDark ? 'border-transparent text-slate-500 hover:text-slate-100' : 'border-transparent text-slate-400 hover:text-slate-800')
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {activeTab === 'ONTOLOGY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${isDark ? 'bg-[#1d1d1d]/40 border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
               <span className={`text-[10px] font-bold uppercase tracking-widest px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>展示视图</span>
               <div className={`flex gap-1.5 p-1 rounded-xl border transition-colors ${isDark ? 'bg-black border-[#303030]' : 'bg-white border-gray-200'}`}>
                  <button 
                    onClick={() => setShowGraph(false)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!showGraph ? (isDark ? 'bg-[#177ddc] text-white' : 'bg-blue-600 text-white shadow-sm') : 'text-slate-500 hover:text-white'}`}
                  >
                    列表
                  </button>
                  <button 
                    onClick={() => setShowGraph(true)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${showGraph ? (isDark ? 'bg-[#177ddc] text-white' : 'bg-blue-600 text-white shadow-sm') : 'text-slate-500 hover:text-white'}`}
                  >
                    图谱
                  </button>
               </div>
            </div>

            {showGraph ? (
              <div className={`aspect-square w-full rounded-3xl border relative overflow-hidden flex flex-col shadow-inner transition-colors ${isDark ? 'bg-black border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                   <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                      <Share2 size={12} />
                   </div>
                   <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>D3 力导向本体网络</span>
                </div>
                <div className="flex-1 cursor-grab active:cursor-grabbing">
                   <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 400 400" className="w-full h-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {domains.map(domain => (
                  <div key={domain} className="space-y-4">
                    <button 
                      onClick={() => setExpandedDomains(p => ({...p, [domain]: !p[domain]}))}
                      className="flex items-center gap-3 w-full text-left group"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedDomains[domain] === false ? '-rotate-90' : ''}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{domain}</span>
                      <div className={`flex-1 h-px transition-colors ${isDark ? 'bg-[#303030]' : 'bg-gray-100'}`} />
                    </button>
                    
                    {expandedDomains[domain] !== false && (
                      <div className="space-y-4 pl-3">
                        {result.objects.filter(o => (o.domain || '通用业务域') === domain).map(obj => (
                          <div key={obj.id} className={`border rounded-[24px] p-5 shadow-sm transition-all group ${isDark ? 'bg-[#1d1d1d] border-[#303030] hover:border-[#177ddc]/50' : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className={`text-[13px] font-bold transition-colors ${isDark ? 'text-white group-hover:text-[#177ddc]' : 'text-slate-800 group-hover:text-blue-600'}`}>{obj.businessName}</h4>
                                <p className={`text-[9px] font-mono mt-0.5 uppercase tracking-tighter font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>物理资产: {obj.name}</p>
                              </div>
                              <div className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-black text-[#177ddc] border-[#303030]' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {ICONS.Object}
                              </div>
                            </div>
                            <p className={`text-[11px] mb-5 leading-relaxed font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{obj.description}</p>
                            
                            <div className="space-y-1.5">
                              {obj.attributes.map((attr, i) => (
                                <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${isDark ? 'bg-black/40 border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{attr.businessName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-mono font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{attr.name}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${isDark ? 'text-blue-400 bg-blue-500/5 border-blue-500/10' : 'text-blue-600 bg-blue-50 border-blue-200'}`}>{attr.type}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'GLOSSARY' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            {result.terms.map(term => (
              <div key={term.id} className={`p-6 border rounded-[28px] transition-all relative overflow-hidden group ${isDark ? 'bg-[#1d1d1d] border-[#303030] hover:bg-[#1f1f1f]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-6 -mt-6 transition-colors ${isDark ? 'bg-orange-500/[0.04]' : 'bg-orange-50'}`} />
                <div className="flex justify-between items-start mb-5 relative">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      <Hash className="w-4 h-4" />
                    </div>
                    <h4 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{term.term}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {term.aliases.map((a, i) => (
                      <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-[#141414] text-slate-400 border-[#303030]' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>{a}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-5 relative">
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>术语核心释义</p>
                  <p className={`text-[12px] font-medium leading-relaxed px-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{term.definition}</p>
                </div>
                {term.rules && term.rules.length > 0 && (
                  <div className={`p-4 rounded-[20px] border transition-colors ${isDark ? 'bg-black/40 border-orange-500/10' : 'bg-orange-50/50 border-orange-100'}`}>
                    <ul className="space-y-2">
                      {term.rules.map((r, i) => (
                        <li key={i} className={`text-[11px] flex items-start gap-2.5 font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                           <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${isDark ? 'bg-orange-500/40' : 'bg-orange-400'}`} />
                           {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'METRICS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             {result.knowledge.map(k => (
              <div key={k.id} className={`p-7 border rounded-[32px] shadow-sm relative overflow-hidden flex flex-col group transition-all ${isDark ? 'bg-[#1d1d1d] border-[#303030] hover:border-[#177ddc]/20' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                <div className="flex items-center justify-between mb-5 relative">
                   <div className="flex items-center gap-3">
                     <div className={`p-2.5 rounded-2xl border transition-colors ${isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                       <Lightbulb size={16} />
                     </div>
                     <h4 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{k.title}</h4>
                   </div>
                   <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${isDark ? 'bg-black text-slate-500 border-[#303030]' : 'bg-gray-100 text-slate-500 border-gray-200'}`}>{k.domain}</span>
                </div>
                {k.logic && (
                  <div className={`p-5 rounded-2xl mb-5 border shadow-inner relative overflow-hidden transition-colors ${isDark ? 'bg-black/60 border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="absolute top-0 right-0 p-3 text-[8px] font-black uppercase tracking-widest pointer-events-none opacity-40">判断规则</div>
                    <p className={`text-[11px] leading-relaxed font-bold ${isDark ? 'text-amber-200/90' : 'text-amber-700'}`}>{k.logic}</p>
                  </div>
                )}
                <div className={`p-4 rounded-xl border transition-colors ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-blue-50/30 border-blue-50'}`}>
                   <p className={`text-[11px] leading-relaxed font-medium italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>“ {k.content} ”</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SAMPLES' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
            {result.sampleData && result.sampleData.map((sample, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                   <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sample.objectName} 对象样例预览</h4>
                </div>
                <div className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${isDark ? 'bg-black border-[#303030]' : 'bg-white border-gray-100'}`}>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b transition-colors ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                          {sample.columns.map(col => (
                            <th key={col} className={`px-5 py-3.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sample.rows.map((row, ridx) => (
                          <tr key={ridx} className={`border-b last:border-0 hover:bg-blue-500/[0.03] transition-colors ${isDark ? 'border-[#303030]/40' : 'border-gray-50'}`}>
                            {sample.columns.map(col => (
                              <td key={col} className={`px-5 py-3.5 text-[11px] font-medium whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{String(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`p-6 border-t shrink-0 z-10 space-y-3 transition-colors ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
        <button 
          onClick={handlePublish}
          disabled={isPublishing || publishStatus === 'SUCCESS'}
          className={`group w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] border ${
            publishStatus === 'SUCCESS' 
              ? 'bg-green-600 text-white border-green-500/20' 
              : (isDark ? 'bg-[#177ddc] hover:bg-[#1668dc] text-white border-blue-400/20' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/20')
          }`}
        >
          {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : publishStatus === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : <CloudUpload className="w-4 h-4" />}
          {isPublishing ? '正在发布中...' : publishStatus === 'SUCCESS' ? '已成功灌入系统' : '发布至问数系统'}
        </button>

        <button 
          onClick={handleExport}
          className={`group w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 border ${
            isDark ? 'bg-[#1d1d1d] text-slate-400 border-[#303030] hover:bg-[#1f1f1f] hover:text-white' : 'bg-gray-50 text-slate-500 border-gray-200 hover:bg-gray-100 hover:text-slate-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          下载离线治理成果包
        </button>
      </div>
    </div>
  );
};
