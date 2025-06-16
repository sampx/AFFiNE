# AFFiNE NBStore Worker 学习指南

## 🚀 欢迎来到 NBStore Worker 的世界！

你好！本指南将带你深入了解 AFFiNE 项目中一个非常重要的部分——**NBStore Worker**。它就像一个幕后英雄，默默地处理着所有与数据存储和同步相关的工作，确保你的 AFFiNE 应用始终流畅运行，不会卡顿。

如果你是编程新手，或者对 Web Worker、TypeScript 高级语法感到困惑，别担心！本指南会用最简单、最直白的方式，一步步为你揭开 NBStore Worker 的神秘面纱。

## 📋 什么是 NBStore Worker？

想象一下，你在 AFFiNE 里写文档、画图，这些操作都需要保存数据。如果这些保存数据的任务在主界面线程里进行，当数据量很大时，你的界面可能会变得卡顿，甚至“假死”。

NBStore Worker 就是为了解决这个问题而生的！它是一个特殊的 **Web Worker**，运行在浏览器的一个**独立线程**中。这意味着：

- **不阻塞主界面**：它在后台默默工作，处理数据存储、同步等“重活”，主界面可以继续响应你的操作，保持流畅。
- **数据持久化与同步**：它负责把你的数据安全地保存起来（比如保存到本地数据库），并确保你的数据在不同设备或不同浏览器标签页之间保持同步。

简而言之，NBStore Worker 是 AFFiNE 数据存储和同步的“大脑”。

## 🏗️ Web Worker 技术基础

在深入 NBStore Worker 之前，我们先来了解一下它所依赖的核心技术：Web Worker。

### 1. 什么是 Web Worker？

Web Worker 是浏览器提供的一种能力，允许你在网页的**后台线程**中运行 JavaScript 代码。这就像给你的网页请了一个“帮手”，可以在不影响主界面（UI）的情况下，处理一些耗时的计算或操作。

它的主要特点有：

- **独立线程**：Worker 运行在一个与主线程完全分离的线程中，互不干扰。
- **不阻塞 UI**：耗时的计算任务在 Worker 中执行，不会导致主界面卡顿。
- **消息通信**：主线程和 Worker 线程之间不能直接访问对方的数据，它们通过 `postMessage`（发送消息）和 `onmessage`（接收消息）机制来互相交流。
- **受限环境**：为了安全和隔离，Worker 无法直接访问网页的 DOM（Document Object Model，也就是网页的结构和内容）以及一些浏览器 API。

### 2. SharedWorker vs 普通 Worker

Web Worker 有两种主要类型：

- **普通 Worker (`Worker`)**：

  - 每个浏览器标签页或每个脚本都会创建一个独立的 Worker 实例。
  - 通信模型相对简单，每个 Worker 只与创建它的主线程通信。
  - 兼容性更好，几乎所有现代浏览器都支持。

- **共享 Worker (`SharedWorker`)**：
  - 多个浏览器标签页或多个脚本可以**共享同一个 Worker 实例**。
  - **优势**：
    - 数据在多个标签页之间可以保持同步，非常适合需要跨标签页协作的应用（比如 AFFiNE）。
    - 减少内存占用，因为多个标签页共享一个 Worker，而不是每个标签页都创建一个。
  - 通信稍微复杂一些，需要通过 `port`（端口）进行通信。

### 3. NBStore Worker 的“双模式”设计

AFFiNE 的 NBStore Worker 非常智能，它会根据运行环境自动选择使用 `SharedWorker` 还是 `普通 Worker`。

```typescript
// 检测运行环境并适配不同的 Worker 类型
if ('onconnect' in globalThis) {
  // 如果 globalThis（全局对象）中有 onconnect 属性，说明当前环境支持 SharedWorker
  // SharedWorker 模式：处理多个连接
  (globalThis as any).onconnect = (event: MessageEvent) => {
    const port = event.ports[0]; // 获取通信端口
    consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
  };
} else {
  // 否则，回退到普通 Worker 模式：直接绑定到全局对象
  consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(globalThis as MessageCommunicapable));
}
```

这段代码的意思是：

