# @toeverything/infra Op 模块技术备忘录

## 📋 概览

Op 模块（Operation Pattern）是 @toeverything/infra 的轻量级 RPC 框架，支持前端和后端通信。它通过简单的 call 和 listen 签名，让 Worker、跨标签页 SharedWorker 或 BroadcastChannel 的使用变得更简单，减少了样板代码。

### 模块信息

- **模块路径**: `packages/common/infra/src/op/`
- **导出内容**: OpClient, OpConsumer, MessageCommunicapable, transfer
- **核心功能**: RPC 通信、跨线程通信、流式数据传输

### 文件结构

```
op/
├── README.md          # 模块文档和使用示例
├── client.ts          # OpClient 客户端实现
├── consumer.ts        # OpConsumer 服务端实现
├── message.ts         # 消息定义和处理器基类
├── types.ts           # TypeScript 类型定义
├── index.ts           # 模块导出
└── __tests__/         # 单元测试
    ├── client.spec.ts
    ├── consumer.spec.ts
    └── message.spec.ts
```

## 🏗️ 核心架构

### 设计理念

Op 模块基于 **生产者-消费者模式** 设计，通过标准化的消息协议实现跨线程、跨进程的 RPC 通信：

- **OpClient**: 消息生产者，发起远程调用和订阅
- **OpConsumer**: 消息消费者，注册处理器响应调用
- **Message Protocol**: 统一的消息协议，支持调用、订阅、传输等操作
- **Transferable Objects**: 支持高效的二进制数据传输

### 消息类型系统

#### 生产者消息（OpClient 发送）

```typescript
// 函数调用消息
interface CallMessage {
  type: 'call';
  id: string; // 唯一调用ID
  name: string; // 操作名称
  payload: any; // 调用参数
}

// 流订阅消息
interface SubscribeMessage {
  type: 'subscribe';
  id: string;
  name: string;
  payload: any;
}

// 取消操作消息
interface CancelMessage {
  type: 'cancel';
  id: string;
}

// 取消订阅消息
interface UnsubscribeMessage {
  type: 'unsubscribe';
  id: string;
}
```

#### 消费者消息（OpConsumer 发送）

```typescript
// 函数返回消息
type ReturnMessage = {
  type: 'return';
  id: string;
} & ({ data: any } | { error: Error });

// 流数据消息
interface SubscriptionNextMessage {
  type: 'next';
  id: string;
  data: any;
}

// 流错误消息
interface SubscriptionErrorMessage {
  type: 'error';
  id: string;
  error: Error;
}

// 流完成消息
interface SubscriptionCompleteMessage {
  type: 'complete';
  id: string;
}
```

## 🔧 核心类详解

### 1. OpSchema 类型定义

操作模式的类型约束系统，确保类型安全的 RPC 调用：

```typescript
export interface OpSchema {
  [key: string]: [any, any?]; // [输入类型, 输出类型]
}

// 定义操作接口
interface MyOps extends OpSchema {
  add: [{ a: number; b: number }, number]; // 函数调用
  getUserInfo: [{ userId: string }, UserInfo]; // 异步调用
  subscribeStatus: [number, string]; // 流式订阅
}
```

#### 高级类型推导

```typescript
// 提取操作名称
type OpNames<T extends OpSchema> = ValuesOf<KeyToKey<T>>;

// 提取输入类型
type OpInput<Ops extends OpSchema, Type extends OpNames<Ops>> = Type extends keyof Ops ? (Ops[Type] extends [infer In] ? RequiredInput<In> : Ops[Type] extends [infer In, infer _Out] ? RequiredInput<In> : never) : never;

// 提取输出类型
type OpOutput<Ops extends OpSchema, Type extends OpNames<Ops>> = Type extends keyof Ops ? (Ops[Type] extends [infer _In, infer Out] ? Out : never) : never;
```

### 2. OpClient - RPC 客户端

负责发起远程调用和管理响应：

#### 核心特性

- **函数调用**: 支持异步函数调用，返回 Promise
- **流式订阅**: 支持 Observable 流数据订阅
- **超时控制**: 可配置调用超时时间
- **取消机制**: 支持手动取消正在进行的调用
- **Transferable 支持**: 高效传输二进制数据

#### 基本用法

```typescript
const client = new OpClient<MyOps>(messagePort, {
  timeout: 5000, // 5秒超时
});

// 函数调用
const result = await client.call('add', { a: 1, b: 2 });
console.log(result); // 3

// 带取消的调用
const abortController = new AbortController();
const promise = client.call('getUserInfo', { userId: '123' }, abortController.signal);

// 取消调用
abortController.abort();

// 流式订阅
client.ob$('subscribeStatus', 123).subscribe({
  next: status => console.log('状态:', status),
  error: err => console.error('错误:', err),
  complete: () => console.log('完成'),
});
```

