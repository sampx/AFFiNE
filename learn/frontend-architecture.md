# AFFiNE 前端架构与设计文档

## 1. 技术栈概览

### 框架与语言

- **React 19**：使用最新的 React 框架进行组件化开发。
- **TypeScript**：全项目启用 `strict` 模式，确保类型安全。
- **Vite**：构建工具，提供快速冷启动和热更新体验。
- **RxJS**：响应式编程库，用于状态管理和异步操作。

### UI 与样式

- **Emotion CSS**：CSS-in-JS 解决方案，支持动态样式注入。
- **Radix UI**：高质量的可组合 UI 组件库（如按钮、对话框等）。
- **Vanilla Extract**：CSS 模块化构建工具，用于编写类型安全的 CSS 样式。
- **CSS-in-JS (styled)**：在部分组件中也使用了内联样式或 styled-components 风格的写法。

### 状态管理

- **React Context API**：跨层级共享状态，例如用户配置、主题等。
- **@toeverything/infra**：自研基础设施模块，提供统一的状态管理接口和模块系统。
- **RxJS Observables**：用于处理复杂的数据流和异步事件。

### 国际化

- **i18next / @affine/i18n**：支持多语言切换，所有文本内容都通过 i18n key 管理。
- **JSON 资源文件**：多语言资源存储在 `/packages/frontend/i18n/src/resources/` 目录下。

### 构建与打包

- **Yarn Workspaces**：支持 monorepo 结构，便于跨包引用和模块化开发。
- **Turborepo**：加速构建流程，优化缓存与依赖管理。
- **Electron**：打包为桌面应用，支持 macOS、Windows 和 Linux。

## 2. 前端架构解析

### 目录结构

```
packages/frontend/
├── apps/         # 平台特定入口（web, electron, mobile）
├── core/         # 核心业务逻辑和模块
├── component/    # 可复用 UI 组件
├── i18n/         # 国际化支持
└── routes/       # 路由定义
```

### 核心模块

- **`@affine/core`**：包含主功能模块，如工作区管理、文档同步、AI 功能集成等。
- **`@affine/component`**：提供基础 UI 组件（如按钮、卡片、设置页头等）。
- **`@affine/i18n`**：支持多语言切换，封装翻译函数。
- **`@affine/routes`**：使用 `react-router-dom` 实现路由管理。

### 模块加载机制

AFFiNE 使用了一个基于模块系统的架构：

```ts
const framework = new Framework();
configureCommonModules(framework);
configureBrowserWorkbenchModule(framework);
configureLocalStorageStateStorageImpls(framework);
configureBrowserWorkspaceFlavours(framework);
```

- 每个模块负责注册其依赖和服务，最终通过 `FrameworkRoot` 提供给整个应用使用。

## 3. UI 组件与样式设计

### 组件结构示例：SettingHeader

```tsx
export const SettingHeader = ({ title, subtitle, beta }: SettingHeaderProps) => {
  return (
    <div className={settingHeader}>
      <div className="title">
        {title}
        {beta ? <div className={settingHeaderBeta}>Beta</div> : null}
      </div>
      {subtitle ? <div className="subtitle">{subtitle}</div> : null}
    </div>
  );
};
```

#### 样式实现方式

- 使用 **Vanilla Extract + Emotion** 的混合模式：
  - `style()` 创建独立类名；
  - `globalStyle()` 定义全局样式；
  - 使用变量 `cssVar()` 引入主题色值。

#### 样式文件结构

```ts
// share.css.ts
export const settingHeader = style({
  borderBottom: `1px solid ${cssVar('borderColor')}`,
  paddingBottom: '16px',
  marginBottom: '24px',
});
```

### 前端架构中的 Blocksuite 集成

在 AFFiNE 的前端架构中，Blocksuite 被广泛用于构建 UI 组件和管理状态。主要体现在以下几个方面：

#### 1. 核心依赖

- **@affine/core**：包含主功能模块，如工作区管理、文档同步、AI 功能集成等，其中大量使用了 Blocksuite 提供的组件和状态管理机制。
- **@affine/component**：提供基础 UI 组件（如按钮、卡片、设置页头等），这些组件的设计和实现参考了 Blocksuite 的样式和结构。

#### 2. 状态管理

- **React Context API**：跨层级共享状态，例如用户配置、主题等，Blocksuite 的状态管理机制与 React Context API 结合使用，确保状态的一致性和可维护性。
- **@toeverything/infra**：自研基础设施模块，提供统一的状态管理接口和模块系统，Blocksuite 的状态管理机制与其无缝集成。

#### 3. 国际化支持

- **i18next / @affine/i18n**：支持多语言切换，所有文本内容都通过 i18n key 管理。Blocksuite 的国际化支持与 AFFiNE 的国际化机制相结合，确保多语言环境下的兼容性。