- 如果浏览器支持 `SharedWorker`（通过检查 `globalThis` 对象是否有 `onconnect` 属性），NBStore Worker 就会以 `SharedWorker` 模式启动，这样多个 AFFiNE 标签页就可以共享同一个 Worker，实现数据同步。
- 如果不支持 `SharedWorker`，它就会回退到 `普通 Worker` 模式，每个标签页有自己的 Worker 实例。

## ⚙️ NBStore Worker 的核心机制

了解了 Web Worker 的基础，我们来看看 NBStore Worker 是如何工作的。

### 1. Worker 加载时机

NBStore Worker 在 AFFiNE 应用启动的**早期阶段**就被加载，确保数据服务随时可用。

- **Web 应用 (`packages/frontend/apps/web/src/app.tsx`)**:

  ```typescript
  // 应用启动时立即创建 Worker
  const workerUrl = getWorkerUrl('nbstore');

  // 优先使用 SharedWorker（支持多标签页共享）
  if (window.SharedWorker && localStorage.getItem('disableSharedWorker') !== 'true') {
    const worker = new SharedWorker(workerUrl, {
      name: 'affine-shared-worker',
    });
    storeManagerClient = new StoreManagerClient(new OpClient(worker.port));
  } else {
    // 回退到普通 Worker
    const worker = new Worker(workerUrl);
    storeManagerClient = new StoreManagerClient(new OpClient(worker));
  }
  ```

  这段代码会首先尝试创建 `SharedWorker`。如果浏览器支持 `SharedWorker` 并且用户没有禁用它（通过 `localStorage`），就会使用 `SharedWorker`。否则，就会使用 `普通 Worker`。

- **移动端应用 (`packages/frontend/apps/mobile/src/app.tsx`)**:
  移动端应用也类似，在启动时加载 Worker。

#### Worker URL 生成机制

Worker 的 URL 是通过一个名为 `getWorkerUrl` 的函数生成的 (`packages/common/env/src/worker.ts`)：

```typescript
export function getWorkerUrl(name: string) {
  return (
    // Worker 必须遵守同源策略，不能使用 publicPath
    (environment.subPath || '/') + 'js/' + `${name}-${BUILD_CONFIG.appVersion}.worker.js` // 包含版本号的文件名
  );
}
```

这个函数会根据 Worker 的名称和应用的当前版本号，生成一个唯一的 URL，确保浏览器能够正确加载到 Worker 脚本。

### 2. Worker 启动后的初始化流程

当 NBStore Worker 成功加载并启动后，它会进行一系列的初始化工作：

#### 环境引导

首先，它会加载一些浏览器环境的配置：

```typescript
// 首先加载浏览器环境配置
import '@affine/core/bootstrap/browser';
```

#### 存储后端初始化

NBStore Worker 的核心是数据存储，所以它会初始化多种“存储后端”，这些后端负责将数据保存到不同的地方：

```typescript
const consumer = new StoreManagerConsumer([
  ...idbStorages, // IndexedDB 存储：本地数据库，用于离线存储
  ...idbV1Storages, // 兼容性存储：处理旧版本的数据格式
  ...broadcastChannelStorages, // 跨标签页通信：通过 BroadcastChannel 实现标签页间数据同步
  ...cloudStorages, // 云端同步：与 AFFiNE 云服务器进行数据同步
]);
```

- **`idbStorages`**：使用浏览器内置的 **IndexedDB** 数据库进行本地数据持久化。这意味着即使你离线，你的数据也安全地保存在本地。
- **`idbV1Storages`**：用于兼容旧版本的数据格式，确保老数据也能正常读取。
- **`broadcastChannelStorages`**：通过 **BroadcastChannel** API 实现不同标签页之间的数据同步。当一个标签页的数据发生变化时，可以通过这个通道通知其他标签页更新。
- **`cloudStorages`**：负责与 AFFiNE 云服务器进行数据同步，实现多设备同步和数据备份。

#### 通信机制建立

Worker 启动后，需要与主线程建立通信桥梁。它通过 `OpConsumer` 来实现这一点：

```typescript
// OpConsumer 负责处理来自主线程的操作请求
consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
```