#### 可取消Promise

```typescript
interface CancelablePromise<T> extends Promise<T> {
  cancel(): void;
}

// 返回可取消的Promise
const promise = client.call('heavyOperation', data);
promise.cancel(); // 手动取消
```

#### 内部机制

```typescript
class OpClient<Ops extends OpSchema> extends AutoMessageHandler {
  private readonly callIds = new Map<OpNames<Ops>, number>(); // 调用ID计数器
  private readonly pendingCalls = new Map<string, PendingCall>(); // 待处理调用
  private readonly obs = new Map<string, Observer<any>>(); // 流订阅管理

  // 生成唯一调用ID
  protected nextCallId(op: OpNames<Ops>) {
    let id = this.callIds.get(op) ?? 0;
    id++;
    this.callIds.set(op, id);
    return `${op}:${id}`;
  }

  // 处理返回消息
  private readonly handleReturnMessage: MessageHandlers['return'] = msg => {
    const pending = this.pendingCalls.get(msg.id);
    if (!pending) return;

    if ('error' in msg) {
      pending.reject(msg.error);
    } else {
      pending.resolve(msg.data);
    }
    clearTimeout(pending.timeout);
    this.pendingCalls.delete(msg.id);
  };
}
```

### 3. OpConsumer - RPC 服务端

负责注册操作处理器和处理客户端请求：

#### 核心特性

- **处理器注册**: 支持函数、Promise、Observable 处理器
- **生命周期钩子**: before/after 事件钩子
- **并发控制**: 自动管理并发处理和取消
- **错误处理**: 统一的错误处理和传播机制

#### 处理器类型

```typescript
// 处理器类型定义
export type OpHandler<Ops extends OpSchema, Op extends OpNames<Ops>> = (
  payload: OpInput<Ops, Op>[0],
  ctx: OpCallContext
) =>
  | OpOutput<Ops, Op> // 同步返回
  | Promise<OpOutput<Ops, Op>> // 异步返回
  | Observable<OpOutput<Ops, Op>>; // 流式返回

interface OpCallContext {
  signal: AbortSignal; // 取消信号
}
```

#### 基本用法

```typescript
const consumer = new OpConsumer<MyOps>(messagePort);

// 同步函数处理器
consumer.register('add', ({ a, b }) => a + b);

// 异步处理器
consumer.register('getUserInfo', async ({ userId }, { signal }) => {
  if (signal.aborted) throw new Error('取消');

  const user = await fetchUser(userId);
  return user;
});

// 流式处理器
consumer.register('subscribeStatus', userId => {
  return interval(1000).pipe(
    map(() => `用户${userId}在线`),
    takeWhile(() => !ctx.signal.aborted)
  );
});

// 批量注册
consumer.registerAll({
  add: ({ a, b }) => a + b,
  multiply: ({ a, b }) => a * b,
  getUserInfo: async ({ userId }) => await fetchUser(userId),
});
```

#### 生命周期钩子

```typescript
// 执行前钩子
consumer.before('getUserInfo', payload => {
  console.log('开始获取用户信息:', payload.userId);
});

// 执行后钩子
consumer.after('getUserInfo', (payload, result) => {
  console.log('获取用户信息完成:', payload.userId, result);
});
```

#### 内部处理机制

```typescript
class OpConsumer<Ops extends OpSchema> extends AutoMessageHandler {
  private readonly registeredOpHandlers = new Map<OpNames<Ops>, OpHandler<Ops, any>>();
  private readonly processing = new Map<string, AbortController>(); // 处理中的操作

  // 处理调用消息
  private readonly handleCallMessage: MessageHandlers['call'] = msg => {
    const abortController = new AbortController();
    this.processing.set(msg.id, abortController);

    this.eventBus.emit(`before:${msg.name}`, msg.payload);
    this.ob$(msg, abortController.signal)
      .pipe(take(1)) // 函数调用只取第一个值
      .subscribe({
        next: data => {
          this.eventBus.emit(`after:${msg.name}`, msg.payload, data);
          const transferables = fetchTransferables(data);
          this.port.postMessage(
            {
              type: 'return',
              id: msg.id,
              data,
            },
            { transfer: transferables }
          );
        },
        error: error => {
          this.port.postMessage({
            type: 'return',
            id: msg.id,
            error: error as Error,
          });
        },
        complete: () => {
          this.processing.delete(msg.id);
        },
      });
  };

  // 统一的处理器执行逻辑
  ob$(op: CallMessage | SubscribeMessage, signal: AbortSignal) {
    return defer(() => {
      const handler = this.registeredOpHandlers.get(op.name as any);
      if (!handler) {
        throw new Error(`Handler for operation [${op.name}] is not registered.`);
      }

      const ret$ = handler(op.payload, { signal });

      // 统一转换为Observable
      let ob$: Observable<any>;
      if (ret$ instanceof Promise) {
        ob$ = from(ret$);
      } else if (ret$ instanceof Observable) {
        ob$ = ret$;
      } else {
        ob$ = of(ret$);
      }

      return ob$.pipe(takeUntil(fromEvent(signal, 'abort')));
    });
  }
}
```

