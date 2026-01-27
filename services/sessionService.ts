import { httpClient } from './httpClient';
import { Session } from '../types';

class SessionService {
  /**
   * 创建新会话
   */
  async createSession(domainId: string, domainName: string, metadata: any = {}): Promise<string> {
    const token = httpClient.getToken();
    const response = await httpClient.post('/sessions/create', {
      userId: token || 'anonymous',
      domainId,
      domainName,
      metadata
    });
    return response.sessionId;
  }

  /**
   * 获取用户的所有会话（支持按 domainId 过滤）
   */
  async getUserSessions(domainId?: string): Promise<Session[]> {
    // userId 会由后端从 token 中提取，或者在 httpClient 中处理
    // 这里假设后端 API 路径是 /sessions/user/:userId
    // 但由于我们使用了 token 作为 userId，我们可以让后端从 token 获取，或者前端传递
    // 根据之前的 httpClient 实现，token 被存储在 localStorage 中
    // 让我们检查一下 httpClient 的实现，看看是否能获取当前 userId (即 token)
    
    const token = httpClient.getToken();
    const userId = token || 'anonymous';

    const params: any = {};
    if (domainId) {
      params.domainId = domainId;
    }

    const response = await httpClient.get(`/sessions/user/${userId}`, params);
    return response.data;
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<Session> {
    const response = await httpClient.get(`/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    await httpClient.delete(`/sessions/${sessionId}`);
  }
}

export const sessionService = new SessionService();
