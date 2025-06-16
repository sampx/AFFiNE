/**
 * 存储模块核心接口和实现
 *
 * 提供多种存储方案:
 * - GlobalState: 持久化应用状态(localStorage)
 * - GlobalCache: 临时缓存(localStorage)
 * - GlobalSessionState: 会话状态(sessionStorage)
 * - CacheStorage: 异步缓存(IndexedDB)
 * - NbstoreProvider: 跨标签页共享存储
 */
/**
 * 导出全局存储提供者接口
 * - CacheStorage: 异步缓存存储接口(基于IndexedDB)
 * - GlobalCache: 全局缓存接口(临时数据，可能被清除)
 * - GlobalSessionState: 全局会话状态接口(标签页生命周期)
 * - GlobalState: 全局持久化状态接口
 */
export {
  CacheStorage,
  GlobalCache,
  GlobalSessionState,
  GlobalState,
} from './providers/global';

/**
 * 导出Nbstore提供者接口
 * - 提供跨标签页/窗口的共享存储能力
 * - 基于SharedWorker实现
 */
export { NbstoreProvider } from './providers/nbstore';

/**
 * 导出全局存储服务类
 * - GlobalCacheService: 全局缓存服务
 * - GlobalSessionStateService: 全局会话状态服务
 * - GlobalStateService: 全局持久化状态服务
 */
export {
  GlobalCacheService,
  GlobalSessionStateService,
  GlobalStateService,
} from './services/global';

/**
 * 导出Nbstore服务类
 * - 封装NbstoreProvider的访问
 * - 提供跨标签页存储管理能力
 */
export { NbstoreService } from './services/nbstore';

// 导入基础设施类型
import { type Framework } from '@toeverything/infra';

/**
 * 导入存储实现类
 * - IDBGlobalState: 基于IndexedDB的全局状态实现
 * - LocalStorageGlobalCache: 基于localStorage的全局缓存实现
 * - LocalStorageGlobalState: 基于localStorage的全局状态实现
 * - SessionStorageGlobalSessionState: 基于sessionStorage的会话状态实现
 */
import {
  IDBGlobalState,
  LocalStorageGlobalCache,
  LocalStorageGlobalState,
  SessionStorageGlobalSessionState,
} from './impls/storage';
/**
 * 导入存储提供者接口
 * - CacheStorage: 异步缓存存储接口
 * - GlobalCache: 全局缓存接口
 * - GlobalSessionState: 全局会话状态接口
 * - GlobalState: 全局持久化状态接口
 */
import {
  CacheStorage,
  GlobalCache,
  GlobalSessionState,
  GlobalState,
} from './providers/global';
// 导入Nbstore提供者接口
import { NbstoreProvider } from './providers/nbstore';
/**
 * 导入存储服务类
 * - GlobalCacheService: 全局缓存服务
 * - GlobalSessionStateService: 全局会话状态服务
 * - GlobalStateService: 全局持久化状态服务
 */
import {
  GlobalCacheService,
  GlobalSessionStateService,
  GlobalStateService,
} from './services/global';
// 导入Nbstore服务类
import { NbstoreService } from './services/nbstore';

export const configureStorageModule = (framework: Framework) => {
  framework.service(GlobalStateService, [GlobalState]);
  framework.service(GlobalCacheService, [GlobalCache]);
  framework.service(GlobalSessionStateService, [GlobalSessionState]);
  framework.service(NbstoreService, [NbstoreProvider]);
};

export function configureLocalStorageStateStorageImpls(framework: Framework) {
  framework.impl(GlobalCache, LocalStorageGlobalCache);
  framework.impl(GlobalState, LocalStorageGlobalState);
  framework.impl(CacheStorage, IDBGlobalState);
}

/**
 * 配置全局会话状态存储实现，使用 sessionStorage 作为后端存储
 *
 * sessionStorage 技术原理:
 * 1. 会话级生命周期 - 数据仅在当前浏览器标签页会话期间有效
 *    - 会话开始: 打开新标签页访问网站时开始
 *    - 会话持续: 刷新页面或同源跳转保持数据
 *    - 会话结束: 关闭标签页时数据立即清除
 * 2. 同源策略 - 仅同源(协议+域名+端口)页面可访问
 * 3. 标签页隔离 - 每个标签页有独立存储空间
 * 4. 同步API - 可能阻塞主线程，不适合大数据量
 * 5. 仅支持字符串 - 需用JSON序列化复杂数据
 *
 * 存储位置:
 * - 主要存储在内存(RAM)中，访问速度快
 * - 可能临时写入硬盘(浏览器配置目录)用于崩溃恢复
 * - 会话结束后会彻底清除
 */
export function configureCommonGlobalStorageImpls(framework: Framework) {
  framework.impl(GlobalSessionState, SessionStorageGlobalSessionState);
}
