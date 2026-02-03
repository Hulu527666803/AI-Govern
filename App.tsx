
import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { SourceSidebar } from './components/SourceSidebar';
import { AnalysisCenter } from './components/AnalysisCenter';
import { GovernanceStudio } from './components/GovernanceStudio';
import { DataSource, DataDomain, GovernanceResult, SourceType, AISettings, AIEngineType, Session } from './types';
import { performGovernanceAnalysis, performGovernanceAnalysisStream } from './services/aiService';
import { InterruptConfirmModal } from './components/InterruptConfirmModal'; // ✅ Phase 3
import { ConfirmModal } from './components/ConfirmModal'; // ✅ 通用确认弹窗
import { domainService } from './services/domainService';
import { sourceService } from './services/sourceService';
import { sessionService } from './services/sessionService';
import { contextService } from './services/contextService';  // ✅ 导入上下文服务
import { httpClient } from './services/httpClient';
import { X, LayoutDashboard, Sun, Moon, Settings as SettingsIcon, Cpu, Globe, Save, ShieldCheck, Zap, Key, Lock, Unlock } from 'lucide-react';

// 使用 static/img/system_icon.png 展示项目标识
const UinoLogo = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div className="flex items-center group cursor-pointer" onClick={() => window.location.href = '/'}>
    <div className="relative flex items-center justify-center">
      <img 
        src="/img/system_icon.png" 
        alt="System Logo" 
        className="object-contain transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        style={{ width: '108px', height: '24px' }}
        onError={(e) => {
          console.error('Logo image failed to load from /img/system_icon.png');
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* 品牌装饰光晕 */}
      <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback?: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 max-w-md">
            <h3 className="font-bold mb-2">组件渲染异常</h3>
            <p className="text-xs font-mono break-all">{this.state.error?.message}</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-xs hover:bg-red-50"
            >
              尝试恢复
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [token, setTokenState] = useState(httpClient.getToken() || '');
  // TODO: 临时逻辑 - Token 锁定状态，用于测试阶段。后续应替换为正式的登录/认证流程。
  const [isTokenLocked, setIsTokenLocked] = useState(!!httpClient.getToken());
  const [domains, setDomains] = useState<DataDomain[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [governanceResult, setGovernanceResult] = useState<GovernanceResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string; result?: GovernanceResult }[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  
  // ✅ Phase 3: 中断状态管理
  const [interruptState, setInterruptState] = useState<{
    isInterrupted: boolean;
    type?: string;
    message?: string;
    data?: any;
    sessionId?: string;
  } | null>(null);
  
  // ✅ 确认弹窗状态管理
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'warning' | 'error' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  });
  
  // 🔧 会话级别的状态存储：每个会话维护自己的聊天历史、分析状态和治理结果
  const [sessionStates, setSessionStates] = useState<{
    [sessionId: string]: {
      chatHistory: { role: 'user' | 'ai'; text: string; result?: GovernanceResult }[];
      isAnalyzing: boolean;
      governanceResult?: GovernanceResult | null;
    }
  }>({});
  
  const [showSettings, setShowSettings] = useState(false);
  // AI 配置现在由后端统一管理，前端只保留用于显示
  const [aiSettings, setAiSettings] = useState<AISettings>({
    engine: 'BACKEND' as AIEngineType, // 标识使用后端配置
    baseUrl: '',
    modelName: '由后端配置'
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // 识别嵌入模式：当 URL 包含 mode=embedded 时隐藏导航栏和侧边栏
  const isEmbedded = searchParams.get('mode') === 'embedded';

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // 🐛 调试工具：将调试函数挂载到全局
  useEffect(() => {
    (window as any).debugSource = async (sourceId: string) => {
      try {
        const debugInfo = await sourceService.getSourceDebugInfo(sourceId);
        console.group('📊 资产调试信息');
        console.log('ID:', debugInfo.id);
        console.log('名称:', debugInfo.name);
        console.log('类型:', debugInfo.type);
        console.log('域ID:', debugInfo.domainId);
        console.log('内容长度:', debugInfo.contentLength, '字符');
        console.log('内容哈希:', debugInfo.contentHash);
        console.log('内容预览 (前500字符):');
        console.log(debugInfo.contentPreview);
        console.groupEnd();
        return debugInfo;
      } catch (error) {
        console.error('❌ 获取资产详情失败:', error);
      }
    };

    (window as any).debugAllSources = () => {
      console.group('📦 当前所有资产');
      console.log('总数:', sources.length);
      sources.forEach((s, idx) => {
        console.log(`${idx + 1}. [${s.type}] ${s.name} (ID: ${s.id})`);
        console.log('   内容长度:', s.content.length, '字符');
        console.log('   内容预览:', s.content.substring(0, 100));
      });
      console.groupEnd();
    };

    (window as any).debugSelectedSource = () => {
      if (!selectedSource) {
        console.log('❌ 当前没有选中的资产');
        return;
      }
      console.group('🎯 当前选中的资产');
      console.log('ID:', selectedSource.id);
      console.log('名称:', selectedSource.name);
      console.log('类型:', selectedSource.type);
      console.log('内容长度:', selectedSource.content.length, '字符');
      console.log('内容预览 (前500字符):');
      console.log(selectedSource.content.substring(0, 500));
      console.groupEnd();
      return selectedSource;
    };

    console.log('🔧 调试工具已加载。可用命令:');
    console.log('  - window.debugSource(sourceId) - 查看指定资产的详细信息');
    console.log('  - window.debugAllSources() - 查看所有资产列表');
    console.log('  - window.debugSelectedSource() - 查看当前选中的资产');
  }, [sources, selectedSource]);

  // Token 变化时加载数据
  useEffect(() => {
    if (token && isTokenLocked) {
      httpClient.setToken(token);
      domainService.getUserDomains()
        .then(data => {
          setDomains(data);
          if (data.length > 0) {
            if (!activeDomainId) {
              setActiveDomainId(data[0].id);
            }
          } else {
            setActiveDomainId(null);
            setActiveSessionId(null);
          }
        })
        .catch(err => console.error('加载数据域失败:', err));
    } else if (!token) {
      setDomains([]);
      setActiveDomainId(null);
      setActiveSessionId(null);
      setSources([]);
    }
  }, [token, isTokenLocked]);

  // 切换域时加载资产和会话
  useEffect(() => {
    if (activeDomainId) {
      sourceService.getDomainSources(activeDomainId)
        .then(data => setSources(data))
        .catch(err => console.error('加载资产失败:', err));
        
      sessionService.getUserSessions(activeDomainId)
        .then(data => setSessions(data))
        .catch(err => console.error('加载会话列表失败:', err));
    } else {
      setSources([]);
      setSessions([]);
    }
  }, [activeDomainId]);

  const handleTokenChange = (newToken: string) => {
    setTokenState(newToken);
  };

  const handleTokenLock = () => {
    if (token.trim()) {
      setIsTokenLocked(true);
      httpClient.setToken(token);
    }
  };

  const handleTokenUnlock = () => {
    // TODO: 临时逻辑 - 允许解锁以修改 Token
    setIsTokenLocked(false);
    setDomains([]);
    setActiveDomainId(null);
    setActiveSessionId(null);
    httpClient.setToken(''); // 清除本地存储的 Token
  };

  // 弹窗辅助函数
  const showModal = (
    type: 'success' | 'warning' | 'error' | 'info' | 'confirm',
    title: string,
    message: string,
    onConfirm?: () => void,
    showCancel: boolean = false
  ) => {
    setConfirmModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel,
    });
  };

  const closeModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const saveSettings = (newSettings: AISettings) => {
    // AI 配置现在由后端管理，前端设置已禁用
    showModal('warning', 'AI 配置', 'AI 配置现在由后端统一管理，请联系管理员修改 .env 配置文件', () => {
      setShowSettings(false);
      closeModal();
    }, false);
  };

  const navItems = [
    { label: '智能治数', path: '/governance' },
    { label: '对象管理', path: '/objects' },
    { label: '业务术语', path: '/glossary' },
    { label: '业务知识', path: '/knowledge' },
    { label: '业务查询', path: '/query' },
    { label: 'MCP 服务', path: '/mcp' },
    { label: '热数据', path: '/hot-data' },
    { label: '分析管理', path: '/analytics' },
    { label: '系统管理', path: '/system' }
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

  const handleAddDomain = async (name: string, description: string) => {
    if (!token) {
      showModal('warning', '输入错误', '请先输入 Token', undefined, false);
      return;
    }
    try {
      const newDomain = await domainService.createDomain(name, description);
      setDomains(prev => [newDomain, ...prev]);
      setActiveDomainId(newDomain.id);
      setActiveSessionId(null);
      setSelectedSource(null);
      console.log(`✅ 业务域 "${name}" 已创建，ID: ${newDomain.id}`);
    } catch (error) {
      console.error('创建业务域失败:', error);
      showModal('error', '创建失败', '创建业务域失败，请稍后重试', undefined, false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    showModal('warning', '确认删除业务域', '确定要删除该业务域吗？这将同时删除该域下的所有会话和历史记录。', async () => {
      try {
        await domainService.deleteDomain(id);
        setDomains(prev => prev.filter(d => d.id !== id));
        if (activeDomainId === id) {
          setActiveDomainId(null);
          setActiveSessionId(null);
          setSelectedSource(null);
        }
        closeModal();
        showModal('success', '删除成功', '业务域已成功删除', undefined, false);
      } catch (error) {
        console.error('删除业务域失败:', error);
        closeModal();
        showModal('error', '删除失败', '删除业务域失败，请稍后重试', undefined, false);
      }
    }, true);
  };

  const handleSelectDomain = (id: string) => {
    // 🔧 保存当前会话状态
    if (activeSessionId) {
      saveCurrentSessionState(activeSessionId);
    }
    
    setActiveDomainId(id);
    setActiveSessionId(null); // 切换域时重置会话
    setSelectedSource(null); 
    setChatHistory([]); // 清空历史记录
    setGovernanceResult(null); // ✅ 清空治理结果
    setIsAnalyzing(false); // 停止分析
    localStorage.removeItem('ai_governance_session_id'); // 清除本地存储的会话ID
  };

  // 🔧 保存当前会话状态到存储
  const saveCurrentSessionState = (sessionId: string | null) => {
    if (!sessionId) return;
    
    console.log('💾 保存会话状态:', sessionId, '历史记录数:', chatHistory.length, '是否分析中:', isAnalyzing, '治理结果:', governanceResult ? '有' : '无');
    setSessionStates(prev => ({
      ...prev,
      [sessionId]: {
        chatHistory: [...chatHistory],
        isAnalyzing: isAnalyzing,
        governanceResult: governanceResult  // 保存治理结果
      }
    }));
  };
  
  // 🔧 从存储恢复会话状态
  const restoreSessionState = (sessionId: string) => {
    const savedState = sessionStates[sessionId];
    if (savedState) {
      console.log('📂 恢复会话状态:', sessionId, '历史记录数:', savedState.chatHistory.length, '是否分析中:', savedState.isAnalyzing, '治理结果:', savedState.governanceResult ? '有' : '无');
      setChatHistory(savedState.chatHistory);
      setIsAnalyzing(savedState.isAnalyzing);
      setGovernanceResult(savedState.governanceResult || null);  // 恢复治理结果
      return true;
    }
    return false;
  };
  
  // 问题4修复：加载会话历史记录
  const loadSessionHistory = async (sessionId: string) => {
    console.log('🔄 加载会话历史:', sessionId);
    
    // 🔧 先尝试从前端状态恢复（包含未保存的分析中内容）
    const restored = restoreSessionState(sessionId);
    if (restored) {
      console.log('✅ 从前端状态恢复成功');
      // 仍然从后端加载，以获取最新的已保存内容
    }
    
    try {
      const result = await httpClient.get(`/context/session/${sessionId}`);
      console.log('📦 后端返回数据:', result);
      
      if (result.success && result.data && result.data.taskHistory) {
        const taskHistory = Array.isArray(result.data.taskHistory) ? result.data.taskHistory : [];
        
        if (taskHistory.length === 0) {
          console.log('⚠️ 会话无后端历史记录');
          if (!restored) {
            setChatHistory([]);
            setIsAnalyzing(false);
          }
          return;
        }
        
        // 后端返回的是最新的在前（DESC），需要反转为最旧的在前
        const sortedTasks = [...taskHistory].reverse();
        
        const history = sortedTasks.flatMap((task: any, taskIdx: number) => {
          const messages = [];
          
          // 用户消息
          if (task.taskDescription) {
            messages.push({ 
              role: 'user' as const, 
              text: task.taskDescription 
            });
          }
          
          // AI 消息
          if (task.outputData) {
            const modelUsed = task.outputData.modelUsed || task.modelUsed || 'AI';
            const summary = task.outputData.summary || `分析已完成。模型使用 [${modelUsed}] 完成了建模推演。`;
            
            // 🔍 添加日志：检查thinkingSteps是否存在
            console.log(`📋 任务 ${taskIdx + 1} outputData:`, {
              hasThinkingSteps: !!task.outputData.thinkingSteps,
              thinkingStepsCount: task.outputData.thinkingSteps?.length || 0,
              thinkingStepsPreview: task.outputData.thinkingSteps?.slice(0, 3).map((s: any) => ({
                phase: s.phase,
                title: s.title
              })) || [],
              objects: task.outputData.objects?.length || 0,
              relationships: task.outputData.relationships?.length || 0,
              terms: task.outputData.terms?.length || 0
            });
            
            messages.push({ 
              role: 'ai' as const, 
              text: summary,
              result: task.outputData
            });
          }
          
          return messages;
        });
        
        console.log('✅ 会话历史加载完成:', history.length, '条消息');
        
        // 🔍 添加日志：检查恢复的历史记录中的thinkingSteps
        const aiMessages = history.filter((msg: any) => msg.role === 'ai');
        console.log('🔍 AI消息统计:', {
          aiMessagesCount: aiMessages.length,
          messagesWithThinkingSteps: aiMessages.filter((msg: any) => msg.result?.thinkingSteps?.length > 0).length,
          totalThinkingSteps: aiMessages.reduce((sum: number, msg: any) => sum + (msg.result?.thinkingSteps?.length || 0), 0),
          firstAiMessage: aiMessages[0] ? {
            hasResult: !!aiMessages[0].result,
            hasThinkingSteps: !!aiMessages[0].result?.thinkingSteps,
            thinkingStepsCount: aiMessages[0].result?.thinkingSteps?.length || 0
          } : null
        });
        
        // 🔧 如果前端有未保存的分析中内容，合并它们
        const savedState = sessionStates[sessionId];
        if (savedState && savedState.chatHistory.length > history.length) {
          console.log('🔀 合并前端未保存的内容');
          setChatHistory(savedState.chatHistory);
        } else {
          console.log('📝 设置会话历史到chatHistory');
          setChatHistory(history);
          setIsAnalyzing(false); // 后端已完成，不再分析中
        }
      } else {
        console.log('⚠️ 无效的响应数据');
        if (!restored) {
          setChatHistory([]);
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('❌ 加载会话历史失败:', error);
      if (!restored) {
        setChatHistory([]);
        setIsAnalyzing(false);
      }
    }
  };

  // 问题1修复：选择会话时立即加载历史
  const handleSelectSession = async (id: string) => {
    console.log('🔄 切换到会话:', activeSessionId, '->', id);
    
    // 🔧 保存当前会话状态（包括分析中的内容）
    if (activeSessionId) {
      saveCurrentSessionState(activeSessionId);
    }
    
    // 切换到新会话
    setActiveSessionId(id);
    localStorage.setItem('ai_governance_session_id', id);
    
    // ✅ 加载会话详情，恢复资产和数据域选择
    try {
      const sessionDetail = await sessionService.getSession(id);
      
      // ✅ 恢复数据域选择（如果会话属于不同的域）
      if (sessionDetail.domainId && sessionDetail.domainId !== activeDomainId) {
        console.log('🔄 恢复数据域选择:', activeDomainId, '->', sessionDetail.domainId);
        setActiveDomainId(sessionDetail.domainId);
        
        // 加载该域的资产列表和会话列表
        const [domainSources, domainSessions] = await Promise.all([
          sourceService.getDomainSources(sessionDetail.domainId),
          sessionService.getUserSessions(sessionDetail.domainId)
        ]);
        setSources(domainSources);
        setSessions(domainSessions);
        console.log('✅ 已切换到域:', sessionDetail.domainId, `(${domainSources.length} 个资产, ${domainSessions.length} 个会话)`);
      }
      
      // ✅ 恢复资产选择
      if (sessionDetail.sourceId) {
        console.log('🔄 恢复资产选择:', sessionDetail.sourceId);
        const source = sources.find(s => s.id === sessionDetail.sourceId);
        if (source) {
          setSelectedSource(source);
        } else {
          // 如果当前 sources 中没有，尝试重新加载
          const domainSources = await sourceService.getDomainSources(sessionDetail.domainId);
          const matchedSource = domainSources.find(s => s.id === sessionDetail.sourceId);
          if (matchedSource) {
            setSelectedSource(matchedSource);
          }
        }
      }
      
      // ✅ 恢复治理结果（从会话历史中提取最后一次的治理结果）
      console.log('🔍 尝试恢复会话治理结果:', id);
      const history = await contextService.getSessionContext(id);
      
      if (history?.taskHistory && history.taskHistory.length > 0) {
        console.log('📚 找到会话历史:', history.taskHistory.length, '条记录');
        
        // 倒序查找最后一个有效的治理结果
        let foundResult = false;
        for (let i = history.taskHistory.length - 1; i >= 0; i--) {
          const task = history.taskHistory[i];
          if (task.outputData && (
            task.outputData.objects?.length > 0 ||
            task.outputData.relationships?.length > 0 ||
            task.outputData.terms?.length > 0 ||
            task.outputData.knowledge?.length > 0
          )) {
            console.log('✅ 恢复治理结果 (记录', i + 1, '):', {
              objects: task.outputData.objects?.length || 0,
              relationships: task.outputData.relationships?.length || 0,
              terms: task.outputData.terms?.length || 0,
              knowledge: task.outputData.knowledge?.length || 0
            });
            setGovernanceResult(task.outputData);
            foundResult = true;
            break;
          }
        }
        
        if (!foundResult) {
          console.warn('⚠️ 未找到有效的治理结果');
          setGovernanceResult(null);
        }
      } else {
        console.log('ℹ️ 该会话暂无历史记录');
        setGovernanceResult(null);
      }
    } catch (error) {
      console.error('加载会话详情失败:', error);
    }
    
    // 加载新会话的历史（会尝试从前端状态恢复）
    await loadSessionHistory(id);
  };

  const handleCreateSession = async () => {
    if (!activeDomainId) return null;

    // 如果当前已有活动会话且无对话历史（空会话），则直接复用，不创建新会话
    if (activeSessionId && chatHistory.length === 0 && !isAnalyzing) {
      console.log('当前会话为空，复用当前会话:', activeSessionId);
      return activeSessionId;
    }
    
    // 🔧 保存当前会话状态（包括分析中的内容）
    if (activeSessionId) {
      saveCurrentSessionState(activeSessionId);
    }
    
    const domain = domains.find(d => d.id === activeDomainId);
    if (!domain) return null;

    setIsCreatingSession(true);
    try {
      // ✅ 传递当前选中的资产信息
      const sessionId = await sessionService.createSession(
        domain.id, 
        domain.name,
        selectedSource?.id,
        selectedSource?.name
      );
      const newSessions = await sessionService.getUserSessions(domain.id);
      setSessions(newSessions);
      setActiveSessionId(sessionId);
      localStorage.setItem('ai_governance_session_id', sessionId);
      
      // 新会话，清空状态
      setChatHistory([]);
      setIsAnalyzing(false);
      
      return sessionId;
    } catch (error) {
      console.error('创建会话失败:', error);
      showModal('error', '创建失败', '创建会话失败，请稍后重试', undefined, false);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    showModal('warning', '确认删除会话', '确定要删除该会话吗？删除后将无法恢复。', async () => {
      try {
        await sessionService.deleteSession(sessionId);
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        
        // 🔧 删除会话状态存储
        setSessionStates(prev => {
          const newStates = { ...prev };
          delete newStates[sessionId];
          return newStates;
        });
        
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setChatHistory([]);
          setIsAnalyzing(false);
        }
        closeModal();
        showModal('success', '删除成功', '会话已成功删除', undefined, false);
      } catch (error) {
        console.error('删除会话失败:', error);
        closeModal();
        showModal('error', '删除失败', '删除会话失败，请稍后重试', undefined, false);
      }
    }, true);
  };

  const handleAddSource = async (type: SourceType, name: string, content: string) => {
    if (!activeDomainId) {
      return;
    }
    
    try {
      const newSource = await sourceService.createSource(activeDomainId, name, type, content);
      setSources(prev => [newSource, ...prev]);
      
      // ✅ 自动切换到新接入的资产
      setSelectedSource(newSource);
      console.log(`🔄 自动切换到新接入的资产: ${name}`);
      console.log(`📊 资产内容长度: ${content.length} 字符`);
      console.log(`📄 资产内容预览: ${content.substring(0, 200)}`);
      
      // 清空当前会话和历史（切换资产时的标准操作）
      setActiveSessionId(null);
      setChatHistory([]);
      setGovernanceResult(null);
      setIsAnalyzing(false);
      localStorage.removeItem('ai_governance_session_id');
      
      // 添加成功提示
      console.log(`✅ 资产 "${name}" 已成功接入到域 "${activeDomain?.name}"`);
      
      // 🔧 优化：显示友好的用户提示
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `✅ 资产"${name}"已成功接入到业务域"${activeDomain?.name}"并已自动选中。\n\n💡 提示：您可以在对话框中输入指令（如"开始分析"、"治理这些资产"）来启动数据治理分析。` 
      }]);
    } catch (error) {
      console.error('创建资产失败:', error);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await sourceService.deleteSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      
      // 如果删除的是当前选中的资产，清空选择
      if (selectedSource?.id === id) {
        setSelectedSource(null);
        setActiveSessionId(null);
        setChatHistory([]);
        setGovernanceResult(null);
        setIsAnalyzing(false);
        localStorage.removeItem('ai_governance_session_id');
      }
      
      console.log(`✅ 资产已删除: ${id}`);
    } catch (error) {
      console.error('删除资产失败:', error);
    }
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

    // 自动创建会话逻辑
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = await handleCreateSession();
      if (!currentSessionId) {
        setChatHistory(prev => [...prev, { role: 'ai', text: "自动创建会话失败，请手动创建会话后再试。" }]);
        return;
      }
    }
    
    setIsAnalyzing(true);
    setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);

    try {
      // 🔧 修复：如果用户选择了特定资产，只分析该资产；否则分析所有资产
      const sourceContext = selectedSource 
        ? `[资产类型: ${selectedSource.type}, 资产名称: ${selectedSource.name}]\n资产内容: ${selectedSource.content}`
        : activeDomainSources.map(s => `[资产类型: ${s.type}, 资产名称: ${s.name}]\n资产内容: ${s.content}`).join('\n\n');
      
      // 🐛 调试：打印发送给后端的内容预览
      console.log('📤 发送给后端的资产内容预览:', sourceContext.substring(0, 300));
      console.log('📊 发送的内容总长度:', sourceContext.length);
      
      // 🚀 使用流式 SSE API
      await performGovernanceAnalysisStream(
        sourceContext,
        prompt,
        aiSettings,
        // onThinkingStep
        (step) => {
          console.log('📝 收到思维步骤:', step);
          setChatHistory(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'ai' && (last as any).isStreaming) {
              // 更新最后一条流式消息
              return [...prev.slice(0, -1), {
                ...last,
                thinkingSteps: [...((last as any).thinkingSteps || []), step]
              }];
            } else {
              // 创建新的流式消息
              return [...prev, {
                role: 'ai' as const,
                text: '正在分析中...',
                isStreaming: true,
                thinkingSteps: [step]
              } as any];
            }
          });
        },
        // onProgress
        (progress) => {
          console.log('📊 进度更新:', progress);
        },
        // onComplete
        (result) => {
          console.log('✅ 分析完成:', result);
          setGovernanceResult(result);
          setIsAnalyzing(false);
          
          const modelName = result.modelUsed || aiSettings.modelName;
          
          setChatHistory(prev => {
            const last = prev[prev.length - 1];
            if (last && (last as any).isStreaming) {
              // 替换流式消息为最终结果
              return [...prev.slice(0, -1), {
                role: 'ai' as const,
                text: `分析已完成。模型使用 [${modelName}] 完成了建模推演。`,
                result: result,
                isStreaming: false
              } as any];
            }
            return [...prev, {
              role: 'ai' as const,
              text: `分析已完成。模型使用 [${modelName}] 完成了建模推演。`,
              result: result
            }];
          });
        },
        // onError
        (error) => {
          console.error('❌ 分析失败:', error);
          setIsAnalyzing(false);
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            text: `分析出错: ${error.message || "请求失败"}` 
          }]);
        },
        // ✅ Phase 3: onInterrupt
        (interruptData) => {
          console.log('⏸️  AI 请求用户确认:', interruptData);
          setInterruptState({
            isInterrupted: true,
            type: interruptData.type,
            message: interruptData.message,
            data: interruptData.data,
            sessionId: currentSessionId,
          });
        }
      );
    } catch (error: any) {
      console.error(error);
      setIsAnalyzing(false);
      setChatHistory(prev => [...prev, { role: 'ai', text: `分析出错: ${error.message || "请求失败"}` }]);
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#141414] text-slate-300' : 'bg-[#f5f5f5] text-slate-900'}`}>
      {/* Header - 在嵌入模式下隐藏 */}
      {!isEmbedded && (
        <header className={`fixed top-0 left-0 right-0 h-16 border-b flex items-center px-6 z-50 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0] shadow-sm'}`}>
          <div className="flex items-center gap-8 h-full">
            <UinoLogo theme={theme} />
            <nav className="flex items-center h-full">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative px-4 h-full text-[13px] font-semibold transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? (theme === 'dark' ? 'text-[#177ddc]' : 'text-[#1677ff]')
                      : (theme === 'dark' ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-[#1677ff]')
                  }`}
                >
                  {item.label}
                  {location.pathname.startsWith(item.path) && (
                    <span className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-t-full transition-colors ${theme === 'dark' ? 'bg-[#177ddc] shadow-[0_0_8px_#177ddc]' : 'bg-[#1677ff]'}`}></span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${theme === 'dark' ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-gray-100 border-gray-200'}`}>
              <Key size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
              <input 
                type="text" 
                placeholder="输入 Token..." 
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                disabled={isTokenLocked}
                className={`bg-transparent outline-none text-xs font-mono w-32 ${theme === 'dark' ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'} ${isTokenLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <button 
                onClick={isTokenLocked ? handleTokenUnlock : handleTokenLock}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                title={isTokenLocked ? "解锁 Token" : "确认并锁定 Token"}
              >
                {isTokenLocked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
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
      )}

      <main className={`flex w-full h-full relative ${!isEmbedded ? 'pt-16' : ''}`}>
        {!isTokenLocked ? (
          <div className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${theme === 'dark' ? 'bg-[#141414] text-slate-400' : 'bg-gray-50 text-slate-500'}`}>
            <div className="text-center space-y-4 p-10 max-w-md">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-[#1d1d1d] text-blue-500' : 'bg-white text-blue-600 shadow-lg'}`}>
                <Key size={40} />
              </div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>需要访问令牌</h2>
              <p className="text-sm leading-relaxed opacity-80">
                请在右上角输入您的 Token 并点击锁定图标以访问系统。<br/>
                Token 用于隔离您的数据域、会话记录和配置信息。
              </p>
              <div className={`mt-8 p-4 rounded-xl text-xs font-mono text-left ${theme === 'dark' ? 'bg-black/50 border border-[#303030]' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2 opacity-50">
                  <ShieldCheck size={12} />
                  <span>安全提示</span>
                </div>
                <p>系统不会保存您的 Token 到服务器，仅用于请求验证和数据隔离。</p>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Sidebar - 在嵌入模式下隐藏 */}
        {!isEmbedded && (
          <aside className={`w-80 h-full border-r flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
            <SourceSidebar 
              domains={domains}
              sources={activeDomainSources}
              activeDomainId={activeDomainId}
              onAddDomain={handleAddDomain}
              onDeleteDomain={handleDeleteDomain}
              onSelectDomain={handleSelectDomain}
              onAddSource={handleAddSource}
              onDeleteSource={handleDeleteSource}
              onSelectSource={(source: DataSource | null) => {
                // ✅ 切换资产时，清空当前会话和治理结果
                console.log('🔄 切换资产:', selectedSource?.name, '->', source?.name);
                
                // 🐛 调试：打印资产内容的前200个字符
                if (source) {
                  console.log('📄 新资产内容预览:', source.content.substring(0, 200));
                  console.log('📊 新资产内容长度:', source.content.length);
                }
                if (selectedSource) {
                  console.log('📄 旧资产内容预览:', selectedSource.content.substring(0, 200));
                  console.log('📊 旧资产内容长度:', selectedSource.content.length);
                }
                
                // 保存当前会话状态（如果有）
                if (activeSessionId) {
                  saveCurrentSessionState(activeSessionId);
                }
                
                setSelectedSource(source);
                setActiveSessionId(null); // 取消当前会话选择
                setChatHistory([]); // 清空聊天历史
                setGovernanceResult(null); // 清空治理结果
                setIsAnalyzing(false); // 停止分析
                localStorage.removeItem('ai_governance_session_id'); // 清除本地存储
                
                console.log('✅ 资产切换完成，已清空会话和治理结果');
              }}
              activeSourceId={selectedSource?.id}
              theme={theme}
            />
          </aside>
        )}

        <section className={`flex-1 h-full overflow-hidden relative transition-colors ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
          <Routes>
            <Route path="/governance" element={
              <div className="h-full flex flex-col">
                    {activeDomain && !isEmbedded && (
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
                    <ErrorBoundary>
                    <AnalysisCenter 
                      isAnalyzing={isAnalyzing} 
                      chatHistory={chatHistory} 
                      onAnalyze={handleStartGovernance} 
                      onOpenSettings={() => setShowSettings(true)}
                      activeDomainName={activeDomain?.name || "未知业务域"}
                        activeSessionId={activeSessionId}
                      aiSettings={aiSettings}
                      theme={theme}
                        sessions={sessions}
                        onSelectSession={handleSelectSession}
                        onCreateSession={handleCreateSession}
                        onDeleteSession={handleDeleteSession}
                        isCreatingSession={isCreatingSession}
                        selectedSource={selectedSource}
                      />
                    </ErrorBoundary>
              </div>
            } />
            
            <Route path="/objects" element={<div className="p-10 text-center"><h2 className="text-2xl font-bold">对象管理模块</h2><p className="mt-4 text-slate-500">该功能正在从治数结果中同步...</p></div>} />
            <Route path="/glossary" element={<div className="p-10 text-center"><h2 className="text-2xl font-bold">业务术语表</h2><p className="mt-4 text-slate-500">查看已沉淀的业务规范术语</p></div>} />
            <Route path="*" element={<Navigate to="/governance" replace />} />
          </Routes>
        </section>

        <aside className={`${isEmbedded ? 'w-[400px]' : 'w-[460px]'} h-full border-l flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#141414] border-[#303030]' : 'bg-white border-[#f0f0f0]'}`}>
              <ErrorBoundary>
                <GovernanceStudio result={governanceResult} theme={theme} selectedSource={selectedSource} />
              </ErrorBoundary>
        </aside>
          </>
        )}
      </main>

      {/* ✅ Phase 3: Interrupt Confirm Modal */}
      {interruptState?.isInterrupted && (
        <InterruptConfirmModal
          type={interruptState.type!}
          message={interruptState.message!}
          data={interruptState.data!}
          onConfirm={async () => {
            if (!interruptState.sessionId) return;
            // 立即关闭弹窗，避免重复显示
            setInterruptState(null);
            try {
              await httpClient.post('/ai/resume', { sessionId: interruptState.sessionId });
            } catch (error) {
              console.error('恢复执行失败:', error);
            }
          }}
          onModify={async (modifiedObjects) => {
            if (!interruptState.sessionId) return;
            // 立即关闭弹窗，避免重复显示
            setInterruptState(null);
            try {
              await httpClient.post('/ai/update-and-resume', {
                sessionId: interruptState.sessionId,
                modifiedObjects: modifiedObjects,
              });
            } catch (error) {
              console.error('修改并恢复失败:', error);
            }
          }}
          onCancel={() => setInterruptState(null)}
          theme={theme}
        />
      )}

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

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API 密钥 (API Key)</label>
                    <input 
                      type="password"
                      className={`w-full px-5 h-14 rounded-2xl border outline-none font-mono text-xs transition-colors ${theme === 'dark' ? 'bg-black border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                      placeholder={aiSettings.engine === 'GEMINI_SDK' ? "AIza..." : "sk-..."}
                      value={aiSettings.apiKey || ''}
                      onChange={e => setAiSettings({...aiSettings, apiKey: e.target.value})}
                    />
                  </div>

                  {aiSettings.engine === 'OPENAI_COMPATIBLE' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API Base URL</label>
                      <input 
                        className={`w-full px-5 h-14 rounded-2xl border outline-none font-mono text-xs transition-colors ${theme === 'dark' ? 'bg-black border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                        placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
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
                      <div className={`text-[11px] font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>API 密钥本地存储</div>
                      <div className="text-[9px] text-slate-500 font-medium">密钥将存储在浏览器本地，仅用于当前设备的 AI 请求。</div>
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
      
      {/* 通用确认弹窗 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        theme={theme}
        showCancel={confirmModal.showCancel}
      />
    </div>
  );
};

export default App;
