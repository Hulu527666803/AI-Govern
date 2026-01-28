/**
 * Checkpoint Service - 时间回溯服务
 * 
 * 调用后端 Checkpoint API
 */

import { httpClient } from './httpClient';

export interface Checkpoint {
  checkpointId: string;
  threadId: string;
  parentId: string | null;
  timestamp: string;
  step: number;
  writes: Record<string, any>;
  summary: {
    objectCount: number;
    relationshipCount: number;
    termCount: number;
    currentNode: string | null;
    executedNodes: string[];
  };
}

export interface CheckpointState {
  checkpointId: string;
  threadId: string;
  parentId: string | null;
  timestamp: string;
  step: number;
  state: {
    objects: any[];
    relationships: any[];
    terms: any[];
    knowledge: any[];
    thinkingSteps: any[];
    executedNodes: string[];
    currentNode: string | null;
  };
  metadata: Record<string, any>;
}

export interface CheckpointDiff {
  checkpoint1: {
    id: string;
    timestamp: string;
    step: number;
  };
  checkpoint2: {
    id: string;
    timestamp: string;
    step: number;
  };
  objectsDiff: {
    added: any[];
    removed: any[];
    modified: any[];
    summary: {
      addedCount: number;
      removedCount: number;
      modifiedCount: number;
    };
  };
  relationshipsDiff: {
    added: any[];
    removed: any[];
    modified: any[];
    summary: {
      addedCount: number;
      removedCount: number;
      modifiedCount: number;
    };
  };
  termsDiff: {
    added: any[];
    removed: any[];
    modified: any[];
    summary: {
      addedCount: number;
      removedCount: number;
      modifiedCount: number;
    };
  };
}

/**
 * 列出会话的所有 checkpoints
 */
export const listCheckpoints = async (sessionId: string): Promise<Checkpoint[]> => {
  try {
    const response = await httpClient.get(`/ai/checkpoints/${sessionId}`);
    if (response.data.success) {
      return response.data.data.checkpoints;
    }
    throw new Error(response.data.error || '获取历史记录失败');
  } catch (error: any) {
    console.error('列出历史记录失败:', error);
    throw error;
  }
};

/**
 * 获取特定 checkpoint 的完整状态
 */
export const getCheckpointState = async (
  sessionId: string,
  checkpointId: string
): Promise<CheckpointState> => {
  try {
    const response = await httpClient.get(`/ai/checkpoint/${sessionId}/${checkpointId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || '获取版本状态失败');
  } catch (error: any) {
    console.error('获取版本状态失败:', error);
    throw error;
  }
};

/**
 * 对比两个 checkpoint 版本
 */
export const compareCheckpoints = async (
  sessionId: string,
  checkpointId1: string,
  checkpointId2: string
): Promise<CheckpointDiff> => {
  try {
    const response = await httpClient.post('/ai/checkpoint/compare', {
      sessionId,
      checkpointId1,
      checkpointId2,
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || '对比版本失败');
  } catch (error: any) {
    console.error('对比版本失败:', error);
    throw error;
  }
};

/**
 * 恢复到指定 checkpoint
 */
export const restoreCheckpoint = async (
  sessionId: string,
  checkpointId: string
): Promise<CheckpointState> => {
  try {
    const response = await httpClient.post('/ai/checkpoint/restore', {
      sessionId,
      checkpointId,
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || '恢复版本失败');
  } catch (error: any) {
    console.error('恢复版本失败:', error);
    throw error;
  }
};