## 2. Blocksuite 在前端的具体应用场景

### 1. UI 组件库的应用

Blocksuite 提供了一系列高质量的 UI 组件，如按钮、输入框、卡片等。这些组件被广泛应用于 AFFiNE 的前端开发中，具体表现为：

- **SettingHeader**：用于显示设置页面的标题和副标题，结合 Blocksuite 的样式和结构进行实现。
- **IntegrationCard**：用于展示集成模块的信息，使用 Blocksuite 的组件和样式进行构建。

### 2. 主题定制

Blocksuite 支持通过 CSS 变量或 SCSS 变量来定制主题。在 AFFiNE 中，Blocksuite 的主题定制机制与 Vanilla Extract 和 Emotion CSS 结合使用，确保样式的一致性和可维护性。

### 3. 国际化支持

Blocksuite 的国际化支持与 AFFiNE 的国际化机制相结合，确保多语言环境下的兼容性。例如，在 AFFiNE 中，Blocksuite 的多语言资源存储在 `/packages/frontend/i18n/src/resources/` 目录下，并通过 i18next 进行管理。

## 3. Blocksuite 与前端的交互方式

### 1. 数据流管理

Blocksuite 使用 RxJS Observables 来处理复杂的数据流和异步事件。在 AFFiNE 中，Blocksuite 的数据流管理机制与 React Context API 和 @toeverything/infra 结合使用，确保数据的一致性和可维护性。

### 2. 插件系统

Blocksuite 的插件系统允许开发者根据需要扩展功能。在 AFFiNE 中，Blocksuite 的插件系统与模块系统相结合，允许开发者轻松地添加新功能或修改现有功能。

### 3. 构建与打包

Blocksuite 的构建与打包流程与 AFFiNE 的构建工具链相结合，确保模块的高效加载和优化。例如，AFFiNE 使用 Yarn Workspaces 和 Turborepo 来支持 monorepo 结构，便于跨包引用和模块化开发。

## 4. 开发指南与最佳实践

### 开发命令

| 命令             | 描述                         |
| ---------------- | ---------------------------- |
| `yarn dev`       | 启动开发服务器               |
| `yarn build`     | 构建生产版本                 |
| `yarn test`      | 运行单元测试                 |
| `yarn lint`      | 执行 ESLint 和 Prettier 检查 |
| `yarn typecheck` | TypeScript 类型检查          |

### 编码规范

- **命名规范**：`camelCase`（变量/函数）、`PascalCase`（组件/类型）；
- **导入排序**：使用 `simple-import-sort` 插件自动排序；
- **样式命名**：推荐使用 `.module.css` 或 Vanilla Extract 的 `style()` 方法；
- **响应式设计**：采用移动优先原则，支持多平台适配（Web/Electron/Mobile）；
- **错误处理**：避免使用 `any`，推荐使用自定义错误类型和 `try/catch` 显式捕获。

## 5. 测试与调试

### 单元测试

- 使用 **Vitest** 替代 Jest，更轻量且兼容性更好；
- 所有模块均有配套的 `*.test.tsx` 文件。

### UI 测试

- 使用 **Playwright** 编写 E2E 测试；
- 支持模拟浏览器行为（点击、输入、导航等）。

### 调试工具

- **SharedWorker**：用于 Web 端数据持久化和后台任务；
- **WASM/NAPI-RS**：用于高性能计算（如文档合并、哈希计算）；
- **本地调试 Electron**：支持热重载和 DevTools。

## 6. 学习建议与路线图

### 入门路径

1. **阅读 AGENT.md**：了解项目整体架构和开发规范；
2. **查看 packages/frontend/apps/web/src/index.tsx**：理解应用初始化流程；
3. **研究 component 目录**：熟悉 UI 组件和样式系统；
4. **探索 core 模块**：掌握状态管理、服务注入和模块系统；
5. **尝试运行项目**：执行 `yarn dev` 启动本地开发环境。

### 进阶方向

- **深入模块系统**：学习如何创建 Feature Module 和 Service；
- **定制 UI 组件**：参考 [IntegrationCard](file:///Users/sam/Coding/sampx/AFFiNE/packages/frontend/core/src/desktop/dialogs/setting/workspace-setting/integration/card.tsx#L14-L32), [SettingHeader](file:///Users/sam/Coding/sampx/AFFiNE/packages/frontend/component/src/components/setting-components/setting-header.tsx#L11-L26) 等组件重构 UI；
- **扩展集成能力**：研究 `integration/index.tsx` 添加新插件；
- **性能优化**：利用 Rust Native/Wasm 模块提升关键路径性能；
- **多语言支持**：编辑 JSON 资源文件添加新的语言支持。
