# AFFiNE 后端 API 功能详解

## 1. 用户管理

### 核心功能

- **用户注册与登录**：支持邮箱密码注册、JWT 认证、OAuth 登录。
- **身份验证**：通过 `@nestjs/passport` 实现多种认证方式（如本地登录、Google OAuth 等）。
- **权限控制**：基于 RBAC 模型，支持细粒度权限分配（如文档读写、工作区设置等）。
- **用户信息更新**：包括头像上传、昵称修改、邮箱验证等。
- **账号安全**：支持更改密码、绑定第三方账户、两步验证。

### 示例 API

```graphql
mutation changePassword($token: String!, $newPassword: String!, $userId: String) {
  changePassword(token: $token, newPassword: $newPassword, userId: $userId)
}

mutation uploadAvatar($avatar: Upload!) {
  uploadAvatar(avatar: $avatar) {
    avatarUrl
  }
}
```

## 2. 工作区管理

### 核心功能

- **创建与删除工作区**：用户可新建多个工作区，并对其执行删除操作。
- **成员管理**：支持添加/移除成员、设置角色（管理员、编辑者、观察者）。
- **权限配置**：对不同角色赋予不同级别的访问和操作权限。
- **配额控制**：限制每个工作区的存储空间、文档数量等资源使用情况。

### 示例 API

```graphql
mutation createWorkspace {
  createWorkspace {
    id
    name
  }
}

query workspace($id: ID!) {
  workspace(id: $id) {
    id
    name
    members {
      id
      role
    }
  }
}
```

## 3. 文档管理

### 核心功能

- **文档创建与编辑**：支持富文本编辑、版本历史记录。
- **文档同步**：实时协同编辑，确保多用户同时编辑时的数据一致性。
- **文档发布**：将文档设为公开或私有，支持链接分享。
- **文档权限**：针对特定用户或角色设置访问级别（只读、编辑、管理）。
- **文档归档与恢复**：长期保存重要文档，防止误删。

### 示例 API

```graphql
mutation publishDoc($workspaceId: ID!, $docId: ID!, $mode: PublicDocMode!) {
  publishDoc(workspaceId: $workspaceId, docId: $docId, mode: $mode) {
    public
    mode
  }
}

query doc($workspaceId: ID!, $docId: ID!) {
  doc(workspaceId: $workspaceId, docId: $docId) {
    content
    permissions {
      read
      write
    }
  }
}
```

## 4. 通知系统

### 核心功能

- **系统通知**：推送新消息、任务提醒等。
- **提及通知**：在文档中提及他人时自动触发通知。
- **标记已读**：支持手动或自动标记通知为已读。
- **通知历史**：保留所有通知记录供查阅。

### 示例 API

```graphql
query notifications($pagination: PaginationInput!) {
  notifications(pagination: $pagination) {
    items {
      id
      type
      body
      createdAt
      readAt
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

mutation mentionUser($input: MentionInput!) {
  mentionUser(input: $input)
}
```

## 5. 邮件服务

### 核心功能

- **邮件发送**：支持 SMTP 协议发送验证邮件、重置密码邮件等。
- **模板渲染**：使用 React 组件生成 HTML 邮件内容。
- **测试邮件**：提供接口用于测试邮件服务器配置是否正确。

### 示例 API

```graphql
mutation sendTestEmail($config: JSONObject!) {
  sendTestEmail(config: $config)
}
```

## 6. 支付集成

### 核心功能

- **订阅管理**：支持按月/年订阅高级功能。
- **支付网关**：集成 Stripe、Apple Pay 等主流支付平台。
- **发票处理**：自动生成并发送电子发票。

### 示例 API

```graphql
mutation createSubscription($plan: String!) {
  createSubscription(plan: $plan) {
    status
    paymentUrl
  }
}
```

## 7. AI 辅助（Copilot）

### 核心功能

- **智能建议**：基于 OpenAI、Anthropic 提供写作辅助。
- **代码理解**：分析文档中的代码片段并给出优化建议。
- **自然语言处理**：支持语音识别、翻译等功能。

### 示例 API

```graphql
query embedding($workspaceId: ID!) {
  workspace(id: $workspaceId) {
    embedding {
      workspaceId
    }
  }
}
```

## 8. 安全与性能保障

### 安全机制

- **速率限制**：防止 API 滥用，保护系统免受 DDoS 攻击。
- **加密传输**：使用 HTTPS 和 JWT 确保通信过程中的数据安全。
- **敏感操作防护**：关键操作需二次确认或验证码验证。

### 性能优化

- **缓存策略**：利用 Redis 缓存高频请求结果，提高响应速度。
- **异步处理**：复杂任务交由 BullMQ 队列处理，避免阻塞主线程。
- **分布式追踪**：OpenTelemetry 跟踪整个调用链路，快速定位瓶颈。

## 9. 开发指南与最佳实践

### 推荐开发流程

| 步骤             | 描述                                     |
| ---------------- | ---------------------------------------- |
| 1. 配置环境      | 安装依赖、启动数据库、配置 Prisma ORM    |
| 2. 修改 schema   | 更新 Prisma schema 并运行迁移脚本        |
| 3. 添加 resolver | 新增 GraphQL resolver 或 REST controller |
| 4. 编写测试      | 单元测试 + E2E 测试                      |
| 5. 构建部署      | 执行构建命令、部署至生产环境             |

### 调试技巧

- 使用 Winston 日志工具记录详细调试信息；
- 利用 Apollo Server Playground 直接测试 GraphQL 查询；
- 使用 Supertest 编写模拟 HTTP 请求进行测试。

## 10. 学习路线图

### 入门路径

1. 理解项目结构及模块划分；
2. 研究用户认证与权限控制逻辑；
3. 尝试运行项目并查看日志输出；
4. 分析核心业务模块（如文档、工作区）的实现细节。

### 进阶方向

- **深入模块系统**：学习如何创建 Feature Module 和 Service；
- **定制数据库模型**：参考 Prisma schema 添加新表或字段；
- **扩展 API 接口**：在 GraphQL resolver 或 REST controller 中添加新接口；
- **优化性能**：利用 Redis 缓存、BullMQ 异步任务提升关键路径性能；
- **增强安全性**：完善 JWT 认证、OAuth 登录、RBAC 权限控制逻辑。
