# AFFiNE 存储架构深度分析

## 🎯 概述

AFFiNE 项目采用了一套精心设计的分层存储架构，巧妙地将数据在后端数据库和前端存储技术栈之间进行分配。这种设计既保证了数据的持久性和一致性，又提供了出色的用户体验和离线能力。

其中，NBStore 是 AFFiNE 项目中的核心存储抽象层，提供统一的文档、Blob、感知状态和索引数据的存储和同步功能。基于分层架构设计，支持多种存储后端（IndexedDB、SQLite、Cloud 等）。

## 🏗️ 整体架构设计

### 存储分层策略

AFFiNE 的存储架构可以分为三个主要层次：

```
┌─────────────────────────────────────────────────────────┐
│                    应用业务层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   用户界面   │  │   协作编辑   │  │   AI 功能   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   前端存储层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   NBStore   │  │ Core Storage│  │ Infra Storage│     │
│  │  (文档数据)  │  │  (应用状态)  │  │  (基础设施)  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   后端存储层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ PostgreSQL  │  │    Redis    │  │ 对象存储(S3) │      │
│  │ (结构化数据) │  │   (缓存)    │  │  (文件数据)  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 📊 数据分配策略详解

### 后端数据库存储的数据

基于 Prisma schema 分析，后端 PostgreSQL 数据库主要存储以下类型的数据：

#### 1. 用户管理数据

- **User 表**: 用户基本信息、认证凭据、账户状态
- **ConnectedAccount 表**: OAuth 第三方账户关联
- **UserSession 表**: 用户会话管理
- **VerificationToken 表**: 邮箱验证、密码重置等令牌

#### 2. 工作区和权限数据

- **Workspace 表**: 工作区元数据、功能开关、配额设置
- **WorkspaceUserRole 表**: 工作区成员权限管理
- **WorkspaceDocUserRole 表**: 文档级别权限控制
- **WorkspaceDoc 表**: 文档元数据、公开状态、默认权限

#### 3. 文档版本和协作数据

- **Snapshot 表**: 文档快照存储（二进制格式）
- **Update 表**: 文档增量更新记录
- **SnapshotHistory 表**: 历史版本管理
- **UserSnapshot 表**: 用户个人数据快照

#### 4. 功能和订阅数据

- **Feature 表**: 功能特性配置
- **UserFeature/WorkspaceFeature 表**: 用户和工作区功能权限
- **支付相关表**: Stripe 集成、订阅管理

#### 5. AI 和搜索数据

- **AiSession/AiPrompt 表**: AI 对话会话和提示词
- **AiWorkspaceEmbedding 表**: 文档向量嵌入（用于语义搜索）
- **AiJobs 表**: AI 任务队列和结果

### 前端存储技术栈的数据

前端采用多层存储架构，不同类型的数据使用不同的存储技术：

｜ 🎯 为什么不直接用 React 状态管理？

#### 1. **跨框架需求** - 不仅仅是 React

AFFiNE 项目需要支持多种环境：

```typescript
// 🌐 Web 环境 - React
// 🖥️ Electron 桌面应用 - React + Node.js
// 📱 移动端 - 可能使用其他框架
// 🔧 Worker 线程 - 没有 React
// 🛠️ Node.js 服务端 - 没有 React
```

React 状态管理只能在 React 组件内使用，但存储需求是**全局性**的。

#### 2. **生命周期不同** - 持久化 vs 临时状态

```
// React 状态 - 组件级别，临时性
const [theme, setTheme] = useState('light'); // 页面刷新就丢失

// Storage 状态 - 应用级别，持久性
const themeStorage = new StorageMemento(localStorage, 'theme:');
themeStorage.set('theme', 'dark'); // 页面刷新后依然存在
```

#### 3.跨标签页需求 - React 做不到

```
// React 状态只在当前标签页有效
const [loginStatus, setLoginStatus] = useState(false);

// Storage 状态可以跨标签页同步
userStorage.set('isLoggedIn', true); // 其他标签页立即知道
```

多层状态管理的协同工作
让我用一个完整的例子来说明它们是如何协同工作的：
实际案例：用户主题设置系统

```
// 1️⃣ 底层存储 (StorageMemento) - 持久化
const themeStorage = new StorageMemento(localStorage, 'theme:');

// 2️⃣ 中层状态 (Jotai) - 响应式状态管理
const themeAtom = atom('light');

// 3️⃣ 上层组件 (React) - UI 状态
function ThemeSelector() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 纯 UI 状态

  return (
    <div>
      <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        Current: {theme}
      </button>
      {isDropdownOpen && (
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      )}
    </div>
  );
}
```

数据流向图

```
用户操作 → React State (UI状态) → Jotai Atom (应用状态) → StorageMemento (持久化)
    ↓              ↓                    ↓                      ↓
