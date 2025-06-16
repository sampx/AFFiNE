import { configureQuotaModule } from '@affine/core/modules/quota'; // 导入配额模块的配置函数
import { type Framework } from '@toeverything/infra'; // 导入框架类型定义，用于依赖注入

import {
  configureAIButtonModule, // 导入 AI 按钮模块的配置函数
  configureAIModelSwitchModule, // 导入 AI 模型切换模块的配置函数
  configureAINetworkSearchModule, // 导入 AI 网络搜索模块的配置函数
  configureAIReasoningModule, // 导入 AI 推理模块的配置函数
} from './ai-button'; // 来自 ai-button 目录
import { configureAppSidebarModule } from './app-sidebar'; // 导入应用侧边栏模块的配置函数
import { configAtMenuConfigModule } from './at-menu-config'; // 导入 @ 菜单配置模块的配置函数
import { configureBlobManagementModule } from './blob-management'; // 导入 Blob 管理模块的配置函数
import { configureCloudModule } from './cloud'; // 导入云服务模块的配置函数
import { configureCollectionModule } from './collection'; // 导入集合模块的配置函数
import { configureCollectionRulesModule } from './collection-rules'; // 导入集合规则模块的配置函数
import { configureWorkspaceDBModule } from './db'; // 导入工作区数据库模块的配置函数
import { configureDialogModule } from './dialogs'; // 导入对话框模块的配置函数
import { configureDndModule } from './dnd'; // 导入拖放模块的配置函数
import { configureDocModule } from './doc'; // 导入文档模块的配置函数
import { configureDocDisplayMetaModule } from './doc-display-meta'; // 导入文档显示元数据模块的配置函数
import { configureDocInfoModule } from './doc-info'; // 导入文档信息模块的配置函数
import { configureDocLinksModule } from './doc-link'; // 导入文档链接模块的配置函数
import { configureDocsSearchModule } from './docs-search'; // 导入文档搜索模块的配置函数
import { configureEditorModule } from './editor'; // 导入编辑器模块的配置函数
import { configureEditorSettingModule } from './editor-setting'; // 导入编辑器设置模块的配置函数
import { configureFavoriteModule } from './favorite'; // 导入收藏模块的配置函数
import { configureFeatureFlagModule } from './feature-flag'; // 导入功能标志模块的配置函数
import { configureGlobalContextModule } from './global-context'; // 导入全局上下文模块的配置函数
import { configureI18nModule } from './i18n'; // 导入国际化模块的配置函数
import { configureImportClipperModule } from './import-clipper'; // 导入剪藏导入模块的配置函数
import { configureImportTemplateModule } from './import-template'; // 导入模板导入模块的配置函数
import { configureIntegrationModule } from './integration'; // 导入集成模块的配置函数
import { configureJournalModule } from './journal'; // 导入日志模块的配置函数
import { configureLifecycleModule } from './lifecycle'; // 导入生命周期模块的配置函数
import { configureMediaModule } from './media'; // 导入媒体模块的配置函数
import { configureNavigationModule } from './navigation'; // 导入导航模块的配置函数
import { configureNavigationPanelModule } from './navigation-panel'; // 导入导航面板模块的配置函数
import { configureNotificationModule } from './notification'; // 导入通知模块的配置函数
import { configureOpenInApp } from './open-in-app'; // 导入应用内打开模块的配置函数
import { configureOrganizeModule } from './organize'; // 导入组织模块的配置函数
import { configurePDFModule } from './pdf'; // 导入 PDF 模块的配置函数
import { configurePeekViewModule } from './peek-view'; // 导入 Peek View 模块的配置函数
import { configurePermissionsModule } from './permissions'; // 导入权限模块的配置函数
import { configureQuickSearchModule } from './quicksearch'; // 导入快速搜索模块的配置函数
import { configSearchMenuModule } from './search-menu'; // 导入搜索菜单模块的配置函数
import { configureShareDocsModule } from './share-doc'; // 导入文档分享模块的配置函数
import { configureShareSettingModule } from './share-setting'; // 导入分享设置模块的配置函数
import {
  configureCommonGlobalStorageImpls, // 导入通用全局存储实现配置函数
  configureStorageModule, // 导入存储模块的配置函数
} from './storage'; // 来自 storage 目录
import { configureSystemFontFamilyModule } from './system-font-family'; // 导入系统字体模块的配置函数
import { configureTagModule } from './tag'; // 导入标签模块的配置函数
import { configureTelemetryModule } from './telemetry'; // 导入遥测模块的配置函数
import { configureTemplateDocModule } from './template-doc'; // 导入模板文档模块的配置函数
import { configureAppThemeModule } from './theme'; // 导入应用主题模块的配置函数
import { configureThemeEditorModule } from './theme-editor'; // 导入主题编辑器模块的配置函数
import { configureUrlModule } from './url'; // 导入 URL 模块的配置函数
import { configureUserspaceModule } from './userspace'; // 导入用户空间模块的配置函数
import { configureWorkspaceModule } from './workspace'; // 导入工作区模块的配置函数
import { configureIndexerEmbeddingModule } from './workspace-indexer-embedding'; // 导入工作区索引器嵌入模块的配置函数
import { configureWorkspacePropertyModule } from './workspace-property'; // 导入工作区属性模块的配置函数

/**
 * 配置 AFFiNE 应用的通用核心模块。
 * 这个函数是应用程序启动时初始化各种功能模块的入口点。
 * 每个 `configureXxxModule` 函数都会将对应的服务、实体、存储等注册到依赖注入框架中。
 *
 * @param framework - 依赖注入框架实例，用于注册和管理模块。
 */
