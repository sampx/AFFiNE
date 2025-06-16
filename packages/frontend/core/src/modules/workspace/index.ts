import { FeatureFlagService } from '@affine/core/modules/feature-flag';

export type { WorkspaceProfileInfo } from './entities/profile';
export { Workspace } from './entities/workspace';
export { WorkspaceEngineBeforeStart, WorkspaceInitialized } from './events';
export { getAFFiNEWorkspaceSchema } from './global-schema';
export type { WorkspaceMetadata } from './metadata';
export type { WorkspaceOpenOptions } from './open-options';
export type { WorkspaceFlavourProvider } from './providers/flavour';
export { WorkspaceFlavoursProvider } from './providers/flavour';
export { WorkspaceLocalCache, WorkspaceLocalState } from './providers/storage';
export { WorkspaceScope } from './scopes/workspace';
export { WorkspaceService } from './services/workspace';
export { WorkspacesService } from './services/workspaces';

import type { Framework } from '@toeverything/infra';

import { GlobalCache, GlobalState, NbstoreService } from '../storage';
import { WorkspaceEngine } from './entities/engine';
import { WorkspaceList } from './entities/list';
import { WorkspaceProfile } from './entities/profile';
import { Workspace } from './entities/workspace';
import {
  WorkspaceLocalCacheImpl,
  WorkspaceLocalStateImpl,
} from './impls/storage';
import { WorkspaceFlavoursProvider } from './providers/flavour';
import { WorkspaceLocalCache, WorkspaceLocalState } from './providers/storage';
import { WorkspaceScope } from './scopes/workspace';
import { WorkspaceDestroyService } from './services/destroy';
import { WorkspaceEngineService } from './services/engine';
import { WorkspaceFactoryService } from './services/factory';
import { WorkspaceFlavoursService } from './services/flavours';
import { WorkspaceListService } from './services/list';
import { WorkspaceProfileService } from './services/profile';
import { WorkspaceRepositoryService } from './services/repo';
import { WorkspaceTransformService } from './services/transform';
import { WorkspaceService } from './services/workspace';
import { WorkspacesService } from './services/workspaces';
import { WorkspaceProfileCacheStore } from './stores/profile-cache';

/**
 * 配置工作区模块的依赖注入关系
 *
 * 该函数用于注册工作区模块相关的服务、实体、存储和实现类，
 * 并定义它们之间的依赖关系。通过Framework API进行依赖注入配置，
 * 包括工作区核心服务、列表服务、配置服务、转换服务等。
 *
 * @param framework - 框架实例，用于配置依赖注入
 */
