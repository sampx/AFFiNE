# AFFiNE 技术规格文档

## 1. 项目概述

AFFiNE 是一个开源的、本地优先的工作空间，结合了文档、画布和表格功能，旨在成为 Notion 和 Miro 的替代品。它支持实时协作、AI 集成和跨平台使用。

## 2. 开发命令

### 2.1. 核心开发

- `yarn dev`: 启动开发服务器。
- `yarn affine dev`: 使用 CLI 工具启动开发服务器。
- `yarn build`: 构建整个项目。
- `yarn affine build`: 使用 CLI 工具构建整个项目。

### 2.2. 代码质量

- `yarn lint`: 运行 ESLint 和 Prettier 检查。
- `yarn lint:fix`: 自动修复 linting 问题。
- `yarn typecheck`: 运行 TypeScript 类型检查。

### 2.3. 测试

- `yarn test`: 运行所有单元测试 (Vitest)。
- `vitest <test-file-pattern>`: 运行指定的测试文件。
- `yarn test:ui`: 运行带 UI 的测试。
- `yarn test:coverage`: 运行测试并生成覆盖率报告。
- E2E 测试:
  - `cd tests/affine-local && yarn e2e`
  - `cd tests/affine-cloud && yarn e2e`

### 2.4. 原生依赖构建

- `yarn affine @affine/native build`: 构建前端原生模块 (Rust)。
- `yarn affine @affine/server-native build`: 构建后端原生模块。

## 3. 代码风格

### 3.1. 导入

使用 `simple-import-sort` 插件自动排序导入，优先使用类型导入。

### 3.2. 格式化

使用 Prettier 进行格式化：单引号、尾随逗号、2 个空格缩进，避免箭头函数括号。

### 3.3. TypeScript

启用严格模式，偏好显式类型。

### 3.4. React

使用 JSX runtime (无需导入 React)，强制执行 hooks 规则。

### 3.5. 命名

变量/函数使用 `camelCase`，组件/类型使用 `PascalCase`。

### 3.6. 错误处理

偏好显式错误类型，避免使用 `any`。

### 3.7. 包导入

禁止从 `/dist` 或 `/src` 导入，应使用包导出。

### 3.8. RxJS

Observables 变量名应以 `$` 结尾 (由 finnish 规则控制)。

### 3.9. 语言约定

交流语言始终使用中文，代码注释语言始终使用英文。

## 4. 架构

### 4.1. 技术栈

- **前端**: React 19, TypeScript, RxJS, Emotion CSS, Radix UI, Vite。
- **后端**: NestJS, GraphQL, Prisma, PostgreSQL, Redis, BullMQ。
- **编辑器**: BlockSuite (基于块的编辑器框架)。
- **构建**: Yarn workspaces, Vite, Rust (原生模块), Electron。
- **测试**: Vitest, Playwright, Happy DOM。
- **基础设施**: Docker, Y.js (CRDT), IndexedDB, S3。
- **AI**: 支持多提供商集成与上下文管理。
- **本地优先**: Y.js CRDT, IndexedDB, NBStore 同步。
- **原生模块**: Rust 模块通过 NAPI-RS 实现性能关键操作。

### 4.2. Monorepo 结构

```
packages/
├── frontend/       # Web, Electron, Mobile 应用和核心业务逻辑
│   ├── apps/       # 平台特定应用 (web, electron, mobile, iOS/Android)
│   ├── core/       # 共享业务逻辑和模块
│   ├── component/  # 可复用 UI 组件
│   ├── i18n/       # 国际化
│   └── routes/     # 路由配置
├── backend/        # NestJS GraphQL API 服务器和 Rust 原生模块
│   ├── server/     # NestJS GraphQL API 服务器
│   └── native/     # Rust 原生模块
├── common/         # 共享库 (infra, nbstore, graphql, theme, etc.)
└── blocksuite/     # 基于块的编辑器框架
tools/              # CLI 工具和构建工具
```

### 4.3. 前端架构

- **共享核心模式**: 所有应用都从 `@affine/core` 导入业务逻辑。
- **平台应用**: 平台特定应用是带有平台特定配置的薄包装层。
- **模块系统**: 功能模块组织在 `/modules` 目录中。
- **状态管理**: 使用 RxJS observables, React Context 和本地优先架构。

### 4.4. 模块系统与依赖注入

项目使用自定义的依赖注入框架 (`@toeverything/infra`)：

- 服务通过框架提供者注册。
- 功能模块组织在 `/modules` 目录中。
- RxJS observables 用于响应式状态管理。
- NBStore + Y.js 实现本地优先存储和同步。

### 4.5. 平台架构

- **共享核心**: 所有应用都从 `@affine/core` 导入业务逻辑。
- **薄包装层**: 平台特定入口点 (web/electron/mobile)。
- **统一构建**: 单一 CLI 工具 (`yarn affine`) 处理所有构建。

## 5. 开发环境设置

### 5.1. 先决条件

- Node.js <23.0.0 (推荐 LTS 版本)
- Rust stable toolchain
- Yarn 4.9.1 (通过 corepack)

### 5.2. 初始设置

1. 克隆仓库: `git clone https://github.com/toeverything/AFFiNE`
2. 安装依赖: `yarn install`
3. 构建原生模块:
   - `yarn affine @affine/native build`
   - `yarn affine @affine/server-native build`

## 6. 关键目录

- `/packages/frontend/core/src/bootstrap/`: 应用初始化和设置。
- `/packages/frontend/core/src/modules/`: 包含业务逻辑的功能模块。
- `/packages/common/infra/`: 依赖注入框架和实用工具。
- `/packages/common/nbstore/`: 本地优先存储和同步。
- `/packages/backend/server/src/`: GraphQL API 和服务器实现。

## 7. 项目设计模式

- **依赖注入框架**: 使用 `@toeverything/infra` 管理服务和组件依赖，以及服务生命周期。
- **模块化架构**: 通过 `/modules` 目录实现功能解耦和组件组织。
- **响应式状态管理**: 基于 RxJS 的响应式状态管理，支持组件间的事件流和数据传递。
- **本地优先数据同步**: 采用 CRDT (Y.js) 和 NBStore 实现本地优先的数据同步机制。
- **平台无关核心业务逻辑**: `@affine/core` 包含平台无关的核心业务逻辑，通过薄包装层支持多端。
- **组件解耦**: 组件通过服务和依赖注入解耦，便于测试和维护。
