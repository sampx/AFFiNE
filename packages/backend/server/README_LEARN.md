# AFFiNE 后端学习指南：从入门到实践

欢迎来到 AFFiNE 后端的世界！这份文档旨在帮助初学者快速理解 AFFiNE 后端的架构、核心功能以及如何进行开发。我们将用简单易懂的语言，带你一步步探索这个强大的系统。

## 1. AFFiNE 后端概览：它是什么？

AFFiNE 后端是整个 AFFiNE 应用的“大脑”，负责处理所有数据、用户请求和复杂逻辑。它就像一个大型的服务器，确保你的文档、工作区和所有操作都能顺畅运行。

### 核心技术栈：我们用什么来构建它？

AFFiNE 后端使用了许多现代且强大的技术，它们共同协作，构建了一个高效、稳定的系统。

- **NestJS 11 (基于 TypeScript 的 Node.js 框架)**：一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。它使用渐进式 JavaScript，内置对 TypeScript 的支持，并结合了 OOP（面向对象编程）、FP（函数式编程）和 FRP（函数响应式编程）的元素。你可以把它想象成一个“骨架”，帮助我们有条理地搭建后端服务。
- **TypeScript 5.7**：一种让 JavaScript 更强大的语言。它能帮助我们在编写代码时就发现错误，就像一个智能的拼写检查器。我们启用了 `strict` 模式，这意味着对代码的检查非常严格，确保了高质量。
- **GraphQL + Apollo Server 4**：这是一种非常灵活的数据查询方式。你可以精确地告诉服务器你需要什么数据，而不是一次性获取所有数据。Apollo Server 则是帮助我们实现 GraphQL 接口的工具。
- **Prisma ORM**：一个帮助我们与数据库“对话”的工具。它让我们用更简单的方式来操作数据，而不需要直接写复杂的 SQL 语句。它支持 PostgreSQL、MySQL 等多种数据库。
- **Redis**：一个超快的“临时存储区”，用于：
  - **缓存**：存储经常访问的数据，加快响应速度。
  - **消息队列**：处理需要异步执行的任务（比如发送邮件），避免阻塞主程序。
  - **分布式锁**：在多个服务器同时操作时，确保数据的一致性。
- **BullMQ**：一个专门用于管理“任务队列”的系统。比如，当用户上传一个大文件时，我们不需要立即处理完，可以把它放到队列里，让 BullMQ 在后台慢慢处理。
- **Socket.IO + WebSockets**：实现实时通信的关键技术。想象一下多人同时编辑文档，你输入的内容能立刻显示在别人的屏幕上，这就是 WebSockets 的功劳。

### 认证与权限：谁能做什么？

- **JWT (JSON Web Token)**：一种安全地验证用户身份的方式。当你登录后，服务器会给你一个“令牌”，你带着这个令牌就可以访问受保护的资源。
- **OAuth 2.0 / SSO (单点登录)**：支持通过第三方服务（如 Google、GitHub）登录，或者在多个应用之间实现一次登录，处处可用。
- **RBAC 模型 (基于角色的访问控制)**：一种精细的权限管理方式。比如，管理员可以做所有事情，编辑者只能修改文档，观察者只能查看。

### 安全与性能：如何保障系统稳定？

- **Argon2 / Bcrypt**：用于加密用户密码的算法，确保即使数据库泄露，密码也不会被轻易破解。
- **Rate Limiting / Throttling (速率限制)**：防止恶意用户频繁访问 API，保护服务器不被滥用。
- **OpenTelemetry**：一个“侦探工具”，用于追踪请求在系统中的整个生命周期，帮助我们发现性能瓶颈。
- **Prometheus Exporter**：暴露系统运行指标（如 CPU 使用率、内存占用），供监控系统收集和分析。
- **Winston Logger**：一个强大的日志记录工具，帮助我们记录系统运行时的各种信息，方便调试和问题排查。

### 开发工具链：我们如何协作开发？

