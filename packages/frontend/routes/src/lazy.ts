import React, {
  type ComponentProps,
  type ComponentType,
  lazy as reactLazy,
  Suspense,
} from 'react';

/**
 * 懒加载组件的高阶函数
 *
 * @template T 组件类型，继承自React.ComponentType
 * @param factory 异步加载组件的工厂函数，返回Promise形式的模块对象
 * @param fallback 可选，加载过程中显示的备用内容
 * @returns 返回一个包装后的懒加载组件，自动处理Suspense和模块导出逻辑
 *
 * @remarks
 * - 自动处理模块导出对象，优先使用default导出
 * - 当模块包含多个导出时会发出警告
 * - 内置Suspense边界，支持自定义fallback
 */
export function lazy<T extends ComponentType<any>>(
  factory: () => Promise<Record<any, T>>,
  fallback?: React.ReactNode
) {
  // 使用 React.lazy 创建懒加载组件
  const LazyComponent = reactLazy(() =>
    factory().then(mod => {
      // 检查模块是否有默认导出
      if ('default' in mod) {
        // 如果有默认导出，直接返回
        return { default: mod.default };
      } else {
        // 如果没有默认导出，获取所有命名导出
        const components = Object.values(mod);
        // 如果模块有多个导出，发出警告
        if (components.length > 1) {
          console.warn('Lazy loaded module has more then one exports');
        }
        // 返回第一个导出作为默认导出
        return {
          default: components[0],
        };
      }
    })
  );

  /**
   * 返回的高阶组件，处理加载状态和错误边界
   * @param props - 传递给懒加载组件的属性
   * @returns 返回包装后的 React 元素
   */
  return function LazyRoute(props: ComponentProps<T>) {
    return React.createElement(
      Suspense, // 使用 Suspense 处理异步加载
      {
        fallback, // 设置加载中的 fallback UI
      },
      React.createElement(LazyComponent, props) // 渲染懒加载组件
    );
  };
}
