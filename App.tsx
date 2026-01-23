
import React, { useState, useMemo, useEffect } from 'react';
import { SourceSidebar } from './components/SourceSidebar';
import { AnalysisCenter } from './components/AnalysisCenter';
import { GovernanceStudio } from './components/GovernanceStudio';
import { DataSource, DataDomain, GovernanceResult, SourceType } from './types';
import { performGovernanceAnalysis } from './services/geminiService';
import { X, LayoutDashboard, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [domains, setDomains] = useState<DataDomain[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [governanceResult, setGovernanceResult] = useState<GovernanceResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string; result?: GovernanceResult }[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [activeNavTab, setActiveNavTab] = useState('智能治数');

  const navItems = [
    '智能治数', '对象管理', '业务术语', '业务知识', '业务查询示例', 
    'MCP 服务', '热数据管理', '分析管理', '用户管理', '角色管理'
  ];

  const activeDomain = useMemo(() => 
    domains.find(d => d.id === activeDomainId) || null
  , [domains, activeDomainId]);

  const activeDomainSources = useMemo(() => 
    sources.filter(s => s.domainId === activeDomainId)
  , [sources, activeDomainId]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAddDomain = (name: string, description: string) => {
    const newDomain: DataDomain = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      timestamp: Date.now()
    };
    setDomains(prev => [...prev, newDomain]);
    setActiveDomainId(newDomain.id);
    setSelectedSource(null);
  };

  const handleSelectDomain = (id: string) => {
    setActiveDomainId(id);
    setSelectedSource(null); 
  };

  const handleAddSource = (type: SourceType, name: string, content: string) => {
    if (!activeDomainId) return;
    const newSource: DataSource = {
      id: Math.random().toString(36).substr(2, 9),
      domainId: activeDomainId,
      name,
      type,
      content,
      timestamp: Date.now()
    };
    setSources(prev => [...prev, newSource]);
  };

  const handleStartGovernance = async (prompt: string) => {
    if (!activeDomainId) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "请先在左侧选择或创建一个业务数据域。" }]);
      return;
    }
    
    if (activeDomainSources.length === 0) {
      setChatHistory(prev => [...prev, { role: 'ai', text: `在 [${activeDomain?.name}] 业务域下暂无数据资产。请先接入元数据（如 DDL 或数据字典）以供分析。` }]);
      return;
    }
    
    setIsAnalyzing(true);
    setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);

    try {
      const sourceContext = activeDomainSources.map(s => `[资产类型: ${s.type}, 资产名称: ${s.name}]\n资产内容: ${s.content}`).join('\n\n');
      const result = await performGovernanceAnalysis(sourceContext, prompt);
      
      setGovernanceResult(result);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `分析已完成。基于 [${activeDomain?.name}] 业务域下的 ${activeDomainSources.length} 个数据资产，我已完成本体建模与知识沉淀。您可以在右侧面板查看具体成果。`,
        result: result 
      }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'ai', text: "抱歉，分析过程中出现了错误。请检查您的元数据内容并重试。" }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#141414] text-[rgba(255,255,255,0.85)]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.88)]'}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 border-b flex items-center px-6 z-50 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0] shadow-sm'}`}>
        <div className="flex items-center gap-8 h-full">
          <img 
            src="https://www.uino.com/images/mhgfp1qu-qktnngs.png" 
            alt="UINO Logo" 
            className={`h-7 w-auto ${theme === 'dark' ? 'brightness-110' : ''}`}
          />
          <nav className="flex items-center h-full">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNavTab(item)}
                className={`relative px-4 h-full text-[13px] font-semibold transition-colors ${
                  activeNavTab === item 
                    ? (theme === 'dark' ? 'text-[#177ddc]' : 'text-[#1677ff]')
                    : (theme === 'dark' ? 'text-[rgba(255,255,255,0.65)] hover:text-white' : 'text-[rgba(0,0,0,0.65)] hover:text-[#1677ff]')
                }`}
              >
                {item}
                {activeNavTab === item && (
                  <span className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-t-full transition-colors ${theme === 'dark' ? 'bg-[#177ddc] shadow-[0_0_8px_#177ddc]' : 'bg-[#1677ff]'}`}></span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-[#1d1d1d] text-yellow-400 border border-[#303030]' : 'bg-gray-100 text-slate-600 border border-gray-200'}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${theme === 'dark' ? 'text-blue-300 bg-blue-500/20 border-blue-500/40' : 'text-blue-600 bg-blue-50 border-blue-200'}`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'}`}></span>
              </span>
              智能治理引擎
            </span>
          </div>
        </div>
      </header>

      <main className="flex w-full pt-16 h-full relative">
        {/* Left Sidebar */}
        <aside className={`w-80 h-full border-r flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
          <SourceSidebar 
            domains={domains}
            sources={activeDomainSources}
            activeDomainId={activeDomainId}
            onAddDomain={handleAddDomain}
            onSelectDomain={handleSelectDomain}
            onAddSource={handleAddSource} 
            onSelectSource={setSelectedSource}
            activeSourceId={selectedSource?.id}
            theme={theme}
          />
        </aside>

        {/* Center */}
        <section className={`flex-1 h-full overflow-hidden relative transition-colors ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
          {selectedSource ? (
            <div className={`absolute inset-0 z-10 p-8 overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-300 transition-colors ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <div className={`flex items-center justify-between mb-6 pb-4 border-b ${theme === 'dark' ? 'border-[#303030]' : 'border-gray-100'}`}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeDomain?.name}</span>
                    <span className="text-[10px] text-slate-700">/</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">资产详情：{selectedSource.type}</span>
                  </div>
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedSource.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedSource(null)}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1d1d1d] text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className={`p-6 rounded-2xl border shadow-2xl transition-colors ${theme === 'dark' ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                 <pre className={`font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                  {selectedSource.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {activeDomain && (
                 <div className={`px-8 py-3 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>当前治数域: {activeDomain.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-slate-400">已接入资产: {activeDomainSources.length}</span>
                    </div>
                 </div>
              )}
              <AnalysisCenter 
                isAnalyzing={isAnalyzing} 
                chatHistory={chatHistory} 
                onAnalyze={handleStartGovernance} 
                activeDomainName={activeDomain?.name}
                theme={theme}
              />
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className={`w-[460px] h-full border-l flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
          <GovernanceStudio result={governanceResult} theme={theme} />
        </aside>
      </main>
    </div>
  );
};

export default App;