下拉框开关    主题选择变化        跨组件状态同步         跨标签页同步 + 持久化
```

🎭 各层的职责分工

1. React State - UI 交互状态
   - 🎯 组件级别，生命周期短
   - 🔄 不需要跨组件共享
   - 💨 临时性，页面刷新就重置

```
const [isLoading, setIsLoading] = useState(false);      // 加载状态
const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 下拉框状态
const [formErrors, setFormErrors] = useState({});       // 表单验证错误
```

2. Jotai Atoms - 应用业务状态
   - 🌐 应用级别，跨组件共享
   - 🔄 响应式，自动更新相关组件
   - 🧠 业务逻辑状态，但不一定需要持久化

```
const currentUserAtom = atom<User | null>(null);        // 当前用户
const workspaceListAtom = atom<Workspace[]>([]);        // 工作空间列表
const currentDocumentAtom = atom<Document | null>(null); // 当前文档
```

3. StorageMemento - 持久化状态
   - 💾 持久化，页面刷新后依然存在
   - 🌐 跨标签页同步
   - 🔧 底层存储，不关心 UI 框架

```
const userPrefsStorage = new StorageMemento(localStorage, 'prefs:');
userPrefsStorage.set('theme', 'dark');           // 用户偏好
userPrefsStorage.set('language', 'zh-CN');       // 界面语言
userPrefsStorage.set('autoSave', true);          // 自动保存设置
```

🔗 它们如何协同工作？
完整的数据流示例

```
// 1. 创建存储层
const settingsStorage = new StorageMemento(localStorage, 'settings:');

// 2. 创建 Jotai 原子，连接存储层
const themeAtom = atom(
  // 读取：从存储中获取
  () => settingsStorage.get('theme') || 'light',
  // 写入：同时更新存储和状态
  (get, set, newTheme: string) => {
    settingsStorage.set('theme', newTheme);  // 持久化 + 跨标签页同步
    // Jotai 会自动通知所有使用这个 atom 的组件
  }
);

// 3. 监听存储变化，同步到 Jotai
settingsStorage.watch('theme').subscribe(theme => {
  const store = getCurrentStore();
  store.set(themeAtom, theme); // 其他标签页的变化同步到当前标签页
});

