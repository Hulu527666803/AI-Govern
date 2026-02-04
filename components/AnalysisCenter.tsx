import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Brain, CheckCircle2, User, Bot, Paperclip, Cpu, Settings as SettingsIcon, Zap, Globe, MessageSquare, MessageSquarePlus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

/** 打字机效果：逐字显示文本 */
const TypingText: React.FC<{ fullText: string; animate: boolean; isDark: boolean; speedMs?: number }> = ({ fullText, animate, isDark, speedMs = 20 }) => {
  const [visibleLength, setVisibleLength] = useState(0);
  useEffect(() => {
    if (!animate || fullText.length === 0) {
      setVisibleLength(fullText.length);
      return;
    }
    setVisibleLength(0);
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      setVisibleLength(n);
      if (n >= fullText.length) clearInterval(t);
    }, speedMs);
    return () => clearInterval(t);
  }, [fullText, animate]);
  return (
    <span className={`whitespace-pre-wrap ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      {fullText.slice(0, visibleLength)}
      {animate && visibleLength < fullText.length && <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-blue-500 animate-pulse" />}
    </span>
  );
};

/** 治理成果摘要可折叠：默认摘要 + 展开查看 N 个对象 */
const GovernanceSummaryCollapse: React.FC<{ result: GovernanceResult; theme?: 'light' | 'dark' }> = ({ result, theme = 'dark' }) => {
  const [expanded, setExpanded] = useState(false);
  const isDark = theme === 'dark';
  const n = (result.objects?.length ?? 0) + (result.relationships?.length ?? 0) + (result.terms?.length ?? 0) + (result.knowledge?.length ?? 0);
  return (
    <div className={`mt-6 border rounded-2xl overflow-hidden transition-colors ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full p-5 flex gap-4 items-start text-left">
        <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border ${isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-600'}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>治理成果摘要</p>
          <p className={`text-[13px] leading-relaxed font-semibold line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.summary}</p>
          <p className={`mt-2 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {expanded ? '点击收起' : `展开查看 ${result.objects?.length ?? 0} 个对象、${result.relationships?.length ?? 0} 个关系、${result.terms?.length ?? 0} 个术语、${result.knowledge?.length ?? 0} 条规则`}
          </p>
        </div>
        <span className={`shrink-0 p-1 rounded ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>
      {expanded && (
        <div className={`px-5 pb-5 pt-0 border-t ${isDark ? 'border-blue-500/10' : 'border-blue-100'}`}>
          <div className={`mt-3 p-4 rounded-xl font-medium text-[12px] ${isDark ? 'bg-black/30 text-slate-300' : 'bg-white text-slate-600'}`}>
            <p>共识别 <strong>{result.objects?.length ?? 0}</strong> 个业务对象、<strong>{result.relationships?.length ?? 0}</strong> 个关系、<strong>{result.terms?.length ?? 0}</strong> 个术语、<strong>{result.knowledge?.length ?? 0}</strong> 条业务规则。详细结构请查看右侧「治理结果」面板。</p>
          </div>
        </div>
      )}
    </div>
  );
};

/** 时间线式思考步骤：左侧竖线+节点，进行中高亮+脉冲，已完成打勾 */
const ThinkingLog: React.FC<{ steps: ThinkingStep[]; isLive?: boolean; theme?: 'light' | 'dark' }> = ({ steps, isLive, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const validSteps = steps.filter(step => step && step.phase && step.title);
  if (validSteps.length === 0) return null;

  return (
    <div className="mb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 px-1 mb-4">
        <Cpu className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''} ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {isLive ? '正在实时进行 G-ABC 范式推演...' : 'G-ABC 治理推演路径存档'}
        </span>
      </div>
      <div className="relative pl-6 border-l-2 border-dashed min-h-[20px]" style={{ borderColor: isDark ? 'rgba(23,125,220,0.35)' : 'rgba(22,119,255,0.25)' }}>
        {validSteps.map((step, idx) => {
          const isActive = isLive && idx === validSteps.length - 1;
          const isDone = !isLive || idx < validSteps.length - 1;
          return (
            <div key={`${step.phase}-${idx}`} className={`relative -left-[26px] flex gap-3 mb-5 last:mb-0 animate-in slide-in-from-left-2 duration-500`} style={{ animationDelay: `${idx * 80}ms` }}>
              <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isActive ? (isDark ? 'bg-blue-500/30 border-blue-400 shadow-[0_0_12px_rgba(23,125,220,0.5)]' : 'bg-blue-100 border-blue-500 shadow-md') : ''
              } ${isDone ? (isDark ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-200') : ''}`}>
                {isDone ? <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} /> : isActive ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} /> : null}
              </div>
              <div className={`flex-1 pt-0.5 pb-3 px-4 rounded-xl border transition-colors ${isActive ? (isDark ? 'bg-blue-500/5 border-blue-500/30' : 'bg-blue-50/80 border-blue-200') : ''} ${isDark ? 'bg-[#1d1d1d]/40 border-[#303030]' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>{step.phase}</span>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{step.title}</h4>
                </div>
                {step.description && (
                  <p className={`mt-2 text-[11px] leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isActive && isLive ? (
                      <TypingText fullText={step.description} animate={true} isDark={isDark} speedMs={12} />
                    ) : (
                      step.description
                    )}
                  </p>
                )}
                {step.details && step.details.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {step.details.map((d, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md border ${isDark ? 'text-slate-400 bg-[#1d1d1d] border-[#303030]/50' : 'text-slate-500 bg-gray-50 border-gray-100'}`}>{d}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { KnowledgeUploader } from './KnowledgeUploader';

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
  const [showSkills, setShowSkills] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatStartRef = useRef<HTMLDivElement>(null); // 问题2：用于滚动到聊天开始位置
  const lastCardRef = useRef<HTMLDivElement | null>(null); // 最新卡片锚点，便于滚动到可见
  const scrollContainerRef = useRef<HTMLDivElement>(null); // 滚动容器，用于强制滚到底部
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

  // 新消息或分析中时滚动到最新内容：优先用滚动容器滚到底部
  useEffect(() => {
    if (!prevSessionIdRef.current || prevSessionIdRef.current === activeSessionId) {
      const run = () => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
          return;
        }
        const el = lastCardRef.current ?? chatEndRef.current;
        el?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      };
      const t = setTimeout(run, 400);
      return () => clearTimeout(t);
    }
  }, [chatHistory.length, isAnalyzing, liveSteps.length, activeSessionId]);

  // 分析进行中时定期滚到底部，使 SSE 推送的步骤始终可见
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, 1200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

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

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-40">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          {/* 问题2：聊天历史顶部标记，用于滚动定位 */}
          <div ref={chatStartRef} />
          
          {/* 当前资产信息：仅展示预览避免大 DDL/DML 卡顿 */}
          {selectedSource && (() => {
            const PREVIEW_MAX = 6000;
            const content = selectedSource.content ?? '';
            const isTruncated = content.length > PREVIEW_MAX;
            const displayContent = isTruncated ? content.slice(0, PREVIEW_MAX) : content;
            return (
            <div className={`rounded-2xl border overflow-hidden animate-in fade-in duration-300 ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>当前资产</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${isDark ? 'text-slate-400 border-[#303030]' : 'text-slate-500 border-gray-200'}`}>{selectedSource.type}</span>
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedSource.name}</span>
              </div>
              <div className={`p-4 max-h-48 overflow-y-auto custom-scrollbar ${isDark ? 'bg-black/30' : 'bg-gray-50/50'}`}>
                <pre className={`font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {displayContent}
                  {isTruncated && `\n\n…（已截断，共 ${content.length.toLocaleString()} 字符，仅展示前 ${PREVIEW_MAX.toLocaleString()} 字）`}
                </pre>
              </div>
            </div>
            );
          })()}

          {/* 上下文历史面板 */}
          {chatHistory.length > 0 && (
            <div className="animate-in fade-in duration-300">
              <ContextPanel theme={theme} sessionId={activeSessionId} lastUpdated={lastUpdated} />
            </div>
          )}

          {/* 知识库：仅在选择资产后显示（与当前资产绑定） */}
          {activeDomainName && selectedSource && (
            <div className="animate-in fade-in duration-300">
              <KnowledgeUploader domainId={activeDomainName} isDark={isDark} />
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
                {activeDomainName 
                  ? (selectedSource 
                      ? `智能治数域：${activeDomainName} / ${selectedSource.name || '资产'}` 
                      : `智能治数域：${activeDomainName}`)
                  : '准备好开始了吗？'}
              </h2>

              <p className={`max-w-md text-sm leading-relaxed mb-12 font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeDomainName 
                  ? (activeSessionId 
                      ? (selectedSource
                          ? `我已准备好对 [${activeDomainName}] 域的 [${selectedSource.name}] 资产进行 G-ABC 本体分析。下达指令后，您将实时看到我的思考推演过程。`
                          : `我已准备好对 [${activeDomainName}] 域进行 G-ABC 本体分析。下达指令后，您将实时看到我的思考推演过程。`)
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
            chatHistory.map((msg, i) => {
              // 🔍 添加日志：检查每条消息的thinkingSteps
              if (msg.role === 'ai' && i % 2 === 1) { // 只对AI消息日志，且不要每次重渲染都打印
                console.log(`🎨 渲染AI消息 ${Math.floor(i / 2) + 1}:`, {
                  hasResult: !!msg.result,
                  hasThinkingSteps: !!msg.result?.thinkingSteps,
                  thinkingStepsCount: msg.result?.thinkingSteps?.length || 0,
                  thinkingStepsPreview: msg.result?.thinkingSteps?.slice(0, 2).map((s: any) => s.phase) || []
                });
              }
              
              return (
              <div key={i} ref={!isAnalyzing && i === chatHistory.length - 1 ? lastCardRef : undefined} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
                      <ThinkingLog steps={msg.result.thinkingSteps} isLive={false} theme={theme} />
                    )}
                    
                    <div className="text-[15px] leading-relaxed font-medium">
                      {msg.role === 'ai' && i === chatHistory.length - 1 && msg.result ? (
                        <TypingText fullText={msg.text} animate={true} isDark={isDark} speedMs={16} />
                      ) : (
                        <span className={isDark ? 'text-slate-100' : 'text-slate-800'}>{msg.text}</span>
                      )}
                    </div>

                    {msg.role === 'ai' && msg.result?.summary && (
                      <GovernanceSummaryCollapse result={msg.result} theme={theme} />
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
          
          {isAnalyzing && (() => {
            const lastMessage = chatHistory[chatHistory.length - 1];
            const realSteps = (lastMessage as any)?.thinkingSteps || [];
            return (
              <div ref={lastCardRef} className="flex gap-4">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isDark ? 'bg-[#177ddc] border-[#1668dc] text-white shadow-[0_0_15px_rgba(23,125,220,0.3)]' : 'bg-blue-600 border-blue-500 text-white shadow-md'}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  {realSteps.length > 0 ? (
                    <ThinkingLog steps={realSteps} isLive={true} theme={theme} />
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
