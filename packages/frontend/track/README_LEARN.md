# AFFiNE Track 模块技术备忘录

## 项目概述

`@affine/track` 是 AFFiNE 前端项目中的用户行为追踪和分析模块，负责收集用户在应用中的操作数据，用于产品分析、错误监控和用户体验优化。

## 核心功能

### 1. 用户行为追踪 (User Behavior Tracking)

- **事件追踪**: 记录用户在应用中的各种操作行为
- **页面追踪**: 监控用户的页面访问和导航行为
- **性能监控**: 收集应用性能数据和加载时间

### 2. 错误监控 (Error Monitoring)

- **异常捕获**: 自动捕获 JavaScript 错误和未处理的异常
- **错误上报**: 将错误信息发送到 Sentry 进行分析
- **性能追踪**: 监控应用性能指标和用户体验数据

### 3. 数据分析 (Analytics)

- **用户画像**: 收集用户使用习惯和偏好数据
- **功能使用统计**: 分析各功能模块的使用频率
- **转化漏斗**: 追踪用户操作流程和转化率

## 技术架构

### 核心模块结构

```
packages/frontend/track/
├── src/
│   ├── index.ts          # 主入口文件
│   ├── auto.ts           # 自动追踪功能
│   ├── events.ts         # 事件定义
│   ├── mixpanel.ts       # Mixpanel 集成
│   ├── sentry.ts         # Sentry 集成
│   ├── types.ts          # 类型定义
│   └── __tests__/        # 测试文件
├── package.json
└── tsconfig.json
```

### 1. 事件追踪系统 (Event Tracking System)

#### 事件层级结构

Track 模块采用四层事件结构：`page.segment.module.event`

- **Page**: 页面级别 (如 `doc`, `allDocs`, `workspace`)
- **Segment**: 页面区域 (如 `header`, `sidebar`, `editor`)
- **Module**: 功能模块 (如 `actions`, `toolbar`, `menu`)
- **Event**: 具体事件 (如 `createDoc`, `deleteDoc`, `openSettings`)

#### 使用示例

```typescript
import track from '@affine/track';

// 追踪文档创建事件
track.allDocs.header.actions.createDoc({ mode: 'page' });

// 追踪设置打开事件
track.$.settingsPanel.menu.openSettings({ to: 'workspace' });

// 追踪用户登录事件
track.$.$.auth.signIn({ method: 'oauth', provider: 'google' });
```

### 2. 自动追踪功能 (Auto Tracking)

#### DOM 数据属性追踪

通过在 HTML 元素上添加 `data-event-*` 属性实现自动追踪：

```html
<!-- 基础事件追踪 -->
<button data-event-props="allDocs.header.actions.createDoc">创建文档</button>

<!-- 带参数的事件追踪 -->
<button data-event-props="$.cmdk.settings.changeLanguage" data-event-arg="cn">切换语言</button>

<!-- 多参数事件追踪 -->
<button data-event-props="doc.editor.toolbar.copyBlockToLink" data-event-args-type="paragraph" data-event-args-control="toolbar">复制链接</button>
```

#### 自动追踪初始化

```typescript
import { enableAutoTrack } from '@affine/track';

// 在应用根元素上启用自动追踪
const cleanup = enableAutoTrack(document.body, (event, props) => {
  console.log('Auto tracked:', event, props);
});

// 清理监听器
cleanup();
```

### 3. 第三方服务集成

#### Mixpanel 集成

**Mixpanel** 是一个强大的产品分析平台，用于追踪用户行为和分析产品使用数据。

**主要特性**:

- 事件追踪和用户行为分析
- 用户画像和细分
- 漏斗分析和留存分析
- A/B 测试支持

**配置示例**:

```typescript
import { mixpanel } from '@affine/track';

// 初始化 Mixpanel
mixpanel.init();

// 注册全局属性
mixpanel.register({
  appVersion: '0.21.0',
  environment: 'production',
  isDesktop: true,
});

// 追踪事件
mixpanel.track('documentCreated', {
  docType: 'page',
  source: 'toolbar',
});

// 用户识别
mixpanel.identify('user-123');

// 设置用户属性
mixpanel.people.set({
  $name: 'John Doe',
  $email: 'john@example.com',
  plan: 'pro',
});
```

#### Sentry 集成

**Sentry** 是一个错误监控和性能监控平台，帮助开发者快速发现和修复应用问题。

**主要特性**:

- 实时错误监控和报警
- 性能监控和追踪
- 发布健康度监控
- 用户反馈收集

**配置示例**:

```typescript
import { sentry } from '@affine/track';

// 初始化 Sentry
sentry.init();

// 启用错误监控
sentry.enable();

// 禁用错误监控
sentry.disable();
```

## 事件类型定义

### 主要事件分类

#### 1. 应用事件 (App Events)

```typescript
type AppEvents =
  | 'checkUpdates' // 检查更新
  | 'downloadUpdate' // 下载更新
  | 'downloadApp' // 下载应用
  | 'quitAndInstall' // 退出并安装
  | 'openChangelog' // 打开更新日志
  | 'contactUs'; // 联系我们
```