`OpConsumer` 就像一个“消息接收器”，它会监听主线程发来的各种操作请求，并进行处理。

### 3. Worker 持续运行过程中的工作

NBStore Worker 启动并初始化完成后，就会持续地在后台运行，处理各种数据操作和同步任务。

#### 存储操作处理

Worker 会持续监听并处理各种存储操作，例如：

- **文档存储操作**：
  - `docStorage.getDoc`：获取文档数据。
  - `docStorage.pushDocUpdate`：推送文档更新。
  - `docStorage.deleteDoc`：删除文档。
  - `docStorage.subscribeDocUpdate`：订阅文档更新，当文档有新变化时会收到通知。
- **Blob 存储操作**：Blob 通常指二进制大对象，比如图片、文件等。
  - `blobStorage.getBlob`：获取二进制数据。
  - `blobStorage.setBlob`：存储二进制数据。
  - `blobStorage.deleteBlob`：删除二进制数据。
- **感知存储操作**：用于处理用户在线状态、光标位置等实时协作信息。
  - `awarenessStorage.update`：更新用户感知信息。
  - `awarenessStorage.subscribeUpdate`：订阅感知更新。

#### 数据同步管理

Worker 中的 `Sync` 组件是数据同步的核心：

```typescript
// 创建同步管理器
this.sync = new Sync(this.storages);
// 连接本地存储
this.storages.local.connect();
// 连接远程存储
for (const remote of Object.values(this.storages.remotes)) {
  remote.connect();
}
// 启动同步
this.sync.start();
```

`Sync` 组件会连接所有配置的存储后端（本地、云端等），并启动数据同步流程，确保数据在不同存储之间保持一致。

#### 存储实例管理

`StoreManagerConsumer` 负责管理多个存储实例，它使用了一种“引用计数”的机制：

```typescript
// 存储实例池，支持引用计数
private readonly storePool = new Map<string, { store: StoreConsumer; refCount: number }>();

// 打开存储时增加引用计数
open: ({ port, key, closeKey, options }) => {
  let storeRef = this.storePool.get(key);
  if (!storeRef) {
    const store = new StoreConsumer(this.availableStorageImplementations, options);
    storeRef = { store, refCount: 0 };
  }
  storeRef.refCount++; // 每次使用时，引用计数加 1
  // ...
}
```

这就像图书馆借书：每当有人“打开”一个存储实例（借一本书），引用计数就加 1。当所有人都“关闭”它（还书）时，引用计数变为 0，这个存储实例就可以被安全地销毁，释放内存。

## 📡 通信机制详解：Op 模式

AFFiNE 使用了一套自研的 **Op 模式通信框架**来实现主线程和 Worker 线程之间的通信。这套框架非常强大，支持类型安全、流式数据传输和操作取消。

### 1. OpClient (主线程) 和 OpConsumer (Worker 线程)

- **`OpClient` (主线程)**：

  - 负责向 Worker 发送各种操作请求。
  - 接收并处理 Worker 返回的结果。
  - 支持 `Promise`（一次性结果）和 `Observable`（持续数据流）两种模式。

- **`OpConsumer` (Worker 线程)**：
  - 负责接收并处理来自主线程的操作请求。
  - 将处理结果返回给主线程。
  - 支持流式数据传输。

它们就像一对“对讲机”，`OpClient` 是主线程的“发送器”，`OpConsumer` 是 Worker 线程的“接收器”，它们通过特定的消息格式进行交流。

### 2. 消息类型

Op 模式通信框架定义了两种主要的消息类型：

- **请求消息 (`CallMessage`)**：主线程向 Worker 发送请求时使用。

  ```typescript
  interface CallMessage {
    type: 'call'; // 消息类型为“调用”
    id: string; // 唯一的消息 ID
    name: string; // 要调用的操作名称（比如 'docStorage.getDoc'）
    payload: any; // 携带的数据或参数
  }
  ```

- **响应消息 (`ReturnMessage`)**：Worker 处理完请求后，将结果返回给主线程时使用。
  ```typescript
  interface ReturnMessage {
    type: 'return'; // 消息类型为“返回”
    id: string; // 对应的请求消息 ID
    data?: any; // 返回的数据（如果操作成功）
    error?: Error; // 错误信息（如果操作失败）
  }
  ```

