# Core Storage 架构设计深度分析

## 🎯 概述

`packages/frontend/core/src/modules/storage` 与 `@toeverything/infra` 中的 Storage 是一个经典的**分层架构**设计案例。这种设计体现了 AFFiNE 项目的核心设计哲学：**基础设施抽象化** + **业务逻辑具体化**。

## 🏗️ 两层架构关系

### 基础设施层 (@toeverything/infra)

```
@toeverything/infra/storage
├── Memento (接口)           # 基础存储抽象
├── AsyncMemento (接口)      # 异步存储抽象
├── ByteKV (接口)           # 二进制存储抽象
├── MemoryMemento (实现)     # 内存存储实现
└── wrapMemento (工具)       # 命名空间包装器
```

### 业务应用层 (frontend/core)

```
packages/frontend/core/src/modules/storage
├── providers/              # 接口定义层
├── services/               # 业务服务层
└── impls/                  # 具体实现层
```

## 🎨 核心设计模式分析

### 1. 三层架构模式 (Providers-Services-Impls)

这是 AFFiNE 项目的标准架构模式，体现了**关注点分离**的设计原则：

#### Providers 层 - 接口契约定义

```typescript
// packages/frontend/core/src/modules/storage/providers/global.ts

// 定义业务接口
export interface GlobalState extends Memento {}
export interface GlobalCache extends Memento {}
export interface GlobalSessionState extends Memento {}

// 创建依赖注入标识符
export const GlobalState = createIdentifier<GlobalState>('GlobalState');
export const GlobalCache = createIdentifier<GlobalCache>('GlobalCache');
export const GlobalSessionState = createIdentifier<GlobalSessionState>('GlobalSessionState');
```

**设计意图**:

- 📋 **契约定义**: 明确定义业务需要什么样的存储能力
- 🔗 **依赖倒置**: 通过 `createIdentifier` 实现接口与实现的解耦
- 🎯 **业务语义**: 用业务术语命名（GlobalState、GlobalCache）而非技术术语

#### Services 层 - 业务逻辑封装

```typescript
// packages/frontend/core/src/modules/storage/services/global.ts

export class GlobalStateService extends Service {
  constructor(public readonly globalState: GlobalState) {
    super();
  }
}

export class GlobalCacheService extends Service {
  constructor(public readonly globalCache: GlobalCache) {
    super();
  }
}
```

**设计意图**:

- 🏢 **业务封装**: 将存储能力包装成业务服务
- 🔌 **依赖注入**: 通过构造函数注入具体实现
- 📦 **服务边界**: 为上层业务提供清晰的服务边界

#### Impls 层 - 具体实现

```typescript
// packages/frontend/core/src/modules/storage/impls/storage.ts

// 基础存储实现类
export class StorageMemento implements Memento {
  constructor(
    private readonly storage: Storage, // Web Storage API
    private readonly prefix: string // 命名空间前缀
  ) {}

  // 实现 Memento 接口...
}

// 具体业务实现
export class LocalStorageGlobalCache extends StorageMemento implements GlobalCache {
  constructor() {
    super(localStorage, 'global-cache:');
  }
}

export class LocalStorageGlobalState extends StorageMemento implements GlobalState {
  constructor() {
    super(localStorage, 'global-state:');
  }
}
```

**设计意图**:

- 🔧 **技术实现**: 将抽象接口转换为具体的技术实现
- 🌍 **环境适配**: 针对不同环境（Web、Electron）提供不同实现
- 🎛️ **配置管理**: 通过构造参数控制具体行为

### 2. 依赖注入模式 (Dependency Injection)

#### 标识符创建

```typescript
// 创建类型安全的标识符
export const GlobalState = createIdentifier<GlobalState>('GlobalState');
```

#### 实现注册

```typescript
// packages/frontend/core/src/modules/storage/index.ts

export function configureLocalStorageStateStorageImpls(framework: Framework) {
  framework.impl(GlobalCache, LocalStorageGlobalCache);
  framework.impl(GlobalState, LocalStorageGlobalState);
  framework.impl(CacheStorage, IDBGlobalState);
}
```

