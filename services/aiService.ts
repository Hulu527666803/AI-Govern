import { GovernanceResult, AISettings } from "../types";
import httpClient from "./httpClient";

/**
 * 执行数据治理分析
 * 现在所有 AI 调用都通过后端进行，前端不再直接调用 AI API
 */
export const performGovernanceAnalysis = async (
  sources: string,
  userPrompt: string,
  settings: AISettings
): Promise<GovernanceResult> => {
  try {
    const sessionId = httpClient.getSessionId();
    
    if (!sessionId) {
      throw new Error('未找到有效会话，请先创建或选择一个会话');
    }
    
    // 调用后端的治理分析接口
    const response = await httpClient.post('/ai/analyze', {
      sessionId,
      userPrompt,
      sources,
      aiSettings: settings
    });
    
    if (!response.success || !response.data) {
      throw new Error('后端返回数据格式错误');
    }
    
    return response.data as GovernanceResult;
  } catch (error: any) {
    console.error('数据治理分析失败:', error);
    throw new Error(error.message || '治理分析请求失败');
  }
};
