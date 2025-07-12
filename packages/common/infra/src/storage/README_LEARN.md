# @toeverything/infra Storage 模块初学者指南

## 🎯 什么是 Storage 模块？

想象一下，你在开发一个网页应用，需要保存用户的设置、缓存数据或者临时状态。Storage 模块就像是一个"万能储物柜"，它提供了统一的方式来存储和管理这些数据，无论你想把数据放在内存里、浏览器的本地存储中，还是数据库里。

## 🏗️ 核心概念

### 1. 什么是 Memento？

`Memento` 就像是一个智能的储物盒，它不仅能存东西，还能告诉你什么时候东西发生了变化。

```typescript
// 这就是 Memento 接口的定义
interface Memento {
  get<T>(key: string): T | undefined; // 取出东西
  set<T>(key: string, value: T): void; // 放入东西
  del(key: string): void; // 删除东西
  clear(): void; // 清空所有
  keys(): string[]; // 查看所有钥匙
  watch<T>(key: string): Observable<T>; // 监听变化
}
```

### 2. 为什么需要响应式存储？

传统的存储方式就像是一个普通的盒子，你放东西进去，取东西出来，但你不知道什么时候有人动了你的东西。

而 Storage 模块的 `watch` 功能就像给盒子装了一个监控器，一旦有变化就会通知你：

```typescript
const storage = new MemoryMemento();

// 监听用户信息的变化
storage.watch<User>('currentUser').subscribe(user => {
  console.log('用户信息更新了:', user);
  // 自动更新界面
  updateUI(user);
});

// 在别的地方更新用户信息
storage.set('currentUser', { name: '张三', age: 25 });
// 上面的监听器会自动收到通知！
```

## 📚 三种存储类型详解

### 1. Memento - 同步存储

**适用场景**: 内存中的临时数据，需要立即读写的场景

```typescript
import { MemoryMemento } from '@toeverything/infra/storage';

// 创建一个内存存储
const memento = new MemoryMemento();

// 存储用户设置
memento.set('theme', 'dark');
memento.set('language', 'zh-CN');

// 立即获取数据
const theme = memento.get('theme'); // 'dark'

// 监听主题变化，实时更新界面
memento.watch('theme').subscribe(newTheme => {
  document.body.className = `theme-${newTheme}`;
});
```

**特点**:

- ✅ 读写速度极快
- ✅ 支持实时监听
- ❌ 页面刷新后数据丢失
- ❌ 不能跨标签页共享

### 2. AsyncMemento - 异步存储

**适用场景**: 需要持久化的数据，如用户配置、应用状态

```typescript
import { AsyncMemento } from '@toeverything/infra/storage';

// 这是一个接口，需要具体实现
interface AsyncMemento {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  watch<T>(key: string): Observable<T | undefined>;
  // ... 其他方法都是异步的
}

// 实际使用中的例子（基于 IndexedDB）
const asyncStorage = new IDBGlobalState(); // AFFiNE 中的实现

// 异步保存数据
await asyncStorage.set('userPreferences', {
  autoSave: true,
  fontSize: 14,
  showLineNumbers: true,
});

// 异步读取数据
const preferences = await asyncStorage.get('userPreferences');

// 监听变化（这个是同步的）
asyncStorage.watch('userPreferences').subscribe(prefs => {
  console.log('用户偏好更新:', prefs);
});
```

**特点**:

- ✅ 数据持久化保存
- ✅ 支持大量数据
- ✅ 可以跨标签页共享
- ❌ 读写需要等待
- ❌ 代码稍微复杂一些

### 3. ByteKV - 二进制存储

**适用场景**: 存储文件、图片、音频等二进制数据

