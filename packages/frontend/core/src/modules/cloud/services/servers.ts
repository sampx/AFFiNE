import { Unreachable } from '@affine/env/constant';
import { LiveData, ObjectPool, Service } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { Observable, switchMap } from 'rxjs';

import { Server } from '../entities/server';
import { ServerStarted } from '../events/server-started';
import type { ServerConfigStore } from '../stores/server-config';
import type { ServerListStore } from '../stores/server-list';
import type { ServerConfig, ServerMetadata } from '../types';

/**
 * 服务器服务类，用于管理服务器列表和配置
 *
 * 提供以下功能：
 * - 服务器列表的观察和查询 (servers$, server$, serverByBaseUrl$)
 * - 服务器的添加和删除 (addServer, removeServer)
 * - 通过基础URL添加或获取服务器 (addServerByBaseUrl, getServerByBaseUrl, addOrGetServerByBaseUrl)
 *
 * 内部使用对象池(serverPool)管理服务器实例，自动处理服务器实例的创建和销毁
 */
export class ServersService extends Service {
  constructor(
    private readonly serverListStore: ServerListStore,
    private readonly serverConfigStore: ServerConfigStore
  ) {
    super();
  }

  /**
   * 服务器列表的响应式数据流
   *
   * 功能：
   * 1. 监听服务器列表存储(serverListStore)的变化
   * 2. 为每个服务器元数据创建或获取对应的服务器实体
   * 3. 使用对象池(serverPool)管理服务器实例的生命周期
   * 4. 当服务器列表变化时自动更新数据
   * 5. 提供自动清理机制释放不再使用的服务器实例
   */
  servers$ = LiveData.from<Server[]>(
    // 监听服务器列表存储的变化
    this.serverListStore.watchServerList().pipe(
      // 对每个服务器元数据进行处理
      switchMap(metadatas => {
        // 为每个服务器元数据创建或获取服务器实例
        const refs = metadatas.map(metadata => {
          // 检查对象池中是否已有该服务器实例
          const exists = this.serverPool.get(metadata.id);
          if (exists) {
            return exists;
          }

          // 创建新的服务器实体
          const server = this.framework.createEntity(Server, {
            serverMetadata: metadata,
          });
          // 重新验证服务器配置
          server.revalidateConfig();
          // 触发服务器启动事件
          server.scope.eventBus.emit(ServerStarted, server);
          // 将服务器实例放入对象池并获取引用
          const ref = this.serverPool.put(metadata.id, server);
          return ref;
        });

        // 返回一个新的Observable，发射服务器实例数组
        return new Observable<Server[]>(subscribe => {
          // 发射当前所有服务器实例
          subscribe.next(refs.map(ref => ref.obj));
          // 清理函数：当Observable取消订阅时释放所有引用
          return () => {
            refs.forEach(ref => {
              ref.release();
            });
          };
        });
      })
    ),
    [] as any
  );

  server$(id: string) {
    return this.servers$.map(servers =>
      servers.find(server => server.id === id)
    );
  }

  serverByBaseUrl$(url: string) {
    return this.servers$.map(servers =>
      servers.find(server => server.baseUrl === url)
    );
  }

  private readonly serverPool = new ObjectPool<string, Server>({
    onDelete(obj) {
      obj.dispose();
    },
  });

  addServer(metadata: ServerMetadata, config: ServerConfig) {
    this.serverListStore.addServer(metadata, config);
  }

  removeServer(id: string) {
    this.serverListStore.removeServer(id);
  }

  async addServerByBaseUrl(baseUrl: string) {
    const config = await this.serverConfigStore.fetchServerConfig(baseUrl);
    const id = nanoid();
    this.serverListStore.addServer(
      { id, baseUrl },
      {
        credentialsRequirement: config.credentialsRequirement,
        features: config.features,
        oauthProviders: config.oauthProviders,
        serverName: config.name,
        type: config.type,
        initialized: config.initialized,
        version: config.version,
      }
    );
  }

  getServerByBaseUrl(baseUrl: string) {
    return this.servers$.value.find(s => s.baseUrl === baseUrl);
  }

  async addOrGetServerByBaseUrl(baseUrl: string) {
    const server = this.getServerByBaseUrl(baseUrl);
    if (server) {
      return server;
    } else {
      await this.addServerByBaseUrl(baseUrl);
      const server = this.getServerByBaseUrl(baseUrl);
      if (!server) {
        throw new Unreachable();
      }
      return server;
    }
  }
}