### 3. 数据传输优化：Transferable Objects

当主线程和 Worker 线程之间传输大量数据时，如果直接复制数据，会非常耗时。为了解决这个问题，Op 模式通信框架支持 **Transferable Objects**。

```typescript
// 自动检测并传输可转移对象
const transferables = fetchTransferables(payload);
this.port.postMessage(msg, { transfer: transferables });
```

`Transferable Objects` 允许数据从一个线程“转移”到另一个线程，而不是复制。这意味着数据在转移后，原始线程就不能再访问它了，但这样可以大大提高大数据传输的效率。

## 🎯 NBStore Worker 的实际应用场景

NBStore Worker 在 AFFiNE 中扮演着关键角色，支持着许多核心功能：

### 1. 文档编辑

当你编辑文档时，NBStore Worker 会在幕后默默工作：

1.  主线程（你正在操作的界面）生成文档更新。
2.  通过 `OpClient` 将更新发送到 Worker。
3.  Worker 将更新存储到本地的 **IndexedDB** 数据库。
4.  如果开启了多标签页协作，Worker 还会通过 **BroadcastChannel** 将更新同步到其他打开相同文档的标签页。
5.  如果配置了云端同步，Worker 还会将更新上传到 AFFiNE 云服务器。

### 2. 多标签页协作

当你在多个浏览器标签页中打开同一个 AFFiNE 文档时：

1.  所有标签页都会连接到同一个 **SharedWorker** 实例。
2.  这个共享的 Worker 实例会管理统一的数据状态。
3.  任何一个标签页的更改都会实时同步到其他标签页，实现无缝协作。

### 3. 离线支持

NBStore Worker 为 AFFiNE 提供了完整的离线支持：

1.  所有数据都优先存储在本地的 **IndexedDB** 数据库中。
2.  即使没有网络，你也可以继续编辑文档。
3.  当网络恢复时，Worker 会自动将本地的更改同步到云端。
4.  它还会处理数据冲突和版本管理，确保你的数据始终是最新的。

## 🔍 NBStore Worker 中的高级 TypeScript/JavaScript 语法

`consumer.ts` 是 NBStore Worker 的核心文件，其中使用了许多 TypeScript 和 JavaScript 的高级语法。理解这些语法对于深入学习 NBStore Worker 至关重要。

### 1. 泛型 (Generics)

**代码示例**:

```typescript
class StoreConsumer<T> {
  // T 是类型参数，可以在使用时指定具体类型
}

// 使用示例
const consumer = new OpConsumer<WorkerOps>(port);
```

**通俗解释**: 泛型就像一个“万能容器”或“类型占位符”。它允许你编写可以适用于多种数据类型的代码，而不需要为每种类型都写一份。比如，一个 `List<T>` 可以存储整数列表、字符串列表，而不需要写 `IntList` 和 `StringList`。这里的 `T` 就是一个占位符，在使用时我们会告诉它具体是什么类型（比如 `WorkerOps`）。

### 2. 可选链操作符 (?.)

**代码示例**:

```typescript
this.sync?.stop();
this.storages?.local.disconnect();
```

**通俗解释**: `?.` 就像一个“安全检查员”。它表示“如果左边的值不是 `null` 或 `undefined`，那么就继续访问右边的属性或方法；否则，就直接停止，不报错”。这可以避免因为某个对象不存在而导致程序崩溃。

### 3. 空值合并操作符 (??)

**代码示例**:

```typescript
for (const remote of Object.values(this.storages?.remotes ?? {})) {
  // 如果 remotes 是 null/undefined，就使用空对象 {}
}
```

**通俗解释**: `??` 就像一个“备胎”。它表示“如果左边的值是 `null` 或 `undefined`，那么就使用右边的默认值；否则，就使用左边的值”。它比 `||` 更严格，因为 `||` 会把 `0`、空字符串 `''`、`false` 也当作空值。

### 4. 可选调用 (?.)

**代码示例**:

```typescript
collectJobs.get(collectId)?.(awareness);
```

