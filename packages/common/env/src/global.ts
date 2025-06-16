import { UaHelper } from './ua-helper.js';

/**
 * 初始化全局环境配置
 * 该函数负责检测运行环境并设置全局环境变量
 *
 * @returns void
 */
export function setupGlobal() {
  // 如果已经初始化过则直接返回
  if (globalThis.$AFFINE_SETUP) {
    return;
  }

  // 初始化默认环境配置
  let environment: Environment = {
    isLinux: false,
    isMacOs: false,
    isSafari: false,
    isWindows: false,
    isFireFox: false,
    isChrome: false,
    isIOS: false,
    isPwa: false,
    isMobile: false,
    isSelfHosted: false,
    // publicPath is the root of assets files
    publicPath: '/',
    // subPath is the path to access the affine service
    subPath: '',
  };

  // 如果存在navigator对象，使用User Agent检测具体环境
  if (globalThis.navigator) {
    const uaHelper = new UaHelper(globalThis.navigator);

    // 更新环境信息，根据User Agent特征进行判断
    environment = {
      ...environment,
      isMobile: uaHelper.isMobile,
      isLinux: uaHelper.isLinux,
      isMacOs: uaHelper.isMacOs,
      isSafari: uaHelper.isSafari,
      isWindows: uaHelper.isWindows,
      isFireFox: uaHelper.isFireFox,
      isChrome: uaHelper.isChrome,
      isIOS: uaHelper.isIOS,
      isPwa: uaHelper.isStandalone,
    };

    // 特殊处理iOS上的Chrome浏览器（实际上仍为Safari）
    // 通过 isIOS 排除伪 Chrome，确保只在真 Chrome 环境设置版本号
    if (environment.isChrome && !environment.isIOS) {
      environment = {
        ...environment,
        isSafari: false,
        isFireFox: false,
        isChrome: true,
        chromeVersion: uaHelper.getChromeVersion(),
      };
    }
  }

  // 应用环境变量覆盖
  applyEnvironmentOverrides(environment);

  // 将最终的环境配置挂载到全局对象
  globalThis.environment = environment;
  globalThis.$AFFINE_SETUP = true;
}

// 通过解析 HTML 文档中特定格式的 <meta> 标签（名称以 env: 开头），动态修改传入的 environment 对象的值。
function applyEnvironmentOverrides(environment: Environment) {
  if (typeof document === 'undefined') {
    return;
  }

  const metaTags = document.querySelectorAll('meta');

  metaTags.forEach(meta => {
    if (!meta.name.startsWith('env:')) {
      return;
    }

    const name = meta.name.substring(4);

    // all environments should have default value
    // 只处理 environment 中已存在的属性（安全限制）
    if (name in environment) {
      // @ts-expect-error safe
      environment[name] =
        // @ts-expect-error safe
        typeof environment[name] === 'string'
          ? meta.content
          : JSON.parse(meta.content);
    }
  });
}
