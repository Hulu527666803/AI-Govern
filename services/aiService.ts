import { GovernanceResult, AISettings, ThinkingStep } from "../types";
import httpClient from "./httpClient";

/**
 * 执行数据治理分析（传统方式）
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

/**
 * 执行数据治理分析（流式 SSE）
 * 支持实时推送思维步骤和进度
 */
export const performGovernanceAnalysisStream = async (
  sources: string,
  userPrompt: string,
  settings: AISettings,
  onThinkingStep: (step: ThinkingStep) => void,
  onProgress: (progress: any) => void,
  onComplete: (result: GovernanceResult) => void,
  onError: (error: Error) => void,
  onInterrupt?: (interruptData: any) => void // ✅ Phase 3: 中断回调
): Promise<void> => {
  const sessionId = httpClient.getSessionId();
  
  if (!sessionId) {
    onError(new Error('未找到有效会话，请先创建或选择一个会话'));
    return;
  }
  
  // 使用 fetch 发起 POST 请求，然后通过 EventSource 接收 SSE
  // 注意：标准 EventSource 只支持 GET，这里需要特殊处理
  
  try {
    const response = await fetch(`${httpClient.getBaseUrl()}/ai/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        'x-token': httpClient.getToken() || ''
      },
      body: JSON.stringify({
        sessionId,
        userPrompt,
        sources,
        aiSettings: settings
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      // 处理 SSE 消息
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const eventMatch = line.match(/^event: (.+)$/m);
        const dataMatch = line.match(/^data: (.+)$/m);
        
        if (eventMatch && dataMatch) {
          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);
          
          switch (event) {
            case 'thinking':
              onThinkingStep(data as ThinkingStep);
              break;
            case 'progress':
              onProgress(data);
              break;
            case 'interrupt': // ✅ Phase 3: 处理中断事件
              if (onInterrupt) {
                onInterrupt(data);
              }
              break;
            case 'complete':
              if (data.success && data.data) {
                onComplete(data.data as GovernanceResult);
              } else {
                onError(new Error(data.error || '分析失败'));
              }
              break;
            case 'error':
              onError(new Error(data.message || '未知错误'));
              break;
          }
        }
      }
    }
  } catch (error: any) {
    console.error('流式分析失败:', error);
    onError(error);
  }
};
