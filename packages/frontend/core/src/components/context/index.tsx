import { ConfirmModalProvider, PromptModalProvider } from '@affine/component';
import { ProviderComposer } from '@affine/component/provider-composer';
import { ThemeProvider } from '@affine/core/components/theme-provider';
import type { createStore } from 'jotai';
import { Provider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

export type AffineContextProps = PropsWithChildren<{
  store?: ReturnType<typeof createStore>;
}>;

/**
 * AffineContext 组合多个 Provider，为子组件提供统一的上下文环境。
 * 使用 useMemo 优化 contexts 的创建过程，避免不必要的重复渲染。
 */
export function AffineContext(props: AffineContextProps) {
  return (
    <ProviderComposer
      contexts={useMemo(
        () =>
          [
            <Provider key="JotaiProvider" store={props.store} />,
            <ThemeProvider key="ThemeProvider" />,
            <ConfirmModalProvider key="ConfirmModalProvider" />,
            <PromptModalProvider key="PromptModalProvider" />,
          ].filter(Boolean), //这是一个简洁的过滤方法，可以将数组中的空值过滤掉
        [props.store] //只有当 props.store 变化时才会重新创建 Providers 数组
      )}
    >
      {props.children}
    </ProviderComposer>
  );
}
