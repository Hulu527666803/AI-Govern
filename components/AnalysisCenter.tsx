import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Brain, CheckCircle2, User, Bot, Paperclip, Cpu, Settings as SettingsIcon, Zap, Globe } from 'lucide-react';
import { GovernanceResult, ThinkingStep, AISettings } from '../types';
import { ContextPanel } from './ContextPanel';
import { SessionPanel } from './SessionPanel';

interface AnalysisCenterProps {
  isAnalyzing: boolean;
  chatHistory: { role: 'user' | 'ai'; text: string; result?: GovernanceResult }[];
  onAnalyze: (prompt: string) => void;
  onOpenSettings: () => void;
  activeDomainName?: string;
  aiSettings: AISettings;
  theme?: 'light' | 'dark';
}

const ThinkingLog: React.FC<{ steps: ThinkingStep[]; isLive?: boolean; theme?: 'light' | 'dark' }> = ({ steps, isLive, theme = 'dark' }) => {
  const [visibleCount, setVisibleCount] = useState(isLive ? 0 : steps.length);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setVisibleCount(prev => (prev < steps.length ? prev + 1 : prev));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive, steps.length]);

  return (
    <div className="mb-6 space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Cpu className={`w-4 h-4 animate-pulse ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {isLive ? '正在实时进行 G-ABC 范式推演...' : 'G-ABC 治理推演路径存档'}
        </span>
      </div>
      
      {steps.slice(0, visibleCount).map((step, idx) => (
        <div key={idx} className={`border rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-left-2 duration-700 transition-colors ${isDark ? 'bg-[#1d1d1d]/40 border-[#303030]' : 'bg-white border-gray-100 shadow-sm'}`}>
           <div className={`px-5 py-3 flex items-center gap-3 border-b transition-colors ${isDark ? 'border-[#303030]/40 bg-black/20' : 'bg-gray-50/50 border-gray-50'}`}>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                {step.phase} 阶段
              </span>
              <h4 className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{step.title}</h4>
              {isLive && idx === visibleCount - 1 && <Loader2 className={`w-3 h-3 animate-spin ml-auto ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />}
           </div>
           <div className="p-4 space-y-3">
              <p className={`text-[11px] leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{step.description}</p>
              <div className="flex flex-wrap gap-2">
                {step.details.map((d, i) => (
                  <span key={i} className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${isDark ? 'text-slate-400 bg-[#1d1d1d] border-[#303030]/50' : 'text-slate-500 bg-gray-50 border-gray-100'}`}>
                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-blue-500/50' : 'bg-blue-400'}`} />
                    {d}
                  </span>
                ))}
              </div>
           </div>
        </div>
      ))}
    </div>
  );
};

