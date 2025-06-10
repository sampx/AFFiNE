# @toeverything/infra - LiveData 模块技术备忘

## 概述

LiveData 是 @toeverything/infra 中的响应式数据系统，基于 RxJS 构建，提供类似 Android LiveData 的 API。它是一个扩展了 Observable 的响应式数据类型，始终保持最新值并支持与 React 的深度集成。

## 核心特性

### 1. 基于 BehaviorSubject

- 始终保持最新值，新订阅者会立即收到当前值
- 支持同步获取当前值
- 内置状态管理

### 2. 与 @preact/signals-core 集成

- 可以转换为 Signal 对象
- 支持 Signal 到 LiveData 的转换
- 提供统一的响应式编程接口

### 3. 内置错误处理机制

- Poisoned 状态：当上游 Observable 抛出错误时进入不可恢复状态
- 防止错误传播导致的应用崩溃
- 提供详细的错误信息

### 4. React Hook 支持

- 提供 `useLiveData` Hook
- 基于 `useSyncExternalStore` 实现
- 自动处理订阅和取消订阅

## 目录结构

```
packages/common/infra/src/livedata/
├── index.ts              # 模块导出
├── livedata.ts          # LiveData 核心类
├── ops.ts               # 操作符集合
├── react.ts             # React 集成
├── effect/              # Effect 系统
│   └── index.ts         # Effect 实现
└── __tests__/           # 测试文件
    ├── livedata.spec.ts
    ├── react.spec.tsx
    └── effect/
        └── effect.spec.ts
```

## 核心 API

### LiveData 类

#### 构造函数

```typescript
// 创建基本 LiveData
const count$ = new LiveData(0);

// 从上游 Observable 创建
const data$ = new LiveData(initialValue, upstream => upstream.pipe(/* operators */));
```

#### 静态方法

##### `LiveData.from()`

从 Observable 或函数创建 LiveData：

```typescript
// 从 Observable 创建
const data$ = LiveData.from(
  interval(1000).pipe(map(i => i * 2)),
  0 // 初始值
);

// 从函数创建（支持生命周期管理）
const managed$ = LiveData.from(
  stream$ =>
    stream$.pipe(
      switchMap(op => {
        if (op === 'watch') {
          return fetchData(); // 开始获取数据
        } else {
          return EMPTY; // 停止获取数据
        }
      })
    ),
  null
);
```

##### `LiveData.fromSignal()`

从 Preact Signal 创建 LiveData：

```typescript
import { signal } from '@preact/signals-core';

const count = signal(0);
const count$ = LiveData.fromSignal(count);
```

##### `LiveData.computed()`

创建计算属性 LiveData：

```typescript
const a$ = new LiveData(1);
const b$ = new LiveData(2);

const sum$ = LiveData.computed(get => {
  return get(a$) + get(b$);
});

console.log(sum$.value); // 3
a$.next(5);
console.log(sum$.value); // 7
```

#### 实例方法

##### 值操作

```typescript
// 获取当前值
const value = data$.value; // 或 data$.getValue()

// 设置新值
data$.next(newValue); // 或 data$.setValue(newValue)
```

##### 转换操作

```typescript
// map 转换
const doubled$ = count$.map(x => x * 2);

// selector 转换（带浅比较）
const user$ = new LiveData({ name: 'John', age: 30 });
const name$ = user$.selector(user => user.name);

// 扁平化
const nested$ = new LiveData(new LiveData(42));
const flat$ = nested$.flat(); // LiveData<number>

// 数组扁平化
const arrayNested$ = new LiveData([new LiveData(1), new LiveData(2)]);
const flatArray$ = arrayNested$.flat(); // LiveData<number[]>
```

##### 过滤和节流

```typescript
// 去重
const distinct$ = data$.distinctUntilChanged();

// 节流
const throttled$ = data$.throttleTime(1000, {
  leading: true,
  trailing: true,
});
```

##### 异步操作

```typescript
// 等待特定条件
await data$.waitFor(value => value > 10);

// 等待非空值
await data$.waitForNonNull();

// 带取消信号
const controller = new AbortController();
await data$.waitFor(value => value.ready, controller.signal);
```

##### Signal 集成

```typescript
// 转换为 Signal
const signal = data$.signal;

// Signal 会自动同步 LiveData 的值
console.log(signal.value); // 与 data$.value 相同
```

## 操作符 (ops.ts)

### 数据流操作符

#### `mapInto()`

将值映射到另一个 LiveData：

```typescript
const source$ = new LiveData(1);
const target$ = new LiveData(0);

source$
  .pipe(
    map(x => x * 2),
    mapInto(target$)
  )
  .subscribe();

source$.next(5);
console.log(target$.value); // 10
```

#### `catchErrorInto()`

捕获错误并发送到错误 LiveData：

```typescript
const error$ = new LiveData<Error | null>(null);

fetchData()
  .pipe(
    catchErrorInto(error$, err => {
      console.log('Error occurred:', err);
    })
  )
  .subscribe();
```

#### `onStart()` 和 `onComplete()`

生命周期回调：

```typescript
fetchData()
  .pipe(
    onStart(() => loading$.next(true)),
    onComplete(() => loading$.next(false))
  )
  .subscribe();
```

### 异步操作符