```typescript
import { MemoryByteKV } from '@toeverything/infra/storage';

const byteStorage = new MemoryByteKV();

// 存储一个小图片
const imageData = new Uint8Array([137, 80, 78, 71, ...]); // PNG 文件数据
await byteStorage.set('avatar.png', imageData);

// 读取图片
const savedImage = await byteStorage.get('avatar.png');

// 使用事务确保数据一致性
await byteStorage.transaction(async (tx) => {
  // 在事务中进行多个操作
  const oldData = await tx.get('backup');
  await tx.set('current', oldData);
  await tx.del('backup');
  // 要么全部成功，要么全部失败
});
```

**特点**:

- ✅ 专门处理二进制数据
- ✅ 支持事务操作
- ✅ 内存使用效率高
- ❌ 只能存储 Uint8Array 类型

## 🛠️ 实用工具

### 命名空间包装器

想象你有一个大仓库，但你想给不同的用户分配不同的区域，`wrapMemento` 就是用来做这件事的：

```typescript
import { wrapMemento, MemoryMemento } from '@toeverything/infra/storage';

const mainStorage = new MemoryMemento();

// 为用户 A 创建专属存储空间
const userAStorage = wrapMemento(mainStorage, 'user-a:');
// 为用户 B 创建专属存储空间
const userBStorage = wrapMemento(mainStorage, 'user-b:');

// 用户 A 存储数据
userAStorage.set('theme', 'dark');
// 实际存储的键是 'user-a:theme'

// 用户 B 存储数据
userBStorage.set('theme', 'light');
// 实际存储的键是 'user-b:theme'

// 两个用户的数据完全隔离
console.log(userAStorage.get('theme')); // 'dark'
console.log(userBStorage.get('theme')); // 'light'
```

## 🌟 在 AFFiNE 中的实际应用

### 1. 全局状态管理

```typescript
// 应用级别的状态，页面刷新后仍然保留
const globalState = new LocalStorageGlobalState();

// 保存用户的工作区选择
globalState.set('lastWorkspace', 'workspace-123');

// 应用启动时恢复状态
const lastWorkspace = globalState.get('lastWorkspace');
if (lastWorkspace) {
  navigateToWorkspace(lastWorkspace);
}
```

### 2. 缓存管理

```typescript
// 临时缓存，可以随时清理
const cache = new LocalStorageGlobalCache();

// 缓存 API 响应
cache.set('user-profile-123', {
  name: '张三',
  avatar: 'https://...',
  lastFetched: Date.now(),
});

// 检查缓存是否过期
const cachedProfile = cache.get('user-profile-123');
if (cachedProfile && Date.now() - cachedProfile.lastFetched < 300000) {
  // 5分钟内的缓存，直接使用
  return cachedProfile;
} else {
  // 缓存过期，重新获取
  const freshProfile = await fetchUserProfile(123);
  cache.set('user-profile-123', {
    ...freshProfile,
    lastFetched: Date.now(),
  });
  return freshProfile;
}
```

### 3. 会话状态

```typescript
// 只在当前标签页有效的状态
const sessionState = new SessionStorageGlobalSessionState();

// 保存当前编辑的文档
sessionState.set('currentDocument', 'doc-456');

// 保存滚动位置
sessionState.set('scrollPosition', { x: 0, y: 1200 });

// 页面刷新后恢复状态
window.addEventListener('load', () => {
  const currentDoc = sessionState.get('currentDocument');
  const scrollPos = sessionState.get('scrollPosition');

  if (currentDoc) {
    openDocument(currentDoc);
  }
  if (scrollPos) {
    window.scrollTo(scrollPos.x, scrollPos.y);
  }
});
```

## 🎨 最佳实践

### 1. 选择合适的存储类型

```typescript
// ✅ 正确：临时 UI 状态用内存存储
const uiState = new MemoryMemento();
uiState.set('sidebarOpen', true);

// ✅ 正确：用户设置用持久化存储
const userSettings = new LocalStorageGlobalState();
userSettings.set('theme', 'dark');

// ❌ 错误：大文件用普通存储
// memento.set('largeFile', hugeFileData); // 会占用太多内存

// ✅ 正确：大文件用二进制存储
const fileStorage = new MemoryByteKV();
await fileStorage.set('document.pdf', pdfBytes);
```

