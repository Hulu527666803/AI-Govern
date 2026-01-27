import { GovernanceResult, DataSource } from '../../types';

/**
 * 生成数据结构分析文档（中文描述）
 */
export function generateDataStructureDoc(result: GovernanceResult, selectedSource?: DataSource | null): string {
  const lines: string[] = [];
  lines.push('# 数据结构分析报告');
  lines.push('');
  lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`**数据域**: ${selectedSource?.name || '未知'}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  lines.push('## 1. 数据概览');
  lines.push('');
  lines.push(`本次数据治理共识别出 **${result.objects.length} 个核心业务对象**，涵盖了业务系统的主要数据实体。以下是每个对象的详细结构说明：`);
  lines.push('');
  
  result.objects.forEach((obj: any, index: number) => {
    lines.push(`### ${index + 1}. ${obj.businessName}`);
    lines.push('');
    lines.push(`**技术名称**: \`${obj.name}\``);
    lines.push('');
    lines.push(`**业务含义**: ${obj.description || '暂无描述'}`);
    lines.push('');
    lines.push(`**所属领域**: ${obj.domain || '未分类'}`);
    lines.push('');
    
    if (obj.mappings && obj.mappings.length > 0) {
      lines.push(`**物理映射**: ${obj.mappings.join(', ')}`);
      lines.push('');
    }
    
    lines.push('#### 数据结构详情');
    lines.push('');
    lines.push('| 字段业务名 | 技术名称 | 数据类型 | 说明 |');
    lines.push('|----------|---------|---------|------|');
    
    obj.attributes.forEach((attr: any) => {
      const businessName = attr.businessName || attr.name;
      const techName = attr.name;
      const type = attr.type || 'UNKNOWN';
      const desc = attr.description || '无';
      lines.push(`| ${businessName} | \`${techName}\` | ${type} | ${desc} |`);
    });
    
    lines.push('');
    
    // 样例数据
    const sampleData = result.sampleData?.find((s: any) => 
      s.objectName === obj.businessName || s.objectName === obj.name
    );
    
    if (sampleData && sampleData.rows && sampleData.rows.length > 0) {
      lines.push('#### 数据样例');
      lines.push('');
      lines.push('以下是该对象的模拟数据示例，用于帮助理解业务语义：');
      lines.push('');
      
      const columns = sampleData.columns || Object.keys(sampleData.rows[0]);
      lines.push(`| ${columns.join(' | ')} |`);
      lines.push(`| ${columns.map(() => '---').join(' | ')} |`);
      
      sampleData.rows.forEach((row: any) => {
        const values = columns.map((col: string) => row[col] || '-');
        lines.push(`| ${values.join(' | ')} |`);
      });
      
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  });
  
  return lines.join('\n');
}

/**
 * 生成关系结构分析文档（中文描述）
 */
export function generateRelationshipDoc(result: GovernanceResult, selectedSource?: DataSource | null): string {
  const lines: string[] = [];
  lines.push('# 关系结构分析报告');
  lines.push('');
  lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`**数据域**: ${selectedSource?.name || '未知'}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  lines.push('## 1. 关系网络概览');
  lines.push('');
  
  if (!result.relationships || result.relationships.length === 0) {
    lines.push('本次治理未识别出明确的业务对象关系。这可能是因为：');
    lines.push('- 数据源为单表或独立实体');
    lines.push('- 关系隐含在业务逻辑中，未通过外键等方式显式表达');
    lines.push('');
    return lines.join('\n');
  }
  
  lines.push(`本次数据治理共识别出 **${result.relationships.length} 个业务关系**，构建了业务对象之间的逻辑关联网络。`);
  lines.push('');
  
  result.relationships.forEach((rel: any, index: number) => {
    const sourceObj = result.objects.find((o: any) => o.id === rel.sourceId);
    const targetObj = result.objects.find((o: any) => o.id === rel.targetId);
    
    if (!sourceObj || !targetObj) return;
    
    lines.push(`### ${index + 1}. ${sourceObj.businessName} → ${targetObj.businessName}`);
    lines.push('');
    lines.push(`**关系名称**: ${rel.label || '关联'}`);
    lines.push('');
    lines.push(`**关系类型**: ${rel.cardinality || '未知'}`);
    lines.push('');
    
    const cardinalityExplain: Record<string, string> = {
      '1:1': '一对一关系，表示两个对象之间存在唯一映射',
      '1:N': '一对多关系，表示一个源对象可以关联多个目标对象',
      'N:1': '多对一关系，表示多个源对象可以关联同一个目标对象',
      'N:N': '多对多关系，表示双方都可以关联多个对象，通常需要中间表实现'
    };
    
    const explain = cardinalityExplain[rel.cardinality] || '关系类型未明确定义';
    lines.push(`**关系说明**: ${explain}`);
    lines.push('');
    
    if (rel.description) {
      lines.push(`**业务含义**: ${rel.description}`);
      lines.push('');
    }
    
    lines.push(`**关联字段**: 从 \`${sourceObj.name}\` 到 \`${targetObj.name}\``);
    lines.push('');
    
    lines.push('---');
    lines.push('');
  });
  
  lines.push('## 2. 关系拓扑图');
  lines.push('');
  lines.push('> 💡 提示：请在 UINO 平台的「治理工作室」中查看可视化的关系拓扑图。');
  lines.push('');
  
  lines.push('### 对象依赖关系');
  lines.push('');
  const graph: Record<string, string[]> = {};
  result.relationships.forEach((rel: any) => {
    const sourceObj = result.objects.find((o: any) => o.id === rel.sourceId);
    const targetObj = result.objects.find((o: any) => o.id === rel.targetId);
    if (sourceObj && targetObj) {
      if (!graph[sourceObj.businessName]) graph[sourceObj.businessName] = [];
      graph[sourceObj.businessName].push(targetObj.businessName);
    }
  });
  
  Object.entries(graph).forEach(([source, targets]) => {
    lines.push(`- **${source}** 依赖/关联：`);
    targets.forEach(target => {
      lines.push(`  - ${target}`);
    });
  });
  lines.push('');
  
  return lines.join('\n');
}