- **Yarn Workspaces + Turborepo**：我们使用 Monorepo（单一代码仓库）结构，这意味着所有相关的项目代码都放在一个仓库里。Yarn Workspaces 和 Turborepo 帮助我们高效地管理这些项目，实现代码复用和快速构建。
- **Prisma Migrate**：数据库版本管理工具。当数据库结构发生变化时，它能帮助我们平滑地升级数据库。
- **Docker + Docker Compose**：将开发和部署环境“打包”成容器。这意味着无论你在哪里开发，环境都是一致的，避免了“在我机器上能跑”的问题。
- **CI/CD Pipeline (持续集成/持续部署)**：自动化测试、构建和部署流程。每次代码提交后，系统会自动进行测试和部署，确保代码质量和快速发布。

## 2. 后端架构解析：系统内部是如何组织的？

### 目录结构：代码在哪里？

AFFiNE 后端的核心代码位于 `packages/backend/server/` 目录下。让我们看看它的主要结构：

```
packages/backend/server/
├── src/                  # 核心源码目录，所有重要的代码都在这里
│   ├── app.module.ts     # NestJS 主模块，定义了整个应用的模块和依赖
│   ├── main.ts           # 服务启动的入口文件，程序从这里开始运行 (实际为 index.ts)
│   ├── cli.ts            # 命令行工具的入口，用于执行一些后台任务
│   ├── base/             # 基础设施模块，包含了日志、配置、数据库连接等基础功能
│   ├── models/           # 数据库模型对应的业务逻辑层模型
│   ├── plugins/          # 各种插件，如索引、OAuth
│   └── ...               # 其他业务模块
├── prisma/               # Prisma 数据库迁移文件目录
├── schema.prisma         # Prisma 数据库 Schema 定义文件
├── package.json          # 项目的依赖和脚本配置
└── README.md             # 后端服务的快速入门指南
```

### 模块体系：功能是如何划分的？

AFFiNE 后端采用模块化设计，每个模块负责特定的功能，这使得代码更易于管理和扩展。

- **Base 模块 (`src/base/`)**：提供基础功能，如日志记录、配置管理、数据库连接、GraphQL 基础配置、WebSocket 适配器、任务队列、指标收集、速率限制、守卫、辅助函数、互斥锁、NestJS 通用工具、Redis 客户端和存储服务等，是其他模块的基础。
- **Auth 模块**：处理用户注册、登录、身份验证和权限控制。
- **User 模块**：管理用户资料，如头像上传、昵称修改、邮箱验证等。
- **Workspace 模块**：负责工作区的创建、删除、成员管理和权限分配。
- **Doc 模块**：处理文档的存储、渲染、实时同步和版本历史。
- **Notification 模块**：管理系统通知和事件订阅。
- **Payment 模块**：集成支付功能，如订阅管理和支付网关。
- **Copilot 模块**：集成 AI 助手功能，提供智能建议和代码理解。

### NestJS 关键组件及使用说明

NestJS 框架的核心是其模块化和依赖注入系统。理解这些组件对于开发和维护 AFFiNE 后端至关重要。

- **模块 (Modules)**：

  - 模块是 NestJS 应用程序的基本构建块，用于组织代码。每个应用程序至少有一个根模块（`AppModule`），通常是 `src/app.module.ts`。
  - 模块使用 `@Module()` 装饰器定义，并可以导入其他模块、声明控制器和提供者。
  - **在 AFFiNE 中的应用**：`src/app.module.ts` 是整个应用的入口，它导入了 `BaseModule`、`AuthModule`、`UserModule` 等核心模块，将它们组合成一个完整的应用程序。

  ```typescript
  // src/app.module.ts (简化示例)
  import { Module } from '@nestjs/common';
  import { AppController } from './app.controller';
  import { AuthModule } from './modules/auth/auth.module'; // 假设存在 AuthModule

  @Module({
    imports: [AuthModule], // 导入其他模块
    controllers: [AppController], // 声明控制器
    providers: [], // 声明提供者
  })
  export class AppModule {}
  ```

