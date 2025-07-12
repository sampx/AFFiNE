import type { ServerFeature } from '@affine/graphql'; // 导入服务器特性类型
import {
  backoffRetry, // 导入指数退避重试策略
  effect, // 导入响应式副作用函数
  Entity, // 导入实体基类
  fromPromise, // 导入将 Promise 转换为 Observable 的函数
  LiveData, // 导入 LiveData 类，用于管理响应式数据
  onComplete, // 导入 Observable 完成时执行的副作用
  onStart, // 导入 Observable 开始时执行的副作用
} from '@toeverything/infra';
import { exhaustMap, map, tap } from 'rxjs'; // 导入 RxJS 操作符

import { ServerScope } from '../scopes/server'; // 导入服务器作用域
import { AuthService } from '../services/auth'; // 导入认证服务
import { FetchService } from '../services/fetch'; // 导入 Fetch 服务
import { GraphQLService } from '../services/graphql'; // 导入 GraphQL 服务
import { ServerConfigStore } from '../stores/server-config'; // 导入服务器配置存储
import type { ServerListStore } from '../stores/server-list'; // 导入服务器列表存储类型
import type { ServerConfig, ServerMetadata } from '../types'; // 导入服务器配置和元数据类型

// 将 ServerFeature 类型的所有字符串字面量转换为小写
type LowercaseServerFeature = Lowercase<ServerFeature>;
// 定义一个记录类型，用于存储服务器特性，键为小写特性名，值为布尔值
type ServerFeatureRecord = {
  [key in LowercaseServerFeature]: boolean;
};

/**
 * Server 类表示一个服务器实体，管理服务器的元数据、配置和相关服务。
 * 它继承自 Entity，并包含服务器的响应式数据流和操作。
 */
export class Server extends Entity<{
  serverMetadata: ServerMetadata; // 服务器元数据属性
}> {
  readonly id = this.props.serverMetadata.id; // 服务器 ID，从元数据中获取
  readonly baseUrl = this.props.serverMetadata.baseUrl; // 服务器基础 URL，从元数据中获取
  // 创建一个服务器作用域，并将当前 Server 实例作为上下文传递
  readonly scope = this.framework.createScope(ServerScope, {
    server: this as Server,
  });

  // 从作用域中获取服务器配置存储实例
  readonly serverConfigStore = this.scope.framework.get(ServerConfigStore);
  // 从作用域中获取 Fetch 服务实例的 fetch 方法
  readonly fetch = this.scope.framework.get(FetchService).fetch;
  // 从作用域中获取 GraphQL 服务实例的 gql 方法
  readonly gql = this.scope.framework.get(GraphQLService).gql;
  // 获取账户 LiveData 的 getter，用于响应式地获取账户信息
  get account$() {
    return this.scope.framework.get(AuthService).session.account$;
  }
  readonly serverMetadata = this.props.serverMetadata; // 服务器元数据

  /**
   * 构造函数，初始化 Server 实例。
   * @param serverListStore 服务器列表存储实例，用于管理服务器配置。
   */
  constructor(private readonly serverListStore: ServerListStore) {
    super(); // 调用父类 Entity 的构造函数
  }

  /**
   * 服务器配置的 LiveData。
   * 监听 serverListStore 中特定服务器 ID 的配置变化，并将其转换为 LiveData。
   * 如果配置不存在，则抛出错误。
   */
  readonly config$ = LiveData.from<ServerConfig>(
    this.serverListStore.watchServerConfig(this.serverMetadata.id).pipe(
      map(config => {
        if (!config) {
          throw new Error('Failed to load server config'); // 如果配置为空，抛出错误
        }
        return config; // 返回服务器配置
      })
    ),
    null as any // 初始值，这里使用 any 绕过类型检查
  );

  // 表示配置是否正在重新验证的 LiveData，初始值为 false
  readonly isConfigRevalidating$ = new LiveData(false);

  /**
   * 服务器特性列表的 LiveData。
   * 将 config$ 中的服务器特性数组转换为一个记录对象，其中键为小写特性名，值为 true。
   */
  readonly features$ = this.config$.map(config => {
    return Array.from(new Set(config.features)).reduce((acc, cur) => {
      acc[cur.toLowerCase() as LowercaseServerFeature] = true; // 将特性名转换为小写并设置为 true
      return acc;
    }, {} as ServerFeatureRecord); // 初始为空的 ServerFeatureRecord
  });

  /**
   * 凭证要求的 LiveData。
   * 从 config$ 中提取凭证要求，如果 config 为空则返回 null。
   */
  readonly credentialsRequirement$ = this.config$.map(config => {
    return config ? config.credentialsRequirement : null; // 返回凭证要求或 null
  });

  /**
   * 定义一个名为 revalidateConfig 的响应式副作用，它会在依赖项变化时重新执行。
   * 用于重新获取并更新服务器配置。
   */
  readonly revalidateConfig = effect(
    exhaustMap(() => {
      // 使用 exhaustMap 操作符，确保在前一个请求完成之前，不会触发新的请求，避免重复调用
      return fromPromise(
        (
          signal // 将一个基于 Promise 的异步操作转换为 Observable，并传递 AbortSignal
        ) => this.serverConfigStore.fetchServerConfig(this.baseUrl, signal) // 调用 serverConfigStore 获取服务器配置，并传递一个 AbortSignal 用于取消请求
      ).pipe(
        // 对 Observable 的结果进行管道操作
        backoffRetry({
          // 应用指数退避重试策略
          count: Infinity, // 无限次重试，直到成功
        }),
        tap(config => {
          // 在 Observable 发出值时执行副作用，这里是更新服务器配置
          this.serverListStore.updateServerConfig(this.serverMetadata.id, {
            // 根据服务器元数据 ID 更新服务器配置
            credentialsRequirement: config.credentialsRequirement, // 凭证要求
            features: config.features, // 服务器特性
            oauthProviders: config.oauthProviders, // OAuth 提供者
            serverName: config.name, // 服务器名称
            type: config.type, // 服务器类型
            version: config.version, // 服务器版本
            initialized: config.initialized, // 服务器是否已初始化
          });
        }),
        onStart(() => {
          // 在 Observable 开始订阅时执行副作用
          this.isConfigRevalidating$.next(true); // 设置配置正在重新验证的状态为 true
        }),
        onComplete(() => {
          // 在 Observable 完成（成功或失败）时执行副作用
          this.isConfigRevalidating$.next(false); // 设置配置正在重新验证的状态为 false
        })
      );
    })
  );

  /**
   * 等待配置重新验证完成。
   * 调用 revalidateConfig 触发重新验证，然后等待 isConfigRevalidating$ 变为 false。
   * @param signal 可选的 AbortSignal，用于取消等待。
   */
  async waitForConfigRevalidation(signal?: AbortSignal) {
    try {
      this.revalidateConfig(); // 触发配置重新验证
      await this.isConfigRevalidating$.waitFor(
        isRevalidating => !isRevalidating, // 等待 isRevalidating 变为 false
        signal // 传递 AbortSignal
      );
    } catch (error) {
      // 捕获错误
      if (error instanceof Event && error.type === 'abort') return; // 如果是 AbortEvent，则直接返回
      console.error('Config revalidation failed:', error); // 打印配置重新验证失败的错误
    }
  }

  /**
   * 销毁方法，用于清理资源。
   * 释放作用域并取消 revalidateConfig 的订阅。
   */
  override dispose(): void {
    this.scope.dispose(); // 销毁作用域
    this.revalidateConfig.unsubscribe(); // 取消 revalidateConfig 的订阅
  }
}
