// 导入操作消费者，用于处理来自主线程的操作请求
import { OpConsumer } from '@toeverything/infra/op';
// 导入 RxJS 的 Observable，用于处理异步数据流
import { Observable } from 'rxjs';

// 导入存储构造器类型，定义了存储实现的接口
import { type StorageConstructor } from '../impls';
// 导入空间存储，管理一个工作空间的所有存储类型
import { SpaceStorage } from '../storage';
// 导入感知记录类型，用于多用户协作时的用户状态信息
import type { AwarenessRecord } from '../storage/awareness';
// 导入同步管理器，负责本地和远程数据的同步
import { Sync } from '../sync';
// 导入对等存储选项类型，定义本地和远程存储的配置
import type { PeerStorageOptions } from '../sync/types';
// 导入手动停止常量，用于标识主动取消的操作
import { MANUALLY_STOP } from '../utils/throw-if-aborted';
// 导入操作类型定义
import type { StoreInitOptions, WorkerManagerOps, WorkerOps } from './ops';

// 重新导出 WorkerManagerOps 类型，供外部使用
export type { WorkerManagerOps };

/**
 * 存储消费者类
 *
 * 这个类是 Worker 中的核心组件，负责：
 * 1. 管理各种存储后端（文档、Blob、感知、索引等）
 * 2. 处理来自主线程的存储操作请求
 * 3. 管理本地和远程存储的同步
 *
 * 通俗理解：就像一个仓库管理员，负责处理所有的存取请求
 */
class StoreConsumer {
  // 存储配置，包含本地存储和远程存储
  // readonly 表示这个属性只能在构造函数中赋值，之后不能修改
  private readonly storages: PeerStorageOptions<SpaceStorage>;
  // 同步管理器，负责数据在不同存储间的同步
  private readonly sync: Sync;

  /**
   * 获取本地存储，带安全检查
   *
   * get 关键字定义了一个 getter 属性，可以像访问属性一样调用
   * 例如：consumer.ensureLocal 而不是 consumer.ensureLocal()
   */
  get ensureLocal() {
    if (!this.storages) {
      throw new Error('Not initialized');
    }
    return this.storages.local;
  }

  /**
   * 获取同步管理器，带安全检查
   */
  get ensureSync() {
    if (!this.sync) {
      throw new Error('Sync not initialized');
    }
    return this.sync;
  }

  /**
   * 获取文档存储
   *
   * 文档存储负责保存和管理文档的内容数据
   */
  get docStorage() {
    return this.ensureLocal.get('doc');
  }

  /**
   * 获取文档同步器
   *
   * 文档同步器负责文档数据在本地和远程之间的同步
   */
  get docSync() {
    return this.ensureSync.doc;
  }

  /**
   * 获取 Blob 存储
   *
   * Blob 存储负责保存二进制文件，如图片、附件等
   */
  get blobStorage() {
    return this.ensureLocal.get('blob');
  }

  /**
   * 获取 Blob 同步器
   */
  get blobSync() {
    return this.ensureSync.blob;
  }

  /**
   * 获取文档同步状态存储
   *
   * 这个存储保存文档的同步状态信息，如最后同步时间等
   */
  get docSyncStorage() {
    return this.ensureLocal.get('docSync');
  }

  /**
   * 获取感知存储
   *
   * 感知存储保存用户的实时状态信息，如光标位置、选择范围等
   * 用于多用户协作时显示其他用户的操作状态
   */
  get awarenessStorage() {
    return this.ensureLocal.get('awareness');
  }

  /**
   * 获取感知同步器
   */
  get awarenessSync() {
    return this.ensureSync.awareness;
  }

  /**
   * 获取索引存储
   *
   * 索引存储用于全文搜索和数据查询的索引信息
   */
  get indexerStorage() {
    return this.ensureLocal.get('indexer');
  }

  /**
   * 获取索引同步器
   */
  get indexerSync() {
    return this.ensureSync.indexer;
  }

