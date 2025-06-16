export { View as WorkbenchView } from './entities/view';
export { Workbench } from './entities/workbench';
export { ViewScope } from './scopes/view';
export { ViewService } from './services/view';
export { WorkbenchService } from './services/workbench';
export { useBindWorkbenchToBrowserRouter } from './view/browser-adapter';
export { useIsActiveView } from './view/use-is-active-view';
export { ViewBody, ViewHeader, ViewSidebarTab } from './view/view-islands';
export { ViewIcon, ViewTitle } from './view/view-meta';
export type { WorkbenchLinkProps } from './view/workbench-link';
export { WorkbenchLink } from './view/workbench-link';
export { WorkbenchRoot } from './view/workbench-root';

import { type Framework } from '@toeverything/infra';

import { DesktopApiService } from '../desktop-api';
import { PeekViewService } from '../peek-view';
import { GlobalState, GlobalStateService } from '../storage';
import { WorkspaceScope } from '../workspace';
import { SidebarTab } from './entities/sidebar-tab';
import { View } from './entities/view';
import { Workbench } from './entities/workbench';
import { ViewScope } from './scopes/view';
import { DesktopStateSynchronizer } from './services/desktop-state-synchronizer';
import { ViewService } from './services/view';
import { WorkbenchService } from './services/workbench';
import {
  BrowserWorkbenchNewTabHandler,
  DesktopWorkbenchNewTabHandler,
  WorkbenchNewTabHandler,
} from './services/workbench-new-tab-handler';
import {
  DesktopWorkbenchDefaultState,
  InMemoryWorkbenchDefaultState,
  WorkbenchDefaultState,
} from './services/workbench-view-state';

// 整体设计说明：
// Workbench模块通过划分作用域（WorkspaceScope和ViewScope），
// 且区分不同运行环境（浏览器与桌面）的实现细节，
// 达到高度的模块复用和扩展性。
// 通用部分负责基础状态和实体注册，环境专属部分通过依赖注入替换默认行为。
// 这种设计既保证了核心功能的统一，也方便针对不同平台进行定制。

/**
 * 配置工作台通用模块
 *
 * 该模块设计为工作台（Workbench）核心功能的基础配置，
 * 主要涉及工作区（Workspace）作用域下注册工作台服务，
 * 以及工作台视图（View）层面的实体和服务配置。
 *
 * 模块主要功能组件说明：
 * - WorkbenchService：负责管理工作台整体状态和行为的服务。
 * - Workbench实体：代表工作台的数据结构，包含默认状态和新标签页处理处理逻辑。
 * - View实体及ViewService：表示单个视图及其服务，管理视图的状态和交互。
 * - SidebarTab实体：定义侧边栏标签的结构，用于界面中不同标签的呈现。
 *
 * 设计思路是分层管理，WorkspaceScope下管理整个工作台的服务与实体，
 * ViewScope专门管理与视图相关的服务和实体，保证关注点分离。
 *
 * @param services - 框架服务实例，用于按作用域注册相关服务和实体。
 */
export function configureWorkbenchCommonModule(services: Framework) {
  services
    .scope(WorkspaceScope) // 工作区作用域，管理工作台整体服务
    .service(WorkbenchService) // 注册工作台核心服务
    .entity(Workbench, [
      WorkbenchDefaultState, // 工作台默认界面状态
      WorkbenchNewTabHandler, // 处理新标签页的逻辑
      GlobalState, // 全局状态管理依赖
    ])
    .entity(View) // 注册视图实体
    .scope(ViewScope) // 进入视图作用域
    .service(ViewService, [ViewScope]) // 注册视图相关服务，依赖视图作用域
    .entity(SidebarTab); // 注册侧边栏标签实体
}

/**
 * 配置浏览器环境下的工作台模块
 *
 * 该函数在通用工作台配置基础上，
 * 额外指定浏览器端的工作台默认状态和新标签页处理器实现。
 *
 * 具体提供：
 * - InMemoryWorkbenchDefaultState：基于内存的默认工作台状态实现，适合浏览器环境。
 * - BrowserWorkbenchNewTabHandler：浏览器特有的新标签页逻辑。
 *
 * @param services - 框架服务实例，用于配置浏览器专属实现。
 */
export function configureBrowserWorkbenchModule(services: Framework) {
  configureWorkbenchCommonModule(services); // 通用模块配置
  services
    .scope(WorkspaceScope)
    .impl(WorkbenchDefaultState, InMemoryWorkbenchDefaultState) // 浏览器默认状态实现
    .impl(WorkbenchNewTabHandler, () => BrowserWorkbenchNewTabHandler); // 浏览器新标签页处理器
}

/**
 * 配置桌面环境下的工作台模块
 *
 * 包括：
 * - 通用工作台模块基础功能
 * - 桌面环境特定的默认状态和新标签页处理器
 * - 新增桌面状态同步器服务，支持桌面应用状态同步功能
 *
 * 依赖注入：
 * - GlobalStateService：全局状态服务
 * - DesktopApiService：桌面应用API交互服务
 * - PeekViewService：预览视图服务
 * @param services - 框架服务容器，用于注册和配置服务
 */
export function configureDesktopWorkbenchModule(services: Framework) {
  configureWorkbenchCommonModule(services);
  services
    .scope(WorkspaceScope)
    .impl(WorkbenchDefaultState, DesktopWorkbenchDefaultState, [
      GlobalStateService, // 依赖全局状态服务
      DesktopApiService, // 依赖桌面API服务
    ])
    .impl(WorkbenchNewTabHandler, DesktopWorkbenchNewTabHandler, [
      DesktopApiService, // 依赖桌面API服务
    ])
    .service(DesktopStateSynchronizer, [
      WorkbenchService, // 依赖工作台服务
      DesktopApiService, // 依赖桌面API服务
      PeekViewService, // 依赖预览视图服务
    ]);
}
