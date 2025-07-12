import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  redirect,
  useNavigate,
} from 'react-router-dom';

import { AffineErrorComponent } from '../components/affine/affine-error-boundary/affine-error-fallback';
import { NavigateContext } from '../components/hooks/use-navigate-helper';
import { RootWrapper } from './pages/root';

/**
 * 根路由组件，负责初始化路由状态并提供导航上下文
 *
 * 使用 `useEffect` 确保路由准备就绪后渲染子组件
 * 通过 `NavigateContext.Provider` 向下传递导航方法
 *
 * @returns 返回包含 `RootWrapper` 的导航上下文提供者
 */
export function RootRouter() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // a hack to make sure router is ready
    setReady(true);
  }, []);

  return (
    ready && (
      <NavigateContext.Provider value={navigate}>
        <RootWrapper />
      </NavigateContext.Provider>
    )
  );
}

export const topLevelRoutes = [
  {
    // 根路由组件，作为所有子路由的布局容器
    element: <RootRouter />,
    // 全局错误处理组件，当子路由渲染出错时显示
    errorElement: <AffineErrorComponent />,
    // 子路由配置数组
    children: [
      {
        path: '/', // 应用首页路径
        lazy: () => import('./pages/index'), // 动态懒加载首页组件
      },
      {
        path: '/workspace/:workspaceId/*', // 工作区路由（带动态参数）
        // :workspaceId - 动态匹配工作区ID
        // /* - 匹配任意子路径
        lazy: () => import('./pages/workspace/index'), // 动态懒加载工作区组件
      },
      {
        path: '/share/:workspaceId/:pageId', // 分享页路由（带两个动态参数）
        // 路由加载器 - 直接重定向到对应工作区页面
        loader: ({ params }) => {
          return redirect(`/workspace/${params.workspaceId}/${params.pageId}`);
        },
      },
      {
        path: '/404', // 404页面路由
        lazy: () => import('./pages/404'), // 动态懒加载404组件
      },
      {
        path: '/expired', // 内容过期提示页
        lazy: () => import('./pages/expired'), // 动态懒加载过期页组件
      },
      {
        path: '/invite/:inviteId', // 邀请页（带邀请ID参数）
        lazy: () => import('./pages/invite'), // 动态懒加载邀请页组件
      },
      {
        path: '/upgrade-success', // 升级成功提示页
        lazy: () => import('./pages/upgrade-success'), // 动态懒加载升级成功页
      },
      {
        path: '/upgrade-success/team', // 团队版升级成功页
        lazy: () => import('./pages/upgrade-success/team'), // 动态懒加载团队升级页
      },
      {
        path: '/upgrade-success/self-hosted-team',
        lazy: () => import('./pages/upgrade-success/self-host-team'),
      },
      {
        path: '/ai-upgrade-success', // AI功能升级成功页
        lazy: () => import('./pages/ai-upgrade-success'), // 动态懒加载AI升级页
      },
      {
        path: '/onboarding', // 新用户引导页
        lazy: () => import('./pages/onboarding'), // 动态懒加载引导页组件
      },
      {
        path: '/redirect-proxy', // 重定向代理页
        lazy: () => import('./pages/redirect'), // 动态懒加载重定向组件
      },
      {
        path: '/subscribe', // 订阅管理页
        lazy: () => import('./pages/subscribe'), // 动态懒加载订阅页组件
      },
      {
        path: '/upgrade-to-team',
        lazy: () => import('./pages/upgrade-to-team'),
      },
      {
        path: '/try-cloud',
        loader: () => {
          return redirect(
            `/sign-in?redirect_uri=${encodeURIComponent('/?initCloud=true')}`
          );
        },
      },
      {
        path: '/theme-editor', // 主题编辑器页
        lazy: () => import('./pages/theme-editor'), // 动态懒加载主题编辑器
      },
      {
        path: '/clipper/import',
        lazy: () => import('./pages/import-clipper'),
      },
      {
        path: '/template/import',
        lazy: () => import('./pages/import-template'),
      },
      {
        path: '/template/preview',
        loader: ({ request }) => {
          const url = new URL(request.url);
          const workspaceId = url.searchParams.get('workspaceId');
          const docId = url.searchParams.get('docId');
          const templateName = url.searchParams.get('name');
          const templateMode = url.searchParams.get('mode');
          const snapshotUrl = url.searchParams.get('snapshotUrl');

          return redirect(
            `/workspace/${workspaceId}/${docId}?${new URLSearchParams({
              isTemplate: 'true',
              templateName: templateName ?? '',
              snapshotUrl: snapshotUrl ?? '',
              mode: templateMode ?? 'page',
            }).toString()}`
          );
        },
      },
      {
        path: '/auth/:authType', // 认证页（带认证类型参数）
        // webpackChunkName - 指定打包后的chunk名称
        lazy: () => import(/* webpackChunkName: "auth" */ './pages/auth/auth'),
      },
      {
        path: '/sign-In',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/sign-in'),
      },
      {
        path: '/magic-link',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/magic-link'),
      },
      {
        path: '/oauth/login',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/oauth-login'),
      },
      {
        path: '/oauth/callback',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/oauth-callback'),
      },
      // deprecated, keep for old client compatibility
      // TODO(@forehalo): remove
      {
        path: '/desktop-signin',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/oauth-login'),
      },
      // deprecated, keep for old client compatibility
      // use '/sign-in'
      // TODO(@forehalo): remove
      {
        path: '/signIn',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/sign-in'),
      },
      {
        path: '/open-app/:action',
        lazy: () => import('./pages/open-app'),
      },
      {
        path: '*', // 兜底路由，匹配所有未定义路径
        lazy: () => import('./pages/404'), // 显示404页面
      },
    ],
  },
] satisfies [RouteObject, ...RouteObject[]];

/**
 * 创建增强版浏览器路由器
 *
 * 1. wrapCreateBrowserRouterV6 是 Sentry 提供的高阶函数，用于包装 React Router 的路由创建函数
 * 2. 包装后的路由器会自动捕获路由错误并上报到 Sentry 监控系统
 * 3. reactRouterCreateBrowserRouter 是 React Router v6 的原生路由创建函数
 *
 * 最终效果：
 * - 保留 React Router 所有原生功能
 * - 增加错误监控能力
 * - 在生产环境启用 Sentry 监控
 */
const createBrowserRouter = wrapCreateBrowserRouterV6(
  reactRouterCreateBrowserRouter
);
/**
 * 创建并导出一个浏览器路由器实例
 *
 * 根据是否启用Sentry发布环境，选择使用不同的路由器创建方法
 * @param topLevelRoutes - 顶级路由配置数组
 * @param options - 路由器配置选项，包括基础路径和未来特性标志
 */
/**
 * 导出最终路由器实例
 *
 * 1. 根据是否配置了 SENTRY_RELEASE 决定使用哪种路由器：
 *    - 生产环境：使用带 Sentry 监控的增强版路由器
 *    - 开发环境：使用原生路由器
 *
 * 2. 参数说明：
 *    - topLevelRoutes: 应用的路由配置数组
 *    - basename: 基础路径，用于部署在子目录的情况
 *    - future: 启用未来版本的特性标志
 *
 * 3. 使用示例：
 *    <RouterProvider router={router} />
 */
export const router = (
  window.SENTRY_RELEASE ? createBrowserRouter : reactRouterCreateBrowserRouter
)(topLevelRoutes, {
  basename: environment.subPath, // 基础路径，如 '/app'
  future: {
    v7_normalizeFormMethod: true, // 启用 React Router v7 的表单方法标准化
  },
});