### 2. 错误处理

```typescript
// 异步存储要处理错误
try {
  await asyncStorage.set('important-data', data);
  console.log('数据保存成功');
} catch (error) {
  console.error('保存失败:', error);
  // 显示错误提示给用户
  showErrorMessage('数据保存失败，请重试');
}
```

### 3. 内存管理

```typescript
// 记得取消订阅，避免内存泄漏
const subscription = storage.watch('data').subscribe(data => {
  updateUI(data);
});

// 组件销毁时取消订阅
onDestroy(() => {
  subscription.unsubscribe();
});
```

### 4. 数据验证

```typescript
// 从存储中读取数据时要验证
const userData = storage.get('user');
if (userData && typeof userData === 'object' && userData.name) {
  // 数据格式正确
  displayUser(userData);
} else {
  // 数据格式错误或不存在
  console.warn('用户数据格式错误');
  storage.del('user'); // 清理错误数据
}
```

## 🚀 进阶技巧

### 创建带过期时间的存储

```typescript
function createExpiringStorage(storage: Memento, defaultTTL = 3600000) {
  return {
    set(key: string, value: any, ttl = defaultTTL) {
      storage.set(key, {
        value,
        expires: Date.now() + ttl,
      });
    },

    get(key: string) {
      const entry = storage.get(key);
      if (entry && entry.expires > Date.now()) {
        return entry.value;
      }
      // 过期了，自动删除
      storage.del(key);
      return undefined;
    },
  };
}

// 使用
const expiringCache = createExpiringStorage(new MemoryMemento());
expiringCache.set('token', 'abc123', 3600000); // 1小时后过期
```

### 创建响应式的设置管理器

```typescript
class SettingsManager {
  constructor(private storage: Memento) {}

  // 获取设置值，带默认值
  get<T>(key: string, defaultValue: T): T {
    const value = this.storage.get(key);
    return value !== undefined ? value : defaultValue;
  }

  // 设置值
  set<T>(key: string, value: T) {
    this.storage.set(key, value);
  }

  // 监听设置变化
  watch<T>(key: string, defaultValue: T) {
    return this.storage.watch(key).pipe(map(value => (value !== undefined ? value : defaultValue)));
  }
}

// 使用
const settings = new SettingsManager(new LocalStorageGlobalState());

// 监听主题变化
settings.watch('theme', 'light').subscribe(theme => {
  document.body.className = `theme-${theme}`;
});

// 更新主题
settings.set('theme', 'dark');
```

## ⚠️ 注意事项

1. **内存存储的数据会在页面刷新后丢失**，只适合临时数据
2. **异步存储的操作都需要 await**，不要忘记处理 Promise
3. **监听器要记得取消订阅**，避免内存泄漏
4. **存储的数据要能够序列化**，不能存储函数或循环引用的对象
5. **命名空间前缀要保证唯一性**，避免不同模块的数据冲突

## 🔍 实际案例分析

### 案例1：用户偏好设置系统

```typescript
// 创建用户设置管理器
class UserPreferencesManager {
  private storage = new LocalStorageGlobalState();
  private cache = new MemoryMemento();

  // 默认设置
  private defaults = {
    theme: 'light',
    language: 'en',
    fontSize: 14,
    autoSave: true,
    sidebarWidth: 240,
  };

  // 获取设置（先查缓存，再查存储）
  get<K extends keyof typeof this.defaults>(key: K) {
    // 先从内存缓存获取
    let value = this.cache.get(key);
    if (value === undefined) {
      // 缓存没有，从持久化存储获取
      value = this.storage.get(key) ?? this.defaults[key];
      // 缓存起来
      this.cache.set(key, value);
    }
    return value;
  }

  // 设置值（同时更新缓存和存储）
  set<K extends keyof typeof this.defaults>(key: K, value: any) {
    this.cache.set(key, value);
    this.storage.set(key, value);
  }

  // 监听设置变化
  watch<K extends keyof typeof this.defaults>(key: K) {
    return this.storage.watch(key).pipe(map(value => value ?? this.defaults[key]));
  }

  // 重置所有设置
  reset() {
    Object.keys(this.defaults).forEach(key => {
      this.storage.del(key);
      this.cache.del(key);
    });
  }
}

// 使用示例
const userPrefs = new UserPreferencesManager();

// 监听主题变化，自动更新界面
userPrefs.watch('theme').subscribe(theme => {
  document.documentElement.setAttribute('data-theme', theme);
});

// 监听字体大小变化
userPrefs.watch('fontSize').subscribe(size => {
  document.documentElement.style.fontSize = `${size}px`;
});

// 用户操作
userPrefs.set('theme', 'dark');
userPrefs.set('fontSize', 16);
```

