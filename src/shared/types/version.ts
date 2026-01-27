/**
 * 版本类型定义
 * 用于区分 v1 (经典版) 和 v2 (Agentic AI 版)
 */

export type AppVersion = 'v1' | 'v2';

export interface VersionConfig {
  version: AppVersion;
  displayName: string;
  description: string;
  apiPrefix: string;
  features: {
    streaming?: boolean;
    humanInLoop?: boolean;
    verification?: boolean;
  };
}

export const VERSION_CONFIGS: Record<AppVersion, VersionConfig> = {
  v1: {
    version: 'v1',
    displayName: '经典版',
    description: '稳定可靠的数据治理',
    apiPrefix: '/api/v1',
    features: {},
  },
  v2: {
    version: 'v2',
    displayName: 'Agentic AI',
    description: '智能对话式治理 (实验性)',
    apiPrefix: '/api/v2',
    features: {
      streaming: true,
      humanInLoop: true,
      verification: false, // Phase 3 开启
    },
  },
};
