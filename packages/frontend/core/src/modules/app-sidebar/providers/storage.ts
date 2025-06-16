import { createIdentifier, type Memento } from '@toeverything/infra';

/**
 * 用于描述App侧边栏状态的接口，继承自Memento接口。
 * Memento接口通常用于保存对象的状态，以便后续恢复。
 */
export interface AppSidebarState extends Memento {}

/**
 * 定义了一个标识符，用于在依赖注入容器中标识AppSidebarState。
 * createIdentifier函数创建一个与AppSidebarState相关的唯一标识符。
 * @param 'AppSidebarState' - 标识符的名称，通常与接口名相同以保持一致性。
 */
export const AppSidebarState =
  createIdentifier<AppSidebarState>('AppSidebarState');