// 4. React 组件使用
function App() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [sidebarOpen, setSidebarOpen] = useState(false); // 纯 UI 状态

  useEffect(() => {
    // 应用主题到 DOM
    document.body.className = `theme-${theme}`;
  }, [theme]);

  return (
    <div>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        Toggle Sidebar
      </button>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

当用户在任意标签页修改主题时：
StorageMemento：
✅ 保存到 localStorage（持久化）
✅ 通过 BroadcastChannel 通知其他标签页
Jotai：
✅ 自动更新所有使用 themeAtom 的组件
✅ 触发相关的派生状态更新
React：
✅ 重新渲染相关组件
✅ 执行 useEffect 应用新主题

#### 1. NBStore 层 - 文档和协作数据

NBStore 采用四层架构，实现关注点分离：

```
Frontend Layer (前端接口层)
    ↓
Storage Layer (存储抽象层)
    ↓
Connection Layer (连接管理层)
    ↓
Implementation Layer (具体实现层)
```

**IndexedDB 存储**:

```typescript
// 文档内容和版本管理
interface DocStorage {
  snapshots: { docId; bin; createdAt; updatedAt };
  updates: { docId; bin; createdAt; editor };
  clocks: { docId; timestamp };
}

// 文件和媒体资源
interface BlobStorage {
  blobs: { key; data; mime; createdAt };
  metadata: { key; size; type };
}

// 协作状态管理
interface AwarenessStorage {
  awareness: { clientId; state; timestamp };
}
```

**适用场景**:

- 📄 文档内容的本地缓存和离线编辑
- 🖼️ 图片、附件等媒体文件的本地存储
- 👥 实时协作状态（光标位置、选择范围等）
- 🔍 全文搜索索引数据

#### 2. Core Storage 层 - 应用状态数据

**localStorage 存储**:

```typescript
// 全局应用状态
interface GlobalState {
  'global-state:theme': 'light' | 'dark';
  'global-state:language': string;
  'global-state:lastWorkspace': string;
  'global-state:userPreferences': UserPrefs;
}

// 应用缓存
interface GlobalCache {
  'global-cache:apiResponses': CachedApiData;
  'global-cache:userProfiles': UserProfileCache;
  'global-cache:workspaceList': WorkspaceCache;
}
```

**sessionStorage 存储**:

```typescript
// 会话级状态
interface SessionState {
  'global-session-state:currentDocument': string;
  'global-session-state:scrollPosition': { x: number; y: number };
  'global-session-state:sidebarState': SidebarState;
}
```

**IndexedDB 异步存储**:

```typescript
// 大量结构化数据
interface AsyncStorage {
  'global-storage': {
    recentDocuments: RecentDoc[];
    workspaceSettings: WorkspaceSettings;
    pluginConfigurations: PluginConfig[];
  };
}
```

#### 3. Infra Storage 层 - 基础设施数据

**内存存储 (MemoryMemento)**:

```typescript
// 临时运行时状态
interface RuntimeState {
  currentUser: User | null;
  connectionStatus: 'online' | 'offline';
  loadingStates: Record<string, boolean>;
  errorMessages: ErrorMessage[];
}
```

## 🔄 数据同步和一致性策略

### 1. 文档数据同步机制

AFFiNE 采用基于 **Yjs CRDT** 的协作同步机制：

```typescript
// 文档同步流程
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  前端编辑器  │───▶│   NBStore   │───▶│  后端数据库  │
│   (Yjs)    │    │ (IndexedDB) │    │(PostgreSQL)│
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       └───────────────────┼───────────────────┘
                          │
                   ┌─────────────┐
                   │ WebSocket   │
                   │ 实时同步     │
                   └─────────────┘
```

**同步策略**:

- **本地优先**: 所有编辑操作首先保存到本地 IndexedDB
- **增量同步**: 只同步文档的变更部分（Yjs Updates）
- **冲突解决**: 使用 CRDT 算法自动解决编辑冲突
- **离线支持**: 离线时继续编辑，联网后自动同步

### 2. 应用状态同步

**跨标签页同步**:

```typescript
// 使用 BroadcastChannel 实现跨标签页状态同步
class StorageMemento {
  private channel = new BroadcastChannel(this.prefix);

  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
    this.channel.postMessage({ key, value }); // 通知其他标签页
  }

  watch(key: string) {
    return new Observable(subscriber => {
      // 监听跨标签页消息
      this.channel.addEventListener('message', event => {
        if (event.data.key === key) {
          subscriber.next(event.data.value);
        }
      });
    });
  }
}
```

### 3. 缓存策略

**多级缓存架构**:

```typescript
// 缓存优先级：内存 > localStorage > IndexedDB > 网络
class CacheManager {
  async get(key: string) {
    // 1. 检查内存缓存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. 检查 localStorage
    const localValue = localStorage.getItem(key);
    if (localValue) {
      this.memoryCache.set(key, JSON.parse(localValue));
      return JSON.parse(localValue);
    }

    // 3. 检查 IndexedDB
    const idbValue = await this.idbStorage.get(key);
    if (idbValue) {
      localStorage.setItem(key, JSON.stringify(idbValue));
      return idbValue;
    }

    // 4. 从网络获取
    const networkValue = await this.fetchFromNetwork(key);
    this.setAllLevels(key, networkValue);
    return networkValue;
  }
}
```

## 🌍 多环境适配策略

### 1. Web 浏览器环境

**存储技术栈**:

- **IndexedDB**: 大容量文档和文件存储
- **localStorage**: 用户偏好和应用状态
- **sessionStorage**: 会话级临时数据
- **BroadcastChannel**: 跨标签页通信

**特点**:

- ✅ 支持离线编辑和同步
- ✅ 跨标签页状态同步
- ❌ 存储容量受浏览器限制
- ❌ 无法访问文件系统

### 2. Electron 桌面环境

**存储技术栈**:

```typescript
// Electron 特定实现
class ElectronGlobalState implements GlobalState {
  constructor(private electronApi: DesktopApiService) {}

  get(key: string) {
    // 使用 Electron 的原生存储 API
    return this.electronApi.sharedStorage.globalState.get(key);
  }

  set(key: string, value: any) {
    // 直接写入文件系统
    this.electronApi.sharedStorage.globalState.set(key, value);
  }
}
```

**特点**:

- ✅ 无存储容量限制
- ✅ 可访问本地文件系统
- ✅ 更好的性能和稳定性
- ✅ 支持原生文件操作

### 3. 移动端环境（规划中）

**存储技术栈**:

- **SQLite**: 本地数据库存储
- **文件系统**: 媒体文件存储
- **原生存储 API**: 应用偏好设置

## 🎨 设计模式分析

### 1. 分层架构模式

**四层架构设计**:

```typescript
// Frontend Layer - 业务接口适配
class DocFrontend {
  connectDoc(doc: YDoc): void;
  disconnectDoc(doc: YDoc): void;
  setPriority(docId: string, priority: number): void;
}

// Storage Layer - 存储抽象统一
interface DocStorage {
  getDoc(docId: string): Promise<DocRecord | null>;
  pushDocUpdate(update: DocUpdate): Promise<DocClock>;
  subscribeDocUpdate(callback: Function): () => void;
}

// Connection Layer - 连接生命周期管理
class AutoReconnectConnection {
  status: 'connecting' | 'connected' | 'error' | 'closed';
  connect(): void;
  disconnect(): void;
  waitForConnected(): Promise<void>;
}

// Implementation Layer - 具体存储实现
class IndexedDBDocStorage implements DocStorage {
  // IndexedDB 具体实现
}
```

#### NBStore 核心组件详解

##### Storage 接口

所有存储的基础接口，定义存储类型和连接：

```typescript
interface Storage {
  readonly storageType: StorageType;
  readonly connection: Connection;
}

type StorageType = 'blob' | 'blobSync' | 'doc' | 'docSync' | 'awareness' | 'indexer' | 'indexerSync';
```

##### Connection 连接管理

**设计模式**: 状态机模式 + 自动重连策略

**核心特性**:

- 状态管理：idle → connecting → connected → error → closed
- 引用计数机制：支持多个组件共享连接
- 自动重连：网络异常时自动恢复
- 超时控制：连接超时保护（默认15秒）

```typescript
interface Connection<T = any> {
  readonly status: ConnectionStatus;
  readonly error?: Error;
  readonly inner: T;
  connect(): void;
  disconnect(): void;
  waitForConnected(signal?: AbortSignal): Promise<void>;
  onStatusChanged(cb: (status: ConnectionStatus, error?: Error) => void): () => void;
}
```

##### SpaceStorage 存储工厂

**设计模式**: 工厂模式 + 组合模式

统一管理不同类型的存储实例，提供默认实现（Dummy Storage）。

```typescript
class SpaceStorage {
  get<T extends StorageType>(type: T): Extract<Storages, { storageType: T }>;
  connect(): void;
  disconnect(): void;
  waitForConnected(signal?: AbortSignal): Promise<void>;
  destroy(): Promise<void>;
}
```

### 2. 策略模式

**可插拔的存储后端**:

```typescript
// 开发环境：使用内存存储
const devStorage = new SpaceStorage({
  doc: new MemoryDocStorage(),
  blob: new MemoryBlobStorage(),
});

// 生产环境：使用持久化存储
const prodStorage = new SpaceStorage({
  doc: new IndexedDBDocStorage(config),
  blob: new IndexedDBBlobStorage(config),
});

// 桌面环境：使用 SQLite
const desktopStorage = new SpaceStorage({
  doc: new SqliteDocStorage(config),
  blob: new SqliteBlobStorage(config),
});
```

### 3. 观察者模式

**响应式状态管理**:

```typescript
// 监听文档变化
docStorage.subscribeDocUpdate((update: DocRecord) => {
  console.log('文档更新:', update);
  // 自动更新 UI
  updateDocumentView(update);
});

// 监听应用状态变化
globalState.watch('theme').subscribe(theme => {
  document.body.className = `theme-${theme}`;
});

// 监听连接状态
storage.connection.onStatusChange((status, error) => {
  if (status === 'connected') {
    showOnlineIndicator();
  } else if (status === 'error') {
    showOfflineIndicator(error);
  }
});
```

### 4. 适配器模式

**统一不同存储 API**:

```typescript
// Web Storage API 适配为 Memento 接口
class StorageMemento implements Memento {
  constructor(
    private storage: Storage,
    private prefix: string
  ) {}

  get<T>(key: string): T | undefined {
    const json = this.storage.getItem(this.prefix + key);
    return json ? JSON.parse(json) : undefined;
  }

  set<T>(key: string, value: T): void {
    this.storage.setItem(this.prefix + key, JSON.stringify(value));
    // 增加响应式能力
    this.eventEmitter.emit(key, value);
    this.channel.postMessage({ key, value });
  }
}

// Electron API 适配为相同接口
class ElectronStorageMemento implements Memento {
  constructor(private electronApi: DesktopApiService) {}

  get<T>(key: string): T | undefined {
    return this.electronApi.storage.get(key);
  }

  set<T>(key: string, value: T): void {
    this.electronApi.storage.set(key, value);
  }
}
```

## 🚀 性能优化策略

### 1. 懒加载和按需加载

```typescript
// 懒加载存储实例
class LazySpaceStorage {
  private _storage: SpaceStorage | null = null;

  private async getStorage(): Promise<SpaceStorage> {
    if (!this._storage) {
      this._storage = new SpaceStorage(this.config);
      await this._storage.connect();
    }
    return this._storage;
  }
}

// 按需加载文档
class DocumentManager {
  private documentCache = new Map<string, YDoc>();

  async getDocument(docId: string): Promise<YDoc> {
    if (!this.documentCache.has(docId)) {
      const doc = new YDoc({ guid: docId });
      await this.loadDocumentContent(doc);
      this.documentCache.set(docId, doc);
    }
    return this.documentCache.get(docId)!;
  }
}
```

### 2. 批量操作优化

```typescript
// 批量文档更新
class BatchDocStorage {
  private pendingUpdates: DocUpdate[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  pushDocUpdate(update: DocUpdate) {
    this.pendingUpdates.push(update);

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // 100ms 内的更新会被批量处理
    this.batchTimer = setTimeout(() => {
      this.flushUpdates();
    }, 100);
  }

  private async flushUpdates() {
    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];

    // 合并同一文档的多个更新
    const mergedUpdates = this.mergeUpdates(updates);

    // 批量提交到 IndexedDB
    await this.batchCommit(mergedUpdates);
  }
}
```

### 3. 内存管理

```typescript
// 自动清理过期数据
class ExpiringMemento {
  private storage = new MemoryMemento();
  private cleanupInterval: number;

  constructor(cleanupIntervalMs = 60000) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  private cleanup() {
    const keys = this.storage.keys();
    const now = Date.now();

    keys.forEach(key => {
      const entry = this.storage.get(key);
      if (entry && entry.expires && entry.expires < now) {
        this.storage.del(key);
      }
    });
  }
}
```

## 🔒 数据安全和隐私

### 1. 客户端加密

```typescript
// 敏感数据本地加密存储
class EncryptedStorage {
  constructor(
    private baseStorage: Memento,
    private encryptionKey: string
  ) {}

  set<T>(key: string, value: T): void {
    const encrypted = this.encrypt(JSON.stringify(value));
    this.baseStorage.set(key, encrypted);
  }

  get<T>(key: string): T | undefined {
    const encrypted = this.baseStorage.get(key);
    if (!encrypted) return undefined;

    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return undefined;
    }
  }
}
```

### 2. 数据隔离

```typescript
// 多租户数据隔离
class TenantIsolatedStorage {
  constructor(
    private baseStorage: Storage,
    private tenantId: string
  ) {}

  private getKey(key: string): string {
    return `tenant:${this.tenantId}:${key}`;
  }

  get(key: string) {
    return this.baseStorage.get(this.getKey(key));
  }

  set(key: string, value: any) {
    this.baseStorage.set(this.getKey(key), value);
  }
}
```

## 📈 监控和调试

### 1. 存储使用情况监控

```typescript
class StorageMonitor {
  private metrics = {
    docReads: 0,
    docWrites: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };

  wrapStorage<T extends Storage>(storage: T): T {
    return new Proxy(storage, {
      get: (target, prop) => {
        const original = target[prop as keyof T];

        if (typeof original === 'function') {
          return (...args: any[]) => {
            this.recordMethodCall(storage.storageType, prop as string);

            try {
              const result = original.apply(target, args);

              if (result instanceof Promise) {
                return result.catch(error => {
                  this.metrics.errors++;
                  throw error;
                });
              }

              return result;
            } catch (error) {
              this.metrics.errors++;
              throw error;
            }
          };
        }

        return original;
      },
    });
  }
}
```

## 🎯 总结

AFFiNE 的存储架构设计体现了以下核心理念：

### 设计优势

1. **分层解耦**: 清晰的分层架构使得各层职责明确，易于维护和扩展
2. **多端适配**: 统一的接口设计支持 Web、Desktop、Mobile 等多种环境
3. **离线优先**: 本地存储优先的策略提供了优秀的离线体验
4. **性能优化**: 多级缓存、批量操作、懒加载等策略保证了高性能
5. **数据安全**: 客户端加密、数据隔离等机制保护用户隐私

### 技术特色

- **CRDT 协作**: 基于 Yjs 的无冲突协作编辑
- **响应式存储**: Observable 模式实现实时状态同步
- **可插拔架构**: 策略模式支持不同存储后端
- **渐进增强**: 从基础功能到高级特性的渐进式设计

### 适用场景

这种存储架构特别适合：

- 📝 协作编辑应用
- 🌐 需要离线支持的 Web 应用
- 🔄 多端同步的生产力工具
- 📱 跨平台的桌面和移动应用

通过这种精心设计的存储架构，AFFiNE 成功地平衡了性能、可用性、可维护性和用户体验，为现代协作应用提供了优秀的技术范例。

---

# NBStore 初学者完全指南

## 🎯 什么是 NBStore？

想象一下，你正在开发一个像 AFFiNE 这样的协同编辑应用。你需要：

- 📄 存储文档内容
- 🖼️ 管理图片、文件等资源
- 👥 处理多人协作状态
- 🔍 提供搜索功能

NBStore 就是为了解决这些问题而设计的**统一存储抽象层**。它就像是一个"万能数据管家"，帮你管理应用中的各种数据，无论这些数据存储在浏览器本地、桌面应用的数据库，还是云端服务器。

## 🏗️ 核心设计理念

### 分层架构 - 像搭积木一样组织代码

NBStore 采用了四层架构，就像盖房子一样，每一层都有自己的职责：

```
🏠 Frontend Layer (前端接口层)
   ↓ "我要存储一个文档"
🔧 Storage Layer (存储抽象层)
   ↓ "定义怎么存储"
🔌 Connection Layer (连接管理层)
   ↓ "管理连接状态"
🛠️ Implementation Layer (具体实现层)
   ↓ "真正执行存储操作"
```

### 为什么要这样设计？

**问题**: 如果没有分层，你的代码可能是这样的：

```typescript
// ❌ 糟糕的设计：业务逻辑和技术细节混在一起
function saveDocument(doc) {
  if (isElectron) {
    // 使用 SQLite 存储
    sqlite.run('INSERT INTO docs...', doc);
  } else if (isBrowser) {
    // 使用 IndexedDB 存储
    indexedDB.transaction('docs').add(doc);
  } else if (isServer) {
    // 使用云端 API
    fetch('/api/docs', { method: 'POST', body: doc });
  }
}
```

**解决方案**: NBStore 的分层设计：

```typescript
// ✅ 优雅的设计：业务逻辑只关心"做什么"，不关心"怎么做"
function saveDocument(doc) {
  // 不管底层用什么技术，接口都是一样的
  await docStorage.pushDocUpdate({
    docId: doc.id,
    bin: doc.content,
  });
}
```

## 📦 核心组件详解

### 1. Storage 层 - 定义"能做什么"

Storage 层定义了各种存储能力的接口，就像是"菜单"，告诉你有哪些功能可以使用：

#### DocStorage - 文档存储

```typescript
interface DocStorage {
  // 获取文档
  getDoc(docId: string): Promise<DocRecord | null>;

  // 保存文档更新
  pushDocUpdate(update: DocUpdate): Promise<DocClock>;

  // 订阅文档变化
  subscribeDocUpdate(callback: (update: DocRecord) => void): () => void;
}
```

**生活化理解**: DocStorage 就像是一个"文档保险箱"，你可以：

- 📖 取出文档来阅读
- ✏️ 保存文档的修改
- 👂 监听文档是否有人修改了

#### BlobStorage - 文件存储

```typescript
interface BlobStorage {
  // 获取文件
  get(key: string): Promise<BlobRecord | null>;

  // 保存文件
  set(blob: BlobRecord): Promise<void>;

  // 删除文件
  delete(key: string, permanently: boolean): Promise<void>;

  // 列出所有文件
  list(): Promise<ListedBlobRecord[]>;
}
```

**生活化理解**: BlobStorage 就像是一个"文件柜"，你可以：

- 📁 存放各种文件（图片、视频、附件等）
- 🔍 根据文件名找到文件
- 🗑️ 删除不需要的文件
- 📋 查看所有文件的清单

#### AwarenessStorage - 协作状态存储

```typescript
interface AwarenessStorage {
  // 更新用户状态（比如光标位置）
  update(record: AwarenessRecord): Promise<void>;

  // 订阅其他用户的状态变化
  subscribeUpdate(id: string, onUpdate: (update: AwarenessRecord) => void): () => void;
}
```

**生活化理解**: AwarenessStorage 就像是一个"状态广播站"，让所有协作者知道：

- 👆 谁在编辑哪个位置
- 🎨 谁选中了什么内容
- 👀 谁正在查看文档

### 2. Connection 层 - 管理"连接状态"

Connection 层负责管理与存储系统的连接，就像是"网络管家"：

```typescript
class AutoReconnectConnection {
  // 连接状态：'connecting' | 'connected' | 'error' | 'closed'
  status: ConnectionStatus;

  // 连接到存储系统
  connect(): void;

  // 断开连接
  disconnect(): void;

  // 等待连接成功
  waitForConnected(signal?: AbortSignal): Promise<void>;

  // 监听状态变化
  onStatusChange(callback: (status: ConnectionStatus, error?: Error) => void): void;
}
```

**智能重连机制**:

```typescript
// 连接断开时自动重试
connection.onStatusChange((status, error) => {
  if (status === 'error') {
    console.log('连接出错，正在重试...', error);
  } else if (status === 'connected') {
    console.log('连接成功！');
  }
});
```

### 3. Frontend 层 - 提供"易用接口"

Frontend 层是你实际使用的接口，它把复杂的存储操作包装成简单易用的方法：

#### DocFrontend - 文档前端接口

```typescript
class DocFrontend {
  // 连接一个 Yjs 文档，开始同步
  connectDoc(doc: YDoc): void;

  // 断开文档连接
  disconnectDoc(doc: YDoc): void;

  // 设置文档优先级（影响同步顺序）
  setPriority(docId: string, priority: number): void;

  // 获取文档状态
  isDocReady(docId: string): boolean;
}
```

**使用示例**:

```typescript
// 创建一个文档
const doc = new YDoc({ guid: 'my-document' });
const text = doc.getText('content');

// 连接到存储系统
const docFrontend = new DocFrontend(docStorage, docSync);
docFrontend.start();
docFrontend.connectDoc(doc);

// 现在你可以正常编辑，所有变化都会自动保存和同步
text.insert(0, 'Hello, World!');
```

#### BlobFrontend - 文件前端接口

```typescript
class BlobFrontend {
  // 获取文件（自动从远程下载）
  async get(blobId: string): Promise<BlobRecord | null>;

  // 保存文件（自动上传到远程）
  async set(blob: BlobRecord): Promise<void>;

  // 手动上传文件
  async upload(blobId: string): Promise<boolean>;
}
```

**使用示例**:

```typescript
// 保存一张图片
const imageBlob = {
  key: 'avatar-123.png',
  data: new Uint8Array([...]), // 图片数据
  mime: 'image/png'
};

await blobFrontend.set(imageBlob);
// 文件会自动保存到本地，并在后台上传到云端

// 获取图片
const savedImage = await blobFrontend.get('avatar-123.png');
// 如果本地没有，会自动从云端下载
```

### 4. Sync 层 - 处理"数据同步"

Sync 层负责在不同存储之间同步数据，比如本地和云端之间的同步：

```typescript
class DocSyncImpl {
  // 同步状态
  state$: Observable<DocSyncState>;

  // 手动触发同步
  sync(docId: string): Promise<void>;

  // 设置同步优先级
  setPriority(docId: string, priority: number): void;
}
```

## 🔧 具体实现层

NBStore 支持多种存储后端，就像是"多种品牌的硬盘"，接口一样但底层技术不同：

### IndexedDB 实现 - 浏览器本地存储

```typescript
// 适用于：Web 应用的本地存储
const docStorage = new IndexedDBDocStorage({
  id: 'my-workspace',
  flavour: 'workspace',
  type: 'workspace',
});
```

### SQLite 实现 - 桌面应用存储

```typescript
// 适用于：Electron 桌面应用
const docStorage = new SqliteDocStorage({
  path: '/path/to/database.db',
});
```

### Cloud 实现 - 云端存储

```typescript
// 适用于：云端同步
const docStorage = new CloudDocStorage({
  serverBaseUrl: 'https://api.affine.pro',
  workspaceId: 'workspace-123',
});
```

## 🚀 实际使用案例

### 案例1：创建一个简单的文档编辑器

```typescript
import { SpaceStorage } from '@affine/nbstore';
import { IndexedDBDocStorage } from '@affine/nbstore/idb';
import { DocFrontend } from '@affine/nbstore/frontend';
import { DocSyncImpl } from '@affine/nbstore/sync';
import { Doc as YDoc } from 'yjs';

// 1. 创建存储系统
const storage = new SpaceStorage({
  doc: new IndexedDBDocStorage({
    id: 'my-app',
    flavour: 'workspace',
    type: 'workspace',
  }),
});

// 2. 连接存储
await storage.connect();
await storage.waitForConnected();

// 3. 创建前端接口
const docFrontend = new DocFrontend(
  storage.get('doc'),
  DocSyncImpl.dummy // 暂时不需要同步
);

// 4. 启动文档管理器
docFrontend.start();

// 5. 创建并连接文档
const doc = new YDoc({ guid: 'my-first-doc' });
const text = doc.getText('content');

docFrontend.connectDoc(doc);

// 6. 现在可以正常编辑了！
text.insert(0, 'Hello, NBStore!');

// 7. 监听文档状态
docFrontend.docState$('my-first-doc').subscribe(state => {
  if (state.ready) {
    console.log('文档已准备好！');
  }
});
```

### 案例2：添加文件上传功能

```typescript
import { BlobFrontend } from '@affine/nbstore/frontend';
import { IndexedDBBlobStorage } from '@affine/nbstore/idb';

// 1. 创建文件存储
const blobStorage = new IndexedDBBlobStorage({
  id: 'my-app',
  flavour: 'workspace',
  type: 'workspace',
});

// 2. 创建文件前端接口
const blobFrontend = new BlobFrontend(
  blobStorage,
  BlobSyncImpl.dummy // 暂时不需要同步
);

// 3. 处理文件上传
async function handleFileUpload(file: File) {
  // 读取文件数据
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // 创建 blob 记录
  const blobRecord = {
    key: `file-${Date.now()}-${file.name}`,
    data: data,
    mime: file.type,
    createdAt: new Date(),
  };

  // 保存文件
  await blobFrontend.set(blobRecord);

  console.log('文件上传成功！', blobRecord.key);
  return blobRecord.key;
}

// 4. 获取文件
async function getFile(fileKey: string) {
  const blob = await blobFrontend.get(fileKey);
  if (blob) {
    // 创建下载链接
    const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mime }));
    return url;
  }
  return null;
}
```

### 案例3：多人协作状态管理

```typescript
import { AwarenessFrontend } from '@affine/nbstore/frontend';
import { BroadcastChannelAwarenessStorage } from '@affine/nbstore/idb';
import { Awareness } from 'y-protocols/awareness';

// 1. 创建协作状态存储（使用 BroadcastChannel 实现跨标签页）
const awarenessStorage = new BroadcastChannelAwarenessStorage({
  id: 'my-app',
});

// 2. 创建协作前端接口
const awarenessFrontend = new AwarenessFrontend(
  new AwarenessSyncImpl({
    local: awarenessStorage,
    remotes: {}, // 暂时没有远程协作者
  })
);

// 3. 创建协作状态管理器
const doc = new YDoc({ guid: 'shared-doc' });
const awareness = new Awareness(doc);

// 4. 连接协作状态
awarenessFrontend.connectAwareness(awareness);

// 5. 设置用户信息
awareness.setLocalStateField('user', {
  name: '张三',
  color: '#ff0000',
  cursor: null,
});

// 6. 监听其他用户状态
awareness.on('change', changes => {
  console.log('协作状态变化:', changes);

  // 显示其他用户的光标
  awareness.getStates().forEach((state, clientId) => {
    if (clientId !== awareness.clientID) {
      console.log(`用户 ${state.user?.name} 在位置 ${state.cursor}`);
    }
  });
});
```

## ⚠️ 常见陷阱和注意事项

### 1. 连接管理

```typescript
// ❌ 错误：忘记等待连接
const doc = await storage.get('doc').getDoc('my-doc'); // 可能失败

// ✅ 正确：先等待连接
await storage.waitForConnected();
const doc = await storage.get('doc').getDoc('my-doc');
```

### 2. 资源清理

```typescript
// ❌ 错误：忘记清理资源
docFrontend.connectDoc(doc);
// 页面关闭时没有清理

// ✅ 正确：及时清理资源
const cleanup = docFrontend.connectDoc(doc);

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
  cleanup();
  docFrontend.stop();
  storage.disconnect();
});
```

### 3. 错误处理

```typescript
// ❌ 错误：没有处理异步错误
blobFrontend.set(largeFile); // 可能因为存储空间不足而失败

// ✅ 正确：妥善处理错误
try {
  await blobFrontend.set(largeFile);
  showSuccessMessage('文件上传成功');
} catch (error) {
  if (error.message.includes('quota')) {
    showErrorMessage('存储空间不足，请清理文件');
  } else {
    showErrorMessage('上传失败，请重试');
  }
}
```

## 🎯 学习建议

### 对于初学者

1. **从简单开始**: 先学会使用 `SpaceStorage` 和基本的 `DocStorage`
2. **理解分层**: 明白每一层的职责，不要跨层调用
3. **多看示例**: 参考 AFFiNE 项目中的实际使用案例
4. **动手实践**: 创建一个简单的文档编辑器来练习

### 对于开发者

1. **遵循接口**: 新增功能时要先定义接口，再实现具体逻辑
2. **考虑多端**: 设计时要考虑 Web、Desktop、Mobile 等不同环境
3. **处理异常**: 网络断开、存储满了等异常情况要妥善处理
4. **性能优化**: 大文件、大量数据的场景要考虑性能优化

## 📚 NBStore 总结

NBStore 是一个设计精良的存储抽象层，它的核心价值在于：

- 🎯 **统一接口**: 无论底层用什么技术，上层接口都一样
- 🔧 **分层设计**: 每一层职责清晰，易于维护和扩展
- 🌍 **跨平台**: 同一套代码可以在不同环境下运行
- 🚀 **高性能**: 智能的连接管理和数据同步机制
- 🛡️ **可靠性**: 自动重连、错误恢复等机制保证稳定性
- 🧪 **可测试**: 分层设计使得每个组件都易于测试
- 📈 **可扩展**: 插件化架构支持自定义存储实现

### NBStore 目录结构

```
packages/common/nbstore/
├── src/
│   ├── connection/          # 连接管理层
│   ├── storage/            # 存储抽象层
│   ├── frontend/           # 前端接口层
│   ├── sync/               # 同步协调层
│   ├── impls/              # 具体实现层
│   ├── worker/             # Worker 支持
│   └── utils/              # 工具函数
├── README.md               # 使用文档
└── package.json
```

### 关键设计模式

1. **分层架构模式**

   - **Frontend**: 业务接口适配
   - **Storage**: 存储抽象统一
   - **Connection**: 连接生命周期管理
   - **Implementation**: 具体存储实现

2. **观察者模式**

   - RxJS Observable 流式状态管理
   - EventEmitter2 事件通知
   - 状态变更实时推送

3. **策略模式**

   - 可插拔的 `mergeUpdates` 合并策略
   - 多种存储后端可选择
   - 自定义同步策略

4. **适配器模式**

   - Frontend 层适配不同存储实现
   - Worker Client 适配跨线程通信

5. **工厂模式**

   - SpaceStorage 统一创建存储实例
   - 默认 Dummy 实现提供

6. **状态机模式**
   - Connection 状态管理
   - 自动重连逻辑

掌握 NBStore，你就掌握了构建现代协同应用的核心技能！

---

_💡 学习建议：建议从简单的文档存储开始，逐步学习文件存储和协作功能。多看 AFFiNE 项目中的实际使用案例，动手实践是最好的学习方式。_
