// 引入 AFFiNE 相关上下文、组件、模块和工具
import { AffineContext } from '@affine/core/components/context';
import { AppContainer } from '@affine/core/desktop/components/app-container';
import { router } from '@affine/core/desktop/router';
import { configureCommonModules } from '@affine/core/modules';
import { I18nProvider } from '@affine/core/modules/i18n';
import { LifecycleService } from '@affine/core/modules/lifecycle';
import {
  configureLocalStorageStateStorageImpls,
  NbstoreProvider,
} from '@affine/core/modules/storage';
import { PopupWindowProvider } from '@affine/core/modules/url';
import { configureBrowserWorkbenchModule } from '@affine/core/modules/workbench';
import { configureBrowserWorkspaceFlavours } from '@affine/core/modules/workspace-engine';
import createEmotionCache from '@affine/core/utils/create-emotion-cache';
import { getWorkerUrl } from '@affine/env/worker';
import { StoreManagerClient } from '@affine/nbstore/worker/client';
import { CacheProvider } from '@emotion/react';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

// 创建 Emotion 的缓存实例，用于样式隔离和优化
const cache = createEmotionCache();

// 创建 nbstore worker 的客户端实例
let storeManagerClient: StoreManagerClient;

// 获取 nbstore worker 的 URL
const workerUrl = getWorkerUrl('nbstore');

// 判断是否支持 SharedWorker，并根据本地配置决定使用 SharedWorker 还是普通 Worker
if (
  window.SharedWorker &&
  localStorage.getItem('disableSharedWorker') !== 'true'
) {
  // 使用 SharedWorker 实现多标签页间的数据共享
  const worker = new SharedWorker(workerUrl, {
    name: 'affine-shared-worker',
  });
  storeManagerClient = new StoreManagerClient(new OpClient(worker.port));
} else {
  // 回退到普通 Worker，仅当前标签页可用
  const worker = new Worker(workerUrl);
  storeManagerClient = new StoreManagerClient(new OpClient(worker));
}
// 页面关闭前释放资源，防止内存泄漏
window.addEventListener('beforeunload', () => {
  storeManagerClient.dispose();
});

// react-router v7 的未来特性配置
const future = {
  v7_startTransition: true,
} as const;

// 创建应用框架实例
const framework = new Framework();
// 配置通用模块
configureCommonModules(framework);
// 配置浏览器端工作台模块
configureBrowserWorkbenchModule(framework);
// 配置本地存储实现
configureLocalStorageStateStorageImpls(framework);
// 配置浏览器端工作区类型
configureBrowserWorkspaceFlavours(framework);
// 注册 NbstoreProvider，提供 openStore 方法，实际调用 storeManagerClient
framework.impl(NbstoreProvider, {
  openStore(key, options) {
    return storeManagerClient.open(key, options);
  },
});
// 注册 PopupWindowProvider，统一处理新窗口打开逻辑
framework.impl(PopupWindowProvider, {
  open: (target: string) => {
    const targetUrl = new URL(target);

    let url: string;
    // 如果目标与当前同源，直接打开
    if (targetUrl.origin === location.origin) {
      url = target;
    } else {
      // 否则通过 redirect-proxy 进行跳转，防止跨域安全问题
      const redirectProxy = location.origin + '/redirect-proxy';
      const search = new URLSearchParams({
        redirect_uri: target,
      });

      url = `${redirectProxy}?${search.toString()}`;
    }
    // 以新窗口方式打开，防止 opener 注入
    window.open(url, '_blank', 'popup noreferrer noopener');
  },
});
const frameworkProvider = framework.provider();

// 设置应用生命周期事件，聚焦时触发 applicationFocus，启动时触发 applicationStart
window.addEventListener('focus', () => {
  frameworkProvider.get(LifecycleService).applicationFocus();
});
frameworkProvider.get(LifecycleService).applicationStart();

/**
 * AFFiNE 应用主入口组件
 *
 * 该组件作为整个应用的根节点，负责初始化核心上下文和路由配置：
 * - 提供框架级依赖注入 (FrameworkRoot)
 * - 管理 Emotion 样式缓存 (CacheProvider)
 * - 处理国际化支持 (I18nProvider)
 * - 注入应用全局状态 (AffineContext)
 * - 配置路由系统 (RouterProvider)
 *
 * 注意：所有子组件都包裹在 React.Suspense 中以支持懒加载
 */
export function App() {
  return (
    <Suspense>
      {/* 框架根节点，提供依赖注入 */}
      <FrameworkRoot framework={frameworkProvider}>
        {/* Emotion 样式缓存上下文 */}
        <CacheProvider value={cache}>
          {/* 国际化上下文 */}
          <I18nProvider>
            {/* AFFiNE 应用上下文，注入当前 store */}
            <AffineContext store={getCurrentStore()}>
              {/* 路由提供者，支持 fallback 组件和未来特性 */}
              <RouterProvider
                fallbackElement={<AppContainer fallback />}
                router={router}
                future={future}
              />
            </AffineContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
