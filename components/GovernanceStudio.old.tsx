
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import JSZip from 'jszip';
import { GovernanceResult, OntologyObject, Relationship, DataSource } from '../types';
import { ICONS } from '../constants';
import { 
  ChevronDown, ChevronRight, Layers, Network, Table as TableIcon, Download, Lightbulb, Hash, AlertCircle, FileSearch, Share2, Move, CloudUpload, CheckCircle, Loader2 
} from 'lucide-react';
import { useDomain } from '../hooks/useSession';

interface GovernanceStudioProps {
  result: GovernanceResult | null;
  theme?: 'light' | 'dark';
  selectedSource?: DataSource | null;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  businessName: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  label: string;
}

export const GovernanceStudio: React.FC<GovernanceStudioProps> = ({ result, theme = 'dark', selectedSource }) => {
  const [activeTab, setActiveTab] = useState<'ONTOLOGY' | 'GLOSSARY' | 'METRICS' | 'SAMPLES'>('ONTOLOGY');
  const [showGraph, setShowGraph] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  
  // Publish states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishStep, setPublishStep] = useState<'CONFIG' | 'PROGRESS' | 'RESULT'>('CONFIG');
  const [publishConfig, setPublishConfig] = useState({ baseUrl: '', authHeader: '', namespace: '' });
  const [publishProgress, setPublishProgress] = useState({ percent: 0, messages: [] as string[] });
  const [publishResultJson, setPublishResultJson] = useState<any>(null);
  const { activeDomainName } = useDomain();

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'M3' | 'MYSQL' | 'DM'>('M3');

  const svgRef = useRef<SVGSVGElement>(null);
  const isDark = theme === 'dark';

  // 字段变更分析：比较原始元数据和AI治理结果
  const analyzeFieldChanges = () => {
    if (!selectedSource || !result) return {};

    const changes: Record<string, { added: string[], removed: string[] }> = {};

    // 解析原始元数据（假设存储在 selectedSource.content 中）
    let originalTables: Record<string, string[]> = {};
    try {
      const metadata = JSON.parse(selectedSource.content);
      if (Array.isArray(metadata)) {
        metadata.forEach((table: any) => {
          const tableName = table.tableName || table.name;
          const columns = (table.columns || []).map((col: any) => 
            col.columnName || col.name || col.COLUMN_NAME
          );
          originalTables[tableName] = columns;
        });
      }
    } catch (error) {
      console.warn('无法解析原始元数据:', error);
    }

    // 比较每个治理对象
    result.objects.forEach(obj => {
      // 找到对应的原始表（通过 mappings 字段）
      const mapping = obj.mappings?.[0];
      if (!mapping) return;

      const tableName = mapping.split('.')[0];
      const originalColumns = originalTables[tableName] || [];
      const governedColumns = obj.attributes?.map(attr => attr.name) || [];

      // 计算新增和删除的字段
      const added = governedColumns.filter(col => !originalColumns.includes(col));
      const removed = originalColumns.filter(col => !governedColumns.includes(col));

      if (added.length > 0 || removed.length > 0) {
        changes[obj.id] = { added, removed };
      }
    });

    return changes;
  };

  const fieldChanges = analyzeFieldChanges();

  // ... useEffect ...

  useEffect(() => {
    if (showGraph && result) {
      setTimeout(() => {
        renderD3Graph();
      }, 100);
    }
  }, [showGraph, result, theme]);

  const handlePublishClick = () => {
      // Check if env is configured (mock check)
      // For now, always show config modal or check backend status (omitted for brevity, assume manual config for "unconfigured" case)
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
          
          // Poll for status
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
                 // Don't stop polling immediately on transient network error, but maybe count failures?
                 console.warn("Polling error", pollErr);
              }
          }, 1000);
          
      } catch (e: any) {
          alert('请求失败: ' + e.message);
          setPublishStep('CONFIG');
      }
  };

  // ... handleExport ...

  // Render Modals helper
  const renderPublishModal = () => {
      if (!isPublishModalOpen) return null;
      
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className={`w-[600px] max-h-[80vh] overflow-y-auto rounded-xl p-6 shadow-2xl ${isDark ? 'bg-[#1f1f1f] text-gray-100' : 'bg-white text-gray-900'}`}>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CloudUpload className="w-5 h-5" /> 发布至问数系统 (M3)
                  </h3>
                  
                  {publishStep === 'CONFIG' && (
                      <div className="space-y-4">
                          <p className="text-sm opacity-70">请配置 M3 数据库连接信息。如果后台已配置环境变量，可直接点击开始。</p>
                          <div>
                              <label className="block text-sm mb-1">Base URL</label>
                              <input 
                                  type="text" 
                                  value={publishConfig.baseUrl}
                                  onChange={e => setPublishConfig({...publishConfig, baseUrl: e.target.value})}
                                  placeholder="http://10.100.30.128:8080"
                                  className={`w-full p-2 rounded border ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-300'}`}
                              />
                          </div>
                          <div>
                              <label className="block text-sm mb-1">Authorization Header</label>
                              <input 
                                  type="text" 
                                  value={publishConfig.authHeader}
                                  onChange={e => setPublishConfig({...publishConfig, authHeader: e.target.value})}
                                  placeholder="Basic xxxxxxx"
                                  className={`w-full p-2 rounded border ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-300'}`}
                              />
                          </div>
                          <div>
                              <label className="block text-sm mb-1">命名空间 (Namespace)</label>
                              <input 
                                  type="text" 
                                  value={publishConfig.namespace || activeDomainName || ''}
                                  onChange={e => setPublishConfig({...publishConfig, namespace: e.target.value})}
                                  placeholder="留空则使用当前域名称"
                                  className={`w-full p-2 rounded border ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-300'}`}
                              />
                          </div>
                          <div className="flex justify-end gap-3 mt-6">
                              <button onClick={() => setIsPublishModalOpen(false)} className="px-4 py-2 rounded hover:bg-gray-700">取消</button>
                              <button onClick={startPublish} className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500">开始发布</button>
                          </div>
                      </div>
                  )}
                  
                  {publishStep === 'PROGRESS' && (
                      <div className="space-y-4">
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${publishProgress.percent}%` }}></div>
                          </div>
                          <div className="text-sm text-right">{publishProgress.percent}%</div>
                          <div className={`h-40 overflow-y-auto p-2 rounded text-xs font-mono ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
                              {publishProgress.messages.map((msg, i) => (
                                  <div key={i}>{msg}</div>
                              ))}
                              <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
                          </div>
                          <div className="flex justify-end mt-4">
                              <button onClick={() => setIsPublishModalOpen(false)} className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-500">关闭</button>
                          </div>
                      </div>
                  )}

                  {publishStep === 'RESULT' && (
                      <div className="space-y-4">
                          <div className="flex items-center gap-2 text-green-500 mb-2">
                              <CheckCircle className="w-5 h-5" /> 发布成功
                          </div>
                          <div className="text-sm opacity-70">以下是 M3 系统所需的元数据 JSON：</div>
                          <pre className={`h-60 overflow-auto p-3 rounded text-xs font-mono ${isDark ? 'bg-black text-green-400' : 'bg-gray-100 text-green-700'}`}>
                              {JSON.stringify(publishResultJson, null, 2)}
                          </pre>
                          <div className="flex justify-end mt-4">
                              <button onClick={() => setIsPublishModalOpen(false)} className="px-4 py-2 bg-blue-600 rounded text-white">关闭</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };


  const handleDownload = async () => {
    if (!result) return;
    
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().slice(0,10);
      
      // 1. 调用后端生成完整导出包（传递 exportType）
      const response = await fetch('/api/export/package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify({ 
          result,
          exportType  // 传递用户选择的导出类型
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '后端生成导出包失败');
      }
      
      const { data } = await response.json();
      
      // 2. 治理结果原始 JSON（保留用于系统导入）
      zip.file("governance_result.json", JSON.stringify(result, null, 2));
      
      // 3. 脚本文件（根据 exportType 命名）
      const scriptFileName = exportType === 'M3' ? 'M3_script.sql' : 
                            exportType === 'MYSQL' ? 'MySQL_script.sql' : 
                            'DM_script.sql';
      zip.file(`3_脚本/${scriptFileName}`, data.m3Script || data.script);
      
      // 4. 数据结构分析文档（后端生成）
      zip.file("1_数据结构分析/structure_analysis.md", data.dataStructureDoc);
      zip.file("1_数据结构分析/objects.json", JSON.stringify(result.objects || [], null, 2));
      
      // 5. 关系结构分析文档（后端生成）
      zip.file("2_关系结构分析/relationship_analysis.md", data.relationshipDoc);
      zip.file("2_关系结构分析/relationships.json", JSON.stringify(result.relationships || [], null, 2));
      
      // 6. 数据治理说明文档（后端生成）
      zip.file("4_数据治理说明文档/README.md", data.governanceDoc);

      // 生成并下载 ZIP
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

  // M3 脚本生成已移至后端，前端不再需要此函数

  /**
   * 生成数据结构分析文档（中文描述）
   */
  const generateDataStructureDoc = (result: any): string => {
    const lines: string[] = [];
    lines.push('# 数据结构分析报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**数据域**: ${selectedSource?.name || '未知'}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    lines.push('## 1. 数据概览');
    lines.push('');
    lines.push(`本次数据治理共识别出 **${result.objects.length} 个核心业务对象**，涵盖了业务系统的主要数据实体。以下是每个对象的详细结构说明：`);
    lines.push('');
    
    result.objects.forEach((obj: any, index: number) => {
      lines.push(`### ${index + 1}. ${obj.businessName}`);
      lines.push('');
      lines.push(`**技术名称**: \`${obj.name}\``);
      lines.push('');
      lines.push(`**业务含义**: ${obj.description || '暂无描述'}`);
      lines.push('');
      lines.push(`**所属领域**: ${obj.domain || '未分类'}`);
      lines.push('');
      
      if (obj.mappings && obj.mappings.length > 0) {
        lines.push(`**物理映射**: ${obj.mappings.join(', ')}`);
        lines.push('');
      }
      
      lines.push('#### 数据结构详情');
      lines.push('');
      lines.push('| 字段业务名 | 技术名称 | 数据类型 | 说明 |');
      lines.push('|----------|---------|---------|------|');
      
      obj.attributes.forEach((attr: any) => {
        const businessName = attr.businessName || attr.name;
        const techName = attr.name;
        const type = attr.type || 'UNKNOWN';
        const desc = attr.description || '无';
        lines.push(`| ${businessName} | \`${techName}\` | ${type} | ${desc} |`);
      });
      
      lines.push('');
      
      // 样例数据
      const sampleData = result.sampleData?.find((s: any) => 
        s.objectName === obj.businessName || s.objectName === obj.name
      );
      
      if (sampleData && sampleData.rows && sampleData.rows.length > 0) {
        lines.push('#### 数据样例');
        lines.push('');
        lines.push('以下是该对象的模拟数据示例，用于帮助理解业务语义：');
        lines.push('');
        
        const columns = sampleData.columns || Object.keys(sampleData.rows[0]);
        lines.push(`| ${columns.join(' | ')} |`);
        lines.push(`| ${columns.map(() => '---').join(' | ')} |`);
        
        sampleData.rows.forEach((row: any) => {
          const values = columns.map((col: string) => row[col] || '-');
          lines.push(`| ${values.join(' | ')} |`);
        });
        
        lines.push('');
      }
      
      lines.push('---');
      lines.push('');
    });
    
    return lines.join('\n');
  };

  /**
   * 生成关系结构分析文档（中文描述）
   */
  const generateRelationshipDoc = (result: any): string => {
    const lines: string[] = [];
    lines.push('# 关系结构分析报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**数据域**: ${selectedSource?.name || '未知'}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    lines.push('## 1. 关系网络概览');
    lines.push('');
    
    if (!result.relationships || result.relationships.length === 0) {
      lines.push('本次治理未识别出明确的业务对象关系。这可能是因为：');
      lines.push('- 数据源为单表或独立实体');
      lines.push('- 关系隐含在业务逻辑中，未通过外键等方式显式表达');
      lines.push('');
      return lines.join('\n');
    }
    
    lines.push(`本次数据治理共识别出 **${result.relationships.length} 个业务关系**，构建了业务对象之间的逻辑关联网络。`);
    lines.push('');
    
    result.relationships.forEach((rel: any, index: number) => {
      const sourceObj = result.objects.find((o: any) => o.id === rel.sourceId);
      const targetObj = result.objects.find((o: any) => o.id === rel.targetId);
      
      if (!sourceObj || !targetObj) return;
      
      lines.push(`### ${index + 1}. ${sourceObj.businessName} → ${targetObj.businessName}`);
      lines.push('');
      lines.push(`**关系名称**: ${rel.label || '关联'}`);
      lines.push('');
      lines.push(`**关系类型**: ${rel.cardinality || '未知'}`);
      lines.push('');
      
      const cardinalityExplain: Record<string, string> = {
        '1:1': '一对一关系，表示两个对象之间存在唯一映射',
        '1:N': '一对多关系，表示一个源对象可以关联多个目标对象',
        'N:1': '多对一关系，表示多个源对象可以关联同一个目标对象',
        'N:N': '多对多关系，表示双方都可以关联多个对象，通常需要中间表实现'
      };
      
      const explain = cardinalityExplain[rel.cardinality] || '关系类型未明确定义';
      lines.push(`**关系说明**: ${explain}`);
      lines.push('');
      
      if (rel.description) {
        lines.push(`**业务含义**: ${rel.description}`);
        lines.push('');
      }
      
      lines.push(`**关联字段**: 从 \`${sourceObj.name}\` 到 \`${targetObj.name}\``);
      lines.push('');
      
      lines.push('---');
      lines.push('');
    });
    
    lines.push('## 2. 关系拓扑图');
    lines.push('');
    lines.push('> 💡 提示：请在 UINO 平台的「治理工作室」中查看可视化的关系拓扑图。');
    lines.push('');
    
    // 简单的文本表达
    lines.push('### 对象依赖关系');
    lines.push('');
    const graph: Record<string, string[]> = {};
    result.relationships.forEach((rel: any) => {
      const sourceObj = result.objects.find((o: any) => o.id === rel.sourceId);
      const targetObj = result.objects.find((o: any) => o.id === rel.targetId);
      if (sourceObj && targetObj) {
        if (!graph[sourceObj.businessName]) graph[sourceObj.businessName] = [];
        graph[sourceObj.businessName].push(targetObj.businessName);
      }
    });
    
    Object.entries(graph).forEach(([source, targets]) => {
      lines.push(`- **${source}** 依赖/关联：`);
      targets.forEach(target => {
        lines.push(`  - ${target}`);
      });
    });
    lines.push('');
    
    return lines.join('\n');
  };

  /**
   * 生成数据治理说明文档（中文描述）
   */
  const generateGovernanceDoc = (result: any): string => {
    const lines: string[] = [];
    lines.push('# 数据治理说明文档');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**数据域**: ${selectedSource?.name || '未知'}`);
    lines.push(`**治理方法**: G-ABC 智能治理范式`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    lines.push('## 1. 治理概述');
    lines.push('');
    lines.push(result.summary || '本次数据治理旨在通过 AI 智能分析，将物理数据资产转化为业务可理解的语义模型，为「智能问数」功能提供底层支撑。');
    lines.push('');
    
    lines.push('## 2. 治理成果统计');
    lines.push('');
    lines.push('| 治理维度 | 数量 | 说明 |');
    lines.push('|---------|------|------|');
    lines.push(`| 业务对象 | ${result.objects.length} | 识别出的核心业务实体 |`);
    lines.push(`| 业务关系 | ${result.relationships?.length || 0} | 对象间的逻辑关联 |`);
    lines.push(`| 业务术语 | ${result.terms?.length || 0} | 标准化的业务词汇 |`);
    lines.push(`| 治理规则 | ${result.knowledge?.length || 0} | 固化的业务逻辑和指标 |`);
    lines.push('');
    
    // 业务术语词典
    if (result.terms && result.terms.length > 0) {
      lines.push('## 3. 业务术语词典');
      lines.push('');
      lines.push('以下是本次治理提取的标准业务术语，用于统一团队对业务概念的理解：');
      lines.push('');
      
      result.terms.forEach((term: any, index: number) => {
        lines.push(`### 3.${index + 1} ${term.term}`);
        lines.push('');
        lines.push(`**定义**: ${term.definition}`);
        lines.push('');
        
        if (term.aliases && term.aliases.length > 0) {
          lines.push(`**别名**: ${term.aliases.join('、')}`);
          lines.push('');
        }
        
        if (term.rules && term.rules.length > 0) {
          lines.push('**相关规则**:');
          term.rules.forEach((rule: string) => {
            lines.push(`- ${rule}`);
          });
          lines.push('');
        }
      });
    }
    
    // 业务知识与规则
    if (result.knowledge && result.knowledge.length > 0) {
      lines.push('## 4. 业务知识与规则');
      lines.push('');
      lines.push('以下是从数据治理过程中沉淀的业务逻辑和指标定义：');
      lines.push('');
      
      result.knowledge.forEach((k: any, index: number) => {
        lines.push(`### 4.${index + 1} ${k.title}`);
        lines.push('');
        lines.push(`**类型**: ${k.type === 'RULE' ? '业务规则' : k.type === 'METRIC' ? '指标定义' : '知识说明'}`);
        lines.push('');
        lines.push(`**领域**: ${k.domain || '通用'}`);
        lines.push('');
        lines.push(`**内容说明**: ${k.content}`);
        lines.push('');
        
        if (k.logic) {
          lines.push('**业务逻辑**:');
          lines.push('');
          lines.push(k.logic);
          lines.push('');
        }
      });
    }
    
    lines.push('## 5. 治理思路回溯');
    lines.push('');
    
    if (result.thinkingSteps && result.thinkingSteps.length > 0) {
      lines.push('以下是 AI 治理引擎的思考过程，展示了如何从原始数据演进到业务本体：');
      lines.push('');
      
      result.thinkingSteps.forEach((step: any, index: number) => {
        const phaseMap: Record<string, string> = {
          'A': 'Annotation (业务标注)',
          'B': 'Bonding (本体粘合)',
          'C': 'Codification (规则编排)',
          'M': 'Modification (增量修改)'
        };
        
        const phaseDesc = phaseMap[step.phase] || step.phase;
        lines.push(`### 步骤 ${index + 1}: ${step.title} [${phaseDesc}]`);
        lines.push('');
        lines.push(`**核心思路**: ${step.description}`);
        lines.push('');
        
        if (step.details && step.details.length > 0) {
          lines.push('**详细步骤**:');
          step.details.forEach((detail: string) => {
            lines.push(`- ${detail}`);
          });
          lines.push('');
        }
      });
    } else {
      lines.push('暂无详细的治理思路记录。');
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
    lines.push('## 6. 使用建议');
    lines.push('');
    lines.push('1. **导入平台**: 将 `governance_result.json` 导入 UINO 平台，即可在「智能问数」中使用。');
    lines.push('2. **审查调整**: 建议业务专家审查本文档，对 AI 生成的语义标注进行必要的人工校准。');
    lines.push('3. **持续迭代**: 随着业务发展，可通过「增量修改」功能持续优化治理模型。');
    lines.push('4. **权限控制**: 敏感业务对象请在平台中设置合理的访问权限。');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*本文档由 UINO 智能数据治理平台自动生成*');
    lines.push('');
    
    return lines.join('\n');
  };

  const renderD3Graph = () => {
    try {
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

      // 创建缩放行为
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])  // 允许缩放范围：30% - 300%
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
        });

      svg.call(zoom as any);

      // 创建容器组（用于缩放和平移）
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
        
        // 更新关系标签位置（显示在连线中点）
        linkLabel
          .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
          .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2 - 5);
      });

      // 模拟稳定后，自动缩放到合适大小
      simulation.on("end", () => {
        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(n => {
          if (n.x! < minX) minX = n.x!;
          if (n.y! < minY) minY = n.y!;
          if (n.x! > maxX) maxX = n.x!;
          if (n.y! > maxY) maxY = n.y!;
        });

        // 计算缩放比例和平移
        const padding = 50;
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const scale = Math.min(
          (width - padding * 2) / graphWidth,
          (height - padding * 2) / graphHeight,
          1  // 最大不超过1倍
        );

        const translateX = (width - (minX + maxX) * scale) / 2;
        const translateY = (height - (minY + maxY) * scale) / 2;

        // 应用缩放和平移
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
      {renderPublishModal()}
      {renderExportModal()}
    </div>
  );

  function renderExportModal() {
      if (!isExportModalOpen) return null;
      
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className={`w-[400px] rounded-xl p-6 shadow-2xl ${isDark ? 'bg-[#1f1f1f] text-gray-100' : 'bg-white text-gray-900'}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" /> 导出治理成果包
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm mb-2 opacity-70">选择目标数据库类型</label>
                          <div className="flex flex-col gap-2">
                              {['M3', 'MYSQL', 'DM'].map(type => (
                                  <label key={type} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${exportType === type ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') : (isDark ? 'border-[#303030]' : 'border-gray-200')}`}>
                                      <input 
                                          type="radio" 
                                          name="dbType" 
                                          checked={exportType === type}
                                          onChange={() => setExportType(type as any)}
                                      />
                                      <span>{type} 数据库</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                      
                      <div className="text-xs opacity-50 p-2 bg-gray-500/10 rounded">
                          包含：<br/>
                          1. 数据结构分析<br/>
                          2. 关系结构分析<br/>
                          3. 建表/插入 SQL 脚本 (带注释)<br/>
                          4. 数据治理说明文档
                      </div>

                      <div className="flex justify-end gap-3 mt-6">
                          <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 rounded hover:bg-gray-700">取消</button>
                          <button onClick={handleDownload} className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-500">下载 .zip</button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }
};
