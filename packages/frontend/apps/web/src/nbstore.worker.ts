// 引入 AFFiNE 的浏览器环境引导文件
import '@affine/core/bootstrap/browser';

// 导入不同类型的存储后端
// 这些存储后端用于处理数据的持久化和同步
import { broadcastChannelStorages } from '@affine/nbstore/broadcast-channel';
import { cloudStorages } from '@affine/nbstore/cloud';
import { idbStorages } from '@affine/nbstore/idb';
import { idbV1Storages } from '@affine/nbstore/idb/v1';
import type { WorkerManagerOps } from '@affine/nbstore/worker/consumer';
// 导入 StoreManagerConsumer 和相关类型
// StoreManagerConsumer 用于管理存储后端
import { StoreManagerConsumer } from '@affine/nbstore/worker/consumer';
import type { MessageCommunicapable } from '@toeverything/infra/op';
// 导入 OpConsumer，用于与 Worker 进行通信
import { OpConsumer } from '@toeverything/infra/op';

// 创建 StoreManagerConsumer 实例，并传入多种存储后端
// 这些存储后端负责处理不同的数据存储需求
const consumer = new StoreManagerConsumer([
  ...idbStorages, // 使用 IndexedDB 的存储后端
  ...idbV1Storages, // 兼容性存储（v1 版本）
  ...broadcastChannelStorages, // 使用 BroadcastChannel 进行跨标签页同步
  ...cloudStorages, // 云端存储
]);

// 检查 globalThis 是否具有 onconnect 属性
// 如果有，则表示当前运行在 SharedWorker 中
if ('onconnect' in globalThis) {
  // 如果在 SharedWorker 中

  // 处理 onconnect 事件
  (globalThis as any).onconnect = (event: MessageEvent) => {
    // 获取连接的端口
    const port = event.ports[0];
    // 绑定消费者到该端口
    consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
  };
} else {
  // 如果不在 SharedWorker 中，则使用普通 Worker

  // 绑定消费者到全局对象
  consumer.bindConsumer(
    new OpConsumer<WorkerManagerOps>(globalThis as MessageCommunicapable)
  );
}