  /**
   * 构造函数 - 初始化存储消费者
   *
   * @param availableStorageImplementations 可用的存储实现列表
   * @param init 存储初始化选项
   */
  constructor(
    // private readonly 表示这是一个私有的只读属性，只能在类内部访问
    private readonly availableStorageImplementations: StorageConstructor[],
    init: StoreInitOptions
  ) {
    // 初始化存储配置
    this.storages = {
      // 配置本地存储
      local: new SpaceStorage(
        // Object.fromEntries 将键值对数组转换为对象
        // 这里是一个复杂的数据转换过程，让我们分步解释：
        Object.fromEntries(
          // Object.entries 将对象转换为键值对数组
          // 例如：{doc: {name: 'idb', opts: {}}} => [['doc', {name: 'idb', opts: {}}]]
          Object.entries(init.local).map(([type, opt]) => {
            // 如果配置为 undefined，直接返回 undefined
            if (opt === undefined) {
              return [type, undefined];
            }

            // 根据存储名称查找对应的存储实现类
            // find 方法查找数组中第一个满足条件的元素
            const Storage = this.availableStorageImplementations.find(
              impl => impl.identifier === opt.name
            );

            // 如果找不到对应的存储实现，抛出错误
            if (!Storage) {
              throw new Error(`Storage implementation ${opt.name} not found`);
            }

            // 返回存储类型和对应的存储实例
            // new Storage(opt.opts as any) 创建存储实例
            return [type, new Storage(opt.opts as any)];
          })
        )
      ),

      // 配置远程存储（可能有多个远程节点）
      remotes: Object.fromEntries(
        // 遍历每个远程节点的配置
        Object.entries(init.remotes).map(([peer, opts]) => {
          return [
            peer, // 远程节点的名称
            // 为每个远程节点创建一个 SpaceStorage
            new SpaceStorage(
              // 和本地存储类似的配置过程
              Object.fromEntries(
                Object.entries(opts).map(([type, opt]) => {
                  if (opt === undefined) {
                    return [type, undefined];
                  }

                  // 查找存储实现
                  const Storage = this.availableStorageImplementations.find(
                    impl => impl.identifier === opt.name
                  );

                  if (!Storage) {
                    throw new Error(
                      `Storage implementation ${opt.name} not found`
                    );
                  }

                  // 创建存储实例
                  return [type, new Storage(opt.opts as any)];
                })
              )
            ),
          ];
        })
      ),
    };

    // 创建同步管理器，传入所有存储配置
    this.sync = new Sync(this.storages);

    // 连接本地存储
    this.storages.local.connect();

    // 连接所有远程存储
    // Object.values 获取对象的所有值（这里是所有远程存储实例）
    for (const remote of Object.values(this.storages.remotes)) {
      remote.connect();
    }

    // 启动数据同步
    this.sync.start();
  }

  /**
   * 绑定操作消费者
   *
   * 这个方法将 OpConsumer 与当前的存储消费者绑定，
   * 使得主线程可以通过 OpConsumer 调用存储操作
   *
   * @param consumer 操作消费者实例
   */
  bindConsumer(consumer: OpConsumer<WorkerOps>) {
    // 注册所有的操作处理器
    this.registerHandlers(consumer);
  }

  /**
   * 销毁存储消费者
   *
   * 清理所有资源，包括停止同步、断开连接、销毁存储实例
   * async 关键字表示这是一个异步方法，返回 Promise
   */
  async destroy() {
    // ?. 是可选链操作符，如果 this.sync 为 null/undefined 则不执行 stop()
    this.sync?.stop();

    // 断开本地存储连接
    this.storages?.local.disconnect();

    // await 等待异步操作完成
    await this.storages?.local.destroy();

    // 销毁所有远程存储
    // ?? {} 是空值合并操作符，如果左边为 null/undefined 则使用右边的默认值
    for (const remote of Object.values(this.storages?.remotes ?? {})) {
      remote.disconnect();
      await remote.destroy();
    }
  }

