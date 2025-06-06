# AFFiNE 后端架构与开发指南

## 1. 技术栈概览

### 核心框架与语言

- **NestJS 11**：基于 TypeScript 的 Node.js 框架，提供模块化、依赖注入和面向对象的开发体验。
- **TypeScript 5.7**：全项目启用 `strict` 模式，确保类型安全。
- **GraphQL + Apollo Server 4**：使用 GraphQL 实现灵活的数据查询接口，配合 Apollo Server 提供高性能 API 服务。
- **Prisma ORM**：用于数据库操作，支持 PostgreSQL、MySQL 等关系型数据库。
- **Redis**：缓存、消息队列和分布式锁支持。
- **BullMQ**：任务队列系统，支持异步任务处理（如邮件发送、文档同步等）。
- **Socket.IO + WebSockets**：实时通信支持，用于协同编辑、通知推送等功能。

### 认证与权限

- **JWT**：用于用户身份验证和会话管理。
- **OAuth 2.0 / SSO**：支持第三方登录和单点登录。
- **RBAC 模型**：基于角色的访问控制，实现细粒度权限管理。

### 安全与性能

- **Argon2 / Bcrypt**：密码加密算法。
- **Rate Limiting / Throttling**：防止 API 滥用。
- **OpenTelemetry**：分布式追踪与监控。
- **Prometheus Exporter**：暴露指标供 Prometheus 收集。
- **Winston Logger**：结构化日志记录，支持调试信息输出。

### 开发工具链

- **Yarn Workspaces + Turborepo**：支持 monorepo 结构，便于跨包引用和模块化开发。
- **Prisma Migrate**：数据库迁移工具，支持版本化 schema 管理。
- **Docker + Docker Compose**：本地开发和部署环境容器化。
- **CI/CD Pipeline**：自动化测试、构建与部署流程。

## 2. 后端架构解析

### 目录结构

```
packages/backend/server/
├── src/                  # 核心源码目录
│   ├── app.module.ts     # 主模块配置
│   ├── server.ts         # 服务启动入口
│   ├── cli.ts            # CLI 工具入口
│   ├── base/             # 基础设施模块（日志、配置、数据库等）
│   └── core/             # 核心业务模块（用户、认证、权限、文档等）
├── prisma/               # Prisma schema 和 migrations
├── package.json          # 依赖与脚本配置
└── README.md             # 快速入门指南
```

### 模块体系

AFFiNE 后端采用模块化设计，核心模块包括：

- **Base 模块**：提供基础功能（如日志、配置、数据库连接等）。
- **Auth 模块**：实现用户注册、登录、权限控制等。
- **User 模块**：用户管理、头像上传、设置管理。
- **Workspace 模块**：工作区创建、成员管理、权限分配。
- **Doc 模块**：文档存储、渲染、同步服务。
- **Notification 模块**：通知系统、事件订阅。
- **Payment 模块**：支付集成（Stripe、Apple Pay 等）。
- **Copilot 模块**：AI 助手集成（OpenAI、Anthropic 等）。

### 数据库模型

使用 Prisma ORM 管理数据模型，主要实体包括：

- **User**：用户基本信息、加密凭证。
- **Workspace**：工作区元数据、配额限制。
- **Document**：文档内容、版本历史。
- **Permission**：资源访问控制策略。
- **Subscription**：用户订阅状态、支付记录。

### 接口设计

#### GraphQL API

- 使用 Apollo Server 实现统一的 GraphQL 接口。
- 支持分页、过滤、排序等高级查询。
- 集成 OpenTelemetry 进行请求追踪。

#### RESTful API

- 用于部分非 GraphQL 场景（如文件上传、身份验证）。
- 通过 Express 中间件实现。

## 3. 开发指南与最佳实践

### 开发命令

| 命令             | 描述                         |
| ---------------- | ---------------------------- |
| `yarn dev`       | 启动开发服务器               |
| `yarn build`     | 构建生产版本                 |
| `yarn test`      | 运行单元测试                 |
| `yarn e2e`       | 执行端到端测试               |
| `yarn lint`      | 执行 ESLint 和 Prettier 检查 |
| `yarn typecheck` | TypeScript 类型检查          |

### 编码规范

- **命名规范**：`camelCase`（变量/函数）、`PascalCase`（类名/模块）；
- **导入排序**：使用 `simple-import-sort` 插件自动排序；
- **错误处理**：避免使用 `any`，推荐使用自定义错误类型和 `try/catch` 显式捕获；
- **日志记录**：使用 `AFFiNELogger` 统一日志格式，便于调试和追踪；
- **事务管理**：使用 `@nestjs-cls/transactional` 注解实现数据库事务。

### 测试与调试

- **单元测试**：使用 AVA 替代 Jest，更轻量且兼容性更好；
- **E2E 测试**：使用 Supertest 和 Playwright 编写端到端测试；
- **调试工具**：使用 Winston 日志、OpenTelemetry 分布式追踪、GraphQL Playground 调试 API。

## 4. 学习建议与路线图

### 入门路径

1. **阅读 README.md**：了解后端服务的基本信息和开发指南；
2. **查看 packages/backend/server/src/index.ts 和 server.ts**：理解服务启动流程；
3. **研究 app.module.ts**：掌握模块加载机制和依赖注入配置；
4. **探索 base 模块**：熟悉日志、配置、数据库连接等基础设施；
5. **尝试运行项目**：执行 `yarn dev` 启动本地开发环境。

### 进阶方向

- **深入模块系统**：学习如何创建 Feature Module 和 Service；
- **定制数据库模型**：参考 Prisma schema 添加新表或字段；
- **扩展 API 接口**：在 GraphQL resolver 或 REST controller 中添加新接口；
- **优化性能**：利用 Redis 缓存、BullMQ 异步任务提升关键路径性能；
- **增强安全性**：完善 JWT 认证、OAuth 登录、RBAC 权限控制逻辑。
