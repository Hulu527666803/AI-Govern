/**
 * 从治理结果生成 JSONRule（含虚拟节点 d、字典/枚举 _txt 字段 b/c）
 */
import type { GovernanceResult, FieldChangeRecord } from '../../types';
import type { JSONRule, JSONRuleClassDef, JSONRuleRelationshipDef, JSONRuleAttr } from '../../types/jsonRule';

const NAMESPACE = '/governance';
const VIRTUAL_ROOT_CLASS = `${NAMESPACE}/__root__`;

function attrTypeFromGovernance(t: string): string {
  const upper = (t || '').toUpperCase();
  if (upper.includes('INT') && !upper.includes('BIGINT')) return 'int';
  if (upper.includes('BIGINT')) return 'bigint';
  if (upper.includes('DOUBLE') || upper.includes('FLOAT') || upper.includes('DECIMAL')) return 'double';
  if (upper.includes('DATE') || upper.includes('TIME')) return upper.includes('STAMP') ? 'timestamp' : 'date';
  if (upper.includes('TEXT') || upper.includes('CLOB')) return 'text';
  return 'varchar';
}

export function governanceResultToJSONRule(result: GovernanceResult, datasetDesc?: string): JSONRule {
  const classList: string[] = [VIRTUAL_ROOT_CLASS];
  const classDefs: JSONRuleClassDef[] = [];

  // 1. 虚拟根节点（星空图中心，连到所有一级节点）
  classDefs.push({
    name: VIRTUAL_ROOT_CLASS,
    showName: '根节点',
    desc: '虚拟根节点，用于星空图展示',
    classToCard: true,
    instanceToCard: true,
    inStarChart: true,
    attrs: [
      { name: 'id', showName: 'ID', desc: '唯一标识', type: 'varchar', bizzKey: true, enable: true },
    ],
  });

  const objToClass = new Map<string, string>();

  (result.objects || []).forEach((obj) => {
    const classPath = `${NAMESPACE}/${obj.name || obj.id}`;
    const objectName = obj.name || obj.id || '';
    objToClass.set(obj.id, classPath);
    classList.push(classPath);

    const attrs: JSONRuleAttr[] = [];
    (obj.attributes || []).forEach((a) => {
      attrs.push({
        name: a.name,
        showName: a.businessName || a.name,
        desc: a.description || '',
        type: attrTypeFromGovernance(a.type),
        bizzKey: false,
        enable: true,
      });
      if ((a as any).isDict || (a as any).isEnum) {
        attrs.push({
          name: `${a.name}_txt`,
          showName: `${a.businessName || a.name}（文本）`,
          desc: (a as any).isDict ? '字典值填入' : `枚举值填入：${(a as any).enumMapping || ''}`,
          type: 'text',
          bizzKey: false,
          enable: true,
        });
      }
    });

    classDefs.push({
      name: classPath,
      showName: obj.businessName || obj.name,
      desc: obj.description || '',
      classToCard: true,
      instanceToCard: true,
      inStarChart: true,
      attrs,
    });
  });

  const relationshipDefs: Record<string, JSONRuleRelationshipDef> = {};

  // 2. 虚拟根到所有一级对象的关系
  (result.objects || []).forEach((obj) => {
    const toClass = objToClass.get(obj.id);
    if (toClass) {
      const key = `root_to_${obj.name || obj.id}`;
      relationshipDefs[key] = {
        fromClass: VIRTUAL_ROOT_CLASS,
        toClass,
        desc: `根节点 -> ${obj.businessName || obj.name}`,
      };
    }
  });

  // 3. 治理结果中的关系
  (result.relationships || []).forEach((rel, idx) => {
    const fromClass = objToClass.get(rel.sourceId) || `${NAMESPACE}/${rel.sourceId}`;
    const toClass = objToClass.get(rel.targetId) || `${NAMESPACE}/${rel.targetId}`;
    const key = `rel_${idx}_${rel.label || 'link'}`;
    relationshipDefs[key] = {
      fromClass,
      toClass,
      desc: rel.label || rel.cardinality || '关联',
    };
  });

  return {
    datasetDesc: datasetDesc || result.summary || '数据治理结果',
    classList,
    classDefs,
    relationshipDefs,
  };
}

/** 从治理结果构建 a~e 字段变更记录（供导出与后续脚本使用） */
export function buildFieldChangeRecord(result: GovernanceResult): FieldChangeRecord {
  const record: FieldChangeRecord = {
    renames: [],
    dictTxtFields: [],
    enumTxtFields: [],
    sqlDerivedFields: [],
  };
  if (result.fieldChangeRecord) {
    record.renames = result.fieldChangeRecord.renames || [];
    record.dictTxtFields = result.fieldChangeRecord.dictTxtFields || [];
    record.enumTxtFields = result.fieldChangeRecord.enumTxtFields || [];
    record.sqlDerivedFields = result.fieldChangeRecord.sqlDerivedFields || [];
    return record;
  }
  (result.objects || []).forEach((obj) => {
    const objectName = obj.name || obj.id || '';
    (obj.attributes || []).forEach((a: any) => {
      if (a.renamedFrom)
        record.renames.push({ objectName, fieldName: a.renamedFrom, newName: a.name, reason: '同名字段不同类型更名' });
      if (a.isDict) record.dictTxtFields.push({ objectName, fieldName: a.name, txtField: `${a.name}_txt` });
      if (a.isEnum) record.enumTxtFields.push({ objectName, fieldName: a.name, txtField: `${a.name}_txt`, enumMapping: a.enumMapping || '' });
    });
  });
  return record;
}
