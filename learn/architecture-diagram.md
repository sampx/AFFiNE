+-----------------------------+
| 用户界面 (Web / Electron) |
| |
| React + TypeScript |
| Radix UI / Emotion CSS |
| GraphQL API 调用 |
+------------+--------------+
|
| HTTP / WebSocket
v
+------------+--------------+
| 后端服务 (NestJS) |
| |
| GraphQL API (Apollo Server) |
| RESTful 接口 |
| Socket.IO 实时通信 |
| BullMQ 异步任务队列 |
+------------+--------------+
|
| 数据库操作
v
+------------+--------------+
| 数据库 (PostgreSQL / Redis) |
| |
| Prisma ORM 映射与迁移 |
| Redis 缓存 / 分布式锁 / 消息队列 |
+------------+--------------+
|
| 第三方服务调用
v
+------------+--------------+
| 第三方服务集成 |
| |
| OpenAI / Anthropic AI 模型 |
| Stripe / Apple Pay 支付系统 |
| S3 / GCP 存储服务 |
| Mixpanel / Google Analytics 统计 |
+-----------------------------+

```

## 架构层级说明

### 1. 用户界面层（Frontend）
- **React + TypeScript**：构建现代化的前端应用，支持 Web 和 Electron 客户端。
- **Radix UI / Emotion CSS**：高质量 UI 组件和样式系统。
- **GraphQL API 调用**：通过 Apollo Client 或 `ai` SDK 与后端交互。

### 2. 后端服务层（Backend）
- **NestJS 11 + TypeScript**：模块化结构、依赖注入、中间件支持。
- **GraphQL API**：使用 Apollo Server 提供统一的数据接口。
- **RESTful API**：用于文件上传、身份验证等非 GraphQL 场景。
- **Socket.IO 实时通信**：协同编辑、通知推送等功能。
- **BullMQ 异步任务队列**：处理文档同步、邮件发送等后台任务。

### 3. 数据存储层（Database）
- **PostgreSQL + Prisma ORM**：关系型数据存储与模型管理。
- **Redis**：缓存加速、分布式锁、消息队列支持。

### 4. 第三方服务集成（External Services）
- **AI 模型**：OpenAI、Anthropic、Google Vertex 等提供智能功能。
- **支付系统**：Stripe、Apple Pay 等用于订阅与交易。
- **对象存储**：S3、GCP Cloud Storage 用于文档与媒体存储。
- **分析工具**：Mixpanel、Google Analytics 用于用户行为追踪。

## 通信流程示例

1. **用户登录**：
   - 前端 → GraphQL API → Auth 模块 → JWT 生成 → 返回 Token。
2. **文档加载**：
   - 前端 → GraphQL 查询 → Doc 模块 → PostgreSQL 获取内容 → 返回给客户端。
3. **实时协作**：
   - 前端 A ↔ WebSocket ↔ Sync 模块 ↔ Redis Pub/Sub ↔ 前端 B。
4. **异步任务**：
   - 前端 → 触发任务 → BullMQ 队列 → Worker 模块执行 → 回调更新状态。

如需进一步细化某一层（如 GraphQL Schema 设计、Prisma 数据模型、WebSocket 协议等），请告诉我具体需求，我可以为你绘制更详细的架构图或提供代码级解析。
```
