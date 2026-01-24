import { useState, useEffect, useCallback } from 'react';
import httpClient from '../services/httpClient';

interface ContextHistoryItem {
  id: number;
  taskType: string;
  taskDescription: string;
  inputData: any;
  outputData: any;
  modelUsed: string;
  timestamp: string;
  contextSnapshot: any;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  domainId: string;
  domainName: string;
  createdAt: string;
  lastActivity: string;
  status: string;
  metadata: any;
  stats?: {
    total_tasks: number;
    task_types: number;
    first_task: string;
    last_task: string;
  };
}

interface SessionContext {
  sessionId: string;
  taskHistory: ContextHistoryItem[];
  currentContext: any;
}

/**
 * Session 管理 Hook
 * 管理会话ID、会话列表和上下文历史
 */
export const useSession = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [userSessions, setUserSessions] = useState<SessionInfo[]>([]);
  const [contextHistory, setContextHistory] = useState<ContextHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState<string>('anonymous'); // 默认用户ID

  // 初始化或获取 sessionId
  useEffect(() => {
    let sid = localStorage.getItem('ai_governance_session_id');
    if (sid) {
      setSessionId(sid);
      loadSessionInfo(sid);
    }
  }, []);

  // 加载会话信息
  const loadSessionInfo = useCallback(async (sid: string) => {
    if (!sid) return;
    
    try {
      const result = await httpClient.get(`/sessions/${sid}`);
      if (result.success && result.data) {
        setCurrentSession(result.data);
      }
    } catch (error) {
      console.error('加载会话信息失败:', error);
    }
  }, []);

  // 加载上下文历史
  const loadContextHistory = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const result = await httpClient.get(`/api/context/session/${sessionId}`);
      if (result.success && result.data) {
        setContextHistory(result.data.taskHistory || []);
      }
    } catch (error) {
      console.error('加载上下文历史失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // 加载用户的所有会话
  const loadUserSessions = useCallback(async () => {
    if (!userId) return;
    
    try {
      const result = await httpClient.get(`/sessions/user/${userId}`);
      if (result.success && result.data) {
        setUserSessions(result.data);
      }
    } catch (error) {
      console.error('加载用户会话列表失败:', error);
    }
  }, [userId]);

  // 创建新会话
  const createSession = useCallback(async (domainId: string, domainName: string, metadata?: any) => {
    try {
      const result = await httpClient.post('/sessions/create', {
        userId,
        domainId,
        domainName,
        metadata
      });
      
      if (result.success && result.sessionId) {
        const newSessionId = result.sessionId;
        setSessionId(newSessionId);
        localStorage.setItem('ai_governance_session_id', newSessionId);
        await loadSessionInfo(newSessionId);
        await loadUserSessions();
        return newSessionId;
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  }, [userId, loadSessionInfo, loadUserSessions]);

  // 切换会话
  const switchSession = useCallback(async (newSessionId: string) => {
    setSessionId(newSessionId);
    localStorage.setItem('ai_governance_session_id', newSessionId);
    await loadSessionInfo(newSessionId);
    setContextHistory([]);
  }, [loadSessionInfo]);

  // 结束会话
  const endSession = useCallback(async (sid?: string) => {
    const targetSessionId = sid || sessionId;
    if (!targetSessionId) return;
    
    try {
      await httpClient.put(`/sessions/${targetSessionId}/end`);
      
      if (targetSessionId === sessionId) {
        setSessionId('');
        setCurrentSession(null);
        setContextHistory([]);
        localStorage.removeItem('ai_governance_session_id');
      }
      
      await loadUserSessions();
    } catch (error) {
      console.error('结束会话失败:', error);
    }
  }, [sessionId, loadUserSessions]);

  // 删除会话
  const deleteSession = useCallback(async (sid: string) => {
    try {
      await httpClient.delete(`/sessions/${sid}`);
      
      if (sid === sessionId) {
        setSessionId('');
        setCurrentSession(null);
        setContextHistory([]);
        localStorage.removeItem('ai_governance_session_id');
      }
      
      await loadUserSessions();
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  }, [sessionId, loadUserSessions]);

  // 清除上下文（保留会话）
  const clearContext = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await httpClient.delete(`/context/session/${sessionId}`);
      setContextHistory([]);
    } catch (error) {
      console.error('清除上下文失败:', error);
    }
  }, [sessionId]);

  // 获取 sessionId（用于请求头）
  const getSessionId = useCallback(() => {
    return sessionId;
  }, [sessionId]);

  return {
    // 会话相关
    sessionId,
    currentSession,
    userSessions,
    
    // 上下文相关
    contextHistory,
    
    // 状态
    isLoading,
    userId,
    
    // 方法
    createSession,
    switchSession,
    endSession,
    deleteSession,
    loadContextHistory,
    loadUserSessions,
    clearContext,
    getSessionId
  };
};