export const AnalysisCenter: React.FC<AnalysisCenterProps> = ({ isAnalyzing, chatHistory, onAnalyze, onOpenSettings, activeDomainName, aiSettings, theme = 'dark' }) => {
  const [input, setInput] = useState('');
  const [liveSteps, setLiveSteps] = useState<ThinkingStep[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isAnalyzing, liveSteps]);

  useEffect(() => {
    if (isAnalyzing) {
      const mockSteps: ThinkingStep[] = [
        { phase: 'G', title: '物理资产元数据解析', description: '正在扫描原始表结构、DDL 或数据字典，提取物理模型定义...', details: ['解析物理字段', '识别主外键', '读取元数据注释'] },
        { phase: 'A', title: '业务对象语义映射', description: '将晦涩的物理表名、字段名映射为具备业务含义的对象本体...', details: ['中文语义标注', '对象边界识别', '属性逻辑归类'] },
        { phase: 'B', title: '本体拓扑关系粘合', description: '基于数据关联路径推演业务实体间的逻辑关系（1:N, N:N）...', details: ['拓扑网络构建', '基数规则匹配', '业务血缘粘合'] },
        { phase: 'C', title: '语义化知识规则编排', description: '正在将计算逻辑、业务约束转换为普通人可读的自然语言规则...', details: ['计算口径沉淀', '指标语义定义', '业务规则编排'] },
      ];
      setLiveSteps([]);
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < mockSteps.length) {
          setLiveSteps(prev => [...prev, mockSteps[currentIdx]]);
          currentIdx++;
        } else { clearInterval(interval); }
      }, 2500);
      return () => clearInterval(interval);
    } else { setLiveSteps([]); }
  }, [isAnalyzing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAnalyzing) {
      onAnalyze(input);
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col h-full relative transition-colors ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-40">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          {/* 会话管理面板 */}
          <div className="animate-in fade-in duration-300">
            <SessionPanel theme={theme} />
          </div>
          
          {/* 上下文历史面板 */}
          {chatHistory.length > 0 && (
            <div className="animate-in fade-in duration-300">
              <ContextPanel theme={theme} />
            </div>
          )}
          
          <div className="space-y-12">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-700">
              <div className="relative mb-12 group cursor-pointer" onClick={onOpenSettings}>
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isDark ? 'bg-gradient-to-br from-[#177ddc] to-[#1668dc] text-white shadow-[0_0_60px_rgba(23,125,220,0.3)] border-[#177ddc]/30' : 'bg-white text-[#1677ff] shadow-2xl border-gray-100'}`}>
                  {aiSettings.engine === 'GEMINI_SDK' ? <Sparkles className="w-10 h-10" /> : <Brain className="w-10 h-10" />}
                </div>
                <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-xl border shadow-xl transition-all ${isDark ? 'bg-black border-[#303030] text-slate-400 group-hover:text-blue-400' : 'bg-white border-gray-200 text-slate-500 group-hover:text-blue-500'}`}>
                  <SettingsIcon size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                </div>
              </div>

              <h2 className={`text-3xl font-bold mb-4 tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDomainName ? `智能治数域：${activeDomainName}` : '准备好开始了吗？'}
              </h2>
              
              <div className={`flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full border transition-all ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-400' : 'bg-white border-gray-200 text-slate-500 shadow-sm'}`}>
                <Zap size={14} className="text-blue-400" />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  AI 引擎: 后端统一配置 (Gemini 2.0 Flash)
                </span>
              </div>

              <p className={`max-w-md text-sm leading-relaxed mb-12 font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeDomainName 
                  ? `我已准备好对 [${activeDomainName}] 域进行 G-ABC 本体分析。下达指令后，您将实时看到我的思考推演过程。`
                  : '请先在左侧侧边栏选择一个业务数据域，并接入元数据资产。'}
              </p>
              
              {activeDomainName && (
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-xl">
                  {[ "自动识别核心业务对象", "推测实体拓扑关联", "提取业务术语与定义", "解析业务逻辑指标" ].map((text, idx) => (
                    <button 
                      key={idx}
                      onClick={() => onAnalyze(text)}
                      className={`px-4 py-2.5 border rounded-xl text-xs font-bold transition-all shadow-sm ${isDark ? 'bg-[#141414] border-[#303030] text-slate-300 hover:border-blue-500 hover:text-white hover:bg-blue-500/5' : 'bg-white border-gray-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-colors ${
                  msg.role === 'user' 
                    ? (isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-300' : 'bg-white border-gray-200 text-slate-600') 
                    : (isDark ? 'bg-[#177ddc] border-[#1668dc] text-white' : 'bg-blue-600 border-blue-500 text-white')
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 transition-colors ${
                    msg.role === 'user' 
                      ? (isDark ? 'bg-[#1d1d1d] border border-[#303030] text-slate-100 rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 text-slate-800 rounded-2xl rounded-tr-none shadow-sm') 
                      : (isDark ? 'text-slate-100' : 'text-slate-800')
                  }`}>
                    {msg.role === 'ai' && msg.result?.thinkingSteps && (
                      <ThinkingLog steps={msg.result.thinkingSteps} theme={theme} />
                    )}
                    
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.text}
                    </div>

                    {msg.role === 'ai' && msg.result?.summary && (
                      <div className={`mt-8 p-5 border rounded-2xl flex gap-4 transition-colors ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                        <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border ${isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-600'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>治理成果摘要</p>
                          <p className={`text-[13px] leading-relaxed font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{msg.result.summary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isAnalyzing && (
            <div className="flex gap-4">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isDark ? 'bg-[#177ddc] border-[#1668dc] text-white shadow-[0_0_15px_rgba(23,125,220,0.3)]' : 'bg-blue-600 border-blue-500 text-white shadow-md'}`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <ThinkingLog steps={liveSteps} isLive theme={theme} />
                <div className={`flex items-center gap-3 mt-4 text-xs font-bold animate-pulse ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                   <Brain className="w-4 h-4" />
                   <span>正在实时编排业务本体架构...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 pt-10 pb-8 px-6 z-20 transition-colors ${isDark ? 'bg-gradient-to-t from-black via-black/95 to-transparent' : 'bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent'}`}>
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative group">
            <div className={`relative border rounded-[28px] shadow-2xl p-2 pr-2.5 flex items-end gap-2 transition-all focus-within:border-blue-500/50 ${isDark ? 'bg-[#1d1d1d] border-[#303030] shadow-[0_15px_40px_rgba(0,0,0,0.6)] focus-within:bg-black' : 'bg-white border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)] focus-within:border-blue-300'}`}>
              <button 
                type="button" 
                onClick={onOpenSettings}
                className={`p-3 transition-colors ${isDark ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
                title="AI 引擎配置"
              >
                <Cpu className="w-5 h-5" />
              </button>
              
              <textarea 
                rows={1}
                className={`flex-1 bg-transparent border-none focus:ring-0 px-2 py-3 text-[15px] outline-none placeholder:text-slate-600 font-medium resize-none max-h-40 overflow-y-auto no-scrollbar transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}
                placeholder={activeDomainName ? `在 [${activeDomainName}] 中发起治数推演...` : "请先在左侧选择业务域"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                disabled={isAnalyzing || !activeDomainName}
              />

              <div className="flex items-center gap-1.5 pb-1">
                <button 
                  type="submit"
                  disabled={!input.trim() || isAnalyzing || !activeDomainName}
                  className={`p-2.5 rounded-2xl transition-all flex items-center justify-center ${
                    input.trim() && !isAnalyzing && activeDomainName 
                      ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95' 
                      : (isDark ? 'text-slate-700 bg-black/40' : 'text-slate-300 bg-gray-50')
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
          <p className={`mt-3 text-center text-[10px] font-medium tracking-wide uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            UINO 智能治理专家 · 当前模型: {aiSettings.modelName}
          </p>
        </div>
      </div>
    </div>
  );
};