#### `fromPromise()`

将 Promise 转换为 Observable，支持 AbortSignal：

```typescript
const data$ = LiveData.from(
  fromPromise(signal => fetch('/api/data', { signal })),
  null
);
```

#### `backoffRetry()`

指数退避重试：

```typescript
fetchData()
  .pipe(
    backoffRetry({
      count: 3,
      delay: 200,
      maxDelay: 15000,
      when: err => err.code === 'NETWORK_ERROR',
    })
  )
  .subscribe();
```

#### `smartRetry()`

智能重试（区分网络错误和其他错误）：

```typescript
fetchData()
  .pipe(
    smartRetry({
      count: 3,
      delay: 200,
      maxDelay: 15000,
    })
  )
  .subscribe();
```

#### `exhaustMapSwitchUntilChanged()`

结合 exhaustMap 和 switchMap 的操作符：

```typescript
userInput$
  .pipe(
    exhaustMapSwitchUntilChanged(
      (prev, curr) => prev.userId === curr.userId, // 比较函数
      input => fetchUserData(input.userId), // 投影函数
      input => console.log('Switching user:', input.userId) // 切换回调
    )
  )
  .subscribe();
```

## React 集成

### useLiveData Hook

#### 基本用法

```typescript
import { useLiveData } from '@toeverything/infra/livedata';

function Counter() {
  const count = useLiveData(count$);

  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => count$.next(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

#### 处理可选 LiveData

```typescript
function UserProfile({ user$ }: { user$?: LiveData<User> }) {
  const user = useLiveData(user$); // 类型: User | undefined

  if (!user) {
    return <div>No user</div>;
  }

  return <div>{user.name}</div>;
}
```

#### 与 useMemo 结合使用

```typescript
function ExpensiveComponent() {
  const data = useLiveData(
    useMemo(() =>
      source$.map(value => expensiveTransform(value)),
      [source$]
    )
  );

  return <div>{data}</div>;
}
```

### 生命周期管理

LiveData 会自动管理订阅生命周期：

- 当组件挂载时开始订阅
- 当组件卸载时自动取消订阅
- 支持多个组件同时订阅同一个 LiveData

## Effect 系统

Effect 提供了一种声明式的副作用管理方式：

### 基本用法

```typescript
import { effect } from '@toeverything/infra/livedata';

const loadUser = effect(
  switchMap((id: number) =>
    fromPromise(signal => fetchUser(id, signal)).pipe(
      mapInto(user$),
      catchErrorInto(error$),
      onStart(() => loading$.next(true)),
      onComplete(() => loading$.next(false))
    )
  )
);

// 触发 effect
loadUser(123);

// 取消所有正在进行的操作
loadUser.unsubscribe();

// 重置 effect 状态
loadUser.reset();
```

### Effect 特性

- 自动错误处理和日志记录
- 支持多个操作符组合
- 提供取消和重置功能
- 调试模式下显示调用位置

## 错误处理

### Poisoned 状态

当 LiveData 的上游 Observable 抛出错误时，LiveData 会进入 "poisoned" 状态：

```typescript
const data$ = LiveData.from(
  throwError(() => new Error('Something went wrong')),
  null
);

try {
  console.log(data$.value); // 抛出 PoisonedError
} catch (err) {
  console.log(err instanceof PoisonedError); // true
}
```

### 错误恢复

```typescript
const data$ = LiveData.from(
  fetchData().pipe(
    catchError(err => {
      console.error('Error:', err);
      return of(null); // 返回默认值而不是抛出错误
    })
  ),
  null
);
```

## 最佳实践

### 1. 命名约定

使用 `$` 后缀标识 LiveData：

```typescript
const user$ = new LiveData<User | null>(null);
const loading$ = new LiveData(false);
const error$ = new LiveData<Error | null>(null);
```

### 2. 初始值设计

总是提供合理的初始值：

```typescript
// 好的做法
const count$ = new LiveData(0);
const user$ = new LiveData<User | null>(null);
const items$ = new LiveData<Item[]>([]);

// 避免 undefined 作为初始值
const bad$ = new LiveData<string | undefined>(undefined);
```

### 3. 错误处理

在数据流中处理错误，避免进入 poisoned 状态：

```typescript
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

### 4. 内存管理

在适当的时候调用 `complete()` 清理资源：

```typescript
class DataService {
  private data$ = new LiveData(null);

  dispose() {
    this.data$.complete();
  }
}
```

### 5. React 组件中的使用

```typescript
// 推荐：使用 useMemo 避免重复创建 LiveData
function Component({ source$ }: { source$: LiveData<number> }) {
  const doubled = useLiveData(
    useMemo(() => source$.map(x => x * 2), [source$])
  );

  return <div>{doubled}</div>;
}
```

## 与其他模块的集成

### 与 Framework 模块集成

```typescript
@Service()
class UserService {
  currentUser$ = new LiveData<User | null>(null);

  async loadUser(id: string) {
    const user = await this.userRepository.findById(id);
    this.currentUser$.next(user);
  }
}
```

### 与 Storage 模块集成

```typescript
const settings$ = LiveData.from(storage.watch('settings').pipe(map(data => JSON.parse(data || '{}'))), {});
```

---

_最后更新: 2024年12月_
