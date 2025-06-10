# @toeverything/infra - Atom 模块技术备忘

## 概述

Atom 模块是 @toeverything/infra 中的状态管理系统，基于 Jotai 构建。它提供了原子化的状态管理方案，支持细粒度的状态更新和订阅，特别适合复杂应用的状态管理需求。

## 核心特性

### 1. 基于 Jotai

- 原子化状态管理
- 自动依赖追踪
- 细粒度更新
- 优秀的 TypeScript 支持

### 2. 全局状态存储

- 统一的全局 Store 实例
- 跨组件状态共享
- 状态持久化支持

### 3. 应用设置管理

- 内置应用配置管理
- 自动存储同步
- Electron 集成支持

### 4. 副作用管理

- 基于 jotai-effect 的副作用系统
- 自动状态同步
- 生命周期管理

## 目录结构

```
packages/common/infra/src/atom/
├── index.ts          # 模块导出
├── root-store.ts     # 全局 Store 管理
└── settings.ts       # 应用设置管理
```

## 核心 API

### 全局 Store 管理 (root-store.ts)

#### `getCurrentStore()`

获取全局唯一的 Jotai Store 实例：

```typescript
import { getCurrentStore } from '@toeverything/infra/atom';

// 获取全局 store 实例
const store = getCurrentStore();

// 手动获取原子值
const value = store.get(someAtom);

// 手动设置原子值
store.set(someAtom, newValue);

// 订阅原子变化
const unsubscribe = store.sub(someAtom, () => {
  console.log('Atom value changed:', store.get(someAtom));
});
```

### 应用设置管理 (settings.ts)

#### 设置类型定义

```typescript
export type AppSetting = {
  clientBorder: boolean; // 客户端边框
  windowFrameStyle: 'frameless' | 'NativeTitleBar'; // 窗口框架样式
  enableBlurBackground: boolean; // 背景模糊效果
  enableNoisyBackground: boolean; // 背景噪点效果
  autoCheckUpdate: boolean; // 自动检查更新
  autoDownloadUpdate: boolean; // 自动下载更新
  enableTelemetry: boolean; // 遥测数据收集
};
```

#### 窗口样式选项

```typescript
export const windowFrameStyleOptions: AppSetting['windowFrameStyle'][] = [
  'frameless', // 无框架窗口
  'NativeTitleBar', // 原生标题栏
];
```

#### 存储配置

```typescript
export const APP_SETTINGS_STORAGE_KEY = 'affine-settings';
```

#### 应用设置原子

##### `appSettingAtom`

主要的应用设置原子，提供读写功能：

```typescript
import { appSettingAtom } from '@toeverything/infra/atom';
import { useAtom } from 'jotai';

function SettingsPanel() {
  const [settings, setSettings] = useAtom(appSettingAtom);

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      enableBlurBackground: !prev.enableBlurBackground
    }));
  };

  return (
    <div>
      <h3>应用设置</h3>
      <label>
        <input
          type="checkbox"
          checked={settings.enableBlurBackground}
          onChange={toggleTheme}
        />
        启用背景模糊
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings.autoCheckUpdate}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            autoCheckUpdate: e.target.checked
          }))}
        />
        自动检查更新
      </label>
    </div>
  );
}
```

#### 默认设置值

```typescript
const defaultSettings: AppSetting = {
  // 客户端边框，在Electron非Windows环境下启用
  clientBorder: BUILD_CONFIG.isElectron && !environment.isWindows,
  windowFrameStyle: 'frameless', // 默认无框架窗口
  enableBlurBackground: false, // 默认关闭背景模糊
  enableNoisyBackground: true, // 默认开启背景噪点
  autoCheckUpdate: true, // 默认自动检查更新
  autoDownloadUpdate: true, // 默认自动下载更新
  enableTelemetry: true, // 默认开启遥测
};
```

## 高级特性

### 1. 存储持久化

应用设置使用 `atomWithStorage` 实现自动持久化：

```typescript
import { atomWithStorage } from 'jotai/utils';

const persistentAtom = atomWithStorage(
  'my-settings', // 存储键名
  { theme: 'light' }, // 默认值
  undefined, // 存储引擎（默认 localStorage）
  { getOnInit: true } // 初始化时立即加载
);
```

### 2. 副作用管理

使用 `atomEffect` 管理副作用：

```typescript
import { atomEffect } from 'jotai-effect';

const syncToElectronEffect = atomEffect(get => {
  const settings = get(appSettingAtom);

  // 同步设置到 Electron
  if (BUILD_CONFIG.isElectron) {
    window.__apis?.updater.setConfig({
      autoCheckUpdate: settings.autoCheckUpdate,
      autoDownloadUpdate: settings.autoDownloadUpdate,
    });
  }
});
```

### 3. 派生原子

创建基于其他原子的计算属性：

```typescript
import { atom } from 'jotai';

// 基础原子
const countAtom = atom(0);
const multiplierAtom = atom(2);

// 派生原子（只读）
const doubledCountAtom = atom(get => {
  const count = get(countAtom);
  const multiplier = get(multiplierAtom);
  return count * multiplier;
});

// 派生原子（可写）
const incrementAtom = atom(
  get => get(countAtom), // 读取函数
  (get, set, increment: number) => {
    // 写入函数
    const current = get(countAtom);
    set(countAtom, current + increment);
  }
);
```

## React 集成

### 基本用法

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// 创建原子
const messageAtom = atom('Hello');
const countAtom = atom(0);

