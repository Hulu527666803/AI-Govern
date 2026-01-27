/**
 * 版本偏好存储工具
 * 使用 localStorage 保存用户的版本偏好
 */

import { AppVersion } from '../types/version';

const VERSION_KEY = 'ai_govern_preferred_version';

export const versionStorage = {
  /**
   * 获取用户偏好版本
   */
  getPreferred(): AppVersion | null {
    try {
      const stored = localStorage.getItem(VERSION_KEY);
      return stored as AppVersion | null;
    } catch {
      return null;
    }
  },

  /**
   * 设置用户偏好版本
   */
  setPreferred(version: AppVersion): void {
    try {
      localStorage.setItem(VERSION_KEY, version);
    } catch (error) {
      console.warn('Failed to save version preference:', error);
    }
  },

  /**
   * 清除偏好
   */
  clearPreferred(): void {
    try {
      localStorage.removeItem(VERSION_KEY);
    } catch (error) {
      console.warn('Failed to clear version preference:', error);
    }
  },
};