### 案例2：文档编辑状态管理

```typescript
// 文档编辑器的状态管理
class DocumentEditorState {
  private sessionStorage = new SessionStorageGlobalSessionState();
  private localStorage = new LocalStorageGlobalState();

  // 保存文档编辑状态（会话级别）
  saveEditingState(
    docId: string,
    state: {
      cursorPosition: number;
      scrollTop: number;
      selectedText?: string;
    }
  ) {
    this.sessionStorage.set(`doc-${docId}-editing`, state);
  }

  // 恢复文档编辑状态
  restoreEditingState(docId: string) {
    return this.sessionStorage.get(`doc-${docId}-editing`);
  }

  // 保存文档草稿（持久化）
  saveDraft(docId: string, content: string) {
    this.localStorage.set(`doc-${docId}-draft`, {
      content,
      timestamp: Date.now(),
    });
  }

  // 获取文档草稿
  getDraft(docId: string) {
    const draft = this.localStorage.get(`doc-${docId}-draft`);
    if (draft && Date.now() - draft.timestamp < 7 * 24 * 60 * 60 * 1000) {
      // 7天内的草稿有效
      return draft.content;
    }
    return null;
  }

  // 清理过期草稿
  cleanupOldDrafts() {
    const keys = this.localStorage.keys();
    const now = Date.now();
    const weekAgo = 7 * 24 * 60 * 60 * 1000;

    keys.forEach(key => {
      if (key.startsWith('doc-') && key.endsWith('-draft')) {
        const draft = this.localStorage.get(key);
        if (draft && now - draft.timestamp > weekAgo) {
          this.localStorage.del(key);
        }
      }
    });
  }
}
```

### 案例3：文件缓存系统

```typescript
// 文件缓存管理器
class FileCacheManager {
  private byteStorage = new MemoryByteKV();
  private metaStorage = new MemoryMemento();

  // 缓存文件
  async cacheFile(
    fileId: string,
    data: Uint8Array,
    metadata: {
      filename: string;
      mimeType: string;
      size: number;
    }
  ) {
    // 存储文件数据
    await this.byteStorage.set(fileId, data);

    // 存储元数据
    this.metaStorage.set(fileId, {
      ...metadata,
      cachedAt: Date.now(),
    });
  }

  // 获取缓存的文件
  async getCachedFile(fileId: string) {
    const data = await this.byteStorage.get(fileId);
    const metadata = this.metaStorage.get(fileId);

    if (data && metadata) {
      return { data, metadata };
    }
    return null;
  }

  // 检查文件是否已缓存
  isFileCached(fileId: string): boolean {
    return this.metaStorage.get(fileId) !== undefined;
  }

  // 获取缓存统计信息
  async getCacheStats() {
    const keys = await this.byteStorage.keys();
    let totalSize = 0;

    for (const key of keys) {
      const metadata = this.metaStorage.get(key);
      if (metadata) {
        totalSize += metadata.size;
      }
    }

    return {
      fileCount: keys.length,
      totalSize,
      totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
    };
  }

  // 清理缓存
  async clearCache() {
    await this.byteStorage.clear();
    this.metaStorage.clear();
  }
}
```

