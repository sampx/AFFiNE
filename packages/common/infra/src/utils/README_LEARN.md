## Common Infra Utils 模块技术备忘

### 模块简介

本模块提供了一组常用的基础工具，帮助开发者更高效地处理异步流程、对象管理、协同编辑等常见场景。它们大多以“工具类”或“函数”的形式出现，方便在项目中随时调用。

#### 主要功能

- **异步控制**：如锁、队列，保证异步任务有序、安全地执行。
- **数据结构操作**：如分数索引，便于在有序列表中插入元素。
- **对象处理**：如对象池、浅比较、稳定哈希等，提升性能和代码简洁性。
- **Yjs 协同编辑支持**：便于多人实时协作。
- **响应式编程支持**：基于 RxJS 的工具，简化流式数据处理。

---

### 目录结构

```
utils/
├── async-lock.ts              # 异步锁
├── async-queue.ts             # 异步队列
├── exhaustmap-with-trailing.ts # RxJS操作符
├── fractional-indexing.ts     # 分数索引
├── index.ts                   # 工具入口
├── merge-updates.ts           # Yjs更新合并
├── object-pool.ts             # 对象池
├── shallow-equal.ts           # 浅比较
├── stable-hash.ts             # 稳定哈希
├── throw-if-aborted.ts        # 中止信号检查
├── yjs-observable.ts          # Yjs响应式工具
└── rx/
    ├── priority-async-queue.ts
    ├── rx-helpers.ts
    └── rx-queue.ts
```

---

### 工具详细说明与示例

#### async-lock.ts —— 异步锁

**作用**：防止多个异步任务同时访问同一资源，避免数据冲突。  
**通俗解释**：就像“上锁开门”，只有拿到钥匙的人才能进屋，别人要等前面的人出来再进去。

**用法示例**：

```typescript
const lock = new AsyncLock();
async function updateData() {
  const { release } = await lock.acquire(); // 等待获取锁
  try {
    // 这里的代码同一时刻只会有一个任务执行
  } finally {
    release(); // 操作完成后释放锁
  }
}
```

---

#### async-queue.ts —— 异步队列

**作用**：让异步任务一个接一个地排队执行，保证顺序。  
**通俗解释**：像排队买票，先来的人先服务。

**用法示例**：

```typescript
const queue = new AsyncQueue<number>();
queue.enqueue(1);
queue.enqueue(2);

async function processQueue() {
  const item = await queue.dequeue(); // 取出队首元素
  // 处理 item
}
```

---

#### exhaustmap-with-trailing.ts —— RxJS 操作符

**作用**：类似 exhaustMap，但会在流结束时补发最后一次值。  
**通俗解释**：只处理第一个请求，后面的等第一个结束后再补发最后一次。

**用法示例**：

```typescript
source$.pipe(exhaustMapWithTrailing(value => apiCall(value))).subscribe(result => {
  // 处理结果
});
```

---

#### fractional-indexing.ts —— 分数索引

**作用**：在有序列表中插入新元素时，生成一个“介于两者之间”的新 key。  
**通俗解释**：像在 a 和 z 之间插入一个新的字母，比如 m。

**用法示例**：

```typescript
const newKey = generateFractionalIndexingKeyBetween('a', 'z'); // 得到 'm'
```

**适用场景**：多人协作编辑时，频繁插入排序。

---

#### merge-updates.ts —— Yjs 更新合并

**作用**：把多个协同编辑的更新合成一个，便于同步。  
**通俗解释**：把多个人的修改合成一份，方便统一处理。

**用法示例**：

```typescript
const merged = mergeUpdates(update1, update2, update3);
ydoc.applyUpdate(merged); // 应用合并后的更新
```

---

#### object-pool.ts —— 对象池

**作用**：重复利用对象，减少频繁创建和销毁带来的性能损耗。  
**通俗解释**：像租借共享单车，用完归还，下次再用。

**用法示例**：

```typescript
const pool = new ObjectPool(() => new Buffer(1024));
const buf = pool.acquire(); // 获取一个对象
// 使用 buf ...
pool.release(buf); // 用完归还
```

**注意**：用完一定要归还，否则会造成内存泄漏。

---

#### shallow-equal.ts —— 浅比较

**作用**：快速判断两个对象的“表面”属性是否相同。  
**通俗解释**：只比较第一层，不递归比较里面的内容。

**用法示例**：

```typescript
if (shallowEqual({ a: 1 }, { a: 1 })) {
  // 返回 true
}
```

---

#### stable-hash.ts —— 稳定哈希

**作用**：为对象生成唯一且稳定的字符串标识。  
**通俗解释**：像给每个对象贴上不会变的条形码。

**用法示例**：

```typescript
const hash = stableHash({ foo: 1, bar: 2 }); // 得到一个字符串
```

**适用场景**：做缓存、去重等。

---

#### throw-if-aborted.ts —— 中止信号检查

**作用**：检测异步操作是否被用户取消，如果取消则抛出异常。  
**通俗解释**：像点了“取消下载”，后续操作会立刻终止。

**用法示例**：

```typescript
function fetchData(signal: AbortSignal) {
  throwIfAborted(signal); // 如果已取消会抛异常
  // 继续执行异步操作
}
```

---

#### yjs-observable.ts —— Yjs 响应式监听

**作用**：监听 Yjs 文档的所有变化，适合实时协作场景。  
**通俗解释**：像给文档加了“监听器”，一有变化就通知你。

**用法示例**：

```typescript
yjsObserveDeep(ydoc)
  .pipe(debounceTime(100)) // 防抖，减少频繁更新
  .subscribe(update => {
    // 根据变化刷新 UI
  });
```

---

### rx/ 子目录工具简介

- **priority-async-queue.ts**  
  支持任务优先级的异步队列，高优先级任务会被优先执行。

  ```typescript
  queue.add(() => doWork(), Priority.HIGH);
  ```

- **rx-helpers.ts**  
  提供 RxJS 常用辅助函数，简化流式数据处理。

- **rx-queue.ts**  
  基于 RxJS 的异步队列，适合响应式场景下的任务管理。

---

### 性能建议与最佳实践

- **对象池**：用完一定要归还，避免内存泄漏。
- **异步锁/队列**：临界区代码要尽量短小，避免阻塞。
- **Yjs 监听**：高频变化时建议加防抖，减少 UI 刷新压力。
- **分数索引**：大列表频繁插入时注意性能，必要时重排。
- **稳定哈希**：大对象计算哈希可能较慢，建议只用于必要场景。
- **RxJS 工具**：合理使用防抖、节流等操作符，提升响应速度。

---

### 综合示例

```typescript
// 1. 用优先级队列管理异步任务
const queue = new PriorityAsyncQueue();
queue.add(() => doWork(), Priority.HIGH);

// 2. 合并多人协作的 Yjs 更新
const merged = mergeUpdates(update1, update2);
ydoc.applyUpdate(merged);

// 3. 检查异步操作是否被取消
function fetchData(signal: AbortSignal) {
  throwIfAborted(signal);
  // 继续 fetch
}
```