#### 服务注册

```typescript
export const configureStorageModule = (framework: Framework) => {
  framework.service(GlobalStateService, [GlobalState]);
  framework.service(GlobalCacheService, [GlobalCache]);
  framework.service(GlobalSessionStateService, [GlobalSessionState]);
};
```

**设计优势**:

- 🔄 **可替换性**: 可以轻松替换不同的存储实现
- 🧪 **可测试性**: 可以注入 Mock 实现进行测试
- 🌐 **环境适配**: 不同环境可以注册不同的实现

### 3. 适配器模式 (Adapter Pattern)

#### 基础适配器

```typescript
export class StorageMemento implements Memento {
  // 将 Web Storage API 适配为 Memento 接口

  get<T>(key: string): T | undefined {
    const json = this.storage.getItem(this.prefix + key);
    return json ? JSON.parse(json) : undefined;
  }

  watch<T>(key: string): Observable<T | undefined> {
    return new Observable<T | undefined>(subscriber => {
      // 同时监听同标签页和跨标签页事件
      const eventEmitterCb = (value: T) => subscriber.next(value);
      const channelCb = (event: MessageEvent) => {
        if (event.data.key === key) {
          subscriber.next(event.data.value);
        }
      };

      this.eventEmitter.on(key, eventEmitterCb);
      this.channel.addEventListener('message', channelCb);

      return () => {
        this.eventEmitter.off(key, eventEmitterCb);
        this.channel.removeEventListener('message', channelCb);
      };
    });
  }
}
```

#### 环境特定适配器

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

**设计意图**:

- 🔌 **接口统一**: 将不同的底层 API 统一为相同的接口
- 🌍 **跨平台**: 支持 Web、Electron 等不同运行环境
- 📡 **功能增强**: 在适配过程中增加响应式、跨标签页通信等功能

### 4. 策略模式 (Strategy Pattern)

通过依赖注入，可以在运行时选择不同的存储策略：

```typescript
// 开发环境：使用内存存储，便于调试
if (isDevelopment) {
  framework.impl(GlobalState, MemoryGlobalState);
}

// 生产环境：使用持久化存储
if (isProduction) {
  framework.impl(GlobalState, LocalStorageGlobalState);
}

// Electron 环境：使用原生存储
if (isElectron) {
  framework.impl(GlobalState, ElectronGlobalState, [DesktopApiService]);
}
```

## 🎯 设计目的和意义

### 1. 业务与技术分离

```
业务层 (Core Storage)     ←→     技术层 (Infra Storage)
├── GlobalState                  ├── Memento
├── GlobalCache                  ├── AsyncMemento
├── GlobalSessionState           └── ByteKV
└── NbstoreProvider
```

**意义**: 业务开发者只需关心业务概念，不需要了解底层存储技术细节。

### 2. 环境无关性

```typescript
// 同一套业务代码，在不同环境下使用不同实现
class UserPreferencesManager {
  constructor(private globalState: GlobalState) {} // 不关心具体实现

  getTheme() {
    return this.globalState.get('theme') ?? 'light';
  }
}
```

### 3. 测试友好性

```typescript
// 测试时可以轻松 Mock
const mockGlobalState = new MemoryMemento();
const userPrefs = new UserPreferencesManager(mockGlobalState);
```

### 4. 功能渐进增强

```typescript
// 基础功能：简单的键值存储 (Infra)
interface Memento {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}

// 增强功能：响应式 + 跨标签页通信 (Core)
class StorageMemento implements Memento {
  watch<T>(key: string): Observable<T> {
    // 增加响应式能力
    // 增加跨标签页通信能力
  }
}
```

## 🚀 开发指导原则

### 1. 新增存储需求的标准流程

#### Step 1: 在 Providers 层定义接口

```typescript
// providers/my-feature.ts
export interface MyFeatureStorage extends Memento {}
export const MyFeatureStorage = createIdentifier<MyFeatureStorage>('MyFeatureStorage');
```

#### Step 2: 在 Services 层创建服务