export function configureCommonModules(framework: Framework) {
  configureI18nModule(framework); // 配置国际化模块，提供多语言支持
  configureWorkspaceModule(framework); // 配置工作区模块，管理工作区的创建、加载、切换等
  configureDocModule(framework); // 配置文档模块，处理文档的创建、内容操作、属性管理等
  configureWorkspaceDBModule(framework); // 配置工作区数据库模块，处理工作区数据的持久化
  configureStorageModule(framework); // 配置存储模块，提供全局状态、缓存和会话存储能力
  configureGlobalContextModule(framework); // 配置全局上下文模块，提供应用范围的上下文信息
  configureLifecycleModule(framework); // 配置生命周期模块，管理应用的生命周期事件
  configureFeatureFlagModule(framework); // 配置功能标志模块，用于控制应用功能的开关
  configureCollectionModule(framework); // 配置集合模块，管理文档集合
  configureNavigationModule(framework); // 配置导航模块，处理应用内的页面导航
  configureTagModule(framework); // 配置标签模块，管理文档标签
  configureCloudModule(framework); // 配置云服务模块，处理用户认证、云同步、订阅等云端交互
  configureQuotaModule(framework); // 配置配额模块，管理用户或工作区的资源配额
  configurePermissionsModule(framework); // 配置权限模块，管理用户对文档或工作区的访问权限
  configureShareDocsModule(framework); // 配置文档分享模块，处理文档的分享功能
  configureShareSettingModule(framework); // 配置分享设置模块，管理文档分享的相关设置
  configureTelemetryModule(framework); // 配置遥测模块，用于收集应用使用数据和性能指标
  configurePDFModule(framework); // 配置 PDF 模块，可能用于 PDF 导出或查看
  configurePeekViewModule(framework); // 配置 Peek View 模块，提供快速预览功能
  configureDocDisplayMetaModule(framework); // 配置文档显示元数据模块，管理文档在 UI 中的显示信息
  configureQuickSearchModule(framework); // 配置快速搜索模块，提供应用内的快速搜索功能
  configureDocsSearchModule(framework); // 配置文档搜索模块，提供更全面的文档内容搜索
  configureDocLinksModule(framework); // 配置文档链接模块，处理文档内部链接和外部链接
  configureOrganizeModule(framework); // 配置组织模块，可能用于文档的分类和组织
  configureFavoriteModule(framework); // 配置收藏模块，管理用户收藏的文档或页面
  configureNavigationPanelModule(framework); // 配置导航面板模块，管理侧边导航栏的显示和行为
  configureThemeEditorModule(framework); // 配置主题编辑器模块，允许用户自定义应用主题
  configureEditorModule(framework); // 配置编辑器模块，提供文档编辑器的核心功能
  configureSystemFontFamilyModule(framework); // 配置系统字体模块，处理系统字体的加载和使用
  configureEditorSettingModule(framework); // 配置编辑器设置模块，管理编辑器的各种配置
  configureImportTemplateModule(framework); // 配置模板导入模块，处理模板的导入功能
  configureUserspaceModule(framework); // 配置用户空间模块，管理用户相关的设置和数据
  configureAppSidebarModule(framework); // 配置应用侧边栏模块，管理侧边栏的显示和状态
  configureJournalModule(framework); // 配置日志模块，可能用于记录用户操作或应用事件
  configureUrlModule(framework); // 配置 URL 模块，处理应用内部的 URL 路由和解析
  configureAppThemeModule(framework); // 配置应用主题模块，管理应用整体的主题样式
  configureDialogModule(framework); // 配置对话框模块，管理应用中各种弹出对话框
  configureDocInfoModule(framework); // 配置文档信息模块，显示和管理文档的详细信息
  configureOpenInApp(framework); // 配置应用内打开模块，处理在应用内打开特定内容
  configAtMenuConfigModule(framework); // 配置 @ 菜单配置模块，用于在编辑器中触发 @ 提及功能
  configSearchMenuModule(framework); // 配置搜索菜单模块，用于在编辑器中触发搜索功能
  configureDndModule(framework); // 配置拖放模块，提供应用内的拖放功能
  configureCommonGlobalStorageImpls(framework); // 配置通用全局存储的实现，如 localStorage, sessionStorage
  configureAINetworkSearchModule(framework); // 配置 AI 网络搜索模块，集成 AI 驱动的网络搜索功能
  configureAIReasoningModule(framework); // 配置 AI 推理模块，提供 AI 推理能力
  configureAIModelSwitchModule(framework); // 配置 AI 模型切换模块，允许用户切换不同的 AI 模型
  configureAIButtonModule(framework); // 配置 AI 按钮模块，提供 AI 相关功能的 UI 入口
  configureTemplateDocModule(framework); // 配置模板文档模块，管理和使用文档模板
  configureBlobManagementModule(framework); // 配置 Blob 管理模块，处理二进制大对象数据
  configureMediaModule(framework); // 配置媒体模块，处理图片、视频等多媒体内容
  configureImportClipperModule(framework); // 配置剪藏导入模块，用于从网页剪藏内容
  configureNotificationModule(framework); // 配置通知模块，处理应用内的通知消息
  configureIntegrationModule(framework); // 配置集成模块，管理与第三方服务的集成
  configureWorkspacePropertyModule(framework); // 配置工作区属性模块，管理工作区的自定义属性
  configureCollectionRulesModule(framework); // 配置集合规则模块，定义和管理集合的自动化规则
  configureIndexerEmbeddingModule(framework); // 配置索引器嵌入模块，可能用于文档内容的索引和嵌入
}
