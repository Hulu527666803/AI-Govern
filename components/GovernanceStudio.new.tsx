import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Layers, Network, FileSearch, Lightbulb, TableIcon, Download, Hash, ChevronDown, Share2, CloudUpload, AlertCircle } from 'lucide-react';
import { ICONS } from '../constants';
import { useDomain } from '../hooks/useSession';

// 导入拆分后的模块
import { GovernanceStudioProps, TabType, ExportType, PublishStep, FieldChanges } from './governance/types';
import { analyzeFieldChanges } from './governance/utils';
import { generateDataStructureDoc, generateRelationshipDoc, generateGovernanceDoc } from './governance/documentGenerators';
import { renderD3Graph } from './governance/D3GraphRenderer';
import { PublishModal } from './governance/PublishModal';
import { ExportModal } from './governance/ExportModal';

export const GovernanceStudio: React.FC<GovernanceStudioProps> = ({ result, theme = 'dark', selectedSource }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ONTOLOGY');
  const [showGraph, setShowGraph] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  
  // Publish states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishStep, setPublishStep] = useState<PublishStep>('CONFIG');
  const [publishConfig, setPublishConfig] = useState({ baseUrl: '', authHeader: '', namespace: '' });
  const [publishProgress, setPublishProgress] = useState({ percent: 0, messages: [] as string[] });
  const [publishResultJson, setPublishResultJson] = useState<any>(null);
  const { activeDomainName } = useDomain();

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('M3');

  const svgRef = useRef<SVGSVGElement>(null);
  const isDark = theme === 'dark';

  const fieldChanges = analyzeFieldChanges(selectedSource, result);

  useEffect(() => {
    if (showGraph && result) {
      setTimeout(() => {
        renderD3Graph(svgRef.current, result, isDark);
      }, 100);
    }
  }, [showGraph, result, theme]);

  const handlePublishClick = () => {
    setIsPublishModalOpen(true);
    setPublishStep('CONFIG');
  };

  const startPublish = async () => {
    setPublishStep('PROGRESS');
    setPublishProgress({ percent: 0, messages: ['开始初始化发布任务...'] });
    
    try {
      const response = await fetch('/api/publish/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: publishConfig.namespace || activeDomainName || 'default',
          governanceResult: result,
          config: publishConfig.baseUrl ? publishConfig : undefined
        })
      });
      
      if (!response.ok) throw new Error(await response.text());

      const { taskId } = await response.json();
      
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/publish/status/${taskId}`);
          if (!statusRes.ok) throw new Error("Status check failed");
          const statusData = await statusRes.json();
          
          setPublishProgress({
            percent: statusData.progress || 0,
            messages: statusData.messages || []
          });
          
          if (statusData.status === 'completed') {
            clearInterval(interval);
            setPublishResultJson(statusData.result);
            setPublishStep('RESULT');
          } else if (statusData.status === 'failed') {
            clearInterval(interval);
            alert('发布失败: ' + (statusData.error || 'Unknown error'));
            setPublishStep('CONFIG');
          }
        } catch (pollErr) {
          console.warn("Polling error", pollErr);
        }
      }, 1000);
    } catch (e: any) {
      alert('请求失败: ' + e.message);
      setPublishStep('CONFIG');
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().slice(0,10);
      
      // 调用后端生成完整导出包
      const response = await fetch('/api/export/package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify({ result, exportType })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '后端生成导出包失败');
      }
      
      const { data } = await response.json();
      
      zip.file("governance_result.json", JSON.stringify(result, null, 2));
      
      const scriptFileName = exportType === 'M3' ? 'M3_script.sql' : 
                            exportType === 'MYSQL' ? 'MySQL_script.sql' : 'DM_script.sql';
      zip.file(`3_脚本/${scriptFileName}`, data.m3Script || data.script);
      
      zip.file("1_数据结构分析/structure_analysis.md", data.dataStructureDoc);
      zip.file("1_数据结构分析/objects.json", JSON.stringify(result.objects || [], null, 2));
      
      zip.file("2_关系结构分析/relationship_analysis.md", data.relationshipDoc);
      zip.file("2_关系结构分析/relationships.json", JSON.stringify(result.relationships || [], null, 2));
      
      zip.file("4_数据治理说明文档/README.md", data.governanceDoc);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UINO_数据治理成果_${exportType}_${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("导出失败", error);
      alert("导出失败: " + (error as Error).message);
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
      
      {/* Asset Metadata Section */}
      {selectedSource && (
        <div className={`p-5 border-b transition-colors ${isDark ? 'border-[#303030]' : 'border-[#f0f0f0]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>当前资产</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-tighter ${isDark ? 'text-slate-400 border-[#303030]' : 'text-slate-500 border-gray-200'}`}>{selectedSource.type}</span>
            </div>
          </div>
          <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedSource.name}</h3>
          <div className={`p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
            <pre className={`font-mono text-[10px] leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {selectedSource.content}
            </pre>
          </div>
        </div>
      )}

      {/* Tabs */}
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
              onClick={() => setActiveTab(tab.id as TabType)}
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

      {/* Content Area */}
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
                            
                            {obj.attributes && obj.attributes.length > 0 ? (
                            <div className="space-y-1.5">
                              {obj.attributes.map((attr, i) => {
                                const isAdded = fieldChanges[obj.id]?.added?.includes(attr.name);
                                const borderColor = isAdded 
                                  ? (isDark ? 'border-green-500/50 bg-green-500/5' : 'border-green-400 bg-green-50')
                                  : (isDark ? 'border-[#303030] bg-black/40' : 'border-gray-100 bg-gray-50');
                                
                                return (
                                  <div key={attr.name || `attr-${obj.id}-${i}`} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${borderColor}`}>
                                    <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                      {attr.name}
                                    </span>
                                    {isAdded && (
                                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                        AI新增
                                      </span>
                                    )}
                                    <span className={`text-[11px] flex-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                      {attr.description || attr.businessName || '-'}
                                    </span>
                                    <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-md whitespace-nowrap ${isDark ? 'text-[#177ddc] bg-blue-500/10' : 'text-blue-600 bg-blue-50'}`}>
                                      {attr.type}
                                    </span>
                                  </div>
                                );
                              })}
                              
                              {/* 显示被AI删除的字段 */}
                              {fieldChanges[obj.id]?.removed?.map((removedField, i) => (
                                <div key={`removed-${i}`} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${isDark ? 'border-red-500/50 bg-red-500/5' : 'border-red-400 bg-red-50'}`}>
                                  <span className={`text-[11px] font-mono font-bold line-through ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {removedField}
                                  </span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                                    AI删除
                                  </span>
                                  <span className={`text-[11px] flex-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    该字段已被AI治理移除
                                  </span>
                                </div>
                              ))}
                            </div>
                            ) : (
                              <div className={`text-[11px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                暂无属性信息
                              </div>
                            )}
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
            {result.terms && result.terms.length > 0 ? (
              result.terms.map(term => (
              <div key={term.id} className={`p-6 border rounded-[28px] transition-all relative overflow-hidden group ${isDark ? 'bg-[#1d1d1d] border-[#303030] hover:bg-[#1f1f1f]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-6 -mt-6 transition-colors ${isDark ? 'bg-orange-500/[0.04]' : 'bg-orange-50'}`} />
                <div className="flex justify-between items-start mb-5 relative">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      <Hash className="w-4 h-4" />
                    </div>
                    <h4 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{term.term || '未命名术语'}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {term.aliases && term.aliases.length > 0 && term.aliases.map((a, i) => (
                      <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-[#141414] text-slate-400 border-[#303030]' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>{a}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-5 relative">
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>术语核心释义</p>
                  <p className={`text-[12px] font-medium leading-relaxed px-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{term.definition || '暂无定义'}</p>
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
              ))
            ) : (
              <div className={`p-8 border rounded-[28px] text-center ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-100'}`}>
                <Hash className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>暂无业务术语</p>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>当前治理结果中未提取到标准业务术语</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'METRICS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {result.knowledge && result.knowledge.length > 0 ? (
              result.knowledge.map(k => (
                <div key={k.id} className={`p-7 border rounded-[32px] shadow-sm relative overflow-hidden flex flex-col group transition-all ${isDark ? 'bg-[#1d1d1d] border-[#303030] hover:border-[#177ddc]/20' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                  <div className="flex items-center justify-between mb-5 relative">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl border transition-colors ${isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        <Lightbulb size={16} />
                      </div>
                      <h4 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{k.title || '未命名规则'}</h4>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${isDark ? 'bg-black text-slate-500 border-[#303030]' : 'bg-gray-100 text-slate-500 border-gray-200'}`}>{k.domain || '通用'}</span>
                  </div>
                  {k.logic && (
                    <div className={`p-5 rounded-2xl mb-5 border shadow-inner relative overflow-hidden transition-colors ${isDark ? 'bg-black/60 border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="absolute top-0 right-0 p-3 text-[8px] font-black uppercase tracking-widest pointer-events-none opacity-40">判断规则</div>
                      <p className={`text-[11px] leading-relaxed font-bold ${isDark ? 'text-amber-200/90' : 'text-amber-700'}`}>{k.logic}</p>
                    </div>
                  )}
                  <div className={`p-4 rounded-xl border transition-colors ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-blue-50/30 border-blue-50'}`}>
                    <p className={`text-[11px] leading-relaxed font-medium italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>" {k.content || '暂无内容说明'} "</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-8 border rounded-[28px] text-center ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-100'}`}>
                <Lightbulb className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>暂无业务知识</p>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>当前治理结果中未提取到业务规则和知识</p>
              </div>
            )}
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

      {/* Action Buttons */}
      <div className={`p-6 border-t shrink-0 z-10 space-y-3 transition-colors ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
        <button 
          onClick={handlePublishClick}
          className={`group w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] border ${
            isDark ? 'bg-[#177ddc] hover:bg-[#1668dc] text-white border-blue-400/20' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/20'
          }`}
        >
          <CloudUpload className="w-4 h-4" />
          发布至问数系统
        </button>

        <button 
          onClick={() => setIsExportModalOpen(true)}
          className={`group w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 border ${
            isDark ? 'bg-[#1d1d1d] text-slate-400 border-[#303030] hover:bg-[#1f1f1f] hover:text-white' : 'bg-gray-50 text-slate-500 border-gray-200 hover:bg-gray-100 hover:text-slate-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          下载离线治理成果包
        </button>
      </div>

      {/* Modals */}
      <PublishModal
        isOpen={isPublishModalOpen}
        step={publishStep}
        config={publishConfig}
        progress={publishProgress}
        resultJson={publishResultJson}
        activeDomainName={activeDomainName}
        isDark={isDark}
        onClose={() => setIsPublishModalOpen(false)}
        onConfigChange={setPublishConfig}
        onStart={startPublish}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        exportType={exportType}
        isDark={isDark}
        onClose={() => setIsExportModalOpen(false)}
        onExportTypeChange={setExportType}
        onDownload={handleDownload}
      />
    </div>
  );
};
