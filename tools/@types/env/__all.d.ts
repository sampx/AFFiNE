import '@affine/env/constant';
import '@blocksuite/affine/global/types'

/**
 * 模块声明：'@blocksuite/affine/store'
 * 该模块定义了文档元数据（DocMeta）接口。
 * 
 * DocMeta 接口描述了文档相关的元信息属性。
 * 包含以下字段：
 * - favorite: 表示文档是否被收藏（已弃用）。
 * - trash: 表示文档是否被标记为垃圾。
 * - trashDate: 文档被标记为垃圾的时间戳。
 * - updatedDate: 文档最后一次更新的时间戳。
 * - mode: 文档模式，可以是 'page'（页面模式）或 'edgeless'（无边界模式）。
 * - isPublic: 表示文档是否为公开状态。
 */
declare module '@blocksuite/affine/store' {
  interface DocMeta {
    /**
     * @deprecated
     */
    favorite?: boolean;
    trash?: boolean;
    trashDate?: number;
    updatedDate?: number;
    mode?: 'page' | 'edgeless';
    // todo: support `number` in the future
    isPublic?: boolean;
  }
}


declare global {

declare type Environment = {
  // Variant
  isSelfHosted: boolean;

  // Device
  isLinux: boolean;
  isMacOs: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isWindows: boolean;
  isFireFox: boolean;
  isMobile: boolean;
  isChrome: boolean;
  isPwa: boolean;
  chromeVersion?: number;

  // runtime configs
  publicPath: string;
  subPath: string;
};

  var process: {
    env: Record<string, string>;
  };
  var environment: Environment;
  var $AFFINE_SETUP: boolean | undefined;
  /**
   * Inject by https://www.npmjs.com/package/@sentry/webpack-plugin
   */
  var SENTRY_RELEASE: { id: string } | undefined;
}