- **控制器 (Controllers)**：

  - 控制器负责处理传入的请求，并返回响应。它们使用 `@Controller()` 装饰器定义，并包含处理特定路由的方法。
  - **在 AFFiNE 中的应用**：例如，`src/app.controller.ts` 可能处理一些根路径的请求，而其他模块（如用户模块）会有自己的控制器来处理用户相关的 API 请求。

  ```typescript
  // src/app.controller.ts (简化示例)
  import { Controller, Get } from '@nestjs/common';

  @Controller('api') // 定义路由前缀
  export class AppController {
    @Get('hello') // 定义 GET 请求的路由
    getHello(): string {
      return 'Hello from AFFiNE Backend!';
    }
  }
  ```

- **服务 (Services) / 提供者 (Providers)**：

  - 提供者是 NestJS 的核心概念，它们可以是服务、仓库、工厂、助手等。它们负责封装业务逻辑和数据访问。
  - 服务通常使用 `@Injectable()` 装饰器定义，并通过依赖注入在控制器或其他服务中使用。
  - **在 AFFiNE 中的应用**：`src/base/prisma/factory.ts` 中的 `PrismaService` 就是一个提供者，它封装了 Prisma 客户端，并在其他服务中被注入使用。每个业务模块（如用户模块、工作区模块）都会有自己的服务来处理其特定的业务逻辑。

  ```typescript
  // src/modules/user/user.service.ts (简化示例)
  import { Injectable } from '@nestjs/common';
  import { PrismaService } from '../../base/prisma/factory'; // 假设路径

  @Injectable()
  export class UserService {
    constructor(private prisma: PrismaService) {} // 注入 PrismaService

    async getUserById(id: string) {
      return this.prisma.user.findUnique({ where: { id } });
    }
  }
  ```

- **中间件 (Middleware)**：

  - 中间件是在路由处理程序之前调用的函数，可以访问请求和响应对象，并执行各种任务（如日志记录、身份验证、数据解析）。
  - **在 AFFiNE 中的应用**：例如，`cookie-parser` 和 `express` 等依赖可能在 NestJS 应用中作为全局或特定路由的中间件使用，用于处理 HTTP 请求的预处理。

- **守卫 (Guards)**：

  - 守卫是用于授权的特殊提供者，它们决定给定请求是否应该由路由处理程序处理。它们在中间件之后、拦截器和管道之前执行。
  - **在 AFFiNE 中的应用**：`src/base/guard/` 目录下可能定义了各种守卫，用于检查用户权限或身份验证状态，例如 `AuthGuard` 用于保护需要登录才能访问的路由。

- **拦截器 (Interceptors)**：

  - 拦截器允许你在方法执行之前或之后绑定额外的逻辑。它们可以用于转换结果、转换异常、扩展基本请求行为等。
  - **在 AFFiNE 中的应用**：例如，在处理 GraphQL 请求时，可能会有拦截器用于日志记录、性能监控或数据格式化。

- **管道 (Pipes)**：
  - 管道用于转换输入数据或验证输入数据。它们在控制器方法被调用之前执行。
  - **在 AFFiNE 中的应用**：例如，用于验证传入请求体的格式，或者将字符串转换为数字类型。

### 数据库模型：数据是如何存储的？

我们使用 Prisma ORM 来管理数据库中的数据模型。`schema.prisma` 文件定义了所有的数据库表结构和关系。以下是一些主要的数据实体：

- **User (用户)**：存储用户的基本信息和加密后的登录凭证。
- **Workspace (工作区)**：存储工作区的元数据，如名称、创建者、存储配额等。
- **Document (文档)**：存储文档的内容和版本历史。
- **Permission (权限)**：定义了用户或角色对资源的访问控制策略。
- **Subscription (订阅)**：记录用户的订阅状态和支付信息。
- **AiPrompt (AI 提示词)**：存储 AI 助手的提示词配置。
- **AiSession (AI 会话)**：记录 AI 助手的会话历史。
- **AiContext (AI 上下文)**：存储 AI 助手的上下文信息，包括文档和文件的嵌入。

### 接口设计：如何与后端交互？

后端提供了两种主要的接口类型供前端或其他服务调用：

- **GraphQL API**：
  - 我们使用 Apollo Server 来实现统一的 GraphQL 接口。
  - 它支持灵活的数据查询，你可以根据需要选择性地获取数据，避免了不必要的数据传输。
  - 支持分页、过滤、排序等高级查询功能。
  - 集成了 OpenTelemetry 进行请求追踪，方便我们了解每个请求的执行情况。
