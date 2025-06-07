# Web 应用 UI 技术备忘录

## 1. 核心依赖模块说明

### 1.1 AffineContext

- **作用**: 提供全局上下文，集成 Jotai 状态管理、主题管理和模态框服务
- **位置**: `packages/frontend/core/src/components/context/index.tsx`
- **功能**:
  - 管理全局状态存储
  - 提供主题切换能力
  - 支持确认和提示模态框的显示

### 1.2 AppContainer

- **作用**: 应用容器组件，提供基础布局和样式
- **位置**: `packages/frontend/core/src/desktop/components/app-container/index.tsx`
- **功能**:
  - 支持 Electron 平台的背景模糊和噪点效果
  - 提供响应式布局支持
  - 处理 Mac OS 特定的视觉效果

### 1.3 router

- **作用**: 路由管理器，处理应用导航
- **位置**: `packages/frontend/core/src/desktop/router.tsx`
- **功能**:
  - 基于 react-router-dom 实现路由
  - 支持 Sentry 错误追踪集成
  - 配置路由 basename 和未来特性

### 1.4 configureCommonModules

- **作用**: 初始化核心功能模块
- **位置**: `packages/frontend/core/src/modules/index.ts`
- **包含模块**:
  - 国际化 (i18n)
  - 工作区管理
  - 文档管理
  - 存储管理
  - 生命周期管理
  - 功能标志管理
  - 导航管理
  - 标签管理
  - 权限管理
  - 主题管理等

### 1.5 I18nProvider

- **作用**: 国际化支持，提供多语言切换能力
- **位置**: `packages/frontend/core/src/modules/i18n/context.tsx`
- **功能**:
  - 使用 i18next 实现多语言支持
  - 自动初始化语言配置
  - 支持动态语言切换

### 1.6 LifecycleService

- **作用**: 应用生命周期管理
- **位置**: `packages/frontend/core/src/modules/lifecycle/service/lifecycle.ts`
- **功能**:
  - 触发应用启动事件
  - 处理应用焦点变化
  - 提供事件总线支持

### 1.7 PopupWindowProvider

- **作用**: 弹出窗口管理接口
- **位置**: `packages/frontend/core/src/modules/url/providers/popup-window.ts`
- **功能**:
  - 定义弹出窗口行为
  - 支持不同环境的实现（如 Electron）
  - 处理跨域链接的安全打开

### 1.8 configureBrowserWorkbenchModule

- **作用**: 浏览器工作台模块配置
- **位置**: `packages/frontend/core/src/modules/workbench/index.ts`
- **功能**:
  - 配置工作台默认状态
  - 设置新标签页处理器
  - 支持浏览器特定的功能实现

### 1.9 configureLocalStorageStateStorageImpls

- **作用**: 配置本地存储实现
- **位置**: `packages/frontend/core/src/modules/storage/index.ts`
- **功能**:
  - 使用 localStorage 存储全局缓存
  - 使用 localStorage 存储全局状态
  - 使用 IndexedDB 存储复杂数据

### 1.10 configureBrowserWorkspaceFlavours

- **作用**: 配置工作区类型
- **位置**: `packages/frontend/core/src/modules/workspace-engine/index.ts`
- **功能**:
  - 支持本地工作区实现
  - 支持云端工作区实现
  - 集成全局状态和服务器服务

### 1.11 createEmotionCache

- **作用**: 创建 Emotion CSS 缓存
- **位置**: `packages/frontend/core/src/utils/create-emotion-cache.ts`
- **功能**:
  - 配置 Emotion 插入点
  - 支持自定义插入点元标签
  - 提升样式加载性能

### 1.12 getWorkerUrl

- **作用**: 获取 Worker 脚本 URL
- **位置**: `packages/common/env/src/worker.ts`
- **功能**:
  - 构建 Worker 脚本路径
  - 支持版本控制
  - 确保同源策略

### 1.13 StoreManagerClient

- **作用**: 存储管理客户端，用于与 Worker 通信
- **位置**: `packages/common/nbstore/src/worker/client.ts`
- **功能**:
  - 管理存储连接
  - 支持多路复用通信
  - 提供优雅的销毁机制

### 1.14 OpClient

- **作用**: 操作客户端，处理异步通信
- **位置**: `packages/common/infra/src/op/client.ts`
- **功能**:
  - 封装消息传递逻辑
  - 支持调用/返回模式
  - 支持订阅/发布模式
  - 提供超时和取消机制

### 1.15 FrameworkRoot

