import { httpClient } from './httpClient';
import { DataDomain } from '../types';

export const domainService = {
  /**
   * 获取用户的所有数据域
   */
  async getUserDomains(): Promise<DataDomain[]> {
    const response = await httpClient.get<{ success: boolean; data: DataDomain[] }>('/domains');
    return response.data;
  },

  /**
   * 创建数据域
   */
  async createDomain(name: string, description: string): Promise<DataDomain> {
    const response = await httpClient.post<{ success: boolean; data: DataDomain }>('/domains', {
      name,
      description
    });
    return response.data;
  },

  /**
   * 删除数据域
   */
  async deleteDomain(id: string): Promise<boolean> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(`/domains/${id}`);
    return response.success;
  }
};