- **RESTful API**：
  - 用于一些不适合 GraphQL 的场景，比如文件上传和某些身份验证流程。
  - 通过 Express 中间件实现。

### `@affine/graphql` 模块与后端的关系

`@affine/graphql` 模块是一个独立的 npm 包，其主要作用是为前端或其他客户端提供类型安全的 GraphQL API 接口。它不包含任何后端业务逻辑，而是通过 GraphQL Code Generator 工具，根据后端 `packages/backend/server/schema.gql` 文件中定义的 GraphQL Schema 自动生成 TypeScript 类型定义和 GraphQL 操作（查询、变更、订阅）。

**工作流程：**

1.  **后端定义 Schema**: 后端服务 (`@affine/server`) 通过 NestJS 和 GraphQL 模块定义其 GraphQL Schema，例如在 `src/schema.gql` 中。
2.  **`@affine/graphql` 生成代码**: `packages/common/graphql/codegen.yml` 配置文件指示 GraphQL Code Generator 读取后端 Schema (`../../backend/server/src/schema.gql`) 和客户端定义的 GraphQL 操作 (`./src/**/*.gql`)。
3.  **生成 TypeScript 类型和操作**: Code Generator 根据 Schema 和操作定义，生成 `src/schema.ts` (包含所有 GraphQL 类型) 和 `src/graphql/index.ts` (包含类型化的 GraphQL 查询、变更和订阅函数)。
4.  **客户端使用**: 前端或其他客户端项目（例如 `@affine/web`）可以导入 `@affine/graphql` 包，直接使用这些生成的 TypeScript 类型和函数来与后端 GraphQL API 进行交互，从而获得强大的类型提示和编译时检查，减少运行时错误。

**示例 (`packages/common/graphql/src/schema.ts` 片段)**：

```typescript
// 自动生成的 GraphQL 类型定义
export interface UserType {
  __typename?: 'UserType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  // ... 其他字段
}

export interface Query {
  __typename?: 'Query';
  currentUser: Maybe<UserType>;
  // ... 其他查询
}

export interface Mutation {
  __typename?: 'Mutation';
  createUser: UserType;
  // ... 其他变更
}
```

通过这种方式，`@affine/graphql` 模块充当了后端 GraphQL API 的“契约”和“客户端 SDK”，确保了前后端之间数据交互的一致性和健壮性。

### 如何使用 Prisma 进行开发

Prisma 是一个现代的数据库工具包，它简化了数据库访问、数据建模和迁移。在 AFFiNE 后端中，Prisma 扮演着核心角色。

**1. 定义数据库 Schema (`schema.prisma`)**

`schema.prisma` 文件是 Prisma 的核心，它定义了应用程序的数据库模型。每个 `model` 对应数据库中的一个表，字段定义了表的列，关系定义了表之间的连接。

**示例 (`packages/backend/server/schema.prisma` 片段)**：

```prisma
// 定义数据库连接
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL") // 从环境变量获取数据库连接URL
  extensions = [pgvector(map: "vector")] // 使用 pgvector 扩展支持向量存储
}

// 定义用户模型
model User {
  id              String    @id @default(uuid()) @db.VarChar
  name            String    @db.VarChar
  email           String    @unique @db.VarChar
  emailVerifiedAt DateTime? @map("email_verified") @db.Timestamptz(3)
  // ... 其他字段和关系
}

// 定义工作区模型
model Workspace {
  sid                Int      @unique @default(autoincrement())
  id                 String   @id @default(uuid()) @db.VarChar
  public             Boolean
  // ... 其他字段和关系
}
```

**关键点：**

- `datasource db`：配置数据库类型（`postgresql`）和连接 URL。`env("DATABASE_URL")` 表示数据库连接字符串将从环境变量 `DATABASE_URL` 中读取，这对于不同环境的配置非常灵活。
- `model`：定义数据模型，每个模型对应数据库中的一个表。
- `@id`, `@unique`, `@default`, `@map`：字段修饰符，用于定义主键、唯一约束、默认值和数据库列名映射。
- `@relation`：定义模型之间的关系，例如 `User` 和 `WorkspaceUserRole` 之间的关系。
- `@@map`：将 Prisma 模型名称映射到数据库表名。
- `@@index`：为字段创建索引，以提高查询性能。
- `Unsupported("vector(1024)")`：表示数据库中使用了 PostgreSQL 的 `pgvector` 扩展，用于存储 AI 相关的向量嵌入。