- **作用**: 框架根组件，提供框架上下文
- **位置**: `packages/common/infra/src/framework/react/index.tsx`
- **功能**:
  - 提供框架服务的 React 上下文
  - 支持依赖注入
  - 管理框架生命周期

## 2. 组件项目技术分析

### 2.1 技术栈概览

#### 核心框架与语言

- **React 19**: 使用最新的 React 框架进行组件化开发
- **TypeScript**: 全项目启用 `strict` 模式，确保类型安全
- **Vite**: 构建工具，提供快速冷启动和热更新体验

#### UI 与样式

- **@emotion/react**: CSS-in-JS 解决方案，支持动态样式注入
- **Radix UI**: 高质量的可组合 UI 组件（如按钮、对话框等）
- **Vanilla Extract**: CSS 模块化构建工具，用于编写类型安全的 CSS 样式
- **@atlaskit/pragmatic-drag-and-drop**: 支持拖放功能
- **lottie-react / lottie-web**: 动画支持

#### 状态管理

- **jotai**: 轻量级状态管理库
- **swr**: 数据获取和缓存管理

#### 工具库

- **clsx**: 条件类名合并
- **dayjs**: 日期处理
- **lodash-es**: 工具函数
- **nanoid**: 唯一 ID 生成
- **zod**: 运行时类型验证

### 2.2 组件结构

#### 主要组件分类

- **Affine 相关组件**:
  - `affine-banner`: 横幅提示组件（浏览器警告、本地演示提示等）
  - `affine-other-page-layout`: 页面布局组件（桌面/移动端导航栏）
- **认证相关组件**:
  - `auth-container`: 认证页面容器
  - `auth-content`: 认证内容区域
  - `auth-input`: 输入框组件（支持标签、错误提示）
  - `auth-header/footer`: 页面头尾部
- **UI 组件库**:
  - `audio-player`: 音频播放器
  - `avatar`: 头像组件
  - `button`: 按钮组件（支持多种类型、大小、加载状态）
  - `checkbox`: 复选框
  - `date-picker`: 日期选择器（日历、周/月/年选择）
  - `dropdown-button`: 下拉按钮
  - `icon-button`: 图标按钮
  - `input`: 输入框基础组件
  - `loading`: 加载指示器
  - `modal`: 模态框（确认、提示）
  - `tooltip`: 提示工具

### 2.3 样式实现

#### 样式解决方案

- **Vanilla Extract**: 使用 `@vanilla-extract/css` 实现 CSS 模块化
- **CSS 变量**: 广泛使用 CSS 变量实现主题定制
- **原子化样式**: 通过 `createVar` 定义样式变量，提高可维护性

#### 样式文件结构

- `theme/global.css`: 全局样式定义
- `theme/fonts.css`: 字体定义
- 各组件目录下的 `*.css.ts` 文件：组件专属样式

### 2.4 学习与修改建议

#### 2.4.1 开发环境准备

1. 安装依赖: `yarn install`
2. 启动 Storybook 开发服务器: `yarn dev`
3. 访问 http://localhost:6006 查看组件库

#### 2.4.2 组件使用方法

1. **引入组件**:

```typescript
import { Button } from '@affine/component';
// 或引入特定组件
import { AuthInput } from '@affine/component/auth-components';
```

2. **使用组件**:

```tsx
<Button variant="primary" size="large">
  Click me
</Button>

<AuthInput
  label="Email"
  error={false}
  placeholder="Enter your email"
/>
```

#### 2.4.3 修改组件指南

1. **找到组件文件**:
   - 组件代码: `packages/frontend/component/src/components/`
   - UI 组件: `packages/frontend/component/src/ui/`
2. **修改样式**:
   - 对应的 `.css.ts` 文件
   - 使用 CSS 变量进行主题定制
3. **添加新属性**:
   - 更新组件的 TypeScript 接口
   - 在组件实现中处理新属性
4. **测试修改**:
   - 使用 Storybook 编写测试用例
   - 运行 `yarn build:storybook` 验证构建

#### 2.4.4 学习资源

1. **官方文档**:
   - [Storybook 文档](https://storybook.js.org/docs/react/get-started/introduction)
   - [React 19 文档](https://react.dev/)
   - [TypeScript 文档](https://www.typescriptlang.org/docs/)
2. **示例学习**:
   - `packages/frontend/component/src/examples/` 目录下的示例代码
   - Storybook 中的组件演示
3. **调试技巧**:
   - 使用浏览器开发者工具检查样式
   - 利用 TypeScript 的类型检查功能
   - 使用 jotai 的调试工具跟踪状态变化
