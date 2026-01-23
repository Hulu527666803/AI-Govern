import React, { useState, useMemo, useEffect } from 'react';
import { SourceSidebar } from './components/SourceSidebar';
import { AnalysisCenter } from './components/AnalysisCenter';
import { GovernanceStudio } from './components/GovernanceStudio';
import { DataSource, DataDomain, GovernanceResult, SourceType, AISettings, AIEngineType } from './types';
import { performGovernanceAnalysis } from './services/aiService';
// Fix: Added missing Zap icon to the lucide-react imports
import { X, LayoutDashboard, Sun, Moon, Settings as SettingsIcon, Cpu, Globe, Save, ShieldCheck, Zap } from 'lucide-react';

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
  
  // AI Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('uino_ai_settings');
    return saved ? JSON.parse(saved) : {
      engine: 'GEMINI_SDK',
      baseUrl: 'https://api.openai.com/v1',
      modelName: 'gemini-3-pro-preview'
    };
  });

  const saveSettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    localStorage.setItem('uino_ai_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

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
      setChatHistory(prev => [...prev, { role: 'ai', text: `在 [${activeDomain?.name}] 业务域下暂无数据资产。请先接入元数据以供分析。` }]);
      return;
    }
    
    setIsAnalyzing(true);
    setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);

    try {
      const sourceContext = activeDomainSources.map(s => `[资产类型: ${s.type}, 资产名称: ${s.name}]\n资产内容: ${s.content}`).join('\n\n');
      const result = await performGovernanceAnalysis(sourceContext, prompt, aiSettings);
      
      setGovernanceResult(result);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `分析已完成。模型使用 [${aiSettings.modelName}] 完成了建模推演。`,
        result: result 
      }]);
    } catch (error: any) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'ai', text: `分析出错: ${error.message || "请求失败"}` }]);
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
        <div className="ml-auto flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${theme === 'dark' ? 'bg-[#1d1d1d] border-[#303030] text-slate-300 hover:text-white' : 'bg-gray-100 border-gray-200 text-slate-600 hover:bg-white hover:border-blue-400'}`}
          >
            <SettingsIcon size={14} />
            AI 配置
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-[#1d1d1d] text-yellow-400 border border-[#303030]' : 'bg-gray-100 text-slate-600 border border-gray-200'}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="flex w-full pt-16 h-full relative">
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
                <button onClick={() => setSelectedSource(null)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1d1d1d] text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}><X size={20} /></button>
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
                       <span className={`text-[10px] px-2 py-0.5 rounded border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>{aiSettings.modelName}</span>
                    </div>
                 </div>
              )}
              <AnalysisCenter 
                isAnalyzing={isAnalyzing} 
                chatHistory={chatHistory} 
                onAnalyze={handleStartGovernance} 
                onOpenSettings={() => setShowSettings(true)}
                activeDomainName={activeDomain?.name}
                aiSettings={aiSettings}
                theme={theme}
              />
            </div>
          )}
        </section>

        <aside className={`w-[460px] h-full border-l flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
          <GovernanceStudio result={governanceResult} theme={theme} />
        </aside>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowSettings(false)}></div>
          <div className={`relative w-full max-w-lg rounded-[40px] border shadow-[0_25px_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-300 ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-200'}`}>
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI 核心引擎配置</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-black">定义治数大模型的接入协议与参数</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">引擎协议架构</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'GEMINI_SDK', label: 'Gemini Native', desc: '原生 SDK 加速', icon: <Zap size={20} /> },
                      { id: 'OPENAI_COMPATIBLE', label: 'Universal AI', desc: 'OpenAI 兼容协议', icon: <Globe size={20} /> }
                    ].map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => setAiSettings({...aiSettings, engine: engine.id as AIEngineType})}
                        className={`flex flex-col items-start gap-3 p-5 rounded-3xl border-2 transition-all ${
                          aiSettings.engine === engine.id 
                            ? (theme === 'dark' ? 'bg-[#177ddc]/10 border-[#177ddc] text-white' : 'bg-blue-50 border-blue-500 text-blue-700') 
                            : (theme === 'dark' ? 'bg-black/40 border-[#303030] text-slate-500 hover:border-slate-600' : 'bg-gray-50 border-gray-100 text-slate-400 hover:bg-white')
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${aiSettings.engine === engine.id ? 'bg-[#177ddc] text-white' : (theme === 'dark' ? 'bg-[#1d1d1d] text-slate-500' : 'bg-white text-slate-400')}`}>
                          {engine.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{engine.label}</div>
                          <div className="text-[10px] font-medium opacity-60">{engine.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">模型标识符 (Model Name)</label>
                    <input 
                      className={`w-full px-5 h-14 rounded-2xl border outline-none font-bold transition-colors ${theme === 'dark' ? 'bg-black border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                      placeholder={aiSettings.engine === 'GEMINI_SDK' ? "gemini-3-pro-preview" : "gpt-4o"}
                      value={aiSettings.modelName}
                      onChange={e => setAiSettings({...aiSettings, modelName: e.target.value})}
                    />
                  </div>

                  {aiSettings.engine === 'OPENAI_COMPATIBLE' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API Base URL</label>
                      <input 
                        className={`w-full px-5 h-14 rounded-2xl border outline-none font-mono text-xs transition-colors ${theme === 'dark' ? 'bg-black border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                        placeholder="https://api.openai.com/v1"
                        value={aiSettings.baseUrl}
                        onChange={e => setAiSettings({...aiSettings, baseUrl: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-colors ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      <ShieldCheck size={20} />
                   </div>
                   <div className="flex-1">
                      <div className={`text-[11px] font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>API 密钥安全托管</div>
                      <div className="text-[9px] text-slate-500 font-medium">密钥统一由环境变量注入，确保生产环境凭证安全。</div>
                   </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => saveSettings(aiSettings)}
                    className={`w-full py-5 rounded-3xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl group ${theme === 'dark' ? 'bg-[#177ddc] hover:bg-[#1668dc] text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                    应用 AI 配置并保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;