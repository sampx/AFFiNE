# AFFiNE 存储模块学习指南

## 🎯 欢迎来到 AFFiNE 存储模块！

这个文档旨在帮助你理解 AFFiNE 项目中负责数据存储的核心模块。无论你是刚接触 AFFiNE 的新手，还是希望深入了解其架构的设计者，这里都能为你提供清晰的指引。

我们将深入探讨 `packages/frontend/core/src/modules/storage` 目录下的文件，了解它们如何协同工作，以及 AFFiNE 如何巧妙地管理各种类型的数据。

## 🏗️ 存储模块的“两层楼”架构

想象一下，AFFiNE 的存储系统就像一座两层楼的房子：

1.  **基础设施层 (`@toeverything/infra/storage`)**：这是房子的地基，提供了最基础、最通用的存储能力，不关心具体业务。它就像一个工具箱，里面有各种通用的存储工具。

    - `Memento` (接口)：最基础的存储抽象，用于同步存储数据（比如 `localStorage`）。
    - `AsyncMemento` (接口)：异步存储抽象，用于处理需要等待的存储操作（比如 `IndexedDB`）。
    - `ByteKV` (接口)：二进制存储抽象，用于存储二进制数据。
    - `MemoryMemento` (实现)：一种简单的内存存储实现，数据只在程序运行时存在，关闭就消失。
    - `wrapMemento` (工具)：一个包装器，可以给存储数据加上一个“命名空间”，避免不同功能的数据混淆。

2.  **业务应用层 (`packages/frontend/core/src/modules/storage`)**：这是房子的上层结构，根据 AFFiNE 的具体业务需求，使用了地基提供的工具，并在此基础上构建了更复杂的存储功能。这一层又分为三个“房间”：
    - `providers/` (接口定义层)：定义了业务需要什么样的存储能力，就像房子的设计图纸。
    - `services/` (业务服务层)：封装了具体的业务逻辑，就像房子的各个功能区（厨房、卧室），处理日常事务。
    - `impls/` (具体实现层)：提供了具体的存储方式，就像厨房里具体的电器（冰箱、烤箱），真正执行存储操作。

## 🎨 核心设计模式：AFFiNE 如何“盖房子”

AFFiNE 在构建存储模块时，巧妙地运用了几种常见的设计模式，让整个系统既灵活又易于维护。

### 1. 三层架构模式 (Providers-Services-Impls)

这是 AFFiNE 项目的标准“盖房子”模式，它把不同的工作分给不同的团队，让大家各司其职：

#### Providers 层 - “设计图纸”

```typescript
// packages/frontend/core/src/modules/storage/providers/global.ts

// 定义业务接口：我们业务需要什么样的存储能力？
export interface GlobalState extends Memento {} // 全局持久化状态
export interface GlobalCache extends Memento {} // 全局缓存
export interface GlobalSessionState extends Memento {} // 全局会话状态
export interface CacheStorage extends AsyncMemento {} // 异步缓存存储

// 创建依赖注入标识符：给这些能力一个唯一的“名字”
export const GlobalState = createIdentifier<GlobalState>('GlobalState');
export const GlobalCache = createIdentifier<GlobalCache>('GlobalCache');
export const GlobalSessionState = createIdentifier<GlobalSessionState>('GlobalSessionState');
export const CacheStorage = createIdentifier<CacheStorage>('CacheStorage');
```

**特殊提供者：`NbstoreProvider`**

`NbstoreProvider` 是一个特殊的存储提供者，它允许在不同的浏览器标签页或窗口之间共享数据。这通常通过 `SharedWorker` 技术实现，使得多个页面可以连接到同一个后台工作线程，从而实现数据共享和同步。

```typescript
// packages/frontend/core/src/modules/storage/providers/nbstore.ts
export interface NbstoreProvider {
  openStore(key: string, options: WorkerInitOptions): Promise<NbstoreClient>;
}
export const NbstoreProvider = createIdentifier<NbstoreProvider>('NbstoreProvider');
```

- **`openStore(key: string, options: WorkerInitOptions)`**：打开一个 `nbstore` 实例。如果指定 `key` 的存储已存在，则返回现有存储。在支持 `SharedWorker` 的环境中，存储可以在多个标签页/窗口之间共享。