**通俗解释**: 这也是 `?.` 的一种用法，专门用于函数调用。它表示“如果 `collectJobs.get(collectId)` 返回的是一个函数，那么就调用它；否则，什么都不做”。这避免了在调用一个可能不存在的函数时报错。

### 5. 解构赋值

**代码示例**:

```typescript
// 对象解构
'docStorage.getDocDiff': ({ docId, state }) => {
  // 从参数对象中提取 docId 和 state
}

// 等价于
'docStorage.getDocDiff': (params) => {
  const docId = params.docId;
  const state = params.state;
}
```

**通俗解释**: 解构赋值就像“拆包裹”。它允许你从数组或对象中快速提取值，并把它们赋给新的变量。这样代码会更简洁，更容易阅读。

### 6. 箭头函数

**代码示例**:

```typescript
// 箭头函数
const func = param => result;

// 等价于普通函数
const func = function (param) {
  return result;
};
```

**通俗解释**: 箭头函数是一种更简洁的函数写法。它通常用于匿名函数（没有名字的函数），并且有一个重要的特点：它没有自己的 `this`，会继承父作用域的 `this`。这在处理事件回调时非常有用。

### 7. Observable 和 RxJS

**代码示例**:

```typescript
new Observable(subscriber => {
  // subscriber 是观察者，用于发送数据
  subscriber.next(data); // 发送数据
  subscriber.error(error); // 发送错误
  subscriber.complete(); // 完成流

  // 返回清理函数
  return () => {
    // 取消订阅时的清理逻辑
  };
});
```

**通俗解释**: `Observable` 就像一个“数据管道”或“事件流”。它不是一次性返回一个值，而是可以随着时间推移**持续发送**多个值（数据、错误或完成信号）。你可以“订阅”这个管道，当有新数据时就会收到通知。RxJS 是一个库，提供了很多操作 `Observable` 的工具。

### 8. Map 数据结构

**代码示例**:

```typescript
const map = new Map<string, Function>();
map.set('key', value); // 设置值
map.get('key'); // 获取值
map.delete('key'); // 删除值
map.has('key'); // 检查是否存在
```

**通俗解释**: `Map` 是一种比普通 JavaScript 对象更强大的键值对集合。它的“键”可以是任何类型（而不仅仅是字符串），并且它提供了更多方便的方法来操作数据，比如 `size`（大小）、`clear`（清空）等。

### 9. Promise.withResolvers()

**代码示例**:

```typescript
const promise = new Promise<AwarenessRecord | null>(resolve => {
  // resolve 是完成 Promise 的函数
  collectJobs.set(currentCollectId.toString(), awareness => {
    resolve(awareness); // 完成 Promise，返回结果
  });
});
```

**通俗解释**: `Promise` 是处理**异步操作**（比如网络请求、定时器）的一种方式。它代表一个未来才会知道结果的操作。`resolve` 函数就是用来“兑现”这个 Promise 的，当异步操作成功完成时，调用 `resolve` 并传入结果。`Promise.withResolvers()` 是一个较新的 API，它提供了一种更方便的方式来创建 Promise 并获取其 `resolve` 和 `reject` 函数。

### 10. AbortController

**代码示例**:

```typescript
const abortController = new AbortController();
// 用于取消异步操作
someAsyncOperation(abortController.signal);

// 取消操作
return () => abortController.abort(MANUALLY_STOP);
```

**通俗解释**: `AbortController` 就像一个“停止按钮”或“取消信号”。它允许你取消一个或多个正在进行的异步操作（比如 `fetch` 请求）。当你调用 `abortController.abort()` 时，它会发送一个信号，监听这个信号的异步操作就可以选择停止执行。

## 🏗️ NBStore Worker 中的架构模式

除了具体的语法，NBStore Worker 还运用了一些常见的软件设计模式，让代码更健壮、更易于维护。

### 1. 工厂模式

**代码示例**:

```typescript
// StoreManagerConsumer 就是一个工厂
// 根据需要创建和管理 StoreConsumer 实例
if (!storeRef) {
  const store = new StoreConsumer(/* ... */);
  storeRef = { store, refCount: 0 };
}
```

