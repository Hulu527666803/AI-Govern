/**
 * JSONRule 规范类型定义
 * 用于 M3 / 星空图等下游的类与关系定义
 */

export interface JSONRuleAttr {
  name: string;
  showName: string;
  desc: string;
  type: string; // varchar | text | int | bigint | double | timestamp | date | bucket | vector
  bizzKey: boolean;
  enable: boolean;
  indicators?: { name: string; desc: string; unit: string }[];
}

export interface JSONRuleClassDef {
  name: string;       // 如 "/namespace/class0"
  showName: string;
  desc: string;
  classToCard: boolean;
  instanceToCard: boolean;
  inStarChart: boolean;
  attrs: JSONRuleAttr[];
}

export interface JSONRuleRelationshipDef {
  fromClass: string;
  toClass: string;
  desc: string;
}

export interface JSONRule {
  datasetDesc: string;
  classList: string[];
  classDefs: JSONRuleClassDef[];
  relationshipDefs: Record<string, JSONRuleRelationshipDef>;
}