**设计意图**：

- **明确契约**：清晰地定义了业务需要哪些存储功能。
- **解耦**：通过 `createIdentifier`，业务代码只知道“名字”，不知道具体是谁在提供服务，这样以后可以随时更换提供者。
- **业务语义**：使用业务中容易理解的词语（如 `GlobalState`）来命名，而不是技术细节。

#### Services 层 - “功能区”

```typescript
// packages/frontend/core/src/modules/storage/services/global.ts

export class GlobalStateService extends Service {
  constructor(public readonly globalState: GlobalState) {
    // 构造函数注入 GlobalState
    super();
  }
  // 这里可以添加更多业务方法，例如：
  // getUserSettings() { return this.globalState.get('userSettings'); }
  // saveUserSettings(settings) { this.globalState.set('userSettings', settings); }
}

export class GlobalCacheService extends Service {
  constructor(public readonly globalCache: GlobalCache) {
    super();
  }
}
```

**设计意图**：

- **业务封装**：把存储能力包装成对业务有意义的服务，比如“获取用户设置”而不是“从 `localStorage` 读取键值”。
- **依赖注入**：通过构造函数把“设计图纸”中定义的具体实现“送”进来，服务本身不需要知道具体实现。
- **服务边界**：为上层业务提供清晰的服务接口，业务代码只需要调用服务方法，不需要关心内部细节。

#### Impls 层 - “具体电器”

```typescript
// packages/frontend/core/src/modules/storage/impls/storage.ts

// 基础存储实现类：把 Web Storage API 适配成 Memento 接口
export class StorageMemento implements Memento {
  constructor(
    private readonly storage: Storage, // 比如 localStorage 或 sessionStorage
    private readonly prefix: string // 存储数据的前缀，避免冲突
  ) {}

  // 实现 Memento 接口的方法，例如：
  get<T>(key: string): T | undefined {
    const json = this.storage.getItem(this.prefix + key);
    return json ? JSON.parse(json) : undefined;
  }
  // ... 其他方法如 set, del, watch 等
}

// 具体业务实现：使用 localStorage 实现 GlobalCache
export class LocalStorageGlobalCache extends StorageMemento implements GlobalCache {
  constructor() {
    super(localStorage, 'global-cache:'); // 使用 localStorage，前缀为 'global-cache:'
  }
}

// 使用 localStorage 实现 GlobalState
export class LocalStorageGlobalState extends StorageMemento implements GlobalState {
  constructor() {
    super(localStorage, 'global-state:');
  }
}

// 使用 sessionStorage 实现 GlobalSessionState
export class SessionStorageGlobalSessionState extends StorageMemento implements GlobalSessionState {
  constructor() {
    super(sessionStorage, 'global-session-state:');
  }
}

// 异步存储的抽象基类，通常基于 IndexedDB
export class AsyncStorageMemento implements AsyncMemento {
  // ... 实现 AsyncMemento 接口的方法
}

// 使用 IndexedDB 实现 CacheStorage
export class IDBGlobalState extends AsyncStorageMemento implements CacheStorage {
  constructor() {
    // 数据库名为 'global-storage'，表名为 'global-state'
    super('global-storage', 'global-state');
  }
}
```

**设计意图**：

- **技术实现**：把抽象的接口变成具体的、可执行的代码。
- **环境适配**：针对不同的运行环境（如浏览器、Electron 桌面应用）提供不同的实现方式。
- **配置管理**：通过构造函数参数来控制具体行为，比如存储的前缀。

### 2. 依赖注入模式 (Dependency Injection)

依赖注入就像一个“中央厨房”，它负责把各种“食材”（依赖）准备好，然后“送”给需要它们的“厨师”（服务）。这样，“厨师”就不用自己去“买菜”了。

#### 标识符创建

```typescript
// 创建类型安全的标识符，就像给食材贴上标签
export const GlobalState = createIdentifier<GlobalState>('GlobalState');
```

#### 实现注册

