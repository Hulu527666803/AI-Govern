import { GovernanceResult, DataSource } from '../../types';
import { FieldChanges } from './types';

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
    const metadata = JSON.parse(selectedSource.content);
    if (Array.isArray(metadata)) {
      metadata.forEach((table: any) => {
        const tableName = table.tableName || table.name;
        const columns = (table.columns || []).map((col: any) => 
          col.columnName || col.name || col.COLUMN_NAME
        );
        originalTables[tableName] = columns;
      });
    }
  } catch (error) {
    console.warn('无法解析原始元数据:', error);
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
