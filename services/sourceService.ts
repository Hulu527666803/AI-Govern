import { httpClient } from './httpClient';
import { DataSource, SourceType } from '../types';

export const sourceService = {
  // 创建资产
  async createSource(domainId: string, name: string, type: SourceType, content: string, config: any = {}): Promise<DataSource> {
    const result = await httpClient.post<{ success: boolean; data: DataSource }>('/sources', {
      domainId,
      name,
      type,
      content,
      config
    });
    
    if (!result.success || !result.data) {
      throw new Error('创建资产失败');
    }
    
    return result.data;
  },

  // 获取域下的所有资产
  async getDomainSources(domainId: string): Promise<DataSource[]> {
    const result = await httpClient.get<{ success: boolean; data: DataSource[] }>(`/sources/domain/${domainId}`);
    
    if (!result.success || !result.data) {
      throw new Error('获取资产列表失败');
    }
    
    return result.data;
  },

  // 删除资产
  async deleteSource(id: string): Promise<boolean> {
    const result = await httpClient.delete<{ success: boolean }>(`/sources/${id}`);
    return result.success;
  }
};
