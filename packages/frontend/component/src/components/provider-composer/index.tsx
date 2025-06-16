import type { ReactNode } from 'react';
import { cloneElement } from 'react';

interface ProviderComposerProps {
  contexts: any;
  children: ReactNode;
}

/**
 * ProviderComposer 组件用于组合多个 React 上下文提供者（Context Providers），
 * 使得子组件能够访问这些上下文中提供的数据，而无需逐层传递 props。
 *
 * @param contexts - 一个包含多个 React 上下文提供者的数组。
 * @param children - 要渲染的子节点。
 *
 * 通过 `reduceRight` 方法从右到左遍历 `contexts` 数组，并使用 `cloneElement` 将每个提供者包裹起来，
 * 最终形成一个嵌套的上下文提供者结构，确保最内层的提供者最先被应用。
 */
export const ProviderComposer = ({
  contexts,
  children,
}: ProviderComposerProps) =>
  contexts.reduceRight(
    (kids: ReactNode, parent: any) =>
      cloneElement(parent, {
        children: kids,
      }),
    children
  );
