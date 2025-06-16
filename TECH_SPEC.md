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

## 模块代码映射

```json
{
  "@blocksuite/affine": "blocksuite/affine/all/src",
  "@blocksuite/affine-block-attachment": "blocksuite/affine/blocks/attachment/src",
  "@blocksuite/affine-block-bookmark": "blocksuite/affine/blocks/bookmark/src",
  "@blocksuite/affine-block-callout": "blocksuite/affine/blocks/callout/src",
  "@blocksuite/affine-block-code": "blocksuite/affine/blocks/code/src",
  "@blocksuite/affine-block-data-view": "blocksuite/affine/blocks/data-view/src",
  "@blocksuite/affine-block-database": "blocksuite/affine/blocks/database/src",
  "@blocksuite/affine-block-divider": "blocksuite/affine/blocks/divider/src",
  "@blocksuite/affine-block-edgeless-text": "blocksuite/affine/blocks/edgeless-text/src",
  "@blocksuite/affine-block-embed": "blocksuite/affine/blocks/embed/src",
  "@blocksuite/affine-block-embed-doc": "blocksuite/affine/blocks/embed-doc/src",
  "@blocksuite/affine-block-frame": "blocksuite/affine/blocks/frame/src",
  "@blocksuite/affine-block-image": "blocksuite/affine/blocks/image/src",
  "@blocksuite/affine-block-latex": "blocksuite/affine/blocks/latex/src",
  "@blocksuite/affine-block-list": "blocksuite/affine/blocks/list/src",
  "@blocksuite/affine-block-note": "blocksuite/affine/blocks/note/src",
  "@blocksuite/affine-block-paragraph": "blocksuite/affine/blocks/paragraph/src",
  "@blocksuite/affine-block-root": "blocksuite/affine/blocks/root/src",
  "@blocksuite/affine-block-surface": "blocksuite/affine/blocks/surface/src",
  "@blocksuite/affine-block-surface-ref": "blocksuite/affine/blocks/surface-ref/src",
  "@blocksuite/affine-block-table": "blocksuite/affine/blocks/table/src",
  "@blocksuite/affine-components": "blocksuite/affine/components/src",
  "@blocksuite/data-view": "blocksuite/affine/data-view/src",
  "@blocksuite/affine-ext-loader": "blocksuite/affine/ext-loader/src",
  "@blocksuite/affine-foundation": "blocksuite/affine/foundation/src",
  "@blocksuite/affine-fragment-adapter-panel": "blocksuite/affine/fragments/adapter-panel/src",
  "@blocksuite/affine-fragment-doc-title": "blocksuite/affine/fragments/doc-title/src",
  "@blocksuite/affine-fragment-frame-panel": "blocksuite/affine/fragments/frame-panel/src",
  "@blocksuite/affine-fragment-outline": "blocksuite/affine/fragments/outline/src",
  "@blocksuite/affine-gfx-brush": "blocksuite/affine/gfx/brush/src",
  "@blocksuite/affine-gfx-connector": "blocksuite/affine/gfx/connector/src",
  "@blocksuite/affine-gfx-group": "blocksuite/affine/gfx/group/src",
  "@blocksuite/affine-gfx-link": "blocksuite/affine/gfx/link/src",
  "@blocksuite/affine-gfx-mindmap": "blocksuite/affine/gfx/mindmap/src",
  "@blocksuite/affine-gfx-note": "blocksuite/affine/gfx/note/src",
  "@blocksuite/affine-gfx-pointer": "blocksuite/affine/gfx/pointer/src",
  "@blocksuite/affine-gfx-shape": "blocksuite/affine/gfx/shape/src",
  "@blocksuite/affine-gfx-template": "blocksuite/affine/gfx/template/src",
  "@blocksuite/affine-gfx-text": "blocksuite/affine/gfx/text/src",
  "@blocksuite/affine-gfx-turbo-renderer": "blocksuite/affine/gfx/turbo-renderer/src",
  "@blocksuite/affine-inline-footnote": "blocksuite/affine/inlines/footnote/src",
  "@blocksuite/affine-inline-latex": "blocksuite/affine/inlines/latex/src",
  "@blocksuite/affine-inline-link": "blocksuite/affine/inlines/link/src",
  "@blocksuite/affine-inline-mention": "blocksuite/affine/inlines/mention/src",
  "@blocksuite/affine-inline-preset": "blocksuite/affine/inlines/preset/src",
  "@blocksuite/affine-inline-reference": "blocksuite/affine/inlines/reference/src",
  "@blocksuite/affine-model": "blocksuite/affine/model/src",
  "@blocksuite/affine-rich-text": "blocksuite/affine/rich-text/src",
  "@blocksuite/affine-shared": "blocksuite/affine/shared/src",
  "@blocksuite/affine-widget-drag-handle": "blocksuite/affine/widgets/drag-handle/src",
  "@blocksuite/affine-widget-edgeless-auto-connect": "blocksuite/affine/widgets/edgeless-auto-connect/src",
  "@blocksuite/affine-widget-edgeless-dragging-area": "blocksuite/affine/widgets/edgeless-dragging-area/src",
  "@blocksuite/affine-widget-edgeless-selected-rect": "blocksuite/affine/widgets/edgeless-selected-rect/src",
  "@blocksuite/affine-widget-edgeless-toolbar": "blocksuite/affine/widgets/edgeless-toolbar/src",
  "@blocksuite/affine-widget-edgeless-zoom-toolbar": "blocksuite/affine/widgets/edgeless-zoom-toolbar/src",
  "@blocksuite/affine-widget-frame-title": "blocksuite/affine/widgets/frame-title/src",
  "@blocksuite/affine-widget-keyboard-toolbar": "blocksuite/affine/widgets/keyboard-toolbar/src",
  "@blocksuite/affine-widget-linked-doc": "blocksuite/affine/widgets/linked-doc/src",
  "@blocksuite/affine-widget-note-slicer": "blocksuite/affine/widgets/note-slicer/src",
  "@blocksuite/affine-widget-page-dragging-area": "blocksuite/affine/widgets/page-dragging-area/src",
  "@blocksuite/affine-widget-remote-selection": "blocksuite/affine/widgets/remote-selection/src",
  "@blocksuite/affine-widget-scroll-anchoring": "blocksuite/affine/widgets/scroll-anchoring/src",
  "@blocksuite/affine-widget-slash-menu": "blocksuite/affine/widgets/slash-menu/src",
  "@blocksuite/affine-widget-toolbar": "blocksuite/affine/widgets/toolbar/src",
  "@blocksuite/affine-widget-viewport-overlay": "blocksuite/affine/widgets/viewport-overlay/src",
  "@blocksuite/bs-docs": "blocksuite/docs",
  "@blocksuite/global": "blocksuite/framework/global/src",
  "@blocksuite/std": "blocksuite/framework/std/src",
  "@blocksuite/store": "blocksuite/framework/store/src",
  "@blocksuite/sync": "blocksuite/framework/sync/src",
  "@blocksuite/integration-test": "blocksuite/integration-test/src",
  "@blocksuite/playground": "blocksuite/playground",
  "@affine/docs": "docs/reference",
  "@affine/server-native": "packages/backend/native/src",
  "@affine/server": "packages/backend/server/src",
  "@affine/debug": "packages/common/debug/src",
  "@affine/env": "packages/common/env/src",
  "@affine/error": "packages/common/error/src",
  "@affine/graphql": "packages/common/graphql/src",
  "@toeverything/infra": "packages/common/infra/src",
  "@affine/nbstore": "packages/common/nbstore/src",
  "@affine/reader": "packages/common/reader/src",
  "@y-octo/node": "packages/common/y-octo/node/src",
  "@affine/admin": "packages/frontend/admin/src",
  "@affine/android": "packages/frontend/apps/android/src",
  "@affine/electron": "packages/frontend/apps/electron/src",
  "@affine/electron-renderer": "packages/frontend/apps/electron-renderer/src",
  "@affine/ios": "packages/frontend/apps/ios/src",
  "@affine/mobile": "packages/frontend/apps/mobile/src",
  "@affine/web": "packages/frontend/apps/web/src",
  "@affine/component": "packages/frontend/component/src",
  "@affine/core": "packages/frontend/core/src",
  "@affine/electron-api": "packages/frontend/electron-api/src",
  "@affine/i18n": "packages/frontend/i18n/src",
  "@affine/media-capture-playground": "packages/frontend/media-capture-playground/web",
  "@affine/native": "packages/frontend/native/src",
  "@affine/routes": "packages/frontend/routes/src",
  "@affine/templates": "packages/frontend/templates",
  "@affine/track": "packages/frontend/track/src",
  "@affine-test/affine-cloud": "tests/affine-cloud/e2e",
  "@affine-test/affine-cloud-copilot": "tests/affine-cloud-copilot/e2e",
  "@affine-test/affine-desktop": "tests/affine-desktop/e2e",
  "@affine-test/affine-desktop-cloud": "tests/affine-desktop-cloud/e2e",
  "@affine-test/affine-local": "tests/affine-local/e2e",
  "@affine-test/affine-mobile": "tests/affine-mobile/e2e",
  "@affine-test/blocksuite": "tests/blocksuite/e2e",
  "@affine-test/kit": "tests/kit/src",
  "@types/build-config": "tools/@types/build-config",
  "@types/affine__env": "tools/@types/env",
  "@affine/changelog": "tools/changelog",
  "@affine-tools/cli": "tools/cli/src",
  "@affine/commitlint-config": "tools/commitlint",
  "@affine/copilot-result": "tools/copilot-result",
  "@affine/playstore-auto-bump": "tools/playstore-auto-bump",
  "@affine-tools/utils": "tools/utils/src"
}
```
