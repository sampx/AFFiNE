# @affine/core 前端核心模块技术架构

(packages/frontend/core)

## 📋 模块概览

`@affine/core` 是 AFFiNE 前端应用的核心模块，提供完整的业务逻辑、组件系统、路由管理和平台适配功能。该模块基于现代化的依赖注入架构，支持桌面端、移动端和 Web 端的统一开发体验。

**模块信息：**

- 包名：`@affine/core`
- 版本：`0.21.0`
- 类型：私有模块 (private: true)
- 模块类型：ES Module (type: "module")
- 主要导出：`./src/index.ts` 和 `./src/bootstrap/index.ts`

## 🏗️ 模块架构

### 核心依赖

- **@toeverything/infra**: workspace:\* - 依赖注入框架
- **@affine/component**: workspace:\* - UI 组件库
- **@blocksuite/affine**: workspace:\* - 编辑器核心
- **React**: 19.1.0 - UI 框架
- **react-router-dom**: ^6.28.0 - 路由管理
- **jotai**: ^2.10.3 - 状态管理
- **rxjs**: ^7.8.1 - 响应式编程

### 导出模块结构

```typescript
{
  ".": "./src/index.ts",           // 主入口
  "./bootstrap": "./src/bootstrap/index.ts"  // 启动配置
}
```

### 目录架构

```
packages/frontend/core/
├── public/                 # 静态资源
│   ├── fonts/             # 字体文件
│   ├── imgs/              # 图片资源
│   └── manifest.json      # PWA 配置
├── src/
│   ├── bootstrap/         # 应用启动配置
│   ├── modules/           # 业务模块 (50+ 模块)
│   ├── components/        # 通用组件
│   ├── blocksuite/        # BlockSuite 集成
│   ├── desktop/           # 桌面端页面
│   ├── mobile/            # 移动端页面
│   ├── commands/          # 命令系统
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
└── package.json
```

## 🔧 核心功能模块

### 1. 应用启动系统 (bootstrap/)

**主要功能：**

- 环境初始化和 polyfill 注入
- 平台特定的启动配置
- 全局路径和遥测配置

**启动顺序：**

```typescript
// bootstrap/browser.ts - 浏览器启动顺序
import './env'; // 环境变量设置
import './public-path'; // 公共路径配置
import './polyfill/browser'; // 浏览器 polyfill
import './telemetry'; // 遥测初始化
```

**核心 Polyfills：**

- Iterator Helpers
- Promise.withResolvers
- ResizeObserver
- RequestIdleCallback
- Array/Set 扩展方法

### 2. 依赖注入模块系统 (modules/)

**架构设计：**
基于 `@toeverything/infra` 框架的模块化架构，包含 50+ 业务模块：

**核心模块类型：**

- **Service**: 业务逻辑服务
- **Entity**: 领域实体对象
- **Store**: 状态存储管理
- **Scope**: 作用域管理器

**主要业务模块：**

```typescript
// 核心模块配置
export function configureCommonModules(framework: Framework) {
  configureWorkspaceModule(framework); // 工作区管理
  configureDocModule(framework); // 文档管理
  configureEditorModule(framework); // 编辑器服务
  configureCloudModule(framework); // 云服务集成
  configureStorageModule(framework); // 存储抽象
  configureNavigationModule(framework); // 导航管理
  configureThemeModule(framework); // 主题系统
  configureAIButtonModule(framework); // AI 功能
  // ... 更多模块
}
```

### 3. 工作区管理模块 (modules/workspace/)

**核心实体：**

```typescript
// 工作区实体
export class Workspace extends Entity {
  // 工作区元数据和配置
}

// 工作区引擎
export class WorkspaceEngine extends Entity {
  // 工作区数据同步引擎
}

// 工作区列表
export class WorkspaceList extends Entity {
  // 管理多个工作区
}
```

**服务层：**

- `WorkspaceService`: 单个工作区管理
- `WorkspacesService`: 多工作区管理
- `WorkspaceFactoryService`: 工作区创建
- `WorkspaceProfileService`: 工作区配置
- `WorkspaceRepositoryService`: 工作区仓库

### 4. 编辑器集成模块 (modules/editor/)

**编辑器实体：**

```typescript
export class Editor extends Entity {
  // BlockSuite 编辑器实例管理
}
```

**服务架构：**

- `EditorService`: 单个编辑器管理
- `EditorsService`: 多编辑器管理
- `EditorScope`: 编辑器作用域

### 5. BlockSuite 集成系统 (blocksuite/)