```typescript
// packages/frontend/core/src/modules/storage/index.ts

export function configureLocalStorageStateStorageImpls(framework: Framework) {
  // 告诉“中央厨房”：当有人需要 GlobalCache 时，就给它 LocalStorageGlobalCache
  framework.impl(GlobalCache, LocalStorageGlobalCache);
  framework.impl(GlobalState, LocalStorageGlobalState);
  framework.impl(CacheStorage, IDBGlobalState); // CacheStorage 使用 IndexedDB 实现
}
```

#### 服务注册

```typescript
export const configureStorageModule = (framework: Framework) => {
  // 告诉“中央厨房”：当有人需要 GlobalStateService 时，它需要 GlobalState 这个“食材”
  framework.service(GlobalStateService, [GlobalState]);
  framework.service(GlobalCacheService, [GlobalCache]);
  framework.service(GlobalSessionStateService, [GlobalSessionState]);
};
```

**设计优势**：

- **可替换性**：可以轻松更换不同的存储实现，比如从 `localStorage` 换成 `IndexedDB`，而业务代码不需要改动。
- **可测试性**：测试时可以注入一个假的（Mock）实现，方便测试服务层的逻辑，而不用真的去读写硬盘。
- **环境适配**：根据不同的运行环境（Web、Electron），注册不同的存储实现。

### 3. 适配器模式 (Adapter Pattern)

适配器模式就像一个“万能转换插头”，它能让不兼容的接口协同工作。在这里，它让不同的底层存储 API（如 `localStorage`、`IndexedDB`、Electron 原生存储）都能以统一的方式被上层业务使用。

#### 基础适配器 (`StorageMemento`)

`StorageMemento` 将 Web Storage API (如 `localStorage`) 适配成 `Memento` 接口，并增加了跨标签页通信和响应式监听功能。

```typescript
export class StorageMemento implements Memento {
  // ... 构造函数和 get/set 等方法

  watch<T>(key: string): Observable<T | undefined> {
    return new Observable<T | undefined>(subscriber => {
      // 同时监听同标签页事件 (EventEmitter2) 和跨标签页事件 (BroadcastChannel)
      // 这样，当一个标签页修改了数据，其他标签页也能立即感知到
      const eventEmitterCb = (value: T) => subscriber.next(value);
      const channelCb = (event: MessageEvent) => {
        if (event.data.key === key) {
          subscriber.next(event.data.value);
        }
      };

      this.eventEmitter.on(key, eventEmitterCb);
      this.channel.addEventListener('message', channelCb);

      return () => {
        // 清理函数，当不再监听时移除事件
        this.eventEmitter.off(key, eventEmitterCb);
        this.channel.removeEventListener('message', channelCb);
      };
    });
  }
}
```

#### 环境特定适配器 (`ElectronGlobalState`)

在 Electron 桌面应用环境中，存储方式可能与浏览器不同，需要专门的适配器来调用 Electron 的原生 API。

```typescript
// Electron 环境适配器
export class ElectronGlobalState implements GlobalState {
  constructor(private readonly electronApi: DesktopApiService) {}

  get<T>(key: string): T | undefined {
    return this.electronApi.sharedStorage.globalState.get(key);
  }

  watch<T>(key: string) {
    return new Observable<T | undefined>(subscriber => {
      const unsubscribe = this.electronApi.sharedStorage.globalState.watch<T>(key, value => subscriber.next(value));
      return () => unsubscribe();
    });
  }
}
```

**设计意图**：

- **接口统一**：让不同的底层存储技术都能对外提供相同的接口，业务代码无需关心底层差异。
- **跨平台**：轻松支持 Web、Electron 等不同运行环境。
- **功能增强**：在适配过程中可以增加额外的功能，如响应式数据流、跨标签页通信等。

### 4. 策略模式 (Strategy Pattern)

策略模式允许在运行时选择不同的算法或行为。在存储模块中，这意味着可以根据不同的环境（开发、生产、Electron）选择不同的存储策略。

```typescript
// 根据环境选择不同的存储策略
if (isDevelopment) {
  // 开发环境：使用内存存储，方便调试，数据不持久化
  framework.impl(GlobalState, MemoryGlobalState);
}

if (isProduction) {
  // 生产环境：使用持久化存储，如 localStorage
  framework.impl(GlobalState, LocalStorageGlobalState);
}

if (isElectron) {
  // Electron 环境：使用原生存储
  framework.impl(GlobalState, ElectronGlobalState, [DesktopApiService]);
}
```

