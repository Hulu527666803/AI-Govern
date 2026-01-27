import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Brain, CheckCircle2, User, Bot, Paperclip, Cpu, Settings as SettingsIcon, Zap, Globe, MessageSquare, MessageSquarePlus, Trash2 } from 'lucide-react';
import { GovernanceResult, ThinkingStep, AISettings, Session, DataSource } from '../types';
import { ContextPanel } from './ContextPanel';

interface AnalysisCenterProps {
  isAnalyzing: boolean;
  chatHistory: { role: 'user' | 'ai'; text: string; result?: GovernanceResult }[];
  onAnalyze: (prompt: string) => void;
  onOpenSettings: () => void;
  activeDomainName?: string;
  activeSessionId?: string | null;
  aiSettings: AISettings;
  theme?: 'light' | 'dark';
  sessions?: Session[];
  onSelectSession?: (id: string) => void;
  onCreateSession?: () => void;
  onDeleteSession?: (id: string) => void;
  isCreatingSession?: boolean;
  selectedSource?: DataSource | null;
  lastUpdated?: number;
}

// 问题3修复：添加安全检查防止访问 undefined 的 phase 属性
const ThinkingLog: React.FC<{ steps: ThinkingStep[]; isLive?: boolean; theme?: 'light' | 'dark' }> = ({ steps, isLive, theme = 'dark' }) => {
  const visibleCount = steps.length;
  const isDark = theme === 'dark';

  // 过滤掉无效的 step
  const validSteps = steps.filter(step => step && step.phase && step.title);

  if (validSteps.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Cpu className={`w-4 h-4 animate-pulse ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {isLive ? '正在实时进行 G-ABC 范式推演...' : 'G-ABC 治理推演路径存档'}
        </span>
      </div>
      
      {validSteps.slice(0, visibleCount).map((step, idx) => (
        <div key={`${step.phase}-${idx}`} className={`border rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-left-2 duration-700 transition-colors ${isDark ? 'bg-[#1d1d1d]/40 border-[#303030]' : 'bg-white border-gray-100 shadow-sm'}`}>
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
                {step.details?.map((d, i) => (
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

export const AnalysisCenter: React.FC<AnalysisCenterProps> = ({ 
  isAnalyzing, 
  chatHistory, 
  onAnalyze, 
  onOpenSettings, 
  activeDomainName, 
  activeSessionId, 
  aiSettings, 
  theme = 'dark',
  sessions,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isCreatingSession,
  selectedSource,
  lastUpdated
}) => {
  const [input, setInput] = useState('');
  const [liveSteps, setLiveSteps] = useState<ThinkingStep[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatStartRef = useRef<HTMLDivElement>(null); // 问题2：用于滚动到聊天开始位置
  const isDark = theme === 'dark';
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevSessionIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    chatStartRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 问题2修复：切换会话时滚动到顶部
  useEffect(() => {
    if (activeSessionId && activeSessionId !== prevSessionIdRef.current) {
      // 会话切换了
      console.log('🔄 AnalysisCenter 检测到会话切换:', prevSessionIdRef.current, '->', activeSessionId);
      
      // 🔧 清理旧会话的分析动画定时器（但不清理 liveSteps，因为可能需要恢复）
      if (analysisIntervalRef.current) {
        console.log('⚠️ 清理旧会话的分析动画定时器');
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      
      // 如果新会话正在分析中，需要重新启动动画
      // 这会由 isAnalyzing 的 useEffect 处理
      
      if (chatHistory.length > 0) {
        // 短暂延迟以确保 DOM 已更新
        setTimeout(() => scrollToTop(), 100);
      }
      prevSessionIdRef.current = activeSessionId;
    }
  }, [activeSessionId, chatHistory]);

  // 正常的滚动到底部（新消息或分析中）
  useEffect(() => {
    // 只有在不是会话切换的情况下才滚动到底部
    if (!prevSessionIdRef.current || prevSessionIdRef.current === activeSessionId) {
      scrollToBottom();
    }
  }, [chatHistory.length, isAnalyzing, liveSteps]);

  // ✅ Phase 2: 去掉固定的 ABC 动画，直接显示真实的思维步骤
  // 不再需要 mockSteps 和定时器
  useEffect(() => {
    if (!isAnalyzing) {
      // 分析停止时清空 liveSteps
      setLiveSteps([]);
    }
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
      
      {/* Session Management Bar - Visible if domain is active */}
      {activeDomainName && (
        <div className={`px-6 py-3 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1 mr-4">
            <div className="flex items-center gap-2 shrink-0">
               <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>治理会话</span>
               <button 
                 onClick={onCreateSession}
                 disabled={isCreatingSession}
                 className={`p-1.5 rounded-lg transition-all border ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-400 hover:text-white' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'} ${isCreatingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                 title="新建会话"
               >
                 <MessageSquarePlus size={14} />
               </button>
            </div>
            
            <div className="flex items-center gap-2">
              {sessions?.map(session => (
                <button
                  key={session.sessionId}
                  onClick={() => onSelectSession && onSelectSession(session.sessionId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all group ${
                    activeSessionId === session.sessionId 
                      ? (isDark ? 'bg-[#177ddc]/20 border-[#177ddc]/50 text-white' : 'bg-blue-50 border-blue-200 text-blue-600') 
                      : (isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-400 hover:text-white' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50')
                  }`}
                >
                  <MessageSquare size={12} />
                  <span className="text-xs font-bold whitespace-nowrap">会话 {session.sessionId.slice(-6)}</span>
                  {activeSessionId === session.sessionId && onDeleteSession && (
                     <div 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.sessionId); }}
                        className={`ml-1 p-0.5 rounded hover:bg-red-500/20 hover:text-red-500 transition-colors`}
                     >
                       <Trash2 size={10} />
                     </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-40">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          {/* 问题2：聊天历史顶部标记，用于滚动定位 */}
          <div ref={chatStartRef} />
          
          {/* 上下文历史面板 */}
          {chatHistory.length > 0 && (
            <div className="animate-in fade-in duration-300">
              <ContextPanel theme={theme} sessionId={activeSessionId} lastUpdated={lastUpdated} />
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
                  ? (activeSessionId 
                      ? `我已准备好对 [${activeDomainName}] 域进行 G-ABC 本体分析。下达指令后，您将实时看到我的思考推演过程。`
                      : '您可以直接输入指令开始分析，系统将自动为您创建新的会话。')
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
          
          {isAnalyzing && (() => {
            // ✅ 只显示最新的一个思维步骤卡片，带切换动效
            const lastMessage = chatHistory[chatHistory.length - 1];
            const realSteps = (lastMessage as any)?.thinkingSteps || [];
            const currentStep = realSteps[realSteps.length - 1]; // 只取最新的一个
            
            return (
              <div className="flex gap-4">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isDark ? 'bg-[#177ddc] border-[#1668dc] text-white shadow-[0_0_15px_rgba(23,125,220,0.3)]' : 'bg-blue-600 border-blue-500 text-white shadow-md'}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  {currentStep ? (
                    <div 
                      key={currentStep.phase + currentStep.title}
                      className={`p-6 rounded-2xl border animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                        isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {currentStep.phase}
                        </span>
                        <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {currentStep.title}
                        </h4>
                      </div>
                      {currentStep.description && (
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {currentStep.description}
                        </p>
                      )}
                      {currentStep.details && currentStep.details.length > 0 && (
                        <ul className={`mt-3 space-y-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {currentStep.details.map((detail: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200'}`}>
                      <div className={`flex items-center gap-3 text-xs font-bold animate-pulse ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Brain className="w-4 h-4" />
                        <span>正在启动分析...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {activeDomainName && (
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
                  placeholder={activeSessionId ? `在 [${activeDomainName}] 中发起治数推演...` : "直接输入指令，系统将自动创建会话..."}
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
      )}
    </div>
  );
};