**2. 生成 Prisma Client**

在 `schema.prisma` 文件定义好后，你需要运行以下命令来生成 Prisma Client：

```bash
yarn prisma generate
```

这个命令会根据你的 `schema.prisma` 文件生成一个类型安全的 Node.js 客户端，位于 `node_modules/.prisma/client`。这个客户端允许你使用 TypeScript/JavaScript 代码直接与数据库进行交互，而无需手动编写 SQL。

**3. 数据库迁移 (`prisma migrate`)**

当你的数据模型发生变化（例如，添加新表、修改字段、添加关系）时，你需要使用 Prisma Migrate 来更新数据库结构。

- **创建迁移文件**：
  ```bash
  yarn prisma migrate dev --name your_migration_name
  ```
  这个命令会比较 `schema.prisma` 和数据库的当前状态，然后生成一个新的迁移文件（位于 `prisma/migrations` 目录下），其中包含了将数据库更新到新 Schema 所需的 SQL 语句。
- **应用迁移**：
  ```bash
  yarn prisma migrate deploy
  ```
  这个命令会执行所有尚未应用的迁移文件，将数据库结构更新到最新状态。在生产环境中，通常会使用这个命令。

**4. 在 NestJS 中使用 Prisma Client**

在 NestJS 应用中，你可以将 Prisma Client 作为一个服务注入到你的模块中。通常，你会创建一个 `PrismaService` 来封装 Prisma Client 的实例。

**示例 (`src/base/prisma/factory.ts` 或类似文件)**：

```typescript
// 这是一个简化的示例，实际代码可能更复杂
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super(); // 可以在这里传入 PrismaClientOptions，例如日志配置
  }

  async onModuleInit() {
    await this.$connect(); // 连接数据库
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close(); // 在应用关闭时断开数据库连接
    });
  }
}
```

