
import { GoogleGenAI, Type } from "@google/genai";
import { GovernanceResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const performGovernanceAnalysis = async (
  sources: string,
  userPrompt: string
): Promise<GovernanceResult> => {
  const systemInstruction = `
    你是一位世界级的 AI 数据治理专家，专注于构建支撑“智能问数”功能的底层业务本体。
    
    你需要严格遵循【G-ABC 治理范式】进行思考：
    1. A - Annotation (业务标注): 识别原始物理资产的业务语义，将晦涩的表名、字段名映射为自然语言业务名。
    2. B - Bonding (本体粘合): 基于数据结构推断业务关系（1:1, 1:N, N:N）和逻辑链路，构建业务本体网络。
    3. C - Codification (规则编排): 固化业务指标、逻辑规则。
    
    【核心要求】：
    - 界面语言：所有输出内容（包括 ID 除外的所有字段值）必须使用中文。
    - 业务知识语义化：在 "knowledge" 部分，严禁直接输出 SQL 语句。逻辑说明必须是“普通业务人员能看懂的自然语言描述”。例如：不要写 "status = 1 AND amount > 100"，而要写“订单状态为已完成且订单金额大于100元”。
    - 字典转义：如果字段存在枚举值（如 0/1），请在描述中进行业务含义转义。
    - 必须生成对象样例 (sampleData)：为治理出的对象生成 3-5 行模拟数据。

    输出 JSON 格式要求：
    {
      "thinkingSteps": [
        { "phase": "A", "title": "阶段标题", "description": "核心思路", "details": ["细节1"] }
      ],
      "summary": "总体治理结论",
      "objects": [{"id": "uuid", "name": "tech_name", "businessName": "业务名", "description": "描述", "domain": "域", "attributes": [{"name": "col", "type": "STRING", "businessName": "列名", "description": "描述"}], "mappings": ["table.col"]}],
      "relationships": [{"id": "uuid", "sourceId": "id1", "targetId": "id2", "label": "关系名", "cardinality": "1:N"}],
      "terms": [{"id": "uuid", "term": "术语", "definition": "定义", "aliases": [], "rules": []}],
      "knowledge": [{"id": "uuid", "title": "规则名", "content": "具体逻辑说明", "logic": "语义化的判断逻辑（非代码）", "domain": "域", "type": "RULE"}],
      "sampleData": [
        {
          "objectName": "业务对象名",
          "columns": ["列业务名1", "列业务名2"],
          "rows": [{"列业务名1": "值1", "列业务名2": "值2"}]
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `原始元数据资产：\n${sources}\n\n当前治理指令：\n${userPrompt}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text) as GovernanceResult;
  } catch (e) {
    console.error("AI 响应解析失败", text);
    throw new Error("治理输出格式无效，请重试。");
  }
};