#### 2. 文档事件 (Document Events)

```typescript
type DocEvents =
  | 'openDoc' // 打开文档
  | 'createDoc' // 创建文档
  | 'renameDoc' // 重命名文档
  | 'deleteDoc' // 删除文档
  | 'switchPageMode' // 切换页面模式
  | 'linkDoc' // 链接文档
  | 'bookmark'; // 添加书签
```

#### 3. 编辑器事件 (Editor Events)

```typescript
type EditorEvents =
  | 'bold' // 加粗
  | 'italic' // 斜体
  | 'underline' // 下划线
  | 'strikeThrough'; // 删除线
```

#### 4. 组织事件 (Organization Events)

```typescript
type OrganizeEvents =
  | 'createCollection' // 创建集合
  | 'deleteCollection' // 删除集合
  | 'createFolder' // 创建文件夹
  | 'createTag' // 创建标签
  | 'toggleFavorite'; // 切换收藏
```

#### 5. 云服务事件 (Cloud Events)

```typescript
type CloudEvents =
  | 'signIn' // 登录
  | 'signOut' // 登出
  | 'createShareLink' // 创建分享链接
  | 'checkout' // 结账
  | 'subscribe'; // 订阅
```

### 事件参数类型

```typescript
export type EventArgs = {
  createWorkspace: { flavour: string };
  signIn: { method: 'password' | 'oauth'; provider?: string };
  checkout: { plan: string; recurring: string };
  navigate: { to: string };
  createDoc: { mode?: 'edgeless' | 'page' };
  switchPageMode: { mode: 'edgeless' | 'page' };
  // ... 更多事件参数定义
};
```

## 使用指南

### 1. 基础使用

#### 导入模块

```typescript
import track, { mixpanel, sentry, enableAutoTrack } from '@affine/track';
```

#### 追踪用户操作

```typescript
// 追踪文档创建
track.allDocs.header.actions.createDoc({ mode: 'page' });

// 追踪用户登录
track.$.$.auth.signIn({
  method: 'oauth',
  provider: 'google',
});

// 追踪设置更改
track.$.settingsPanel.workspace.changeAppSetting({
  key: 'theme',
  value: 'dark',
});
```

### 2. 高级使用

#### 中间件支持

```typescript
// 添加追踪中间件
const removeMiddleware = mixpanel.middleware((eventName, properties) => {
  // 添加自定义属性
  return {
    ...properties,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };
});

// 移除中间件
removeMiddleware();
```

#### 条件追踪

```typescript
// 只在生产环境追踪
if (BUILD_CONFIG.appBuildType === 'production') {
  track.doc.editor.toolbar.copyBlockToLink({ type: 'paragraph' });
}
```

### 3. 自定义追踪包装器

```typescript
// 为特定功能创建追踪包装器
export const readwiseTrack = new Proxy(track.$.settingsPanel.integrationList, {
  get(target, key, receiver) {
    const original = Reflect.get(target, key, receiver);

    if (typeof original !== 'function') {
      return original;
    }

    return function (this: unknown, ...args: unknown[]) {
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        args[0] = {
          type: 'readwise',
          control: 'Readwise Card',
          ...args[0],
        };
      }
      return original.apply(this, args);
    };
  },
});
```

## 最佳实践

### 1. 事件命名规范

- 使用清晰、描述性的事件名称
- 遵循 `page.segment.module.event` 层级结构
- 使用驼峰命名法 (camelCase)

### 2. 参数设计原则

- 保持参数结构简单明了
- 包含必要的上下文信息
- 避免敏感信息 (如密码、个人数据)

### 3. 性能考虑

- 避免在高频操作中进行复杂追踪
- 使用批量上报减少网络请求
- 在开发环境中禁用或简化追踪

### 4. 隐私保护

- 遵循数据保护法规 (GDPR, CCPA)
- 提供用户选择退出机制
- 匿名化敏感数据

## 测试策略

### 单元测试

```typescript
import { makeTracker, enableAutoTrack } from '@affine/track';

describe('Track Module', () => {
  test('should track events with correct parameters', () => {
    const mockTrack = vi.fn();
    const track = makeTracker(mockTrack);

    track.allDocs.header.actions.createDoc({ mode: 'page' });

    expect(mockTrack).toBeCalledWith('createDoc', {
      page: 'allDocs',
      segment: 'header',
      module: 'actions',
      mode: 'page',
    });
  });
});
```

### 集成测试

- 验证与 Mixpanel 的集成
- 测试 Sentry 错误上报
- 验证自动追踪功能

## 总结

`@affine/track` 模块为 AFFiNE 提供了完整的用户行为追踪和错误监控解决方案。通过结构化的事件定义、自动追踪功能和第三方服务集成，帮助团队更好地理解用户行为、优化产品体验和快速定位问题。

该模块的设计充分考虑了类型安全、性能优化和隐私保护，为产品的持续改进提供了可靠的数据支持。
