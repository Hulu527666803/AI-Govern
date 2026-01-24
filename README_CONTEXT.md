# 前端上下文功能使用指南

## 功能概述

前端上下文功能提供了：
- 自动会话管理
- 上下文历史展示
- 会话清除功能
- 统一的HTTP客户端（自动携带session-id）

## 核心模块

### 1. useSession Hook

位置: `hooks/useSession.ts`

用于管理会话ID和加载上下文历史：

```typescript
import { useSession } from '../hooks/useSession';

function MyComponent() {
  const { 
    sessionId,           // 当前会话ID
    contextHistory,      // 上下文历史记录
    isLoading,           // 加载状态
    loadContextHistory,  // 手动加载上下文
    clearContext,        // 清除上下文
    getSessionId         // 获取sessionId
  } = useSession();

  return (
    <div>
      <p>Session: {sessionId}</p>
      <button onClick={clearContext}>清除上下文</button>
    </div>
  );
}
```

### 2. httpClient 服务

位置: `services/httpClient.ts`

统一的HTTP请求客户端，自动携带session-id：

```typescript
import httpClient from '../services/httpClient';

// GET 请求
const data = await httpClient.get('/api/data');

// POST 请求
const result = await httpClient.post('/api/governance', {
  prompt: 'analyze data'
});

// 获取当前 sessionId
const sessionId = httpClient.getSessionId();
```

**特性**：
- 自动从 localStorage 获取或生成 session-id
- 所有请求自动携带 `x-session-id` header
- 统一错误处理
- 支持自定义 headers

### 3. ContextPanel 组件

位置: `components/ContextPanel.tsx`

可折叠的上下文历史面板：

```typescript
import { ContextPanel } from '../components/ContextPanel';

function MyPage() {
  return (
    <div>
      <ContextPanel theme="dark" />
    </div>
  );
}
```

**功能**：
- 展示历史治理任务
- 显示任务时间、类型、使用的模型
- 可展开查看详细结果
- 一键清除所有上下文

## 集成示例

### 在 AnalysisCenter 中使用

```typescript
import { ContextPanel } from './ContextPanel';

export const AnalysisCenter = ({ theme }) => {
  return (
    <div>
      {/* 上下文历史面板 */}
      <ContextPanel theme={theme} />
      
      {/* 其他内容 */}
    </div>
  );
};
```

### 修改 AI 服务调用

`aiService.ts` 已自动集成，会在治理完成后保存上下文：

```typescript
// 治理完成后自动保存到后端
await httpClient.post('/api/context/save', {
  taskType: 'governance',
  taskDescription: userPrompt,
  inputData: { sources, prompt },
  outputData: result,
  modelUsed: settings.modelName,
  contextSnapshot: { objects, relationships, terms }
});
```

## 环境配置

创建 `.env.local` 文件（注意：.env 文件可能被 gitignore）：

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 数据流

```
用户发起治理
    ↓
httpClient 自动添加 x-session-id
    ↓
后端接收请求，加载历史上下文
    ↓
AI 执行治理（可利用历史上下文）
    ↓
返回结果并自动保存上下文
    ↓
前端更新 UI，ContextPanel 显示新记录
```

## 样式集成

ContextPanel 已与现有设计风格保持一致：
- 支持 light/dark 主题
- 使用相同的颜色变量
- 圆角、间距与其他组件统一
- 动画效果与整体风格匹配

## 性能考虑

### 1. 懒加载
上下文历史仅在面板展开时加载：

```typescript
useEffect(() => {
  if (isExpanded && sessionId) {
    loadContextHistory();
  }
}, [isExpanded, sessionId]);
```

### 2. 本地缓存
sessionId 存储在 localStorage，避免频繁生成

### 3. 防抖优化
如需频繁调用，可添加防抖：

```typescript
import { debounce } from 'lodash';

const debouncedLoad = useMemo(
  () => debounce(loadContextHistory, 300),
  [loadContextHistory]
);
```

## 常见问题

### Q: 如何重置会话？
A: 调用 `clearContext()` 会清除历史并生成新的 sessionId

### Q: 如何手动设置 sessionId？
A: 
```typescript
localStorage.setItem('ai_governance_session_id', 'custom-session-id');
window.location.reload(); // 重新加载应用
```

### Q: 上下文历史显示不完整？
A: 后端默认只保留最近10条记录，可在后端配置中调整 `contextWindow`

### Q: 如何在其他组件中访问上下文？
A: 
```typescript
import { useSession } from '../hooks/useSession';

function AnyComponent() {
  const { contextHistory } = useSession();
  // 使用 contextHistory
}
```

## 未来扩展

### 1. 上下文搜索
添加搜索功能，快速定位历史记录

### 2. 上下文导出
支持导出历史记录为 JSON/CSV

### 3. 上下文分析
可视化展示会话统计数据

### 4. 多会话切换
支持在多个会话之间切换
