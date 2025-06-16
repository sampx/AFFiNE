import { DebugLogger } from '@affine/debug';
import { setupGlobal } from '@affine/env/global';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomEffect } from 'jotai-effect';

setupGlobal();

const logger = new DebugLogger('affine:settings');

/**
 * 定义应用设置的类型
 */
export type AppSetting = {
  clientBorder: boolean;
  windowFrameStyle: 'frameless' | 'NativeTitleBar';
  enableBlurBackground: boolean;
  enableNoisyBackground: boolean;
  autoCheckUpdate: boolean;
  autoDownloadUpdate: boolean;
  enableTelemetry: boolean;
};

/**
 * 定义窗口样式选项
 */
export const windowFrameStyleOptions: AppSetting['windowFrameStyle'][] = [
  'frameless',
  'NativeTitleBar',
];

/**
 * 定义应用设置存储的键名
 */
export const APP_SETTINGS_STORAGE_KEY = 'affine-settings';

/**
 * 创建一个存储应用设置的原子
 * @typeParam AppSetting - 应用设置的类型
 */
const appSettingBaseAtom = atomWithStorage<AppSetting>(
  APP_SETTINGS_STORAGE_KEY, // 存储键名
  {
    // 默认设置值
    // 客户端边框，在Electron非Windows环境下启用
    clientBorder: BUILD_CONFIG.isElectron && !environment.isWindows,
    windowFrameStyle: 'frameless', // 窗口框架样式，默认为无框架
    enableBlurBackground: false, // 是否启用背景模糊效果
    enableNoisyBackground: true, // 是否启用背景噪点效果
    autoCheckUpdate: true, // 是否自动检查更新
    autoDownloadUpdate: true, // 是否自动下载更新
    enableTelemetry: true, // 是否启用遥测数据收集
  },
  undefined, // 使用默认存储引擎
  {
    getOnInit: true, // 初始化时立即从存储中获取值
  }
);

/**
 * 定义设置更新操作的类型
 * @typeParam Value - 设置值的类型
 */
type SetStateAction<Value> = Value | ((prev: Value) => Value);

// todo(@pengx17): use global state instead
/**
 * 创建一个副作用原子用于同步设置到Electron
 *
 * 这个原子会监听应用设置的变化，并将相关配置同步到Electron端：
 * - 当应用在Electron环境中运行时，会将自动更新相关设置同步到Electron
 * - 使用window.__apis?.updater接口与Electron通信
 *
 * @param get - 获取原子值的方法，用于访问appSettingBaseAtom
 */
const appSettingEffect = atomEffect(get => {
  const settings = get(appSettingBaseAtom);
  // some values in settings should be synced into electron side
  if (BUILD_CONFIG.isElectron) {
    logger.debug('sync settings to electron', settings);
    // this api type in @affine/electron-api, but it is circular dependency this package, use any here
    (window as any).__apis?.updater
      .setConfig({
        autoCheckUpdate: settings.autoCheckUpdate,
        autoDownloadUpdate: settings.autoDownloadUpdate,
      })
      .catch((err: any) => {
        console.error(err);
      });
  }
});
/**
 * 创建应用设置原子，包含获取和更新设置的功能
 *
 * 这个原子使用了jotai的atom函数创建，具有读取和写入功能：
 * - 读取功能：获取应用设置并应用副作用
 * - 写入功能：允许部分更新应用设置
 *
 * @returns 返回一个可读写的原子，用于管理应用设置状态
 * - 读取时返回完整的AppSetting对象
 * - 写入时接受部分AppSetting对象或更新函数
 */
export const appSettingAtom = atom<
  AppSetting, // 读取值类型
  [SetStateAction<Partial<AppSetting>>], // 写入参数类型
  void // 写入返回类型
>(
  get => {
    get(appSettingEffect); // 应用副作用，同步设置到Electron
    return get(appSettingBaseAtom); // 返回完整的设置对象
  },
  (_get, set, apply) => {
    set(appSettingBaseAtom, prev => {
      const next = typeof apply === 'function' ? apply(prev) : apply; // 处理函数式更新或直接对象更新
      return { ...prev, ...next }; // 合并现有设置和新设置
    });
  }
);