/**
 * 生成数据治理说明文档（中文描述）
 */
export function generateGovernanceDoc(result: GovernanceResult, selectedSource?: DataSource | null): string {
  const lines: string[] = [];
  lines.push('# 数据治理说明文档');
  lines.push('');
  lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`**数据域**: ${selectedSource?.name || '未知'}`);
  lines.push(`**治理方法**: G-ABC 智能治理范式`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  lines.push('## 1. 治理概述');
  lines.push('');
  lines.push(result.summary || '本次数据治理旨在通过 AI 智能分析，将物理数据资产转化为业务可理解的语义模型，为「智能问数」功能提供底层支撑。');
  lines.push('');
  
  lines.push('## 2. 治理成果统计');
  lines.push('');
  lines.push('| 治理维度 | 数量 | 说明 |');
  lines.push('|---------|------|------|');
  lines.push(`| 业务对象 | ${result.objects.length} | 识别出的核心业务实体 |`);
  lines.push(`| 业务关系 | ${result.relationships?.length || 0} | 对象间的逻辑关联 |`);
  lines.push(`| 业务术语 | ${result.terms?.length || 0} | 标准化的业务词汇 |`);
  lines.push(`| 治理规则 | ${result.knowledge?.length || 0} | 固化的业务逻辑和指标 |`);
  lines.push('');
  
  // 业务术语词典
  if (result.terms && result.terms.length > 0) {
    lines.push('## 3. 业务术语词典');
    lines.push('');
    lines.push('以下是本次治理提取的标准业务术语，用于统一团队对业务概念的理解：');
    lines.push('');
    
    result.terms.forEach((term: any, index: number) => {
      lines.push(`### 3.${index + 1} ${term.term}`);
      lines.push('');
      lines.push(`**定义**: ${term.definition}`);
      lines.push('');
      
      if (term.aliases && term.aliases.length > 0) {
        lines.push(`**别名**: ${term.aliases.join('、')}`);
        lines.push('');
      }
      
      if (term.rules && term.rules.length > 0) {
        lines.push('**相关规则**:');
        term.rules.forEach((rule: string) => {
          lines.push(`- ${rule}`);
        });
        lines.push('');
      }
    });
  }
  
  // 业务知识与规则
  if (result.knowledge && result.knowledge.length > 0) {
    lines.push('## 4. 业务知识与规则');
    lines.push('');
    lines.push('以下是从数据治理过程中沉淀的业务逻辑和指标定义：');
    lines.push('');
    
    result.knowledge.forEach((k: any, index: number) => {
      lines.push(`### 4.${index + 1} ${k.title}`);
      lines.push('');
      lines.push(`**类型**: ${k.type === 'RULE' ? '业务规则' : k.type === 'METRIC' ? '指标定义' : '知识说明'}`);
      lines.push('');
      lines.push(`**领域**: ${k.domain || '通用'}`);
      lines.push('');
      lines.push(`**内容说明**: ${k.content}`);
      lines.push('');
      
      if (k.logic) {
        lines.push('**业务逻辑**:');
        lines.push('');
        lines.push(k.logic);
        lines.push('');
      }
    });
  }
  
  lines.push('## 5. 治理思路回溯');
  lines.push('');
  
  if (result.thinkingSteps && result.thinkingSteps.length > 0) {
    lines.push('以下是 AI 治理引擎的思考过程，展示了如何从原始数据演进到业务本体：');
    lines.push('');
    
    result.thinkingSteps.forEach((step: any, index: number) => {
      const phaseMap: Record<string, string> = {
        'A': 'Annotation (业务标注)',
        'B': 'Bonding (本体粘合)',
        'C': 'Codification (规则编排)',
        'M': 'Modification (增量修改)'
      };
      
      const phaseDesc = phaseMap[step.phase] || step.phase;
      lines.push(`### 步骤 ${index + 1}: ${step.title} [${phaseDesc}]`);
      lines.push('');
      lines.push(`**核心思路**: ${step.description}`);
      lines.push('');
      
      if (step.details && step.details.length > 0) {
        lines.push('**详细步骤**:');
        step.details.forEach((detail: string) => {
          lines.push(`- ${detail}`);
        });
        lines.push('');
      }
    });
  } else {
    lines.push('暂无详细的治理思路记录。');
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  lines.push('## 6. 使用建议');
  lines.push('');
  lines.push('1. **导入平台**: 将 `governance_result.json` 导入 UINO 平台，即可在「智能问数」中使用。');
  lines.push('2. **审查调整**: 建议业务专家审查本文档，对 AI 生成的语义标注进行必要的人工校准。');
  lines.push('3. **持续迭代**: 随着业务发展，可通过「增量修改」功能持续优化治理模型。');
  lines.push('4. **权限控制**: 敏感业务对象请在平台中设置合理的访问权限。');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*本文档由 UINO 智能数据治理平台自动生成*');
  lines.push('');
  
  return lines.join('\n');
}
