# @toeverything/infra 模块技术备忘录

## 📋 概览

@toeverything/infra 是 AFFiNE 项目的核心基础设施库，提供了一套完整的前端应用开发框架。它采用模块化设计，包含依赖注入、响应式数据管理、存储抽象、ORM 等核心功能模块。

### 项目信息

- **包名**: `@toeverything/infra`
- **版本**: 0.21.0
- **类型**: ESM 模块
- **位置**: `packages/common/infra/`

### 导出模块

```typescript
// 主要导出
export * from './app-config-storage';
export * from './atom';
export * from './framework';
export * from './livedata';
export * from './media';
export * from './orm';
export * from './storage';
export * from './utils';
```

## 🏗️ 核心模块架构

### 1. Framework 模块 - 依赖注入框架

**设计理念**: 基于依赖注入(DI)的组件管理系统，实现控制反转和松耦合架构。

#### 核心类型

- **Service**: 业务逻辑单元
- **Store**: 状态管理组件
- **Entity**: 领域模型对象
- **Scope**: 作用域管理器

#### 关键 API

```typescript
// 创建框架实例
const framework = new Framework();

// 注册组件
framework.service(LoggerService).store(UserStore, [dependencies]).entity(ProfileEntity, [dependencies]).scope(WorkspaceScope);

// 创建提供者
const provider = framework.provider();
const logger = provider.get(LoggerService);
```

#### 标识符系统

```typescript
// 定义接口标识符
interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
}
const Storage = createIdentifier<Storage>('Storage');

// 注册实现
framework.impl(Storage, LocalStorageImpl);

// 使用
const storage = provider.get(Storage);
```

#### 作用域管理

```typescript
// 定义作用域
class WorkspaceScope extends Scope<{ workspaceId: string }> {}

// 注册作用域服务
framework.scope(WorkspaceScope).service(WorkspaceService, [dependencies]);

// 创建作用域实例
const workspaceProvider = provider.createScope(WorkspaceScope, {
  workspaceId: 'workspace-123',
});
```

｜ [Framework 技术文档](./toeverything-infra-framework-teckmemo.md)

### 2. LiveData 模块 - 响应式数据系统

**设计理念**: 基于 RxJS 的响应式数据流，提供类似 Android LiveData 的 API。

#### 核心特性

- 基于 BehaviorSubject，始终保持最新值
- 与 @preact/signals-core 集成
- 内置错误处理机制
- React Hook 支持

#### 基本用法

```typescript
// 创建 LiveData
const count$ = new LiveData(0);

// 订阅变化
count$.subscribe(value => console.log(value));

// 更新值
count$.next(1);

// 获取当前值
console.log(count$.value);

// 转换为 Signal
const countSignal = count$.signal;
```

#### 从 Observable 创建

```typescript
const data$ = LiveData.from(
  interval(1000).pipe(map(i => i * 2)),
  0 // 初始值
);
```

#### React 集成

```typescript
// 在 React 组件中使用
function Counter() {
  const count = useLiveData(count$);
  return <div>{count}</div>;
}
```

｜ [LiveData 技术文档](./toeverything-infra-livedata-techmemo.md)

### 3. Storage 模块 - 存储抽象层

**设计理念**: 提供统一的存储接口，支持内存、本地存储等多种实现，同时包含二进制键值存储能力。模块采用分层设计：

- `Memento` 接口提供基础键值存储能力
- `AsyncMemento` 扩展为异步存储接口
- `ByteKV` 提供二进制数据存储能力

#### 核心接口与实现

##### Memento 接口

```typescript
interface Memento {
  get<T>(key: string): T | undefined;
  watch<T>(key: string): Observable<T | undefined>;
  set<T>(key: string, value: T | undefined): void;
  del(key: string): void;
  clear(): void;
  keys(): string[];
}
```

##### MemoryMemento 实现

```typescript
// 内存存储实现，适用于临时数据
const memento = new MemoryMemento();

// 设置值
memento.set('user', { name: 'Alice', age: 30 });

// 获取值
const user = memento.get<User>('user');

// 监听变化
memento.watch<User>('user').subscribe(user => {
  console.log('User changed:', user);
});
```

##### AsyncMemento 接口

```typescript
// 异步存储接口，适用于持久化存储
export interface AsyncMemento {
  watch<T>(key: string): Observable<T | undefined>;
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T | undefined): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

##### ByteKV 二进制存储

```typescript
// 二进制数据存储接口
export interface ByteKV extends ByteKVBehavior {
  transaction<T>(cb: (transaction: ByteKVBehavior) => Promise<T>): Promise<T>;
}

