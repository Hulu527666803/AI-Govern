
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

export interface GovernanceResult {
  thinkingSteps: ThinkingStep[];
  objects: OntologyObject[];
  relationships: Relationship[];
  terms: BusinessTerm[];
  knowledge: BusinessKnowledge[];
  sampleData: SampleData[];
  summary: string;
  modelUsed?: string;
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
