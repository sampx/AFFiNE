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
