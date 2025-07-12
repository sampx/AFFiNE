# @affine/graphql 模块技术备忘录

## 模块概述

该模块提供了 AFFiNE 应用的 GraphQL 客户端实现，包含：

- 所有 GraphQL 查询和变更的类型定义
- 预定义的 GraphQL 操作片段
- 文件上传支持
- 通过插件生成 graphql client 代码

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
├── package.json
├── codegen.yml           # GraphQL Code Generator 配置文件
├── export-gql-plugin.cjs # 自定义 GraphQL Code Generator 插件
└── src/
    ├── index.ts          # 主入口文件
    ├── fetcher.ts        # GraphQL 请求处理器
    ├── schema.ts         # GraphQL Schema 对应的 TypeScript 类型定义
    └── graphql/
        ├── *.gql         # 你的 GraphQL 查询、变更和片段文件
        └── index.ts      # 所有 GraphQL 操作定义 (由 gql-gen 生成)
```

## 技术细节

- 使用 TypeScript 接口定义 GraphQL 查询/变更
- 支持文件上传 (通过 `file: true` 标记)
- 包含详细的错误处理
- 使用片段(fragments)复用查询部分

## 完整的 GraphQL 开发流程

在 AFFiNE 项目中，GraphQL 的开发流程可以概括为以下几个主要步骤：

### 1. 后端：设计数据库与实现 GraphQL API

- **数据库表设计**: 后端开发人员设计数据库表结构，决定数据如何存储。
- **GraphQL API 实现**: 基于数据库设计，后端使用框架（如 NestJS）编写代码，定义 GraphQL 的 **类型 (Types)** 和 **解析器 (Resolvers)**。
  - **类型**: 对应数据库中的数据结构，例如定义一个 `User` 类型，包含 `id`、`name`、`email` 等字段。
  - **解析器**: 告诉 GraphQL 服务器如何从数据库或其他数据源获取或修改数据。
- **自动生成 `schema.gql`**: 后端框架会根据这些类型和解析器的定义，**自动生成**一个名为 `schema.gql` 的文件（例如 [`packages/backend/server/src/schema.gql`](packages/backend/server/src/schema.gql)）。这个文件是你的 GraphQL API 的完整描述，前端会依赖它来了解可用的数据和操作。**你不需要手动编辑这个文件。**

### 2. 前端：编写 GraphQL 操作 (`.gql` 文件)

- **根据 `schema.gql` 编写查询/变更**: 前端开发人员会参考后端生成的 `schema.gql` 文件，了解有哪些数据类型和操作可用。然后，他们会编写具体的 GraphQL 查询 (`query`)、变更 (`mutation`) 和片段 (`fragment`)，并将它们保存在 `.gql` 文件中（例如 `packages/common/graphql/src/graphql/**/*.gql`）。
- **使用 `#import` 导入片段**: 为了代码复用，你可以在 `.gql` 文件中使用 `#import` 语句来导入其他 `.gql` 文件中定义的片段。这有助于模块化你的 GraphQL 定义。

  ```graphql
  # 示例：packages/common/graphql/src/graphql/getUserInfo.gql
  query GetUserInfo($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }

  # 示例：packages/common/graphql/src/graphql/userBasicFields.gql
  fragment UserBasicFields on User {
    id
    name
  }

  # 示例：packages/common/graphql/src/graphql/getUserWithBasicFields.gql
  #import "./userBasicFields.gql" # 导入片段

  query GetUserWithBasicFields($id: ID!) {
    user(id: $id) {
      ...UserBasicFields # 使用片段
      email
    }
  }
  ```

### 3. 前端：自动生成客户端代码

- **配置 `codegen.yml`**: 在 `packages/common/graphql/` 目录下有一个 `codegen.yml` 文件，它是 GraphQL Code Generator 的配置文件。它告诉工具：
  - 你的 GraphQL Schema 在哪里 (`schema: ../../backend/server/src/schema.gql`)。
  - 你的 GraphQL 操作文件在哪里 (`documents: ./src/**/*.gql`)。
  - 要使用哪些插件来生成代码。
  - 生成的文件应该输出到哪里。
- **`export-gql-plugin.cjs` 的作用**: 这个插件是 `codegen.yml` 中配置的一个自定义插件。它的主要任务是：
  - 读取你在 `.gql` 文件中定义的所有查询、变更和片段。
  - 将它们转换为易于在 JavaScript/TypeScript 中使用的常量对象和类型定义。
  - 处理 `#import` 语句，确保所有引用的片段都被正确地包含在最终生成的代码中。
  - 检测你是否使用了 GraphQL Schema 中已废弃的字段，并在生成代码中给出警告。
  - 检测你的变更是否包含文件上传 (`Upload`) 类型。
  - 最终，将所有这些生成的代码写入到 `packages/common/graphql/src/graphql/index.ts` 文件中。
- **运行生成命令**: 在 `packages/common/graphql/package.json` 中定义了一个 `build` 脚本：`"build": "gql-gen --errors-only"`。当你运行 `npm run build` 时，它会启动 GraphQL Code Generator，根据 `codegen.yml` 的配置，自动执行代码生成过程。

### 4. 前端：在应用程序中使用生成的代码

- 一旦代码生成完成，`packages/common/graphql/src/graphql/index.ts` 文件就会包含所有可用的 GraphQL 操作常量和类型。
- 你的前端应用程序可以直接从这个文件中导入这些常量和类型，然后使用它们来构建 GraphQL 请求，与后端 API 进行交互。这样，你就可以获得类型安全和更好的开发体验。

  ```typescript
  // 示例：在你的前端组件或服务中
  import { getUserInfoQuery, updateUserNameMutation } from '@affine/graphql/graphql'; // 导入生成的查询和变更

  // 假设你有一个 GraphQL 客户端库，例如 graphql-request
  import { request } from 'graphql-request';

  async function fetchAndDisplayUser(userId: string) {
    const data = await request(
      'YOUR_GRAPHQL_API_ENDPOINT', // 你的 GraphQL API 地址
      getUserInfoQuery.query, // 使用生成的查询字符串
      { id: userId } // 传递查询变量
    );
    console.log('User data:', data.user.name);
  }

  async function changeUserName(userId: string, newName: string) {
    const data = await request(
      'YOUR_GRAPHQL_API_ENDPOINT',
      updateUserNameMutation.query, // 使用生成的变更字符串
      { id: userId, newName: newName } // 传递变更变量
    );
    console.log('User name updated:', data.updateUser.name);
  }
  ```

## 使用示例

```typescript
import { getWorkspaceQuery, GraphQLQuery, Queries, Mutations } from '@affine/graphql/graphql';
import { request } from 'graphql-request';

// 示例：使用生成的查询对象
async function fetchWorkspace(workspaceId: string) {
  const result = await request('YOUR_GRAPHQL_API_ENDPOINT', getWorkspaceQuery.query, { id: workspaceId });
  console.log('Workspace data:', result);
}

// 示例：如何使用生成的类型
function handleQuery<T extends Queries>(query: T) {
  console.log(`Handling query: ${query.name}`);
  // query.variables 和 query.response 会根据具体的查询类型提供正确的类型提示
}

function handleMutation<T extends Mutations>(mutation: T) {
  console.log(`Handling mutation: ${mutation.name}`);
  // mutation.variables 和 mutation.response 会根据具体的变更类型提供正确的类型提示
}

fetchWorkspace('some-workspace-id');
```

## 依赖关系

- `graphql`
- `@graphql-codegen/cli`
- `@graphql-codegen/typescript`
- `@graphql-codegen/typescript-operations`
- 与核心认证/存储模块集成