  /**
   * 注册操作处理器
   *
   * 这是整个类最复杂的方法，它注册了所有可以从主线程调用的存储操作。
   * 每个操作都对应一个处理函数，当主线程发送操作请求时，这些处理函数会被调用。
   *
   * @param consumer 操作消费者，用于注册处理器
   */
  private registerHandlers(consumer: OpConsumer<WorkerOps>) {
    // 收集任务映射表，用于处理感知数据的异步收集
    // Map 是一种键值对数据结构，类似于对象但功能更强大
    const collectJobs = new Map<
      string, // 收集任务的 ID
      (awareness: AwarenessRecord | null) => void // 收集完成时的回调函数
    >();

    // 收集任务的计数器，用于生成唯一的收集 ID
    let collectId = 0;

    // registerAll 方法一次性注册多个操作处理器
    // 这里使用对象字面量语法，键是操作名称，值是处理函数
    consumer.registerAll({
      // === 文档存储相关操作 ===

      /**
       * 获取文档内容
       * 箭头函数语法：(参数) => 返回值
       * 等价于：function(docId) { return this.docStorage.getDoc(docId); }
       */
      'docStorage.getDoc': (docId: string) => this.docStorage.getDoc(docId),

      /**
       * 获取文档差异
       * 解构赋值语法：{ docId, state } 从参数对象中提取 docId 和 state 属性
       */
      'docStorage.getDocDiff': ({ docId, state }) =>
        this.docStorage.getDocDiff(docId, state),

      /**
       * 推送文档更新
       * update: 文档的更新数据
       * origin: 更新的来源（如用户ID、设备ID等）
       */
      'docStorage.pushDocUpdate': ({ update, origin }) =>
        this.docStorage.pushDocUpdate(update, origin),

      /**
       * 获取文档时间戳列表
       * ?? undefined 是空值合并，如果 after 为 null 则使用 undefined
       */
      'docStorage.getDocTimestamps': after =>
        this.docStorage.getDocTimestamps(after ?? undefined),

      /**
       * 获取单个文档的时间戳
       */
      'docStorage.getDocTimestamp': docId =>
        this.docStorage.getDocTimestamp(docId),

      /**
       * 删除文档
       */
      'docStorage.deleteDoc': (docId: string) =>
        this.docStorage.deleteDoc(docId),

      /**
       * 订阅文档更新（返回 Observable 流）
       *
       * Observable 是 RxJS 的核心概念，表示一个可观察的数据流
       * 类似于 Promise，但可以发出多个值
       */
      'docStorage.subscribeDocUpdate': () =>
        new Observable(subscriber => {
          // subscriber 是观察者，用于发送数据
          // 这里订阅底层存储的文档更新事件
          return this.docStorage.subscribeDocUpdate((update, origin) => {
            // subscriber.next() 向观察者发送新数据
            subscriber.next({ update, origin });
          });
        }),

      /**
       * 等待文档存储连接建立
       * _ 表示忽略第一个参数
       * ctx.signal 是 AbortSignal，用于取消操作
       */
      'docStorage.waitForConnected': (_, ctx) =>
        this.docStorage.connection.waitForConnected(ctx.signal),
      // === Blob 存储相关操作 ===

      /**
       * 获取 Blob 数据
       * Blob 通常是二进制大对象，如图片、文件等
       */
      'blobStorage.getBlob': key => this.blobStorage.get(key),

      /**
       * 存储 Blob 数据
       */
      'blobStorage.setBlob': blob => this.blobStorage.set(blob),

      /**
       * 删除 Blob 数据
       * permanently: 是否永久删除（否则可能只是标记删除）
       */
      'blobStorage.deleteBlob': ({ key, permanently }) =>
        this.blobStorage.delete(key, permanently),

      /**
       * 释放 Blob 资源
       * 清理不再使用的 Blob 数据，释放存储空间
       */
      'blobStorage.releaseBlobs': () => this.blobStorage.release(),

      /**
       * 列出所有 Blob
       */
      'blobStorage.listBlobs': () => this.blobStorage.list(),

      /**
       * 等待 Blob 存储连接建立
       */
      'blobStorage.waitForConnected': (_, ctx) =>
        this.blobStorage.connection.waitForConnected(ctx.signal),

      // === 感知存储相关操作 ===

      /**
       * 更新感知信息
       * 感知信息包括用户的光标位置、选择范围等实时状态
       */
      'awarenessStorage.update': ({ awareness, origin }) =>
        this.awarenessStorage.update(awareness, origin),

      /**
       * 订阅感知更新（复杂的异步处理）
       *
       * 这是一个比较复杂的操作，涉及到异步数据收集
       */
      'awarenessStorage.subscribeUpdate': docId =>
        new Observable(subscriber => {
          // 订阅感知存储的更新事件
          return this.awarenessStorage.subscribeUpdate(
            docId,
            // 当有感知更新时的回调
            (update, origin) => {
              subscriber.next({
                type: 'awareness-update', // 标记这是感知更新事件
                awareness: update,
                origin,
              });
            },
            // 当需要收集感知数据时的回调
            // 这是一个高阶函数，返回一个 Promise
            () => {
              // 生成唯一的收集 ID
              // collectId++ 是后置递增，先使用当前值，然后加1
              const currentCollectId = collectId++;

              // 创建一个 Promise 来处理异步收集
              const promise = new Promise<AwarenessRecord | null>(resolve => {
                // 将收集任务存储到 Map 中
                // 当收集完成时，会调用这个回调函数
                collectJobs.set(currentCollectId.toString(), awareness => {
                  resolve(awareness); // 完成 Promise
                  collectJobs.delete(currentCollectId.toString()); // 清理任务
                });
              });

              return promise;
            }
          );
        }),

      /**
       * 收集感知数据
       * 这个操作与上面的订阅配合使用，完成异步数据收集
       */
      'awarenessStorage.collect': ({ collectId, awareness }) =>
        // ?. 是可选链，如果找不到对应的收集任务则不执行
        // ?.(awareness) 是可选调用，如果函数存在则调用
        collectJobs.get(collectId)?.(awareness),

      /**
       * 等待感知存储连接建立
       */
      'awarenessStorage.waitForConnected': (_, ctx) =>
        this.awarenessStorage.connection.waitForConnected(ctx.signal),
      // === 文档同步相关操作 ===

      /**
       * 获取文档同步状态流
       * state$ 是一个 Observable，$ 后缀是 RxJS 的命名约定，表示这是一个流
       */
      'docSync.state': () => this.docSync.state$,

      /**
       * 获取特定文档的同步状态流
       */
      'docSync.docState': docId =>
        new Observable(subscriber => {
          // 订阅底层的文档状态流
          const subscription = this.docSync
            .docState$(docId)
            .subscribe(state => {
              // 将状态转发给上层订阅者
              subscriber.next(state);
            });

          // 返回清理函数，当 Observable 被取消订阅时调用
          return () => subscription.unsubscribe();
        }),

      /**
       * 添加文档同步优先级
       *
       * 这个操作返回一个 Observable，当订阅时添加优先级，取消订阅时移除优先级
       */
      'docSync.addPriority': ({ docId, priority }) =>
        new Observable(() => {
          // 添加优先级，返回撤销函数
          const undo = this.docSync.addPriority(docId, priority);

          // 返回清理函数，取消订阅时调用撤销函数
          return () => undo();
        }),

      /**
       * 等待文档同步完成
       */
      'docSync.waitForSynced': (docId, ctx) =>
        this.docSync.waitForSynced(docId ?? undefined, ctx.signal),

      /**
       * 重置同步状态
       */
      'docSync.resetSync': () => this.docSync.resetSync(),

      // === Blob 同步相关操作 ===

      /**
       * 获取 Blob 同步状态流
       */
      'blobSync.state': () => this.blobSync.state$,

      /**
       * 获取特定 Blob 的同步状态
       */
      'blobSync.blobState': blobId => this.blobSync.blobState$(blobId),

      /**
       * 下载 Blob
       */
      'blobSync.downloadBlob': key => this.blobSync.downloadBlob(key),

      /**
       * 上传 Blob
       * force: 是否强制上传（即使已存在）
       */
      'blobSync.uploadBlob': ({ blob, force }) =>
        this.blobSync.uploadBlob(blob, force),

      /**
       * 完整下载（从指定节点下载所有 Blob）
       *
       * 这是一个复杂的异步操作，需要特殊处理
       */
      'blobSync.fullDownload': peerId =>
        new Observable(subscriber => {
          // 创建中止控制器，用于取消操作
          const abortController = new AbortController();

          // 执行完整下载
          this.blobSync
            .fullDownload(peerId ?? undefined, abortController.signal)
            .then(() => {
              // 下载完成
              subscriber.next(); // 发送完成信号
              subscriber.complete(); // 完成流
            })
            .catch(error => {
              // 下载失败
              subscriber.error(error); // 发送错误
            });

          // 返回清理函数，取消订阅时中止下载
          return () => abortController.abort(MANUALLY_STOP);
        }),
      // === 感知同步相关操作 ===

      /**
       * 更新感知同步信息
       */
      'awarenessSync.update': ({ awareness, origin }) =>
        this.awarenessSync.update(awareness, origin),

      /**
       * 订阅感知同步更新
       *
       * 这个操作与感知存储的订阅类似，但用于同步场景
       */
      'awarenessSync.subscribeUpdate': docId =>
        new Observable(subscriber => {
          return this.awarenessSync.subscribeUpdate(
            docId,
            // 感知更新回调
            (update, origin) => {
              subscriber.next({
                type: 'awareness-update',
                awareness: update,
                origin,
              });
            },
            // 感知收集回调
            () => {
              const currentCollectId = collectId++;
              const promise = new Promise<AwarenessRecord | null>(resolve => {
                collectJobs.set(currentCollectId.toString(), awareness => {
                  resolve(awareness);
                  collectJobs.delete(currentCollectId.toString());
                });
              });

              // 发送收集请求
              subscriber.next({
                type: 'awareness-collect',
                collectId: currentCollectId.toString(),
              });

              return promise;
            }
          );
        }),

      /**
       * 收集感知同步数据
       */
      'awarenessSync.collect': ({ collectId, awareness }) =>
        collectJobs.get(collectId)?.(awareness),

      // === 索引存储相关操作 ===

      /**
       * 聚合查询
       * 对索引数据进行聚合操作，如统计、求和等
       */
      'indexerStorage.aggregate': ({ table, query, field, options }) =>
        this.indexerStorage.aggregate(table, query, field, options),

      /**
       * 搜索查询
       * 在索引中搜索匹配的数据
       */
      'indexerStorage.search': ({ table, query, options }) =>
        this.indexerStorage.search(table, query, options),

      /**
       * 订阅搜索结果
       * 返回一个流，当搜索结果变化时会推送新结果
       */
      'indexerStorage.subscribeSearch': ({ table, query, options }) =>
        this.indexerStorage.search$(table, query, options),

      /**
       * 订阅聚合结果
       */
      'indexerStorage.subscribeAggregate': ({ table, query, field, options }) =>
        this.indexerStorage.aggregate$(table, query, field, options),

      /**
       * 等待索引存储连接建立
       */
      'indexerStorage.waitForConnected': (_, ctx) =>
        this.indexerStorage.connection.waitForConnected(ctx.signal),

      // === 索引同步相关操作 ===

      /**
       * 获取索引同步状态流
       */
      'indexerSync.state': () => this.indexerSync.state$,

      /**
       * 获取特定文档的索引同步状态
       */
      'indexerSync.docState': (docId: string) =>
        this.indexerSync.docState$(docId),

      /**
       * 添加索引同步优先级
       */
      'indexerSync.addPriority': ({ docId, priority }) =>
        new Observable(() => {
          const undo = this.indexerSync.addPriority(docId, priority);
          return () => undo();
        }),

      /**
       * 等待索引同步完成
       */
      'indexerSync.waitForCompleted': (_, ctx) =>
        this.indexerSync.waitForCompleted(ctx.signal),

      /**
       * 等待特定文档的索引同步完成
       */
      'indexerSync.waitForDocCompleted': (docId: string, ctx) =>
        this.indexerSync.waitForDocCompleted(docId, ctx.signal),
    });
  }
}