然后，你可以在你的 NestJS 服务或解析器中注入 `PrismaService` 并使用它来执行数据库操作：

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../base/prisma/factory'; // 假设路径

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(name: string, email: string) {
    return this.prisma.user.create({
      data: { name, email },
    });
  }
}
```

通过 Prisma，开发者可以以一种直观、类型安全的方式与数据库交互，大大提高了开发效率和代码质量。

## 3. 核心 API 功能详解：后端能做什么？

AFFiNE 后端提供了丰富的功能，支持用户进行各种操作。

### 开发 GraphQL API

在 AFFiNE 后端，我们主要使用 GraphQL 来构建 API。NestJS 提供了强大的 `@nestjs/graphql` 模块，可以帮助我们高效地构建 GraphQL API。

**核心概念：**

- **Schema Definition Language (SDL)**：GraphQL 使用 SDL 来定义 API 的类型系统。在 AFFiNE 中，GraphQL Schema 通常定义在 `src/schema.gql` 文件中，它描述了所有可用的类型、查询（Query）、变更（Mutation）和订阅（Subscription）。
- **解析器 (Resolvers)**：解析器是负责处理 GraphQL 查询和变更的函数。它们将 GraphQL 操作映射到实际的数据源（例如，数据库、外部 API）。在 NestJS 中，解析器通常是带有 `@Resolver()` 装饰器的类，其方法使用 `@Query()`、`@Mutation()` 或 `@ResolveField()` 装饰器。
- **类型 (Types)**：在 GraphQL 中，类型定义了数据的结构。例如，`UserType` 定义了用户的字段。
- **输入类型 (Input Types)**：输入类型用于定义 GraphQL 变更的输入参数。
- **参数 (Args)**：用于向查询或变更传递参数。
- **查询 (Query)**：用于从服务器获取数据。
- **变更 (Mutation)**：用于向服务器发送数据（创建、更新、删除）。
- **订阅 (Subscription)**：用于实现实时数据流。

**在本项目中的具体开发流程：**

1.  **定义 GraphQL Schema (SDL)**：

    - 在 `packages/backend/server/src/schema.gql` 文件中定义或修改 GraphQL 类型、查询和变更。
    - **示例 (`src/schema.gql` 片段)**：

      ```graphql
      type User {
        id: ID!
        name: String!
        email: String!
      }

      type Query {
        # 获取当前用户
        currentUser: User
      }

      type Mutation {
        # 创建新用户
        createUser(name: String!, email: String!): User!
      }
      ```

2.  **创建 NestJS GraphQL Resolver**：

    - 在相应的模块中创建解析器文件（例如，`src/modules/user/user.resolver.ts`）。
    - 使用 `@Resolver()` 装饰器标记类，并使用 `@Query()` 或 `@Mutation()` 装饰器标记方法。
    - 注入服务（例如 `UserService`）来处理业务逻辑和数据访问。
    - **示例 (`src/modules/user/user.resolver.ts` 简化示例)**：

      ```typescript
      import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
      import { UserService } from './user.service'; // 假设存在 UserService
      import { UserType } from '@affine/graphql/schema'; // 导入自动生成的类型

      @Resolver(() => UserType) // 关联到 GraphQL 的 UserType
      export class UserResolver {
        constructor(private readonly userService: UserService) {}

        @Query(() => UserType, { nullable: true }) // 定义一个查询
        async currentUser(): Promise<UserType | null> {
          // 实际逻辑会从请求中获取当前用户
          return this.userService.getCurrentUser();
        }

        @Mutation(() => UserType) // 定义一个变更
        async createUser(@Args('name') name: string, @Args('email') email: string): Promise<UserType> {
          return this.userService.createUser(name, email);
        }
      }
      ```

3.  **更新 NestJS 模块**：

    - 在模块文件（例如，`src/modules/user/user.module.ts`）中导入并注册你的解析器和相关服务。
    - **示例 (`src/modules/user/user.module.ts` 简化示例)**：

      ```typescript
      import { Module } from '@nestjs/common';
      import { UserResolver } from './user.resolver';
      import { UserService } from './user.service';

      @Module({
        providers: [UserResolver, UserService], // 注册解析器和服务
      })
      export class UserModule {}
      ```

4.  **生成客户端代码 (`@affine/graphql`)**：

    - 在后端代码更新后，运行 `yarn graphql:codegen` (或类似的命令，具体取决于 `package.json` 中的脚本) 来更新 `@affine/graphql` 模块中的客户端类型和操作。
    - 这个步骤确保前端或其他客户端能够使用最新的 GraphQL API 定义，并获得类型安全。

5.  **测试 GraphQL API**：
    - 使用 GraphQL Playground (通常在开发模式下访问 `/graphql` 路径) 直接测试你的查询和变更。
    - 编写单元测试和 E2E 测试来验证 GraphQL API 的功能。

通过遵循这些步骤，你可以在 AFFiNE 后端中高效地开发和维护 GraphQL API。

### 3.1 用户管理

- **用户注册与登录**：支持通过邮箱密码注册，使用 JWT 进行身份验证，也支持通过 Google 等第三方 OAuth 登录。
- **身份验证**：通过 `@nestjs/passport` 模块实现多种认证策略。
- **权限控制**：基于 RBAC 模型，可以为用户分配不同的角色，从而控制他们对文档、工作区等资源的访问权限。
- **用户信息更新**：用户可以上传头像、修改昵称、验证邮箱等。
- **账号安全**：支持修改密码、绑定/解绑第三方账户、开启两步验证等。

**示例 API (GraphQL)**：

```graphql
# 修改密码
mutation changePassword($token: String!, $newPassword: String!, $userId: String) {
  changePassword(token: $token, newPassword: $newPassword, userId: $userId)
}