export function configureWorkspaceModule(framework: Framework) {
  framework
    // === 重要理解：注册阶段 vs 实例化阶段 ===
    // 注册阶段：只是告诉Framework如何创建实例（注册工厂函数）
    // 实例化阶段：当React组件使用useService时，才真正创建实例并解析依赖

    // 1. 注册工作区服务总管 - WorkspacesService
    // 🔥 关键理解：这里不会立即创建WorkspacesService实例！
    // 只是注册了一个工厂函数：当需要WorkspacesService时，如何创建它
    // 工厂函数会记住：创建WorkspacesService需要这7个依赖
    .service(WorkspacesService, [
      WorkspaceFlavoursService, // 工作区类型管理服务(本地/云端)
      WorkspaceListService, // 工作区列表管理服务
      WorkspaceProfileService, // 工作区配置信息服务
      WorkspaceTransformService, // 工作区数据转换服务
      WorkspaceRepositoryService, // 工作区存储仓库服务
      WorkspaceFactoryService, // 工作区创建工厂服务
      WorkspaceDestroyService, // 工作区销毁处理服务
    ])

    // 2. 注册工作区类型服务 - WorkspaceFlavoursService
    // 同样只是注册工厂函数，不会立即创建实例
    // [[WorkspaceFlavoursProvider]] 表示依赖一个WorkspaceFlavoursProvider数组
    .service(WorkspaceFlavoursService, [[WorkspaceFlavoursProvider]])

    // 3. 注册工作区销毁服务 - WorkspaceDestroyService
    // 注册时可以安全地声明依赖WorkspaceFlavoursService，因为它已经被注册了
    .service(WorkspaceDestroyService, [WorkspaceFlavoursService])

    // 4. 注册工作区列表服务 - WorkspaceListService
    // 注册工厂函数：记住创建WorkspaceListService时需要什么依赖
    .service(WorkspaceListService)

    // 5. 注册工作区列表实体 - WorkspaceList
    // 注册工厂函数：记住创建WorkspaceList时需要WorkspaceFlavoursService
    .entity(WorkspaceList, [WorkspaceFlavoursService])

    // 6. 注册工作区配置服务 - WorkspaceProfileService
    // 无依赖的服务，注册简单的工厂函数
    .service(WorkspaceProfileService)

    // 7. 注册工作区配置缓存存储 - WorkspaceProfileCacheStore
    // store() 方法用于注册存储类，用于数据持久化
    // 依赖GlobalCache进行全局缓存管理
    .store(WorkspaceProfileCacheStore, [GlobalCache])

    // 8. 注册工作区配置实体 - WorkspaceProfile
    // 管理单个工作区的配置状态，依赖缓存存储和类型服务
    .entity(WorkspaceProfile, [
      WorkspaceProfileCacheStore, // 用于缓存配置数据
      WorkspaceFlavoursService, // 用于了解工作区类型相关的配置
    ])

    // 9. 注册工作区工厂服务 - WorkspaceFactoryService
    // 负责创建新的工作区实例，依赖类型服务来创建正确类型的工作区
    .service(WorkspaceFactoryService, [WorkspaceFlavoursService])

    // 10. 注册工作区转换服务 - WorkspaceTransformService
    // 负责工作区数据的导入导出转换，依赖工厂服务创建临时工作区，依赖销毁服务清理资源
    .service(WorkspaceTransformService, [
      WorkspaceFactoryService, // 用于创建转换过程中的工作区实例
      WorkspaceDestroyService, // 用于清理转换过程中的临时资源
    ])

    // 11. 注册工作区仓库服务 - WorkspaceRepositoryService
    // 负责工作区的存储和检索，需要多个服务协同工作
    .service(WorkspaceRepositoryService, [
      WorkspaceFlavoursService, // 了解不同类型工作区的存储方式
      WorkspaceProfileService, // 管理工作区配置信息
      WorkspaceListService, // 管理工作区列表状态
    ])

    // 12. 注册工作区作用域 - WorkspaceScope
    // scope() 方法用于注册作用域，作用域定义了服务的生存周期和范围
    // WorkspaceScope为每个工作区创建独立的依赖注入容器
    .scope(WorkspaceScope)

    // 13. 注册单个工作区服务 - WorkspaceService
    // 这是单个工作区实例的核心服务，在WorkspaceScope作用域内使用
    .service(WorkspaceService)

    // 14. 注册工作区实体 - Workspace
    // 代表一个具体的工作区实例，包含工作区的所有状态和行为
    .entity(Workspace, [
      WorkspaceScope, // 确定该工作区所属的作用域
      FeatureFlagService, // 用于控制工作区的功能特性开关
    ])

    // 15. 注册工作区引擎服务 - WorkspaceEngineService
    // 负责工作区的底层数据处理引擎，在特定作用域内工作
    .service(WorkspaceEngineService, [WorkspaceScope])

    // 16. 注册工作区引擎实体 - WorkspaceEngine
    // 具体的数据处理引擎实例，依赖工作区服务和数据存储服务
    .entity(WorkspaceEngine, [
      WorkspaceService, // 获取工作区基本信息
      NbstoreService, // 用于本地优先的数据同步存储
    ])

    // 17. 注册工作区本地状态实现 - WorkspaceLocalState
    // impl() 方法用于为接口注册具体的实现类
    // 第一个参数是接口/抽象类，第二个参数是具体实现类，第三个参数是实现类的依赖
    .impl(WorkspaceLocalState, WorkspaceLocalStateImpl, [
      WorkspaceService, // 获取当前工作区信息
      GlobalState, // 访问全局状态存储
    ])

    // 18. 注册工作区本地缓存实现 - WorkspaceLocalCache
    // 为工作区本地缓存接口提供具体实现
    .impl(WorkspaceLocalCache, WorkspaceLocalCacheImpl, [
      WorkspaceService, // 获取当前工作区信息
      GlobalCache, // 访问全局缓存存储
    ]);
}