## 🎯 设计目的和意义：为什么这么设计？

这种分层和模式化的设计带来了巨大的好处：

### 1. 业务与技术分离

- **业务层 (Core Storage)**：只关心业务概念，如 `GlobalState`（全局状态）、`GlobalCache`（全局缓存）。
- **技术层 (Infra Storage)**：只关心基础存储能力，如 `Memento`（键值存储）、`AsyncMemento`（异步键值存储）。

**意义**：业务开发者可以专注于业务逻辑，不需要了解底层存储的具体技术细节，大大提高了开发效率和代码可读性。

### 2. 环境无关性

同一套业务代码，可以在不同的运行环境下（Web 浏览器、Electron 桌面应用）使用不同的底层存储实现，而无需修改业务逻辑。

```typescript
// 业务代码：UserPreferencesManager 不关心具体实现
class UserPreferencesManager {
  constructor(private globalState: GlobalState) {} // 只依赖 GlobalState 接口

  getTheme() {
    return this.globalState.get('theme') ?? 'light';
  }
}
```

### 3. 测试友好性

由于业务代码只依赖接口，测试时可以轻松地注入一个假的（Mock）实现，从而隔离外部依赖，使单元测试变得简单高效。

```typescript
// 测试时可以轻松 Mock
const mockGlobalState = new MemoryMemento(); // 使用内存实现进行测试
const userPrefs = new UserPreferencesManager(mockGlobalState);
```

### 4. 功能渐进增强

可以在基础存储功能之上，逐步添加更高级的功能，如响应式数据流、跨标签页通信等，而不会影响到基础接口。

## 🚀 开发指导原则：如何使用这个模块？

如果你需要为 AFFiNE 添加新的存储功能，请遵循以下标准流程：

### 1. Step 1: 在 `providers/` 层定义接口

首先，明确你的业务需要什么样的存储能力，并定义一个接口。

```typescript
// packages/frontend/core/src/modules/storage/providers/my-feature.ts
import { createIdentifier, type Memento } from '@toeverything/infra';

export interface MyFeatureStorage extends Memento {} // 继承 Memento 基础能力
export const MyFeatureStorage = createIdentifier<MyFeatureStorage>('MyFeatureStorage');
```

### 2. Step 2: 在 `services/` 层创建服务

接着，创建一个服务类来封装业务逻辑，它将通过构造函数注入你定义的存储接口。

```typescript
// packages/frontend/core/src/modules/storage/services/my-feature.ts
import { Service } from '@toeverything/infra';
import type { MyFeatureStorage } from '../providers/my-feature';

export class MyFeatureService extends Service {
  constructor(private readonly storage: MyFeatureStorage) {
    super();
  }

  saveUserData(data: UserData) {
    this.storage.set('userData', data); // 通过接口保存数据
  }
  // ... 其他业务方法
}
```

### 3. Step 3: 在 `impls/` 层提供实现

然后，提供一个或多个具体的实现类，它们将实现你在 `providers/` 中定义的接口。

```typescript
// packages/frontend/core/src/modules/storage/impls/my-feature.ts
import { StorageMemento } from './storage'; // 可以继承 StorageMemento
import type { MyFeatureStorage } from '../providers/my-feature';

export class LocalStorageMyFeature extends StorageMemento implements MyFeatureStorage {
  constructor() {
    super(localStorage, 'my-feature:'); // 使用 localStorage，并指定前缀
  }
}
```

### 4. Step 4: 注册到框架

最后，在 `index.ts` 中将你的服务和实现注册到 AFFiNE 的框架中，这样它们才能被应用程序使用。

```typescript
// packages/frontend/core/src/modules/storage/index.ts

export function configureMyFeatureStorage(framework: Framework) {
  // 注册服务
  framework.service(MyFeatureService, [MyFeatureStorage]);
  // 注册实现
  framework.impl(MyFeatureStorage, LocalStorageMyFeature);
  // 如果有 Electron 环境的实现，也可以在这里根据环境判断注册
  // if (isElectron) {
  //   framework.impl(MyFeatureStorage, ElectronMyFeature, [DesktopApiService]);
  // }
}
```