# 上传头像
mutation uploadAvatar($avatar: Upload!) {
  uploadAvatar(avatar: $avatar) {
    avatarUrl
  }
}
```

### 3.2 工作区管理

- **创建与删除工作区**：用户可以创建多个独立的工作区，并根据需要删除它们。
- **成员管理**：在工作区内添加或移除成员，并为他们设置不同的角色（如管理员、编辑者、观察者）。
- **权限配置**：为不同角色配置不同级别的访问和操作权限。
- **配额控制**：限制每个工作区的存储空间、文档数量等资源使用。

**示例 API (GraphQL)**：

```graphql
# 创建工作区
mutation createWorkspace {
  createWorkspace {
    id
    name
  }
}

# 查询工作区详情
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

### 3.3 文档管理

- **文档创建与编辑**：支持富文本编辑，并自动保存文档的版本历史记录。
- **文档同步**：实现实时协同编辑，确保多用户同时编辑时数据的一致性。
- **文档发布**：可以将文档设置为公开或私有，并支持通过链接分享。
- **文档权限**：针对特定用户或角色设置文档的访问级别（只读、编辑、管理）。
- **文档归档与恢复**：可以长期保存重要文档，防止误删，并支持恢复。

**示例 API (GraphQL)**：

```graphql
# 发布文档
mutation publishDoc($workspaceId: ID!, $docId: ID!, $mode: PublicDocMode!) {
  publishDoc(workspaceId: $workspaceId, docId: $docId, mode: $mode) {
    public
    mode
  }
}

# 查询文档内容和权限
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

### 3.4 通知系统

- **系统通知**：推送新消息、任务提醒等系统级别的通知。
- **提及通知**：当你在文档中提及他人时，系统会自动触发通知。
- **标记已读**：支持手动或自动将通知标记为已读。
- **通知历史**：保留所有通知记录，方便用户随时查阅。

**示例 API (GraphQL)**：

```graphql
# 查询通知列表
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

