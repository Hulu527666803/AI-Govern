/**
 * 上下文服务
 * 负责管理会话上下文和历史记录
 */

import { httpClient } from './httpClient';
import { ContextHistoryItem } from '../types';

/**
 * 获取会话上下文历史
 */
export const getSessionContext = async (sessionId: string): Promise<{ taskHistory: ContextHistoryItem[] } | null> => {
  try {
    // ✅ 修复：移除重复的/api前缀（httpClient会自动添加）
    const response = await httpClient.get<{ success: boolean; data: { taskHistory: ContextHistoryItem[] } }>(
      `/context/session/${sessionId}`
    );
    
    if (response?.success && response.data) {
      console.log('📊 获取会话上下文成功:', sessionId, '历史记录数:', response.data.taskHistory?.length || 0);
      return response.data;
    }
    
    console.warn('⚠️ 会话上下文响应异常:', response);
    return null;
  } catch (error) {
    console.error('❌ 获取会话上下文失败:', error);
    return null;
  }
};

export const contextService = {
  getSessionContext
};
