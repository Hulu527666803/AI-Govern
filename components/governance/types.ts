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

export interface FieldChanges {
  [objectId: string]: {
    added: string[];
    removed: string[];
  };
}

export type TabType = 'ONTOLOGY' | 'GLOSSARY' | 'METRICS' | 'SAMPLES';
export type ExportType = 'M3' | 'MYSQL' | 'DM';
export type PublishStep = 'CONFIG' | 'PROGRESS' | 'RESULT';
