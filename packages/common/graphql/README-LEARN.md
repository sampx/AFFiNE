# @affine/graphql 模块技术备忘录

## 模块概述

该模块提供了 AFFiNE 应用的 GraphQL 客户端实现，包含：

- 所有 GraphQL 查询和变更的类型定义
- 预定义的 GraphQL 操作片段
- 文件上传支持

## 主要功能

### 1. 用户管理

- 用户 CRUD 操作
- 权限管理
- 邮箱验证和密码重置

### 2. 工作区管理

- 工作区创建/删除
- 成员管理
- 权限控制

### 3. 订阅和支付

- 订阅管理
- 发票查询
- 支付门户集成

### 4. AI Copilot 功能

- 上下文管理
- 会话历史
- 文件嵌入和搜索

### 5. 文件管理

- Blob 存储操作
- 文件上传/下载
- 配额管理

## 文件结构

```
packages/common/graphql/
├── src/
│   ├── index.ts          # 主入口文件
│   ├── fetcher.ts        # GraphQL 请求处理器
│   ├── schema.ts         # 类型定义
│   └── graphql/
│       └── index.ts      # 所有 GraphQL 操作定义 (2000+ 行)
```

## 技术细节

- 使用 TypeScript 接口定义 GraphQL 查询/变更
- 支持文件上传 (通过 `file: true` 标记)
- 包含详细的错误处理
- 使用片段(fragments)复用查询部分

## 使用示例

```typescript
import { getWorkspaceQuery } from '@affine/graphql';

const result = await client.query({
  query: getWorkspaceQuery,
  variables: { id: workspaceId },
});
```

## 依赖关系

- graphql
- @apollo/client
- 与核心认证/存储模块集成