**AI 功能集成：**

- AI 聊天面板和组件
- AI 操作和扩展
- AI 提供器和工具

**编辑器组件：**

- `BlockSuiteEditor`: 主编辑器组件
- `BlockSuiteHeader`: 编辑器头部
- `BlockSuiteModeSwitch`: 模式切换
- `AttachmentViewer`: 附件查看器

**视图扩展：**

- 云服务集成扩展
- 数据库视图扩展
- PDF 查看扩展
- 主题扩展
- 移动端适配扩展

### 6. 路由系统 (desktop/router.tsx, mobile/router.tsx)

**桌面端路由：**

```typescript
export const topLevelRoutes = [
  { path: '/', lazy: () => import('./pages/index') },
  { path: '/workspace/:workspaceId/*', lazy: () => import('./pages/workspace') },
  { path: '/auth/:authType', lazy: () => import('./pages/auth/auth') },
  { path: '/sign-in', lazy: () => import('./pages/auth/sign-in') },
  { path: '/onboarding', lazy: () => import('./pages/onboarding') },
  { path: '/theme-editor', lazy: () => import('./pages/theme-editor') },
  // ... 更多路由
];
```

**移动端路由：**

- 简化的路由结构
- 移动端特定页面
- 共享桌面端认证页面

### 7. 命令系统 (commands/)

**命令架构：**

```typescript
export interface AffineCommand {
  readonly id: string;
  readonly preconditionStrategy: PreconditionStrategy | (() => boolean);
  readonly label: { title: string; subTitle?: string };
  readonly icon?: ReactNode;
  readonly category: CommandCategory;
  readonly keyBinding?: KeybindingOptions;
  run(): void | Promise<void>;
}
```

**命令分类：**

- `editor:insert-object`: 编辑器插入对象
- `editor:page`: 页面编辑命令
- `affine:navigation`: 导航命令
- `affine:creation`: 创建命令
- `affine:settings`: 设置命令
- `affine:layout`: 布局命令

**预条件策略：**

```typescript
export enum PreconditionStrategy {
  Always, // 总是可用
  InPaperOrEdgeless, // 在页面或无边界模式
  InPaper, // 仅页面模式
  InEdgeless, // 仅无边界模式
  Never, // 从不可用
}
```

### 8. 组件系统 (components/)

**核心组件架构：**

**上下文管理 (components/context/)：**

```typescript
export function AffineContext(props: AffineContextProps) {
  return (
    <ProviderComposer contexts={[
      <Provider key="JotaiProvider" store={props.store} />,
      <ThemeProvider key="ThemeProvider" />,
      <ConfirmModalProvider key="ConfirmModalProvider" />,
      <PromptModalProvider key="PromptModalProvider" />,
    ]}>
      {props.children}
    </ProviderComposer>
  );
}
```

**主题系统 (components/theme-provider/)：**

```typescript
export const ThemeProvider = ({ children }: PropsWithChildren) => {
  return (
    <NextThemeProvider themes={['dark', 'light']} enableSystem={true}>
      {children}
      <ThemeObserver />  {/* 同步主题状态到服务 */}
    </NextThemeProvider>
  );
};
```

**页面列表组件 (components/page-list/)：**

- 虚拟化列表性能优化
- 分组展示和过滤
- 丰富的操作菜单
- 页面预览功能

**属性系统组件：**

- 系统属性：创建时间、更新时间、收藏状态
- 工作区属性：日期、数字、文本、标签
- 属性管理器和编辑器

### 9. 工具函数库 (utils/)

**核心工具：**

- `channel.ts`: 消息通道管理
- `clipboard/`: 剪贴板操作
- `create-emotion-cache.ts`: Emotion 缓存创建
- `extract-emoji-icon.ts`: Emoji 图标提取
- `fuzzy-match.ts`: 模糊匹配算法
- `navigable-history.ts`: 可导航历史记录
- `reduce-image.ts`: 图片压缩
- `string2color.ts`: 字符串转颜色
- `toast.ts`: 提示消息
- `unique-name.ts`: 唯一名称生成

## 🚀 使用指南

### 1. 应用启动配置

```typescript
// 浏览器环境启动
import '@affine/core/bootstrap/browser';

// Electron 环境启动
import '@affine/core/bootstrap/electron';
```

### 2. 模块系统使用

```typescript
import { Framework } from '@toeverything/infra';
import { configureCommonModules } from '@affine/core/modules';

// 创建框架实例
const framework = new Framework();

// 配置所有模块
configureCommonModules(framework);

// 启动应用
const provider = framework.provider();
```

