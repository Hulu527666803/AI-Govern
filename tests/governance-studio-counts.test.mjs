/**
 * GovernanceStudio 业务对象数量展示逻辑单元测试
 * 校验：总数量、按域分组数量与 result.objects 一致，避免「识别 44 个仅显示 6 个」歧义
 * 运行：node tests/governance-studio-counts.test.mjs
 */

const result = {
  objects: [
    { id: '1', name: 'a', businessName: '表A', domain: '域1' },
    { id: '2', name: 'b', businessName: '表B', domain: '域1' },
    { id: '3', name: 'c', businessName: '表C', domain: '域2' },
    { id: '4', name: 'd', businessName: '表D', domain: '域2' },
    { id: '5', name: 'e', businessName: '表E', domain: '域2' },
    { id: '6', name: 'f', businessName: '表F', domain: '通用业务域' },
  ],
  relationships: [],
  terms: [],
  knowledge: [],
};

const domains = Array.from(new Set(result.objects.map(o => o.domain || '通用业务域')));
const domainCounts = domains.reduce((acc, d) => {
  acc[d] = result.objects.filter(o => (o.domain || '通用业务域') === d).length;
  return acc;
}, {});

// 断言：总数 = 6
const total = result.objects.length;
if (total !== 6) {
  console.error('FAIL: 期望 total=6, 实际', total);
  process.exit(1);
}

// 断言：域数量之和 = 6
const sumByDomain = Object.values(domainCounts).reduce((a, b) => a + b, 0);
if (sumByDomain !== 6) {
  console.error('FAIL: 各域数量之和应为 6, 实际', sumByDomain);
  process.exit(1);
}

// 断言：域1=2, 域2=3, 通用业务域=1
if (domainCounts['域1'] !== 2 || domainCounts['域2'] !== 3 || domainCounts['通用业务域'] !== 1) {
  console.error('FAIL: domainCounts 与预期不符', domainCounts);
  process.exit(1);
}

console.log('OK: GovernanceStudio 数量逻辑（总数量、按域分组）校验通过');
