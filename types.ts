
export enum SourceType {
  DDL = 'DDL',
  XLS = 'XLS',
  DICTIONARY = 'DICTIONARY',
  DATABASE = 'DATABASE'
}

export interface DataSource {
  id: string;
  domainId: string;
  name: string;
  type: SourceType;
  content: string;
  timestamp: number;
}

export interface DataDomain {
  id: string;
  name: string;
  description: string;
  timestamp: number;
}

export interface OntologyObject {
  id: string;
  name: string;
  businessName: string;
  description: string;
  domain: string;
  attributes: {
    name: string;
    type: string;
    businessName: string;
    description: string;
    /** 是否字典字段，需生成 name_txt 用于后续填值 */
    isDict?: boolean;
    /** 是否枚举字段，需生成 name_txt 用于后续填值 */
    isEnum?: boolean;
    /** 枚举映射，如 "0=否,1=是" 或 "01=工程人员,02=技术人员" */
    enumMapping?: string;
    /** 同表同名字段不同类型时的更名来源 */
    renamedFrom?: string;
  }[];
  mappings: string[]; 
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string; 
  cardinality: string; // 1:1, 1:N, N:N
}

export interface BusinessTerm {
  id: string;
  term: string;
  definition: string;
  aliases: string[];
  rules: string[];
}

export interface BusinessKnowledge {
  id: string;
  title: string;
  content: string;
  logic: string; 
  domain: string;
  type: 'CALCULATION' | 'RULE' | 'DIMENSION';
}

export interface ThinkingStep {
  phase: 'G' | 'A' | 'B' | 'C';
  title: string;
  description: string;
  details: string[];
}

export interface SampleData {
  objectName: string;
  columns: string[];
  rows: Record<string, any>[];
}

/** 同名字段不同类型时的更名记录（a） */
export interface FieldRenameRecord {
  objectName: string;
  fieldName: string;
  newName: string;
  reason: string;
}

/** 字典/枚举 _txt 字段与 SQL 解析新增字段的导出记录（b/c/e） */
export interface FieldChangeRecord {
  renames: FieldRenameRecord[];
  dictTxtFields: { objectName: string; fieldName: string; txtField: string }[];
  enumTxtFields: { objectName: string; fieldName: string; txtField: string; enumMapping: string }[];
  sqlDerivedFields: { objectName: string; fieldName: string; description?: string }[];
}

export interface GovernanceResult {
  thinkingSteps: ThinkingStep[];
  objects: OntologyObject[];
  relationships: Relationship[];
  terms: BusinessTerm[];
  knowledge: BusinessKnowledge[];
  sampleData: SampleData[];
  summary: string;
  modelUsed?: string;
  /** a~e 导出用：字段更名/字典_txt/枚举_txt/SQL解析字段记录 */
  fieldChangeRecord?: FieldChangeRecord;
}

export type AIEngineType = 'GEMINI_SDK' | 'OPENAI_COMPATIBLE';

export interface AISettings {
  engine: AIEngineType;
  baseUrl: string;
  modelName: string;
  apiKey?: string;
}

export interface Session {
  sessionId: string;
  userId: string;
  domainId: string;
  domainName: string;
  sourceId?: string;  // ✅ 关联的资产ID
  sourceName?: string;  // ✅ 关联的资产名称
  createdAt: string;
  lastActivity: string;
  status: string;
  metadata: any;
}

export interface ContextHistoryItem {
  id: number;
  taskType: string;
  taskDescription: string;
  inputData: any;
  outputData: any;
  modelUsed: string;
  timestamp: string;
  contextSnapshot: any;
}
