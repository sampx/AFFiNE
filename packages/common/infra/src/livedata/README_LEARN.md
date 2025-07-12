# @toeverything/infra - LiveData 模块技术备忘

## 概述

LiveData 是 @toeverything/infra 中的响应式数据系统，基于 RxJS 构建，提供类似 Android LiveData 的 API。它是一个扩展了 Observable 的响应式数据类型，始终保持最新值并支持与 React 的深度集成。

## 什么是响应式编程？

在了解 LiveData 之前，让我们先理解响应式编程的核心概念。

想象一下 Excel 表格中的公式：当 A1 单元格的值改变时，所有引用 A1 的单元格会自动更新。响应式编程就是这个概念在编程中的应用。

```typescript
// 传统编程方式
let price = 100;
let tax = 0.1;
let total = price * (1 + tax); // total = 110

price = 200; // 改变价格
// total 仍然是 110，需要手动重新计算
total = price * (1 + tax); // 需要手动更新

// 响应式编程方式（使用 LiveData）
const price$ = new LiveData(100);
const tax$ = new LiveData(0.1);
const total$ = LiveData.computed(get => get(price$) * (1 + get(tax$)));

console.log(total$.value); // 110
price$.next(200); // 改变价格
console.log(total$.value); // 220 - 自动更新！
```

### 响应式编程的优势

1. **自动依赖追踪** - 无需手动管理数据依赖关系
2. **声明式编程** - 专注于"做什么"而不是"怎么做"
3. **数据一致性** - 避免状态不同步的问题
4. **组合性** - 轻松组合复杂的数据流逻辑

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

从 Observable 或函数创建 LiveData。这个方法有三种使用方式：

**方式1：从普通 Observable 创建**

```typescript
import { of, interval } from 'rxjs';

// 从静态值创建
const staticData$ = LiveData.from(of(1, 2, 3), 0);
// 初始值是 0，然后依次变为 1, 2, 3

// 从定时器创建
const timer$ = LiveData.from(interval(1000), -1);
// 初始值是 -1，然后每秒递增：0, 1, 2, 3...
```

**方式2：从函数创建（支持懒加载）**

这是 LiveData 的高级功能，支持基于订阅状态的生命周期管理：

```typescript
// 模拟一个需要资源的数据源
function createExpensiveDataSource() {
  console.log('启动昂贵的数据源...');
  return interval(1000).pipe(
    map(i => `数据-${i}`),
    tap(() => console.log('生成数据'))
  );
}

const lazyData$ = LiveData.from(
  // 这个函数接收操作流，返回数据流
  operationStream$ => {
    return operationStream$.pipe(
      // 处理不同的操作类型
      mergeMap(operation => {
        if (operation === 'set') {
          return EMPTY; // 设置操作不产生数据
        } else if (operation === 'get') {
          return of('watch', 'unwatch'); // 获取操作产生 watch 和 unwatch
        } else {
          return of(operation); // 其他操作直接传递
        }
      }),

      // 计算观察者数量
      scan((watcherCount, operation) => {
        if (operation === 'watch') {
          return watcherCount + 1; // 增加观察者
        } else if (operation === 'unwatch') {
          return watcherCount - 1; // 减少观察者
        } else {
          return watcherCount; // 数量不变
        }
      }, 0), // 初始观察者数量为 0

      // 判断是否需要激活
      map(count => (count > 0 ? 'watch' : 'unwatch')),

      // 去重，避免重复的激活/停用
      distinctUntilChanged(),

      // 根据状态决定数据源
      switchMap(status => {
        if (status === 'watch') {
          return createExpensiveDataSource(); // 有观察者时，连接上游数据源
        } else {
          return EMPTY; // 没有观察者时，停止数据流
        }
      })
    );
  },
  '初始值'
);

console.log('LiveData 已创建，但数据源还未启动');

// 只有当订阅时，数据源才会启动
const subscription = lazyData$.subscribe(data => {
  console.log('收到数据:', data);
});

// 取消订阅时，数据源会停止
setTimeout(() => {
  subscription.unsubscribe();
  console.log('数据源已停止');
}, 5000);
```

这个机制实现了**懒加载**：只有当有人订阅 LiveData 时，才会激活上游的数据源，从而节省资源。

##### `LiveData.fromSignal()`

从 Preact Signal 创建 LiveData：

```typescript
import { signal } from '@preact/signals-core';

const count = signal(0);
const count$ = LiveData.fromSignal(count);
```

##### `LiveData.computed()`

创建计算属性 LiveData，这是 LiveData 最强大的功能之一：

```typescript
static computed<T>(
  compute: (get: <L>(data: LiveData<L>) => L) => T
): LiveData<T>
```