### 4. AutoMessageHandler - 消息处理基类

提供统一的消息监听和处理能力：

```typescript
export abstract class AutoMessageHandler {
  private listening = false;
  protected abstract handlers: Partial<MessageHandlers>;

  constructor(protected readonly port: MessageCommunicapable) {
    this.listen();
  }

  // 统一的消息处理入口
  protected handleMessage = ignoreUnknownEvent((msg: Messages) => {
    const handler = this.handlers[msg.type];
    if (!handler) return;
    handler(msg as any);
  });

  protected listen() {
    if (this.listening) return;

    this.port.addEventListener('message', this.handleMessage);
    this.port.addEventListener('messageerror', console.error);
    this.port.start?.();
    this.listening = true;
  }

  close() {
    this.port.close?.();
    this.port.terminate?.(); // For Worker
    this.port.removeEventListener('message', this.handleMessage);
    this.port.removeEventListener('messageerror', console.error);
    this.listening = false;
  }
}
```

### 5. Transferable Objects 支持

高效的二进制数据传输机制：

```typescript
// 标记可传输对象
const TRANSFERABLES_CACHE = new Map<any, Transferable[]>();

export function transfer<T>(data: T, transferables: Transferable[]): T {
  TRANSFERABLES_CACHE.set(data, transferables);
  return data;
}

// 获取并清理可传输对象
export function fetchTransferables(data: any): Transferable[] | undefined {
  const transferables = TRANSFERABLES_CACHE.get(data);
  if (transferables) {
    TRANSFERABLES_CACHE.delete(data);
  }
  return transferables;
}
```

#### 使用示例

```typescript
// 客户端传输大型数据
const client = new OpClient<Ops>(worker);
const data = new Uint8Array([1, 2, 3, 4, 5]);
const result = await client.call(
  'processData',
  transfer({ data }, [data.buffer]) // 转移所有权
);

console.log(data.byteLength); // 0 - 数据已被转移

// 服务端返回可传输数据
consumer.register('generateData', () => {
  const result = new Uint8Array(1000);
  return transfer(result, [result.buffer]);
});
```

## 🌐 通信适配器

### 支持的通信方式

#### 1. MessageChannel

```typescript
const { port1, port2 } = new MessageChannel();

const client = new OpClient(port1);
const consumer = new OpConsumer(port2);
```

#### 2. Worker

```typescript
// 主线程
const worker = new Worker('./worker.js');
const client = new OpClient(worker);

// worker.js
const consumer = new OpConsumer(globalThis);
consumer.listen();
```

#### 3. SharedWorker

```typescript
// 主线程
const worker = new SharedWorker('./shared-worker.js');
const client = new OpClient(worker.port);

// shared-worker.js
globalThis.addEventListener('connect', event => {
  const port = event.ports[0];
  const consumer = new OpConsumer(port);
  consumer.listen();
});
```

#### 4. BroadcastChannel

```typescript
const channel = new BroadcastChannel('my-domain');

// 页面A
const consumer = new OpConsumer(channel);
consumer.listen();

// 页面B
const client = new OpClient(channel);
client.listen();
```

### MessageCommunicapable 接口

统一的通信接口，兼容各种消息传递机制：

```typescript
export type MessageCommunicapable = Pick<MessagePort, 'postMessage' | 'addEventListener' | 'removeEventListener'> & {
  start?(): void; // MessagePort 需要
  close?(): void; // MessagePort, BroadcastChannel
  terminate?(): void; // Worker 需要
};
```

## 🎯 使用场景

### 1. Web Worker 计算密集型任务