export interface ByteKVBehavior {
  get(key: string): Promise<Uint8Array | null>;
  set(key: string, value: Uint8Array): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

// 使用示例
const kv = new MemoryByteKV();
await kv.set('avatar', new Uint8Array([1, 2, 3]));
const data = await kv.get('avatar'); // Uint8Array [1,2,3]
```

#### 高级功能

##### 命名空间包装

```typescript
// 创建带命名空间的存储
const userMemento = wrapMemento(memento, 'user:');
userMemento.set('profile', userData); // 实际存储为 'user:profile'

// 获取命名空间下的所有键
const keys = userMemento.keys(); // 返回 'profile' 而不是 'user:profile'
```

##### 事务处理 (ByteKV)

```typescript
// 使用事务保证操作原子性
await kv.transaction(async tx => {
  const data = await tx.get('data');
  await tx.set('backup', data);
  await tx.del('data');
});
```

##### 只读存储 (ByteKV)

```typescript
// 创建只读存储实例
const readonlyKV = new ReadonlyByteKV();

// 写操作将被忽略
await readonlyKV.set('key', new Uint8Array()); // 无效果
```

#### 使用场景

1. **客户端状态管理**：使用 `MemoryMemento` 管理会话级状态
2. **持久化配置**：通过 `AsyncMemento` 实现 localStorage 封装
3. **文件存储**：使用 `ByteKV` 存储二进制文件数据
4. **数据隔离**：通过 `wrapMemento` 实现多用户数据隔离

#### 最佳实践

```typescript
// 创建带过期时间的存储封装
const createExpiringStorage = (memento: Memento) => ({
  set(key: string, value: any, ttl: number) {
    memento.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  },
  get(key: string) {
    const entry = memento.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.value;
    }
    return undefined;
  },
});

// 使用示例
const expiringStore = createExpiringStorage(new MemoryMemento());
expiringStore.set('token', 'abc123', 3600000); // 1小时有效期
```

#### 注意事项

1. `MemoryMemento` 数据在页面刷新后会丢失，适合临时数据
2. `wrapMemento` 的命名空间前缀需确保全局唯一
3. `ByteKV` 事务操作需要保证回调函数的原子性

| [Storage 技术文档](./toeverything-infra-storage-techmemo.md)]

### 4. ORM 模块 - 对象关系映射

**设计理念**: 轻量级 ORM 系统，支持多种数据库适配器。

#### Schema 定义

```typescript
const userSchema = {
  id: { type: 'string', primary: true },
  name: { type: 'string', required: true },
  email: { type: 'string', unique: true },
  createdAt: { type: 'date', default: () => new Date() },
};

const dbSchema = {
  users: userSchema,
  posts: postSchema,
};
```

#### 创建 ORM 客户端

```typescript
const ORMClientClass = createORMClient(dbSchema);
const client = new ORMClientClass(adapter);

// 使用表
const user = await client.users.create({
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
});

const users = await client.users.findMany({
  where: { name: { contains: 'Alice' } },
});
```

#### Hook 系统

```typescript
// 定义钩子
ORMClientClass.defineHook('users', 'before-create', async data => {
  data.id = data.id || generateId();
  data.createdAt = new Date();
});
```

| [ORM 技术文档](./toeverything-infra-orm-techmemo.md)]

### 5. Atom 模块 - 状态管理

**设计理念**: 基于 Jotai 的原子化状态管理。

#### 全局 Store

```typescript
import { getCurrentStore } from '@toeverything/infra/atom';

// 获取全局状态存储
const store = getCurrentStore();
```

#### 设置管理

```typescript
// 应用设置原子
const settingsAtom = atom({
  theme: 'light',
  language: 'en',
  autoSave: true
});