### 命名约定

为了保持代码的一致性，请遵循以下命名约定：

- **Providers**：使用业务术语，如 `GlobalState`、`UserPreferences`。
- **Services**：以 `Service` 结尾，如 `GlobalStateService`。
- **Impls**：以技术实现命名，如 `LocalStorageGlobalState`、`ElectronGlobalState`。

### 依赖关系原则

- `Services` 依赖 `Providers` (接口)
- `Impls` 实现 `Providers` (接口)
- `Services` 不直接依赖 `Impls` (实现)

### 测试策略

- **单元测试**：对 `Services` 层进行测试时，可以使用内存实现 (`MemoryMemento`) 来模拟存储，从而隔离外部依赖。
- **集成测试**：测试整个存储流程时，可以使用真实的实现（如 `LocalStorageMyFeature`）。
- **Mock 测试**：当有外部依赖（如 Electron API）时，可以使用 Mock 对象来模拟这些依赖的行为。

## 🔍 实际应用案例分析：用户偏好设置系统

让我们通过一个完整的例子来理解这种架构模式如何应用于实际开发：构建一个用户偏好设置系统。

### 1. 定义业务接口 (`providers/user-preferences.ts`)

```typescript
// packages/frontend/core/src/modules/storage/providers/user-preferences.ts
import { createIdentifier, type Memento } from '@toeverything/infra';

export interface UserPreferencesStorage extends Memento {
  getTheme(): string;
  setTheme(theme: string): void;
}

export const UserPreferencesStorage = createIdentifier<UserPreferencesStorage>('UserPreferencesStorage');
```

### 2. 创建业务服务 (`services/user-preferences.ts`)

```typescript
// packages/frontend/core/src/modules/storage/services/user-preferences.ts
import { Service } from '@toeverything/infra';
import type { UserPreferencesStorage } from '../providers/user-preferences';
import { map, distinctUntilChanged } from 'rxjs/operators'; // 用于响应式流

export class UserPreferencesService extends Service {
  constructor(private readonly storage: UserPreferencesStorage) {
    super();
  }

  getTheme() {
    return this.storage.get('theme') ?? 'light'; // 获取主题，如果没有则默认为 'light'
  }

  setTheme(theme: 'light' | 'dark') {
    this.storage.set('theme', theme); // 设置主题
    console.log(`Theme changed to: ${theme}`);
  }

  watchTheme() {
    // 监听主题变化，并确保只有在主题真正改变时才通知
    return this.storage.watch<string>('theme').pipe(
      map(theme => theme ?? 'light'),
      distinctUntilChanged()
    );
  }

  resetToDefaults() {
    this.storage.clear(); // 清除所有偏好设置
    this.setTheme('light'); // 重置主题为默认值
  }
}
```

### 3. 提供具体实现 (`impls/user-preferences.ts`)

```typescript
// packages/frontend/core/src/modules/storage/impls/user-preferences.ts
import { StorageMemento } from './storage';
import type { UserPreferencesStorage } from '../providers/user-preferences';
import { Observable } from 'rxjs'; // 用于响应式流

export class LocalStorageUserPreferences extends StorageMemento implements UserPreferencesStorage {
  constructor() {
    super(localStorage, 'user-preferences:'); // 使用 localStorage，前缀为 'user-preferences:'
  }

  getTheme(): string {
    return this.get('theme') ?? 'light';
  }

  setTheme(theme: string): void {
    this.set('theme', theme);
  }
}

// Electron 环境的实现（如果需要）
// export class ElectronUserPreferences implements UserPreferencesStorage {
//   constructor(private readonly electronApi: DesktopApiService) {}
//
//   getTheme(): string {
//     return this.electronApi.userPreferences.getTheme();
//   }
//
//   setTheme(theme: string): void {
//     this.electronApi.userPreferences.setTheme(theme);
//   }
//
//   get<T>(key: string): T | undefined {
//     return this.electronApi.userPreferences.get(key);
//   }
//
//   set<T>(key: string, value: T): void {
//     this.electronApi.userPreferences.set(key, value);
//   }
//
//   watch<T>(key: string) {
//     return new Observable<T | undefined>(subscriber => {
//       const unsubscribe = this.electronApi.userPreferences.watch<T>(key, value => subscriber.next(value));
//       return () => unsubscribe();
//     });
//   }
// }
```