```typescript
// services/my-feature.ts
export class MyFeatureService extends Service {
  constructor(private readonly storage: MyFeatureStorage) {
    super();
  }

  saveUserData(data: UserData) {
    this.storage.set('userData', data);
  }
}
```

#### Step 3: 在 Impls 层提供实现

```typescript
// impls/my-feature.ts
export class LocalStorageMyFeature extends StorageMemento implements MyFeatureStorage {
  constructor() {
    super(localStorage, 'my-feature:');
  }
}
```

#### Step 4: 注册到框架

```typescript
// index.ts
export function configureMyFeatureStorage(framework: Framework) {
  framework.service(MyFeatureService, [MyFeatureStorage]);
  framework.impl(MyFeatureStorage, LocalStorageMyFeature);
}
```

### 2. 命名约定

- **Providers**: 使用业务术语，如 `GlobalState`、`UserPreferences`
- **Services**: 以 `Service` 结尾，如 `GlobalStateService`
- **Impls**: 以技术实现命名，如 `LocalStorageGlobalState`、`ElectronGlobalState`

### 3. 依赖关系原则

```
Services 依赖 Providers (接口)
Impls 实现 Providers (接口)
Services 不直接依赖 Impls (实现)
```

### 4. 测试策略

```typescript
// 单元测试：使用内存实现
const testStorage = new MemoryMemento();
const service = new MyFeatureService(testStorage);

// 集成测试：使用真实实现
const realStorage = new LocalStorageMyFeature();
const service = new MyFeatureService(realStorage);
```

## 📚 学习建议

### 对于初学者

1. **先理解接口**: 从 `providers/` 开始，理解业务需要什么样的存储能力
2. **再看实现**: 查看 `impls/` 了解如何将抽象转换为具体实现
3. **最后看服务**: 理解 `services/` 如何封装业务逻辑

### 对于参与开发

1. **遵循三层架构**: 新功能必须按照 Providers-Services-Impls 模式组织
2. **使用依赖注入**: 通过 `createIdentifier` 和 `framework.impl` 管理依赖
3. **考虑多环境**: 为 Web、Electron 等不同环境提供适配实现
4. **编写测试**: 利用依赖注入的优势编写可测试的代码

## 🔍 实际应用案例分析

### 案例1：用户偏好设置系统

让我们通过一个完整的案例来理解这种架构模式：

#### 1. 定义业务接口 (Providers)

```typescript
// providers/user-preferences.ts
import { createIdentifier, type Memento } from '@toeverything/infra';

export interface UserPreferencesStorage extends Memento {
  // 继承基础存储能力，可以添加特定业务方法
  getTheme(): string;
  setTheme(theme: string): void;
}

export const UserPreferencesStorage = createIdentifier<UserPreferencesStorage>('UserPreferencesStorage');
```

#### 2. 创建业务服务 (Services)

```typescript
// services/user-preferences.ts
import { Service } from '@toeverything/infra';
import type { UserPreferencesStorage } from '../providers/user-preferences';

export class UserPreferencesService extends Service {
  constructor(private readonly storage: UserPreferencesStorage) {
    super();
  }

  // 业务方法：获取主题
  getTheme() {
    return this.storage.get('theme') ?? 'light';
  }

  // 业务方法：设置主题并通知变化
  setTheme(theme: 'light' | 'dark') {
    this.storage.set('theme', theme);
    // 可以在这里添加业务逻辑，如验证、日志等
    console.log(`Theme changed to: ${theme}`);
  }

  // 业务方法：监听主题变化
  watchTheme() {
    return this.storage.watch<string>('theme').pipe(
      map(theme => theme ?? 'light'),
      distinctUntilChanged()
    );
  }

  // 业务方法：重置所有偏好
  resetToDefaults() {
    this.storage.clear();
    this.setTheme('light');
  }
}
```

#### 3. 提供具体实现 (Impls)