function App() {
  // 读写原子
  const [message, setMessage] = useAtom(messageAtom);

  // 只读原子
  const count = useAtomValue(countAtom);

  // 只写原子
  const setCount = useSetAtom(countAtom);

  return (
    <div>
      <p>{message}</p>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
    </div>
  );
}
```

### 条件渲染

```typescript
const userAtom = atom<User | null>(null);
const isLoggedInAtom = atom(get => get(userAtom) !== null);

function UserProfile() {
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const user = useAtomValue(userAtom);

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return <div>Welcome, {user!.name}!</div>;
}
```

### 异步原子

```typescript
const userIdAtom = atom<string | null>(null);

const userAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  if (!userId) return null;

  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

function UserProfile() {
  const user = useAtomValue(userAtom);

  if (user === null) {
    return <div>No user selected</div>;
  }

  // user 是 Promise<User> 类型，需要 Suspense
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserDetails userPromise={user} />
    </Suspense>
  );
}
```

## 实际应用示例

### 1. 主题管理

```typescript
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type Theme = 'light' | 'dark' | 'auto';

const themeAtom = atomWithStorage<Theme>('theme', 'auto');

const effectiveThemeAtom = atom(get => {
  const theme = get(themeAtom);
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
});

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  const effectiveTheme = useAtomValue(effectiveThemeAtom);

  return (
    <div>
      <p>Current theme: {effectiveTheme}</p>
      <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
      </select>
    </div>
  );
}
```

### 2. 表单状态管理

```typescript
const formAtom = atom({
  name: '',
  email: '',
  age: 0,
});

const formErrorsAtom = atom(get => {
  const form = get(formAtom);
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!form.email.includes('@')) {
    errors.email = 'Invalid email';
  }

  if (form.age < 0) {
    errors.age = 'Age must be positive';
  }

  return errors;
});

const isFormValidAtom = atom(get => {
  const errors = get(formErrorsAtom);
  return Object.keys(errors).length === 0;
});

function ContactForm() {
  const [form, setForm] = useAtom(formAtom);
  const errors = useAtomValue(formErrorsAtom);
  const isValid = useAtomValue(isFormValidAtom);

  const updateField = (field: keyof typeof form) => (value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form>
      <div>
        <input
          value={form.name}
          onChange={(e) => updateField('name')(e.target.value)}
          placeholder="Name"
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div>
        <input
          value={form.email}
          onChange={(e) => updateField('email')(e.target.value)}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}
```

### 3. 列表状态管理

```typescript
type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const todosAtom = atom<Todo[]>([]);

const addTodoAtom = atom(
  null,
  (get, set, text: string) => {
    const todos = get(todosAtom);
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
    };
    set(todosAtom, [...todos, newTodo]);
  }
);

const toggleTodoAtom = atom(
  null,
  (get, set, id: string) => {
    const todos = get(todosAtom);
    set(todosAtom, todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }
);

const completedCountAtom = atom(get => {
  const todos = get(todosAtom);
  return todos.filter(todo => todo.completed).length;
});

function TodoApp() {
  const todos = useAtomValue(todosAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const completedCount = useAtomValue(completedCountAtom);

  const [newTodoText, setNewTodoText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim());
      setNewTodoText('');
    }
  };

  return (
    <div>
      <h2>Todos ({completedCount}/{todos.length} completed)</h2>

      <form onSubmit={handleSubmit}>
        <input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add new todo"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span style={{
                textDecoration: todo.completed ? 'line-through' : 'none'
              }}>
                {todo.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 最佳实践

### 1. 原子命名约定

```typescript
// 使用 Atom 后缀
const userAtom = atom<User | null>(null);
const settingsAtom = atom<Settings>({});

// 或者使用描述性名称
const currentUser = atom<User | null>(null);
const appSettings = atom<Settings>({});
```

### 2. 原子组织

```typescript
// atoms/user.ts
export const userAtom = atom<User | null>(null);
export const isLoggedInAtom = atom(get => get(userAtom) !== null);

// atoms/settings.ts
export const themeAtom = atomWithStorage<Theme>('theme', 'light');
export const languageAtom = atomWithStorage<Language>('language', 'en');

// atoms/index.ts
export * from './user';
export * from './settings';
```

### 3. 类型安全

```typescript
// 使用严格的类型定义
type UserStatus = 'idle' | 'loading' | 'success' | 'error';

const userStatusAtom = atom<UserStatus>('idle');

// 避免 any 类型
const badAtom = atom<any>(null); // ❌
const goodAtom = atom<User | null>(null); // ✅
```

### 4. 性能优化

```typescript
// 使用 useMemo 避免重复创建派生原子
function UserProfile({ userId }: { userId: string }) {
  const userAtom = useMemo(
    () =>
      atom(async () => {
        const response = await fetch(`/api/users/${userId}`);
        return response.json();
      }),
    [userId]
  );

  const user = useAtomValue(userAtom);
  // ...
}
```

## 与其他模块的集成

### 与 LiveData 集成

```typescript
import { LiveData } from '@toeverything/infra/livedata';
import { atom } from 'jotai';

// 将 LiveData 转换为 Atom
function liveDataToAtom<T>(liveData: LiveData<T>) {
  return atom(
    get => liveData.value,
    (get, set, value: T) => liveData.next(value)
  );
}

const count$ = new LiveData(0);
const countAtom = liveDataToAtom(count$);
```

### 与 Framework 集成

```typescript
@Service()
class SettingsService {
  private store = getCurrentStore();

  getSettings() {
    return this.store.get(appSettingAtom);
  }

  updateSettings(updates: Partial<AppSetting>) {
    this.store.set(appSettingAtom, updates);
  }
}
```

---

_最后更新: 2024年12月_