### 4. 注册到框架 (`index.ts`)

```typescript
// packages/frontend/core/src/modules/storage/index.ts
import type { Framework } from '@toeverything/infra';
import { UserPreferencesService } from './services/user-preferences';
import { UserPreferencesStorage } from './providers/user-preferences';
import { LocalStorageUserPreferences } from './impls/user-preferences';
import { ElectronUserPreferences } from './impls/user-preferences'; // 如果有 Electron 实现
import { DesktopApiService } from '../desktop/services/desktop-api'; // 如果有 Electron 实现

export function configureUserPreferencesModule(framework: Framework) {
  framework.service(UserPreferencesService, [UserPreferencesStorage]);

  // 根据环境注册不同实现
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  if (isElectron) {
    framework.impl(UserPreferencesStorage, ElectronUserPreferences, [DesktopApiService]);
  } else {
    framework.impl(UserPreferencesStorage, LocalStorageUserPreferences);
  }
}
```

### 5. 在组件中使用 (`components/ThemeSelector.tsx`)

```typescript
// components/ThemeSelector.tsx
import { useService } from '@toeverything/infra/framework';
import { UserPreferencesService } from '../services/user-preferences';
import { useState, useEffect } from 'react';

export function ThemeSelector() {
  const userPrefs = useService(UserPreferencesService); // 获取 UserPreferencesService 实例
  const [theme, setTheme] = useState(userPrefs.getTheme()); // 获取当前主题

  useEffect(() => {
    // 订阅主题变化
    const subscription = userPrefs.watchTheme().subscribe(setTheme);
    return () => subscription.unsubscribe(); // 组件卸载时取消订阅
  }, [userPrefs]);

  return (
    <select
      value={theme}
      onChange={(e) => userPrefs.setTheme(e.target.value as 'light' | 'dark')}
    >
      <option value="light">浅色模式</option>
      <option value="dark">深色模式</option>
    </select>
  );
}
```

## 📚 学习建议

- **对于初学者**：

  1.  **先理解接口**：从 `providers/` 目录开始，理解业务需要什么样的存储能力。
  2.  **再看实现**：查看 `impls/` 目录，了解如何将抽象的接口转换为具体的存储实现。
  3.  **最后看服务**：理解 `services/` 目录如何封装业务逻辑，并使用前面定义的接口。
  4.  **动手实践**：尝试按照“开发指导原则”的步骤，实现一个简单的存储功能，这将帮助你更好地理解整个流程。

- **对于参与开发**：
  1.  **遵循三层架构**：新增功能必须按照 Providers-Services-Impls 模式组织。
  2.  **使用依赖注入**：通过 `createIdentifier` 和 `framework.impl` 管理依赖，保持代码的灵活性。
  3.  **考虑多环境**：为 Web、Electron 等不同运行环境提供适配实现，确保跨平台兼容性。
  4.  **编写测试**：利用依赖注入的优势，编写可测试的代码，保证代码质量。

## 🎉 总结

AFFiNE 的存储模块是其架构设计的典型代表，它展示了如何通过**分层架构**、**依赖注入**、**适配器模式**等设计模式，构建一个既灵活又可维护的存储系统。

这种设计的核心价值在于：

- 🎯 **业务导向**：以业务需求为中心设计接口，而不是被技术细节束缚。
- 🔧 **技术无关**：业务逻辑不依赖具体的存储技术实现，可以轻松切换底层技术。
- 🌍 **环境适配**：同一套代码可以适配多种运行环境，减少重复开发。
- 🧪 **测试友好**：通过依赖注入实现高可测试性，方便进行单元测试和集成测试。
- 🔄 **易于扩展**：新增功能只需要实现对应的接口，系统扩展性强。

掌握这种设计模式，你就能理解 AFFiNE 项目的核心设计哲学，并能够自信地参与到项目的开发中来！
