import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Trash2, Clock, Check, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { useSession } from '../hooks/useSession';

interface SessionPanelProps {
  theme?: 'light' | 'dark';
  onSessionChange?: (sessionId: string) => void;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({ 
  theme = 'dark',
  onSessionChange 
}) => {
  const { 
    sessionId,
    currentSession,
    userSessions,
    loadUserSessions,
    createSession,
    switchSession,
    endSession,
    deleteSession
  } = useSession();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isExpanded) {
      loadUserSessions();
    }
  }, [isExpanded, loadUserSessions]);

  const handleCreateSession = async () => {
    if (!newDomainName.trim()) return;
    
    setIsCreating(true);
    try {
      const domainId = `domain_${Date.now()}`;
      const newSessionId = await createSession(domainId, newDomainName.trim());
      setNewDomainName('');
      
      if (onSessionChange) {
        onSessionChange(newSessionId);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchSession = async (newSessionId: string) => {
    await switchSession(newSessionId);
    if (onSessionChange) {
      onSessionChange(newSessionId);
    }
  };

  const handleEndSession = async (sid: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('确定要结束此会话吗？')) {
      await endSession(sid);
    }
  };

  const handleDeleteSession = async (sid: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('确定要删除此会话吗？此操作将删除所有相关数据且无法恢复。')) {
      await deleteSession(sid);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return isDark ? 'text-green-400 bg-green-500/10' : 'text-green-600 bg-green-50';
      case 'ended':
        return isDark ? 'text-gray-400 bg-gray-500/10' : 'text-gray-600 bg-gray-50';
      case 'expired':
        return isDark ? 'text-orange-400 bg-orange-500/10' : 'text-orange-600 bg-orange-50';
      default:
        return isDark ? 'text-slate-400 bg-slate-500/10' : 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-100 shadow-sm'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-black/40' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <FolderOpen size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              会话管理
            </span>
            {currentSession && (
              <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentSession.domainName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSession && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getSessionStatusColor(currentSession.status)}`}>
              {currentSession.status === 'active' ? '活跃' : currentSession.status === 'ended' ? '已结束' : '已过期'}
            </span>
          )}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className={`border-t ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
          {/* 创建新会话 */}
          <div className={`p-4 border-b ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入数据域名称..."
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none transition-colors ${
                  isDark 
                    ? 'bg-black border-[#303030] text-white focus:border-blue-500' 
                    : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'
                }`}
                disabled={isCreating}
              />
              <button
                onClick={handleCreateSession}
                disabled={!newDomainName.trim() || isCreating}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                  !newDomainName.trim() || isCreating
                    ? (isDark ? 'bg-[#303030] text-slate-600 cursor-not-allowed' : 'bg-gray-100 text-slate-400 cursor-not-allowed')
                    : (isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700')
                }`}
              >
                <Plus size={14} />
                新建
              </button>
            </div>
          </div>

          {/* 会话列表 */}
          <div className="max-h-96 overflow-y-auto">
            {userSessions.length === 0 ? (
              <div className={`p-6 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                暂无会话，创建一个新会话开始使用
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-[#303030]' : 'divide-gray-100'}`}>
                {userSessions.map((session) => {
                  const isActive = session.sessionId === sessionId;
                  return (
                    <div
                      key={session.sessionId}
                      className={`p-3 transition-all cursor-pointer ${
                        isActive 
                          ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50')
                          : (isDark ? 'hover:bg-black/40' : 'hover:bg-gray-50')
                      }`}
                      onClick={() => !isActive && handleSwitchSession(session.sessionId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isActive && (
                              <Check size={12} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                            )}
                            <span className={`text-xs font-bold truncate ${
                              isActive 
                                ? (isDark ? 'text-blue-400' : 'text-blue-600')
                                : (isDark ? 'text-white' : 'text-slate-900')
                            }`}>
                              {session.domainName}
                            </span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getSessionStatusColor(session.status)}`}>
                              {session.status === 'active' ? '活跃' : session.status === 'ended' ? '已结束' : '已过期'}
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatTimestamp(session.lastActivity)}
                            </span>
                            {session.stats && session.stats.total_tasks > 0 && (
                              <span>
                                {session.stats.total_tasks} 个任务
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {session.status === 'active' && (
                            <button
                              onClick={(e) => handleEndSession(session.sessionId, e)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark 
                                  ? 'text-slate-500 hover:text-orange-400 hover:bg-orange-500/10' 
                                  : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                              }`}
                              title="结束会话"
                            >
                              <LogOut size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteSession(session.sessionId, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark 
                                ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' 
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title="删除会话"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