## 🧪 测试和调试

### 单元测试示例

```typescript
import { describe, test, expect } from 'vitest';
import { MemoryMemento } from '@toeverything/infra/storage';

describe('Storage Module', () => {
  test('基本存储功能', () => {
    const storage = new MemoryMemento();

    // 测试设置和获取
    storage.set('test-key', 'test-value');
    expect(storage.get('test-key')).toBe('test-value');

    // 测试删除
    storage.del('test-key');
    expect(storage.get('test-key')).toBeUndefined();
  });

  test('响应式监听', done => {
    const storage = new MemoryMemento();

    // 监听变化
    storage.watch('reactive-key').subscribe(value => {
      expect(value).toBe('new-value');
      done();
    });

    // 触发变化
    storage.set('reactive-key', 'new-value');
  });

  test('命名空间隔离', () => {
    const mainStorage = new MemoryMemento();
    const ns1 = wrapMemento(mainStorage, 'ns1:');
    const ns2 = wrapMemento(mainStorage, 'ns2:');

    ns1.set('same-key', 'value1');
    ns2.set('same-key', 'value2');

    expect(ns1.get('same-key')).toBe('value1');
    expect(ns2.get('same-key')).toBe('value2');
  });
});
```

### 调试技巧

```typescript
// 创建带调试功能的存储包装器
function createDebugStorage(storage: Memento, name: string) {
  return {
    get<T>(key: string): T | undefined {
      const value = storage.get<T>(key);
      console.log(`[${name}] GET ${key}:`, value);
      return value;
    },

    set<T>(key: string, value: T): void {
      console.log(`[${name}] SET ${key}:`, value);
      storage.set(key, value);
    },

    del(key: string): void {
      console.log(`[${name}] DEL ${key}`);
      storage.del(key);
    },

    watch<T>(key: string) {
      console.log(`[${name}] WATCH ${key}`);
      return storage.watch<T>(key).pipe(tap(value => console.log(`[${name}] WATCH ${key} changed:`, value)));
    },

    // 其他方法...
    keys: () => storage.keys(),
    clear: () => storage.clear(),
  };
}

// 使用
const debugStorage = createDebugStorage(new MemoryMemento(), 'UserSettings');
```

## 🔧 性能优化建议

### 1. 批量操作

```typescript
// ❌ 低效：逐个设置
for (const item of items) {
  storage.set(item.id, item.data);
}

// ✅ 高效：批量设置
const memento = new MemoryMemento();
memento.setAll(Object.fromEntries(items.map(item => [item.id, item.data])));
```

### 2. 懒加载

```typescript
class LazyStorageManager {
  private _storage: Memento | null = null;

  private get storage() {
    if (!this._storage) {
      this._storage = new MemoryMemento();
    }
    return this._storage;
  }

  get(key: string) {
    return this.storage.get(key);
  }

  set(key: string, value: any) {
    this.storage.set(key, value);
  }
}
```

### 3. 内存管理

```typescript
// 定期清理过期数据
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

  dispose() {
    clearInterval(this.cleanupInterval);
  }
}
```

## 📖 总结

Storage 模块就像是一个智能的数据管家，它：

- 🏠 提供了统一的存储接口，无论底层用什么技术
- 👀 支持实时监听数据变化，让你的应用更加响应式
- 🔧 提供了多种存储类型，适应不同的使用场景
- 🛡️ 通过命名空间实现数据隔离，避免冲突
- ⚡ 既支持快速的内存存储，也支持持久化的磁盘存储
- 🧪 易于测试和调试
- 🚀 支持性能优化和内存管理

掌握了这些概念和用法，你就能在 AFFiNE 项目中灵活地管理各种数据了！

---

_💡 提示：这个指南涵盖了 Storage 模块的核心概念和实用技巧。在实际开发中，建议先从简单的 MemoryMemento 开始，逐步掌握更复杂的异步存储和二进制存储。_
