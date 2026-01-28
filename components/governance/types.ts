import * as d3 from 'd3';
import { GovernanceResult, DataSource } from '../../types';

export interface GovernanceStudioProps {
  result: GovernanceResult | null;
  theme?: 'light' | 'dark';
  selectedSource?: DataSource | null;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  businessName: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  label: string;
}

// ===== Diff 相关类型定义 =====

/**
 * Diff 状态枚举
 */
export type DiffStatus = 
  | 'UNCHANGED'  // 未变更
  | 'ADDED'      // 新增
  | 'REMOVED'    // 删除
  | 'RENAMED'    // 重命名
  | 'MODIFIED';  // 修改

/**
 * 属性 Diff 接口（带完整元数据）
 */
export interface AttributeDiff {
  name: string;
  originalName?: string;  // 重命名前的名称（仅当 status=RENAMED 时有值）
  type: string;
  description?: string;
  businessName?: string;
  mappings?: string[];
  isPrimaryKey?: boolean;
  status: DiffStatus;
  reason?: string;  // AI 解释为何做此修改
}

/**
 * 带 Diff 元数据的治理对象
 */
export interface GovernedObject {
  id: string;
  name: string;
  businessName?: string;
  chineseName?: string;
  description?: string;
  domain?: string;
  diffStatus?: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  diffStats?: {
    added: number;     // 新增字段数
    removed: number;   // 删除字段数
    renamed: number;   // 重命名字段数
    modified: number;  // 修改字段数
  };
  attributes: AttributeDiff[];
}

/**
 * 旧版 FieldChanges（向后兼容）
 */
export interface FieldChanges {
  [objectId: string]: {
    added: string[];
    removed: string[];
  };
}

export type TabType = 'ONTOLOGY' | 'GLOSSARY' | 'METRICS' | 'SAMPLES';
export type ExportType = 'M3' | 'MYSQL' | 'DM';
export type PublishStep = 'CONFIG' | 'PROGRESS' | 'RESULT';