### 3. 服务使用示例

```typescript
import { useService } from '@toeverything/infra';
import { WorkspaceService, EditorService } from '@affine/core/modules';

function MyComponent() {
  const workspaceService = useService(WorkspaceService);
  const editorService = useService(EditorService);

  // 使用服务
  const workspace = workspaceService.workspace;
  const editor = editorService.editor;

  return <div>...</div>;
}
```

### 4. 组件开发示例

```typescript
import { AffineContext } from '@affine/core/components/context';
import { ThemeProvider } from '@affine/core/components/theme-provider';

function App() {
  return (
    <AffineContext>
      <MyAppContent />
    </AffineContext>
  );
}
```

### 5. 命令注册示例

```typescript
import { registerAffineCommand } from '@affine/core/commands';

registerAffineCommand({
  id: 'my-custom-command',
  category: 'affine:general',
  label: 'My Custom Command',
  icon: <MyIcon />,
  keyBinding: 'Ctrl+Shift+M',
  run: () => {
    console.log('Command executed!');
  },
});
```

## 🔍 技术特点

### 1. 现代化架构

- 基于依赖注入的模块化设计
- 响应式数据流 (RxJS + LiveData)
- 类型安全的 TypeScript 开发
- 组件化和可复用设计

### 2. 跨平台支持

- 统一的桌面端和移动端代码库
- 平台特定的启动配置和优化
- 响应式设计和自适应布局
- Electron 桌面应用支持

### 3. 性能优化

- 路由懒加载和代码分割
- 虚拟化列表和组件优化
- 缓存策略和状态管理
- Bundle 优化和 Tree Shaking

### 4. 开发体验

- 热重载和快速开发
- 完整的类型提示和检查
- 模块化的测试策略
- 丰富的开发工具集成

## 📝 开发注意事项

### 1. 模块依赖

- 确保正确配置依赖注入关系
- 遵循模块间的依赖层次
- 避免循环依赖问题

### 2. 性能考虑

- 合理使用 React.memo 和 useMemo
- 避免不必要的重渲染
- 正确管理组件生命周期

### 3. 类型安全

- 使用严格的 TypeScript 配置
- 定义清晰的接口和类型
- 避免使用 any 类型

### 4. 测试策略

- 单元测试覆盖核心逻辑
- 集成测试验证模块交互
- E2E 测试保证用户体验

## 🧪 测试

模块包含完整的测试套件：

```bash
# 运行所有测试
npm test

# 运行特定模块测试
npm test -- packages/frontend/core

# 测试覆盖率
npm run test:coverage
```

**测试覆盖范围：**

- 组件渲染和交互
- 服务逻辑和状态管理
- 路由导航和页面加载
- 工具函数和算法

## 📚 模块详细清单

### 核心业务模块 (modules/)

1. **workspace** - 工作区管理
2. **doc** - 文档管理
3. **editor** - 编辑器服务
4. **cloud** - 云服务集成
5. **storage** - 存储抽象
6. **db** - 数据库服务
7. **navigation** - 导航管理
8. **theme** - 主题系统
9. **i18n** - 国际化
10. **collection** - 集合管理
11. **tag** - 标签系统
12. **favorite** - 收藏功能
13. **quota** - 配额管理
14. **permissions** - 权限管理
15. **share-doc** - 文档分享
16. **telemetry** - 遥测数据
17. **pdf** - PDF 处理
18. **peek-view** - 预览视图
19. **quicksearch** - 快速搜索
20. **docs-search** - 文档搜索
21. **organize** - 组织管理
22. **ai-button** - AI 功能
23. **media** - 媒体处理
24. **notification** - 通知系统
25. **integration** - 集成功能

### 组件系统 (components/)

- **affine/** - AFFiNE 特定组件
- **page-list/** - 页面列表组件
- **properties/** - 属性系统组件
- **tags/** - 标签组件
- **filter/** - 过滤器组件
- **workspace-selector/** - 工作区选择器
- **theme-provider/** - 主题提供器

### BlockSuite 集成 (blocksuite/)

- **ai/** - AI 功能集成
- **editors/** - 编辑器组件
- **view-extensions/** - 视图扩展
- **store-extensions/** - 存储扩展
- **attachment-viewer/** - 附件查看器

该模块是 AFFiNE 前端应用的核心基础设施，提供完整的业务逻辑、组件系统和平台适配能力，支撑整个应用的功能实现和用户体验。