**通俗解释**: 工厂模式就像一个“生产线”。它不直接创建对象，而是提供一个专门的方法来创建对象。这样，创建对象的逻辑被集中管理，当需要创建不同类型的对象时，只需要修改工厂内部的逻辑，而不需要修改使用对象的地方。在这里，`StoreManagerConsumer` 就像一个工厂，负责根据需要“生产”或获取 `StoreConsumer` 实例。

### 2. 引用计数模式

**代码示例**:

```typescript
// 每次使用时增加计数
storeRef.refCount++;

// 不使用时减少计数
storeRef.refCount--;

// 计数为 0 时销毁资源
if (storeRef.refCount === 0) {
  storeRef.store.destroy();
}
```

**通俗解释**: 引用计数模式就像图书馆借书的记录。每当一个资源（比如一个存储实例）被使用时，它的“引用计数”就加 1；当它不再被使用时，计数就减 1。当计数变为 0 时，就表示这个资源已经没人用了，可以安全地销毁并释放内存。这是一种管理资源生命周期的有效方式。

### 3. 观察者模式

**代码示例**:

```typescript
// 订阅数据变化
this.docStorage.subscribeDocUpdate((update, origin) => {
  subscriber.next({ update, origin });
});
```

**通俗解释**: 观察者模式就像“订阅报纸”。当一个对象（“主题”或“发布者”）的状态发生变化时，所有“订阅”了它的对象（“观察者”）都会自动收到通知。这使得对象之间可以松散耦合，当数据发生变化时，相关的部分能够及时响应。在 NBStore Worker 中，它用于订阅文档更新等数据流。

## 📁 相关文件位置

如果你想进一步探索 NBStore Worker 的代码，可以查看以下关键文件：

- **Worker 入口**: [`packages/frontend/apps/web/src/nbstore.worker.ts`](packages/frontend/apps/web/src/nbstore.worker.ts)
- **Worker 加载**: [`packages/frontend/apps/web/src/app.tsx`](packages/frontend/apps/web/src/app.tsx) (第 33-47 行)
- **存储管理**: [`packages/common/nbstore/src/worker/consumer.ts`](packages/common/nbstore/src/worker/consumer.ts)
- **通信框架**: [`packages/common/infra/src/op/`](packages/common/infra/src/op/)
- **URL 生成**: [`packages/common/env/src/worker.ts`](packages/common/env/src/worker.ts)

## 📊 总结

NBStore Worker 是 AFFiNE 架构中的一个核心组件，它为整个应用提供了稳定、高效的数据基础设施。

### NBStore Worker 的核心价值

1.  **性能优化**：将耗时的计算任务转移到独立的 Worker 线程，避免阻塞主界面，提升用户体验。
2.  **数据一致性**：通过统一的存储管理和同步机制，确保数据在不同标签页、不同设备之间保持一致。
3.  **多标签页支持**：利用 SharedWorker 实现跨标签页的数据共享和实时协作。
4.  **离线优先**：数据优先存储在本地，提供强大的离线支持，网络恢复时自动同步。
5.  **可扩展性**：模块化的存储后端设计，使得未来可以轻松扩展新的存储方式或同步功能。

### 技术亮点

- **双模式 Worker**：智能适配 SharedWorker 和普通 Worker。
- **Op 通信框架**：自研的类型安全、高效的 RPC（远程过程调用）通信机制。
- **存储抽象**：统一的存储接口，支持 IndexedDB、BroadcastChannel、云端等多种后端。
- **引用计数**：智能的资源管理和自动清理机制，避免内存泄漏。
- **流式数据**：支持 Observable 的实时数据流，处理复杂异步场景。
- **高级 TypeScript/JavaScript 语法**：充分利用泛型、可选链、空值合并、解构赋值、Promise、AbortController 等现代语法，提升代码质量和可维护性。

### 适用场景

NBStore Worker 的设计使其非常适合以下类型的应用：

- 大型文档编辑应用（如 AFFiNE）。
- 需要多标签页实时协作的应用。
- 对离线支持有高要求的 Web 应用。
- 数据密集型的前端应用。

希望这份指南能帮助你更好地理解 NBStore Worker！如果你有任何疑问，欢迎继续探索和学习。