```typescript
// 主线程 - main.ts
interface ComputeOps extends OpSchema {
  fibonacci: [{ n: number }, number];
  primeFactors: [{ num: number }, number[]];
}

const worker = new Worker('./compute-worker.js');
const client = new OpClient<ComputeOps>(worker);

// 计算斐波那契数列
const result = await client.call('fibonacci', { n: 40 });
console.log(`第40项: ${result}`);

// compute-worker.js
const consumer = new OpConsumer<ComputeOps>(globalThis);

consumer.register('fibonacci', ({ n }) => {
  function fib(num: number): number {
    if (num <= 1) return num;
    return fib(num - 1) + fib(num - 2);
  }
  return fib(n);
});

consumer.register('primeFactors', ({ num }) => {
  const factors = [];
  for (let i = 2; i <= num; i++) {
    while (num % i === 0) {
      factors.push(i);
      num /= i;
    }
  }
  return factors;
});
```

### 2. 跨标签页状态同步

```typescript
// 定义跨页面操作
interface CrossTabOps extends OpSchema {
  syncUserData: [{ userId: string; data: UserData }, void];
  subscribeUserChanges: [{ userId: string }, UserData];
  broadcastMessage: [{ message: string }, void];
}

// 页面A - 数据提供者
const channel = new BroadcastChannel('user-sync');
const consumer = new OpConsumer<CrossTabOps>(channel);

let userData: UserData = { name: 'Alice', status: 'online' };

consumer.register('syncUserData', ({ userId, data }) => {
  userData = data;
  // 广播给其他页面
  broadcastUserChange(data);
});

consumer.register('subscribeUserChanges', ({ userId }) => {
  return interval(1000).pipe(
    map(() => userData),
    distinctUntilChanged()
  );
});

// 页面B - 数据消费者
const client = new OpClient<CrossTabOps>(channel);

// 订阅用户数据变化
client.ob$('subscribeUserChanges', { userId: '123' }).subscribe(data => {
  updateUI(data);
});

// 更新用户数据
await client.call('syncUserData', {
  userId: '123',
  data: { name: 'Alice', status: 'busy' },
});
```

### 3. 文件处理管道

```typescript
interface FileOps extends OpSchema {
  uploadFile: [{ file: File }, { id: string; url: string }];
  processImage: [{ imageData: Uint8Array; options: ProcessOptions }, Uint8Array];
  monitorProgress: [{ taskId: string }, ProgressUpdate];
}

// 文件处理服务
const worker = new Worker('./file-processor.js');
const client = new OpClient<FileOps>(worker);

// 上传并处理图片
async function processUserImage(file: File) {
  try {
    // 1. 上传文件
    const uploadResult = await client.call('uploadFile', { file });
    console.log('上传完成:', uploadResult.url);

    // 2. 监听处理进度
    const progress$ = client.ob$('monitorProgress', { taskId: uploadResult.id });
    progress$.subscribe(progress => {
      updateProgressBar(progress.percentage);
    });

    // 3. 处理图片
    const imageData = await file.arrayBuffer();
    const processedData = await client.call(
      'processImage',
      transfer(
        {
          imageData: new Uint8Array(imageData),
          options: { resize: true, quality: 0.8 },
        },
        [imageData]
      )
    );

    return processedData;
  } catch (error) {
    console.error('处理失败:', error);
  }
}
```

### 4. 实时数据流

```typescript
interface StreamOps extends OpSchema {
  subscribeStock: [{ symbol: string }, { price: number; timestamp: number }];
  subscribeChat: [{ roomId: string }, ChatMessage];
  sendMessage: [{ roomId: string; message: string }, void];
}

// 实时数据服务
const socket = new WebSocket('ws://localhost:8080');
const client = new OpClient<StreamOps>(adaptWebSocketToMessagePort(socket));

// 订阅股票价格
client.ob$('subscribeStock', { symbol: 'AAPL' }).subscribe(data => {
  updateStockPrice('AAPL', data.price);
});

// 订阅聊天消息
client.ob$('subscribeChat', { roomId: 'general' }).subscribe(message => {
  displayChatMessage(message);
});

// 发送消息
await client.call('sendMessage', {
  roomId: 'general',
  message: 'Hello everyone!',
});
```

## 🚀 最佳实践

### 1. 错误处理策略

```typescript
// 统一错误处理
consumer.register('riskyOperation', async ({ data }, { signal }) => {
  try {
    // 检查取消状态
    if (signal.aborted) {
      throw new Error('操作已取消');
    }

    const result = await performRiskyTask(data);
    return result;
  } catch (error) {
    // 记录错误
    logger.error('操作失败:', error);

    // 重新抛出标准化错误
    throw new Error(`操作失败: ${error.message}`);
  }
});

// 客户端错误处理
try {
  const result = await client.call('riskyOperation', { data });
  handleSuccess(result);
} catch (error) {
  if (error.message === '操作已取消') {
    handleCancellation();
  } else {
    handleError(error);
  }
}
```

