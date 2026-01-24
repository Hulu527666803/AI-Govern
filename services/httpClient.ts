/**
 * HTTP 客户端
 * 统一管理 API 请求，自动添加 session-id
 */

// 开发环境使用 Vite 代理 (/api -> http://localhost:5001)
// 生产环境可以通过 VITE_API_BASE_URL 环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * 获取当前 session ID
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem('ai_governance_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ai_governance_session_id', sessionId);
  }
  return sessionId;
}

/**
 * 通用请求方法
 */
async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const sessionId = getSessionId();
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(fullUrl, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('HTTP 请求错误:', error);
    throw error;
  }
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, options?: RequestInit): Promise<T> {
  return request<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export function post<T = any>(
  url: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });
}

/**
 * PUT 请求
 */
export function put<T = any>(
  url: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  return request<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, options?: RequestInit): Promise<T> {
  return request<T>(url, { ...options, method: 'DELETE' });
}

/**
 * 导出统一的 HTTP 客户端
 */
export const httpClient = {
  get,
  post,
  put,
  delete: del,
  getSessionId
};

export default httpClient;
