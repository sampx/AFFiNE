import {
  gqlFetcherFactory,
  type OauthProvidersQuery,
  oauthProvidersQuery,
  type ServerConfigQuery,
  serverConfigQuery,
  ServerFeature,
} from '@affine/graphql';
import { Store } from '@toeverything/infra';

export type ServerConfigType = ServerConfigQuery['serverConfig'] &
  OauthProvidersQuery['serverConfig'];

export class ServerConfigStore extends Store {
  constructor() {
    super();
  }

  /**
   * 获取服务器配置信息
   *
   * @param serverBaseUrl - 服务器基础URL
   * @param abortSignal - 可选的AbortSignal用于取消请求
   * @returns 包含服务器配置和OAuth提供者信息的Promise
   * @throws 当请求失败时抛出错误
   */
  async fetchServerConfig(
    serverBaseUrl: string,
    abortSignal?: AbortSignal
  ): Promise<ServerConfigType> {
    const gql = gqlFetcherFactory(`${serverBaseUrl}/graphql`, globalThis.fetch);
    const serverConfigData = await gql({
      query: serverConfigQuery,
      context: {
        signal: abortSignal,
      },
    });
    if (serverConfigData.serverConfig.features.includes(ServerFeature.OAuth)) {
      const oauthProvidersData = await gql({
        query: oauthProvidersQuery,
        context: {
          signal: abortSignal,
        },
      });
      return {
        ...serverConfigData.serverConfig,
        ...oauthProvidersData.serverConfig,
      };
    }
    return { ...serverConfigData.serverConfig, oauthProviders: [] };
  }
}
