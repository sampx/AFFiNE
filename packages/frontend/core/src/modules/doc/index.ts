export { Doc } from './entities/doc';
export { DocRecord } from './entities/record';
export { DocRecordList } from './entities/record-list';
export { DocCreated } from './events';
export { DocScope } from './scopes/doc';
export { DocService } from './services/doc';
export { DocsService } from './services/docs';

import type { Framework } from '@toeverything/infra';

import { WorkspaceDBService } from '../db/services/db';
import { WorkspaceScope, WorkspaceService } from '../workspace';
import { Doc } from './entities/doc';
import { DocRecord } from './entities/record';
import { DocRecordList } from './entities/record-list';
import { DocCreateMiddleware } from './providers/doc-create-middleware';
import { DocScope } from './scopes/doc';
import { DocService } from './services/doc';
import { DocsService } from './services/docs';
import { DocPropertiesStore } from './stores/doc-properties';
import { DocsStore } from './stores/docs';

export { DocCreateMiddleware } from './providers/doc-create-middleware';

/**
 * @function configureDocModule
 *
 * @description
 * 配置文档模块的依赖注入关系，建立文档系统的组件架构。
 * 这个函数使用依赖注入框架将所有文档相关组件连接起来，形成一个完整的文档管理系统。
 *
 * @architecture
 * 整体架构分为两个主要作用域：
 * 1. WorkspaceScope (工作区作用域) - 管理多个文档
 * 2. DocScope (文档作用域) - 管理单个文档实例
 *
 * @dataFlow
 * - 用户操作 → DocService → Doc实体 → DocsStore/DocPropertiesStore → 持久化存储
 * - 外部更新 → 持久化存储 → Store → Entity → UI更新
 *
 * @param {Framework} framework - 依赖注入框架实例
 */
export function configureDocModule(framework: Framework) {
  framework
    // 开始在工作区作用域内注册组件
    .scope(WorkspaceScope)

    // 注册 DocsService 服务 - 管理多个文档的集合操作
    // 功能：创建文档、打开文档、复制文档、监控文档变化等
    .service(DocsService, [
      DocsStore, // 依赖：文档存储
      DocPropertiesStore, // 依赖：文档属性存储
      [DocCreateMiddleware], // 依赖：文档创建中间件数组
    ])

    // 注册 DocPropertiesStore 存储 - 管理文档属性
    // 功能：存储和检索文档属性，处理属性升级，提供属性观察
    .store(DocPropertiesStore, [
      WorkspaceService, // 依赖：工作区服务
      WorkspaceDBService, // 依赖：工作区数据库服务
    ])

    // 注册 DocsStore 存储 - 管理文档核心数据
    // 功能：创建文档、监控文档状态、管理元数据、集成BlockSuite
    .store(DocsStore, [
      WorkspaceService, // 依赖：工作区服务
      DocPropertiesStore, // 依赖：文档属性存储
    ])

    // 注册 DocRecord 实体 - 文档的轻量级记录
    // 功能：提供文档基本信息访问，无需打开完整文档
    .entity(DocRecord, [
      DocsStore, // 依赖：文档存储
      DocPropertiesStore, // 依赖：文档属性存储
    ])

    // 注册 DocRecordList 实体 - 管理多个文档记录
    // 功能：维护文档记录池，提供文档列表访问，管理垃圾箱
    .entity(DocRecordList, [
      DocsStore, // 依赖：文档存储
    ])

    // 切换到文档作用域 - 专注于单个文档实例的管理
    .scope(DocScope)

    // 注册 Doc 实体 - 完整的文档对象
    // 功能：提供文档内容操作，管理元数据和属性，处理模式切换
    .entity(Doc, [
      DocScope, // 依赖：文档作用域
      DocsStore, // 依赖：文档存储
      WorkspaceService, // 依赖：工作区服务
    ])

    // 注册 DocService 服务 - 管理单个文档
    // 功能：创建和管理文档实体，提供文档操作接口
    .service(DocService);
}