# 提及用户
mutation mentionUser($input: MentionInput!) {
  mentionUser(input: $input)
}
```

### 3.5 邮件服务

- **邮件发送**：支持通过 SMTP 协议发送各种邮件，如验证邮件、重置密码邮件等。
- **模板渲染**：使用 React 组件来生成漂亮的 HTML 邮件内容。
- **测试邮件**：提供接口用于测试邮件服务器配置是否正确。

**示例 API (GraphQL)**：

```graphql
# 发送测试邮件
mutation sendTestEmail($config: JSONObject!) {
  sendTestEmail(config: $config)
}
```

### 3.6 支付集成

- **订阅管理**：支持用户按月或按年订阅高级功能。
- **支付网关**：集成了 Stripe、Apple Pay 等主流支付平台，方便用户进行支付。
- **发票处理**：自动生成并发送电子发票。

**示例 API (GraphQL)**：

```graphql
# 创建订阅
mutation createSubscription($plan: String!) {
  createSubscription(plan: $plan) {
    status
    paymentUrl
  }
}
```

### 3.7 AI 辅助（Copilot）

- **智能建议**：基于 OpenAI、Anthropic 等 AI 模型，提供写作辅助、内容生成等智能建议。
- **代码理解**：分析文档中的代码片段，并给出优化建议或解释。
- **自然语言处理**：支持语音识别、文本翻译等功能。

**示例 API (GraphQL)**：

```graphql
# 查询工作区的 AI 嵌入信息
query embedding($workspaceId: ID!) {
  workspace(id: $workspaceId) {
    embedding {
      workspaceId
    }
  }
}
```

### 3.8 安全与性能保障

- **安全机制**：
  - **速率限制**：防止恶意请求或 DDoS 攻击，保护 API 接口。
  - **加密传输**：使用 HTTPS 和 JWT 确保数据在传输过程中的安全。
  - **敏感操作防护**：对关键操作（如修改密码）进行二次确认或验证码验证。
- **性能优化**：
  - **缓存策略**：利用 Redis 缓存高频请求的结果，提高响应速度。
  - **异步处理**：将耗时任务（如文件处理）放入 BullMQ 队列进行异步处理，避免阻塞主线程。
  - **分布式追踪**：使用 OpenTelemetry 跟踪整个调用链路，快速定位性能瓶颈。

## 4. 开发指南与最佳实践：如何开始贡献？

### 开发命令：常用操作

- **`yarn dev`**: 启动开发服务器，用于本地开发和调试
- **`yarn build`**: 构建生产版本，生成可部署的代码
- **`yarn test`**: 运行单元测试，检查代码逻辑是否正确
- **`yarn e2e`**: 执行端到端测试，模拟用户操作，测试整个系统
- **`yarn lint`**: 执行 ESLint 和 Prettier 检查，确保代码风格一致
- **`yarn typecheck`**: TypeScript 类型检查，发现类型相关的错误

### 编码规范：如何写出好代码？

- **命名规范**：
  - 变量和函数使用 `camelCase`（小驼峰命名法），例如 `userName`。
  - 类名和模块名使用 `PascalCase`（大驼峰命名法），例如 `UserService`。
- **导入排序**：使用 `simple-import-sort` 插件自动排序导入语句，保持代码整洁。
- **错误处理**：避免使用 `any` 类型，推荐使用自定义错误类型，并使用 `try/catch` 显式捕获和处理错误。
- **日志记录**：使用 `AFFiNELogger` 统一日志格式，方便调试和追踪问题。
- **事务管理**：使用 `@nestjs-cls/transactional` 注解实现数据库事务，确保数据操作的原子性（要么全部成功，要么全部失败）。

### 测试与调试：如何确保代码质量？

- **单元测试**：使用 AVA 替代 Jest，它更轻量且兼容性更好，用于测试单个函数或模块。
- **E2E 测试 (端到端测试)**：使用 Supertest 和 Playwright 编写端到端测试，模拟用户在浏览器中的操作，测试整个应用流程。
- **调试工具**：
  - 使用 Winston 日志工具记录详细的调试信息。
  - 利用 OpenTelemetry 进行分布式追踪，查看请求在不同服务间的流转。
  - 使用 GraphQL Playground 直接测试 GraphQL 查询和变动。

### 推荐开发流程

1.  **配置环境**：首先，安装所有必要的依赖，启动数据库服务，并配置 Prisma ORM。
2.  **修改 schema**：如果需要修改数据库结构，更新 Prisma schema 文件，并运行迁移脚本来同步数据库。
3.  **添加 resolver/controller**：根据需求，新增 GraphQL resolver 或 REST controller 来实现新的 API 接口。
4.  **编写测试**：为新功能编写单元测试和端到端测试，确保代码的正确性和稳定性。
5.  **构建部署**：执行构建命令，将代码打包成生产版本，然后部署到生产环境。

### 调试技巧

- 使用 Winston 日志工具记录详细的调试信息，帮助你理解代码执行过程。
- 利用 Apollo Server Playground 直接测试 GraphQL 查询和变动，快速验证 API 行为。
- 使用 Supertest 编写模拟 HTTP 请求，方便在没有前端的情况下测试 RESTful API。

## 5. 学习建议与路线图：如何深入学习？

### 入门路径：从哪里开始？

1.  **阅读 README.md**：这份文档就是你最好的起点，它提供了后端服务的基本信息和开发指南。
2.  **查看 `packages/backend/server/src/index.ts` 和 `server.ts`**：理解服务是如何启动的，这是整个应用的入口。
3.  **研究 `app.module.ts`**：掌握 NestJS 的模块加载机制和依赖注入配置，理解各个模块是如何协同工作的。
4.  **探索 `base` 模块**：熟悉日志、配置、数据库连接等基础设施的实现方式。
5.  **尝试运行项目**：执行 `yarn dev` 启动本地开发环境，亲手体验一下后端服务的运行。

### 进阶方向：成为后端专家！

- **深入模块系统**：学习如何创建自定义的 Feature Module 和 Service，更好地组织和扩展代码。
- **定制数据库模型**：参考 Prisma schema，尝试添加新的数据表或字段，并理解数据迁移的流程。
- **扩展 API 接口**：在现有的 GraphQL resolver 或 REST controller 中添加新的接口，或者创建全新的接口。
- **优化性能**：学习如何利用 Redis 缓存、BullMQ 异步任务等技术，提升关键路径的性能。
- **增强安全性**：深入研究 JWT 认证、OAuth 登录、RBAC 权限控制的实现细节，提升系统的安全性。

希望这份文档能帮助你更好地理解 AFFiNE 后端！祝你学习愉快！