// 在组件中使用
function Settings() {
  const [settings, setSettings] = useAtom(settingsAtom);

  return (
    <div>
      <select
        value={settings.theme}
        onChange={(e) => setSettings({...settings, theme: e.target.value})}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

｜ [Atom 技术文档](./toeverything-infra-atom-techmemo.md)

### 6. Op 模块 - 操作模式框架

**设计理念**: 轻量级 RPC 框架，支持跨线程、跨标签页通信。

#### 定义操作接口

```typescript
interface Ops extends OpSchema {
  add: [{ a: number; b: number }, number];
  getUserInfo: [{ userId: string }, UserInfo];
  subscribeStatus: [number, string]; // 流式操作
}
```

#### 注册处理器

```typescript
const consumer = new OpConsumer<Ops>();

// 函数调用处理器
consumer.register('add', ({ a, b }) => a + b);

// 异步处理器
consumer.register('getUserInfo', async ({ userId }) => {
  return await fetchUserInfo(userId);
});

// 流式处理器
consumer.register('subscribeStatus', function* (userId) {
  while (true) {
    yield await getStatus(userId);
    await sleep(1000);
  }
});
```

#### 客户端调用

```typescript
const client = new OpClient<Ops>();

// 调用函数
const result = await client.call('add', { a: 1, b: 2 }); // 3

// 订阅流
client.call('subscribeStatus', 123).subscribe(status => {
  console.log('Status:', status);
});
```

| [Op 技术文档](./toeverything-infra-op-techmemo.md)]

### 7. Utils 模块 - 工具函数集

#### 异步锁

```typescript
import { AsyncLock } from '@toeverything/infra/utils';

const lock = new AsyncLock();

await lock.acquire('resource-key', async () => {
  // 临界区代码
  await doSomething();
});
```

#### 异步队列

```typescript
import { AsyncQueue } from '@toeverything/infra/utils';

const queue = new AsyncQueue();

queue.push(async () => {
  await task1();
});

queue.push(async () => {
  await task2();
});
```

#### 分数索引

```typescript
import { generateKeyBetween } from '@toeverything/infra/utils';

// 在两个项目之间插入
const newKey = generateKeyBetween('a0', 'a1');
```

#### Yjs Observable 集成

```typescript
import { yDocToObservable } from '@toeverything/infra/utils';

const doc = new Y.Doc();
const text = doc.getText('content');

// 监听文档变化
yDocToObservable(doc).subscribe(update => {
  console.log('Document updated:', update);
});
```

| [Utils 技术文档](./toeverything-infra-utils-techmemo.md)]

### 8. App Config Storage - 应用配置存储

#### 配置 Schema

```typescript
export const appConfigSchema = z.object({
  onBoarding: z.boolean().optional().default(true),
  theme: z.enum(['light', 'dark']).default('light'),
  language: z.string().default('en'),
});

export type AppConfigSchema = z.infer<typeof appConfigSchema>;
```

#### 使用配置存储

```typescript
const configStorage = new AppConfigStorage({
  config: defaultAppConfig,
  get: () => JSON.parse(localStorage.getItem('app-config') || '{}'),
  set: data => localStorage.setItem('app-config', JSON.stringify(data)),
});

// 获取配置
const theme = configStorage.get('theme');

// 更新配置
configStorage.patch('theme', 'dark');

// 获取完整配置
const fullConfig = configStorage.get();
```

## 🔧 技术栈与依赖

### 核心依赖

- **@preact/signals-core**: 响应式信号系统
- **jotai**: 原子化状态管理
- **yjs**: CRDT 协同编辑
- **eventemitter2**: 事件系统
- **idb**: IndexedDB 封装
- **zod**: 运行时类型验证
- **lodash-es**: 工具函数库
- **nanoid**: ID 生成器

### 开发依赖

- **vitest**: 单元测试框架
- **@testing-library/react**: React 测试工具
- **fake-indexeddb**: IndexedDB 模拟

## 🎯 设计优势

1. **模块化架构**: 各模块职责清晰，可独立使用
2. **类型安全**: 完整的 TypeScript 类型系统
3. **响应式**: 基于 Observable 的响应式数据流
4. **可扩展性**: 插件化架构，支持自定义扩展
5. **跨平台**: 支持 Web、Electron 等多种环境
6. **测试友好**: 内置测试工具和模拟实现

## 📝 使用场景

- **大型前端应用**: 提供完整的基础设施支持
- **协同编辑**: 基于 CRDT 的实时协同
- **状态管理**: 复杂应用的状态管理方案
- **数据持久化**: 多层次的数据存储方案
- **跨组件通信**: 基于事件和依赖注入的通信机制

## 🚀 最佳实践

### 1. 框架初始化

```typescript
// app.ts
const framework = new Framework().service(LoggerService).service(ConfigService, [LoggerService]).store(AppStore, [ConfigService]).scope(WorkspaceScope).service(WorkspaceService, [AppStore]);

export const rootProvider = framework.provider();
```

### 2. React 集成

```typescript
// App.tsx
import { FrameworkProvider } from '@toeverything/infra/framework';

function App() {
  return (
    <FrameworkProvider framework={framework}>
      <AppContent />
    </FrameworkProvider>
  );
}
```

### 3. 服务使用

```typescript
// components/UserProfile.tsx
import { useService } from '@toeverything/infra/framework';

function UserProfile() {
  const userService = useService(UserService);
  const user = useLiveData(userService.currentUser$);

  return <div>{user?.name}</div>;
}
```

### 4. 错误处理

```typescript
// 在 LiveData 中处理错误
const data$ = LiveData.from(
  fetchData().pipe(
    catchError(err => {
      logger.error('Failed to fetch data:', err);
      return of(null);
    })
  ),
  null
);
```

- [BlockSuite 架构文档](./blocksuite-architecture.md)
- [后端架构文档](./backend-architecture.md)