/**
 * 存储管理器消费者
 *
 * 这是 Worker 中的顶层管理器，负责：
 * 1. 管理多个存储实例的生命周期
 * 2. 实现引用计数，确保资源的正确释放
 * 3. 处理存储实例的创建、复用和销毁
 *
 * 通俗理解：就像一个存储实例的工厂和管理员，
 * 当需要存储时创建实例，当不需要时回收资源
 */
export class StoreManagerConsumer {
  // 存储销毁器映射表，用于清理资源
  // key: closeKey（关闭键），value: 销毁函数
  private readonly storeDisposers = new Map<string, () => void>();

  // 存储实例池，用于复用存储实例
  // key: 存储键，value: 存储实例和引用计数
  private readonly storePool = new Map<
    string,
    { store: StoreConsumer; refCount: number }
  >();

  /**
   * 构造函数
   *
   * @param availableStorageImplementations 可用的存储实现列表
   */
  constructor(
    private readonly availableStorageImplementations: StorageConstructor[]
  ) {}

  /**
   * 绑定操作消费者
   *
   * @param consumer 操作消费者实例
   */
  bindConsumer(consumer: OpConsumer<WorkerManagerOps>) {
    this.registerHandlers(consumer);
  }

  /**
   * 注册管理器操作处理器
   *
   * 这个方法只注册两个核心操作：打开存储和关闭存储
   */
  private registerHandlers(consumer: OpConsumer<WorkerManagerOps>) {
    consumer.registerAll({
      /**
       * 打开存储操作
       *
       * 这是一个复杂的操作，涉及存储实例的创建、复用和引用计数管理
       */
      open: ({ port, key, closeKey, options }) => {
        console.debug('open store', key, closeKey);

        // 尝试从存储池中获取已存在的存储实例
        let storeRef = this.storePool.get(key);

        // 如果不存在，创建新的存储实例
        if (!storeRef) {
          const store = new StoreConsumer(
            this.availableStorageImplementations,
            options
          );
          // 创建存储引用，初始引用计数为 0
          storeRef = { store, refCount: 0 };
        }

        // 增加引用计数
        // 这很重要：每次打开存储都会增加引用计数
        storeRef.refCount++;

        // 为这个连接创建专用的操作消费者
        const workerConsumer = new OpConsumer<WorkerOps>(port);
        // 将操作消费者绑定到存储实例
        storeRef.store.bindConsumer(workerConsumer);

        // 设置销毁器，当存储关闭时调用
        this.storeDisposers.set(closeKey, () => {
          // 减少引用计数
          storeRef.refCount--;

          // 如果引用计数为 0，说明没有其他地方在使用这个存储
          if (storeRef.refCount === 0) {
            // 销毁存储实例
            storeRef.store.destroy().catch(error => {
              console.error(error);
            });
            // 从存储池中移除
            this.storePool.delete(key);
          }
        });

        // 将存储引用放入存储池
        this.storePool.set(key, storeRef);

        // 返回关闭键，主线程可以用这个键来关闭存储
        return closeKey;
      },

      /**
       * 关闭存储操作
       *
       * 根据关闭键找到对应的销毁器并执行
       */
      close: key => {
        console.debug('close store', key);

        // 根据关闭键找到对应的销毁器
        const workerDisposer = this.storeDisposers.get(key);

        if (!workerDisposer) {
          throw new Error('Worker not found');
        }

        // 执行销毁器
        workerDisposer();

        // 从销毁器映射表中移除
        this.storeDisposers.delete(key);
      },
    });
  }
}