**基础用法**

```typescript
const firstName$ = new LiveData('张');
const lastName$ = new LiveData('三');

const fullName$ = LiveData.computed(get => {
  // get 函数会自动追踪依赖
  return get(firstName$) + get(lastName$);
});

console.log(fullName$.value); // "张三"

firstName$.next('李');
console.log(fullName$.value); // "李三" - 自动重新计算
```

**条件依赖（智能依赖追踪）**

```typescript
const mode$ = new LiveData('light');
const lightTheme$ = new LiveData({ bg: 'white', text: 'black' });
const darkTheme$ = new LiveData({ bg: 'black', text: 'white' });

const currentTheme$ = LiveData.computed(get => {
  // 根据模式动态选择依赖
  if (get(mode$) === 'light') {
    return get(lightTheme$); // 只有在 light 模式下才依赖 lightTheme$
  } else {
    return get(darkTheme$); // 只有在 dark 模式下才依赖 darkTheme$
  }
});

// 智能依赖追踪：只有当前使用的主题改变时才会重新计算
```

**复杂计算示例**

```typescript
const price$ = new LiveData(100);
const quantity$ = new LiveData(2);
const discountRate$ = new LiveData(0.1);
const taxRate$ = new LiveData(0.08);

const finalPrice$ = LiveData.computed(get => {
  const price = get(price$);
  const quantity = get(quantity$);
  const discount = get(discountRate$);
  const tax = get(taxRate$);

  const subtotal = price * quantity;
  const discounted = subtotal * (1 - discount);
  const final = discounted * (1 + tax);

  return Math.round(final * 100) / 100; // 保留两位小数
});

console.log(finalPrice$.value); // 194.4
price$.next(150);
console.log(finalPrice$.value); // 291.6 - 自动重新计算
```

**递归限制保护**

```typescript
// 这会触发递归限制，保护系统不会无限递归
const problematic$ = LiveData.computed(get => {
  return get(problematic$) + 1; // 自己依赖自己，会抛出错误
});
// Error: computed recursive limit exceeded
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

操作符是处理数据流的工具，就像工厂流水线上的不同工序。在 LiveData 中，我们可以使用 RxJS 的所有操作符，同时还提供了一些专门的操作符。

### RxJS 操作符基础

在深入 LiveData 特有的操作符之前，让我们先了解常用的 RxJS 操作符：

#### 数据转换类操作符

**`map` - 数据转换**
就像 JavaScript 数组的 map 方法，对每个值进行转换：

```typescript
const numbers$ = new LiveData(5);

// 将数字转换为字符串
const strings$ = numbers$.map(num => `数字是: ${num}`);

console.log(strings$.value); // "数字是: 5"
numbers$.next(10);
console.log(strings$.value); // "数字是: 10"
```

**`filter` - 数据过滤**
只保留满足条件的值：

```typescript
const allNumbers$ = new LiveData(1);

// 只保留大于 5 的数字
const bigNumbers$ = LiveData.from(
  allNumbers$.pipe(filter(num => num > 5)),
  0 // 初始值
);

allNumbers$.next(3); // bigNumbers$ 不会更新
allNumbers$.next(8); // bigNumbers$ 更新为 8
```

**`distinctUntilChanged` - 去重**
只有当值真的改变时才发出通知：

```typescript
const data$ = new LiveData(1);
const unique$ = data$.distinctUntilChanged();

unique$.subscribe(val => console.log('值改变了:', val));

data$.next(1); // 不会打印，因为值没变
data$.next(1); // 不会打印，因为值没变
data$.next(2); // 打印 "值改变了: 2"
```

#### 异步操作符

**`switchMap` - 切换映射**
将一个值映射为新的 Observable，并自动切换到最新的：

```typescript
const userId$ = new LiveData(1);

// 根据用户ID获取用户数据
const userData$ = LiveData.from(
  userId$.pipe(
    switchMap(id =>
      // 模拟 API 调用
      fromPromise(signal => fetch(`/api/users/${id}`, { signal }).then(res => res.json()))
    )
  ),
  null
);

userId$.next(2); // 会取消之前的请求，只返回用户2的数据
```

**`mergeMap` - 合并映射**
与 switchMap 不同，不会取消之前的请求：

```typescript
const searchTerm$ = new LiveData('');

const searchResults$ = LiveData.from(
  searchTerm$.pipe(
    filter(term => term.length > 2),
    mergeMap(term => fromPromise(signal => fetch(`/api/search?q=${term}`, { signal }).then(res => res.json())))
  ),
  []
);
```

### 数据流操作符（LiveData 特有）

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