```typescript
// impls/user-preferences.ts
import { StorageMemento } from './storage';
import type { UserPreferencesStorage } from '../providers/user-preferences';

export class LocalStorageUserPreferences extends StorageMemento implements UserPreferencesStorage {
  constructor() {
    super(localStorage, 'user-preferences:');
  }

  // 实现特定业务方法
  getTheme(): string {
    return this.get('theme') ?? 'light';
  }

  setTheme(theme: string): void {
    this.set('theme', theme);
  }
}

// Electron 环境的实现
export class ElectronUserPreferences implements UserPreferencesStorage {
  constructor(private readonly electronApi: DesktopApiService) {}

  getTheme(): string {
    return this.electronApi.userPreferences.getTheme();
  }

  setTheme(theme: string): void {
    this.electronApi.userPreferences.setTheme(theme);
  }

  // 实现 Memento 接口的其他方法...
  get<T>(key: string): T | undefined {
    return this.electronApi.userPreferences.get(key);
  }

  set<T>(key: string, value: T): void {
    this.electronApi.userPreferences.set(key, value);
  }

  watch<T>(key: string) {
    return new Observable<T | undefined>(subscriber => {
      const unsubscribe = this.electronApi.userPreferences.watch<T>(key, value => subscriber.next(value));
      return () => unsubscribe();
    });
  }

  // ... 其他方法
}
```

#### 4. 注册到框架

```typescript
// index.ts
export function configureUserPreferencesModule(framework: Framework) {
  // 注册服务
  framework.service(UserPreferencesService, [UserPreferencesStorage]);

  // 根据环境注册不同实现
  if (isElectron) {
    framework.impl(UserPreferencesStorage, ElectronUserPreferences, [DesktopApiService]);
  } else {
    framework.impl(UserPreferencesStorage, LocalStorageUserPreferences);
  }
}
```

#### 5. 在组件中使用

```typescript
// components/ThemeSelector.tsx
import { useService } from '@toeverything/infra/framework';
import { UserPreferencesService } from '../services/user-preferences';

export function ThemeSelector() {
  const userPrefs = useService(UserPreferencesService);
  const [theme, setTheme] = useState(userPrefs.getTheme());

  useEffect(() => {
    const subscription = userPrefs.watchTheme().subscribe(setTheme);
    return () => subscription.unsubscribe();
  }, [userPrefs]);

  return (
    <select
      value={theme}
      onChange={(e) => userPrefs.setTheme(e.target.value as 'light' | 'dark')}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

### 案例2：多环境存储适配

#### 环境检测和配置

```typescript
// config/storage-config.ts
import type { Framework } from '@toeverything/infra';

export function configureStorageForEnvironment(framework: Framework) {
  // 检测运行环境
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const isWebWorker = typeof importScripts === 'function';
  const isBrowser = typeof window !== 'undefined' && !isElectron;

  if (isElectron) {
    // Electron 环境：使用原生存储
    configureElectronStorage(framework);
  } else if (isWebWorker) {
    // Web Worker 环境：使用 IndexedDB
    configureWorkerStorage(framework);
  } else if (isBrowser) {
    // 浏览器环境：使用 localStorage + IndexedDB
    configureBrowserStorage(framework);
  }
}

function configureElectronStorage(framework: Framework) {
  framework.impl(GlobalState, ElectronGlobalState, [DesktopApiService]);
  framework.impl(GlobalCache, ElectronGlobalCache, [DesktopApiService]);
  framework.impl(CacheStorage, ElectronCacheStorage, [DesktopApiService]);
}