### 2. 超时和重试机制

```typescript
// 带重试的客户端包装
class RobustOpClient<T extends OpSchema> {
  constructor(
    private client: OpClient<T>,
    private options = { maxRetries: 3, baseDelay: 1000 }
  ) {}

  async callWithRetry<Op extends OpNames<T>>(op: Op, ...args: OpInputWithSignal<T, Op>): Promise<OpOutput<T, Op>> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await this.client.call(op, ...args);
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.options.maxRetries) {
          const delay = this.options.baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}

// 使用示例
const robustClient = new RobustOpClient(client);
const result = await robustClient.callWithRetry('unstableOperation', data);
```

### 3. 类型安全的操作定义

```typescript
// 创建类型安全的操作工厂
function createTypedOps<T extends OpSchema>() {
  return {
    createClient: (port: MessageCommunicapable, options?: OpClientOptions) => new OpClient<T>(port, options),
    createConsumer: (port: MessageCommunicapable) => new OpConsumer<T>(port),
  };
}

// 定义业务操作接口
interface UserOps extends OpSchema {
  getUser: [{ id: string }, User];
  updateUser: [{ id: string; data: Partial<User> }, User];
  deleteUser: [{ id: string }, void];
  subscribeUserEvents: [{ id: string }, UserEvent];
}

// 创建类型化实例
const { createClient, createConsumer } = createTypedOps<UserOps>();
const userClient = createClient(worker);
const userConsumer = createConsumer(globalThis);
```

### 4. 资源管理和清理

```typescript
// 资源管理器
class OpResourceManager {
  private clients = new Set<OpClient<any>>();
  private consumers = new Set<OpConsumer<any>>();

  createClient<T extends OpSchema>(port: MessageCommunicapable) {
    const client = new OpClient<T>(port);
    this.clients.add(client);
    return client;
  }

  createConsumer<T extends OpSchema>(port: MessageCommunicapable) {
    const consumer = new OpConsumer<T>(port);
    this.consumers.add(consumer);
    return consumer;
  }

  // 清理所有资源
  cleanup() {
    this.clients.forEach(client => client.destroy());
    this.consumers.forEach(consumer => consumer.destroy());
    this.clients.clear();
    this.consumers.clear();
  }
}

// 页面卸载时清理
const resourceManager = new OpResourceManager();
window.addEventListener('beforeunload', () => {
  resourceManager.cleanup();
});
```

### 5. 调试和监控

```typescript
// 调试友好的 Consumer
class DebuggableOpConsumer<T extends OpSchema> extends OpConsumer<T> {
  constructor(
    port: MessageCommunicapable,
    private debugName: string
  ) {
    super(port);
  }

  override register<Op extends OpNames<T>>(op: Op, handler: OpHandler<T, Op>) {
    // 包装处理器添加日志
    const wrappedHandler: OpHandler<T, Op> = async (payload, ctx) => {
      const startTime = performance.now();
      console.log(`[${this.debugName}] 开始处理 ${op}:`, payload);

      try {
        const result = await handler(payload, ctx);
        const duration = performance.now() - startTime;
        console.log(`[${this.debugName}] 完成处理 ${op} (${duration.toFixed(2)}ms):`, result);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`[${this.debugName}] 处理失败 ${op} (${duration.toFixed(2)}ms):`, error);
        throw error;
      }
    };

    super.register(op, wrappedHandler);
  }
}

// 使用示例
const debugConsumer = new DebuggableOpConsumer(worker, 'FileProcessor');
```

## 📝 注意事项

### 1. Transferable Objects 限制

- 数据传输后原对象将失效（byteLength = 0）
- BroadcastChannel 不支持 Transferable Objects
- 只有 ArrayBuffer、MessagePort 等特定类型支持转移

### 2. 内存管理

- 及时调用 `destroy()` 方法清理资源
- 避免长时间持有大量 Observable 订阅
- 合理设置超时时间，避免内存泄漏

### 3. 错误处理

- Promise 和 Observable 的错误需要分别处理
- 网络断开可能导致消息丢失
- 跨线程错误序列化可能丢失堆栈信息

### 4. 性能考虑

- 避免频繁的小数据传输
- 合理使用 Transferable Objects 减少拷贝开销
- 长时间运行的流式操作要考虑背压处理

---

_最后更新: 2024年12月_
