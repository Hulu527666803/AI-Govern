import { GovernanceResult, DataSource } from '../../types';
import { FieldChanges, ExtendedFieldChanges, FieldChangeDetail } from './types';

/**
 * 字段变更分析：比较原始元数据和AI治理结果
 */
export function analyzeFieldChanges(
  selectedSource: DataSource | null,
  result: GovernanceResult | null
): FieldChanges {
  if (!selectedSource || !result) return {};

  const changes: FieldChanges = {};

  // 解析原始元数据
  let originalTables: Record<string, string[]> = {};
  try {
    // 验证 content 是否为有效字符串
    if (!selectedSource.content || typeof selectedSource.content !== 'string') {
      console.warn('元数据内容为空或格式无效');
      return changes;
    }

    // ✅ 智能解析：支持 JSON 和纯文本格式
    let metadata;
    try {
      // 尝试解析 JSON
      metadata = JSON.parse(selectedSource.content);
      
      if (Array.isArray(metadata)) {
        metadata.forEach((table: any) => {
          const tableName = table.tableName || table.name;
          const columns = (table.columns || []).map((col: any) => 
            col.columnName || col.name || col.COLUMN_NAME
          );
          originalTables[tableName] = columns;
        });
      }
    } catch (jsonError) {
      // 不是 JSON，尝试解析纯文本格式（DDL 或格式化文本）
      console.info('元数据为纯文本格式，尝试解析...');
      
      const content = selectedSource.content;
      
      // 解析 "表名: xxx" 格式
      const tableNamePattern = /表名:\s*([^\n]+)/g;
      const tableMatches = [...content.matchAll(tableNamePattern)];
      
      // 或解析 CREATE TABLE 格式
      const createTablePattern = /CREATE\s+TABLE\s+(?:`([^`]+)`|"([^"]+)"\.?"?([^"\s(]+)"?|(\w+))/gi;
      const createMatches = [...content.matchAll(createTablePattern)];
      
      if (tableMatches.length > 0) {
        // 中文格式化文本
        tableMatches.forEach(match => {
          const tableName = match[1].trim();
          // 简单处理：暂时不提取字段信息
          originalTables[tableName] = [];
        });
      } else if (createMatches.length > 0) {
        // DDL 格式
        createMatches.forEach(match => {
          const tableName = match[1] || match[2] || match[3] || match[4];
          originalTables[tableName] = [];
        });
      } else {
        console.warn('无法识别元数据格式:', content.substring(0, 200));
      }
    }
  } catch (error) {
    console.warn('处理元数据时出错:', error);
  }

  // 比较每个治理对象
  result.objects.forEach(obj => {
    const mapping = obj.mappings?.[0];
    if (!mapping) return;

    const tableName = mapping.split('.')[0];
    const originalColumns = originalTables[tableName] || [];
    const governedColumns = obj.attributes?.map(attr => attr.name) || [];

    const added = governedColumns.filter(col => !originalColumns.includes(col));
    const removed = originalColumns.filter(col => !governedColumns.includes(col));

    if (added.length > 0 || removed.length > 0) {
      changes[obj.id] = { added, removed };
    }
  });

  return changes;
}

/**
 * 扩展版字段变更分析：支持四种状态（新增、删除、更改、无变化）
 */
export function analyzeExtendedFieldChanges(
  selectedSource: DataSource | null,
  result: GovernanceResult | null
): ExtendedFieldChanges {
  if (!selectedSource || !result) return {};

  const changes: ExtendedFieldChanges = {};

  // 解析原始元数据（复用上面的逻辑）
  let originalTables: Record<string, Array<{name: string, type?: string}>> = {};
  try {
    if (!selectedSource.content || typeof selectedSource.content !== 'string') {
      console.warn('元数据内容为空或格式无效');
      return changes;
    }

    let metadata;
    try {
      // 尝试解析 JSON
      metadata = JSON.parse(selectedSource.content);
      
      if (Array.isArray(metadata)) {
        metadata.forEach((table: any) => {
          const tableName = table.tableName || table.name;
          const columns = (table.columns || []).map((col: any) => ({
            name: col.columnName || col.name || col.COLUMN_NAME,
            type: col.type || col.dataType || col.DATA_TYPE
          }));
          originalTables[tableName] = columns;
        });
      }
    } catch (jsonError) {
      // 纯文本格式处理（简化版，不包含类型信息）
      console.info('元数据为纯文本格式，尝试解析...');
      const content = selectedSource.content;
      const tableNamePattern = /表名:\s*([^\n]+)/g;
      const tableMatches = [...content.matchAll(tableNamePattern)];
      
      const createTablePattern = /CREATE\s+TABLE\s+(?:`([^`]+)`|"([^"]+)"\.?"?([^"\s(]+)"?|(\w+))/gi;
      const createMatches = [...content.matchAll(createTablePattern)];
      
      if (tableMatches.length > 0) {
        tableMatches.forEach(match => {
          const tableName = match[1].trim();
          originalTables[tableName] = [];
        });
      } else if (createMatches.length > 0) {
        createMatches.forEach(match => {
          const tableName = match[1] || match[2] || match[3] || match[4];
          originalTables[tableName] = [];
        });
      }
    }
  } catch (error) {
    console.warn('处理元数据时出错:', error);
  }

  // 比较每个治理对象
  result.objects.forEach(obj => {
    const mapping = obj.mappings?.[0];
    if (!mapping) return;

    const tableName = mapping.split('.')[0];
    const originalColumns = originalTables[tableName] || [];
    const governedColumns = obj.attributes || [];

    const added: FieldChangeDetail[] = [];
    const removed: FieldChangeDetail[] = [];
    const modified: FieldChangeDetail[] = [];
    const unchanged: FieldChangeDetail[] = [];

    // 检查治理后的字段
    governedColumns.forEach(attr => {
      const originalCol = originalColumns.find(col => col.name === attr.name);
      
      if (!originalCol) {
        // 新增字段
        added.push({
          name: attr.name,
          type: attr.type
        });
      } else {
        // 字段存在，检查类型是否变化
        const typeChanged = originalCol.type && attr.type && 
                           originalCol.type.toLowerCase() !== attr.type.toLowerCase();
        
        if (typeChanged) {
          // 类型变化 = 更改
          modified.push({
            name: attr.name,
            type: attr.type,
            originalType: originalCol.type
          });
        } else {
          // 无变化
          unchanged.push({
            name: attr.name,
            type: attr.type
          });
        }
      }
    });

    // 检查被删除的字段
    originalColumns.forEach(col => {
      const isInGoverned = governedColumns.some(attr => attr.name === col.name);
      if (!isInGoverned) {
        removed.push({
          name: col.name,
          type: col.type
        });
      }
    });

    // 只记录有变化的对象
    if (added.length > 0 || removed.length > 0 || modified.length > 0 || unchanged.length > 0) {
      changes[obj.id] = { added, removed, modified, unchanged };
    }
  });

  return changes;
}