function configureBrowserStorage(framework: Framework) {
  framework.impl(GlobalState, LocalStorageGlobalState);
  framework.impl(GlobalCache, LocalStorageGlobalCache);
  framework.impl(CacheStorage, IDBGlobalState);
  framework.impl(GlobalSessionState, SessionStorageGlobalSessionState);
}
```

## 🧪 测试策略详解

### 1. 单元测试：服务层测试

```typescript
// __tests__/user-preferences.service.spec.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { MemoryMemento } from '@toeverything/infra/storage';
import { UserPreferencesService } from '../services/user-preferences';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let mockStorage: MemoryMemento;

  beforeEach(() => {
    mockStorage = new MemoryMemento();
    service = new UserPreferencesService(mockStorage);
  });

  test('should return default theme when not set', () => {
    expect(service.getTheme()).toBe('light');
  });

  test('should save and retrieve theme', () => {
    service.setTheme('dark');
    expect(service.getTheme()).toBe('dark');
  });

  test('should notify theme changes', done => {
    service.watchTheme().subscribe(theme => {
      if (theme === 'dark') {
        done();
      }
    });

    service.setTheme('dark');
  });

  test('should reset to defaults', () => {
    service.setTheme('dark');
    service.resetToDefaults();
    expect(service.getTheme()).toBe('light');
  });
});
```

### 2. 集成测试：完整流程测试

```typescript
// __tests__/storage-integration.spec.ts
import { describe, test, expect } from 'vitest';
import { Framework } from '@toeverything/infra';
import { configureUserPreferencesModule } from '../index';

describe('Storage Integration', () => {
  test('should work with real localStorage implementation', () => {
    const framework = new Framework();
    configureUserPreferencesModule(framework);

    const provider = framework.provider();
    const service = provider.get(UserPreferencesService);

    // 测试真实的 localStorage 交互
    service.setTheme('dark');
    expect(localStorage.getItem('user-preferences:theme')).toBe('"dark"');

    // 清理
    localStorage.removeItem('user-preferences:theme');
  });
});
```

### 3. Mock 测试：外部依赖测试

```typescript
// __tests__/electron-storage.spec.ts
import { describe, test, expect, vi } from 'vitest';
import { ElectronUserPreferences } from '../impls/user-preferences';

describe('ElectronUserPreferences', () => {
  test('should delegate to electron API', () => {
    const mockElectronApi = {
      userPreferences: {
        getTheme: vi.fn().mockReturnValue('dark'),
        setTheme: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        watch: vi.fn(),
      },
    };

    const storage = new ElectronUserPreferences(mockElectronApi as any);

    expect(storage.getTheme()).toBe('dark');
    expect(mockElectronApi.userPreferences.getTheme).toHaveBeenCalled();

    storage.setTheme('light');
    expect(mockElectronApi.userPreferences.setTheme).toHaveBeenCalledWith('light');
  });
});
```

## 🎯 最佳实践总结

### 1. 接口设计原则

- **业务导向**: 接口名称使用业务术语，不暴露技术细节
- **职责单一**: 每个接口只负责一个业务领域
- **扩展友好**: 继承基础接口，添加特定业务方法

### 2. 实现类设计原则

- **环境特化**: 为不同环境提供特化实现
- **功能增强**: 在实现中添加响应式、缓存等增强功能
- **错误处理**: 在实现层处理技术相关的错误

### 3. 服务类设计原则

- **业务封装**: 将存储操作封装为有意义的业务方法
- **数据验证**: 在服务层进行业务数据验证
- **事件通知**: 通过响应式流通知业务状态变化

### 4. 测试设计原则

- **分层测试**: 每一层都有对应的测试策略
- **依赖隔离**: 通过依赖注入隔离外部依赖
- **场景覆盖**: 覆盖正常流程、异常流程、边界条件

## 🎉 总结

Core Storage 模块是 AFFiNE 项目架构设计的典型代表，它展示了如何通过**分层架构**、**依赖注入**、**适配器模式**等设计模式，构建一个既灵活又可维护的存储系统。

这种设计的核心价值在于：

- 🎯 **业务导向**: 以业务需求为中心设计接口
- 🔧 **技术无关**: 业务逻辑不依赖具体技术实现
- 🌍 **环境适配**: 同一套代码适配多种运行环境
- 🧪 **测试友好**: 通过依赖注入实现高可测试性
- 🔄 **易于扩展**: 新增功能只需要实现对应接口

掌握这种设计模式，你就能理解 AFFiNE 项目的核心设计哲学，并能够参与到项目的开发中来。

---

_💡 建议：作为初学者，建议先从理解现有的 GlobalState、GlobalCache 等模块开始，然后尝试按照相同的模式实现一个简单的功能模块，这样能更好地理解这种架构设计的精髓。_
