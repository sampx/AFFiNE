# AFFiNE 前端核心模块与工作区引擎深度解析

本文档旨在为初学者详细介绍 AFFiNE 前端应用中的核心模块，特别是 `packages/frontend/core/src/modules/index.ts` 文件及其导入导出的模块，并深入分析 `workspace-engine` 模块的功能、用法以及它与 `workspace` 模块之间的紧密关系。通过本报告，您将对 AFFiNE 前端架构有一个全面而清晰的认识。

## 一、AFFiNE 前端核心模块概览

AFFiNE 的前端应用由一系列精心设计的模块组成，每个模块都负责特定的功能，并通过依赖注入框架协同工作。以下是主要核心模块的功能和用法总结：

### 1. `workspace` (工作区) 模块

- **功能:** 管理 AFFiNE 应用中的工作区，包括工作区的创建、列表管理、配置、数据转换、存储和销毁。它定义了工作区的生命周期和数据模型。
- **核心服务/实体:** `WorkspacesService` (工作区服务总管), `WorkspaceService` (单个工作区实例服务), `Workspace` (工作区实体), `WorkspaceListService` (工作区列表管理), `WorkspaceProfileService` (工作区配置信息), `WorkspaceEngineService` (底层数据处理引擎), `WorkspaceFlavoursService` (工作区类型管理)。
- **用法:** 通过 `configureWorkspaceModule(framework)` 将工作区管理能力注入到应用框架中，使得应用能够创建、加载、切换和管理不同的工作区。

### 2. `doc` (文档) 模块

- **功能:** 处理文档的创建、加载、保存、内容操作、属性管理和文档记录。它定义了文档的数据模型和操作接口。
- **核心服务/实体:** `DocsService` (管理多个文档), `DocService` (管理单个文档), `Doc` (文档对象), `DocRecord` (文档轻量级记录), `DocsStore` (文档核心数据存储), `DocPropertiesStore` (文档属性存储)。
- **用法:** 通过 `configureDocModule(framework)` 配置文档模块，使得应用能够对文档进行全面的管理和操作。

### 3. `editor` (编辑器) 模块

- **功能:** 提供文档编辑器的核心功能和配置。它将编辑器与文档服务和工作区服务关联起来。
- **核心服务/实体:** `EditorsService` (管理多个编辑器), `EditorService` (管理单个编辑器), `Editor` (编辑器实体)。
- **用法:** 通过 `configureEditorModule(framework)` 配置编辑器模块，使得应用能够创建和管理文档编辑器，并与文档和工作区数据进行交互。

### 4. `storage` (存储) 模块

- **功能:** 提供多种存储方案，包括持久化应用状态、临时缓存、会话状态和跨标签页共享存储。它封装了底层存储机制（如 localStorage, sessionStorage, IndexedDB, SharedWorker）。
- **核心服务/接口/实现:** `GlobalStateService`, `GlobalCacheService`, `GlobalSessionStateService` (全局状态/缓存/会话状态服务), `NbstoreService` (跨标签页共享存储服务), `GlobalState`, `GlobalCache`, `GlobalSessionState`, `CacheStorage`, `NbstoreProvider` (存储提供者接口), `LocalStorageGlobalState`, `LocalStorageGlobalCache`, `SessionStorageGlobalSessionState`, `IDBGlobalState` (具体存储实现)。
- **用法:** 通过 `configureStorageModule(framework)` 和 `configureCommonGlobalStorageImpls(framework)` 配置存储模块，为应用提供数据持久化和缓存能力。

### 5. `lifecycle` (生命周期) 模块

- **功能:** 管理应用的生命周期事件和状态，如应用启动、聚焦等。
- **核心服务/事件:** `LifecycleService` (生命周期服务), `ApplicationStarted`, `ApplicationFocused` (生命周期事件)。
- **用法:** 通过 `configureLifecycleModule(framework)` 配置生命周期模块，使得应用能够响应和管理自身的生命周期事件。

### 6. `cloud` (云服务) 模块

- **功能:** 处理与云端服务的交互，包括用户认证、服务器管理、订阅、配额、邀请、发票、许可证、文档元数据同步等。它集成了 GraphQL 和 Fetch 服务进行网络通信。
- **核心服务/实体/存储:** `AuthService` (用户认证), `ServersService`, `ServerService` (单个服务器实例服务), `SubscriptionService` (订阅管理), `UserQuotaService`, `UserCopilotQuotaService`, `UserFeatureService` (用户配额和功能), `InvitationService` (邀请管理), `SelfhostLicenseService`, `SelfhostGenerateLicenseService` (自托管许可证), `CloudDocMetaService` (云文档元数据), `GraphQLService`, `FetchService` (网络通信), 以及各种相关的 `Store`。
- **用法:** 通过 `configureCloudModule(framework)` 配置云服务模块，使得应用能够与 AFFiNE 的云后端进行交互，实现用户登录、数据同步、功能订阅等。

### 7. `i18n` (国际化) 模块

- **功能:** 提供多语言支持，管理应用的国际化资源。
- **核心服务/实体:** `I18nService` (国际化服务), `I18n` (国际化实体)。
- **用法:** 通过 `configureI18nModule(framework)` 配置国际化模块，使得应用能够根据用户选择的语言显示不同的文本。

### 8. `app-sidebar` (应用侧边栏) 模块

- **功能:** 管理应用界面的侧边栏功能，包括侧边栏的状态（展开/折叠）和持久化。
- **核心服务/实体/提供者:** `AppSidebarService` (侧边栏服务), `AppSidebar` (侧边栏实体), `AppSidebarState` (侧边栏状态提供者接口), `AppSidebarStateImpl` (侧边栏状态具体实现)。
- **用法:** 通过 `configureAppSidebarModule(framework)` 配置侧边栏模块，使得应用能够管理侧边栏的显示和行为，并将其状态持久化。

## 二、`workspace-engine` 模块深度解析

`workspace-engine` 模块是 AFFiNE 工作区管理系统的核心驱动力，它负责处理工作区的底层数据存储、同步和不同环境下的适配。

### 1. `packages/frontend/core/src/modules/workspace-engine/index.ts`

这是工作区引擎模块的入口文件，主要负责配置浏览器环境下的工作区类型提供者，并提供一个用于直接添加本地工作区的辅助函数。

- **`configureBrowserWorkspaceFlavours(framework: Framework)`**:

  - **功能**: 这个函数是核心，它将不同的工作区类型（"LOCAL" 本地工作区 和 "CLOUD" 云工作区）与它们的具体实现（`LocalWorkspaceFlavoursProvider` 和 `CloudWorkspaceFlavoursProvider`）绑定到应用程序的依赖注入框架中。
  - **用法**: 在应用程序启动时调用，用于初始化工作区类型管理系统。
    - `WorkspaceFlavoursProvider('LOCAL')`: 注册本地工作区类型。
    - `WorkspaceFlavoursProvider('CLOUD')`: 注册云工作区类型，并声明其依赖 `GlobalState` (全局状态) 和 `ServersService` (服务器服务)。这意味着在创建 `CloudWorkspaceFlavoursProvider` 实例时，框架会自动注入这些依赖。

- **`_addLocalWorkspace(id: string)`**:

  - **功能**: 一个辅助函数，用于在将 SQLite 数据库文件复制到应用程序数据文件夹后，直接将本地工作区 ID 添加到本地存储的工作区列表中。这通常用于桌面应用程序中，当用户导入或复制了一个本地工作区文件时。
  - **用法**: 在特定场景下（如桌面应用的文件导入），手动调用以更新本地工作区列表。它通过 `localStorage` 存储工作区 ID。

- **导出**:
  - `base64ToUint8Array`, `uint8ArrayToBase64`: 从 `./utils/base64` 导出，用于 Base64 编码和解码 `Uint8Array` 数据。这些函数在处理二进制数据（如图片、文件内容）时非常有用。

### 2. `packages/frontend/core/src/modules/cloud/services/servers.ts`

该文件定义了 `ServersService`，负责管理应用程序中的云服务器列表及其配置。

- **`ServersService`**:
  - **功能**:
    - 管理 `Server` 实体（代表一个云服务器实例）。
    - 通过 `serverListStore` 和 `serverConfigStore` 持久化和获取服务器列表及配置。
    - 提供 `servers$` LiveData (实时数据流)，响应式地提供当前所有服务器的列表。
    - 提供 `server$(id: string)` 和 `serverByBaseUrl$(url: string)` 方法，用于按 ID 或基础 URL 查找服务器。
    - 提供 `addServer`、`removeServer`、`addServerByBaseUrl`、`addOrGetServerByBaseUrl` 等方法来管理服务器的增删改查。
    - 使用 `ObjectPool` 来管理 `Server` 实例的生命周期，确保服务器实例在不再需要时被正确释放。
  - **用法**: 作为依赖注入的服务，供其他模块（如 `CloudWorkspaceFlavoursProvider`）使用，以获取和管理云服务器信息。

### 3. `packages/frontend/core/src/modules/storage/index.ts`

存储模块的入口文件，提供了多种存储方案的接口、服务和实现。

- **核心概念**:
  - **Providers (接口)**: 定义了不同存储类型的抽象接口，如 `CacheStorage` (IndexedDB 缓存), `GlobalCache` (localStorage 临时缓存), `GlobalSessionState` (sessionStorage 会话状态), `GlobalState` (localStorage 持久化状态), `NbstoreProvider` (跨标签页共享存储)。
  - **Services (服务)**: 封装了对 Providers 的访问，提供更高级别的存储管理功能，如 `GlobalStateService`。
  - **Impls (实现)**: 提供了 Providers 接口的具体实现，如 `LocalStorageGlobalState`。
- **`GlobalState`**:
  - **功能**: 一个用于持久化应用程序全局状态的接口，通常基于 `localStorage` 实现。在 `CloudWorkspaceFlavoursProvider` 中，它被用于缓存云工作区列表。
  - **用法**: 通过依赖注入获取 `GlobalState` 实例，然后使用其方法来存储和检索全局持久化数据。
- **`configureStorageModule(framework: Framework)`**: 配置存储模块的服务。
- **`configureLocalStorageStateStorageImpls(framework: Framework)`**: 配置基于 `localStorage` 和 `IndexedDB` 的存储实现。
- **`configureCommonGlobalStorageImpls(framework: Framework)`**: 配置基于 `sessionStorage` 的会话状态存储实现。

### 4. `packages/frontend/core/src/modules/workspace/index.ts`

工作区模块的入口文件，定义了工作区的核心概念、实体、服务和提供者接口。

- **`WorkspaceFlavoursProvider` (接口)**:
  - **功能**: 这是定义不同工作区类型（如本地、云端）行为的核心接口。它规定了每种工作区类型必须实现的方法，例如创建工作区、删除工作区、获取工作区配置文件、获取 Blob 数据、列出 Blob 等。
  - **用法**: `workspace-engine/index.ts` 中的 `configureBrowserWorkspaceFlavours` 函数就是将 `LocalWorkspaceFlavoursProvider` 和 `CloudWorkspaceFlavoursProvider` 作为这个接口的具体实现注册到框架中。
- **`Workspace`**: 工作区实体，代表一个具体的工作区实例。
- **`WorkspaceMetadata`**: 工作区元数据类型，包含工作区 ID 和类型（flavour）。
- **`configureWorkspaceModule(framework: Framework)`**: 配置工作区模块的依赖注入关系，注册了大量与工作区相关的服务和实体，如 `WorkspacesService`、`WorkspaceListService`、`WorkspaceProfileService` 等。

### 5. `packages/frontend/core/src/modules/workspace-engine/impls/cloud.ts`

该文件实现了云工作区类型提供者 `CloudWorkspaceFlavoursProvider` 和单个云工作区类型提供者 `CloudWorkspaceFlavourProvider`。

- **`CloudWorkspaceFlavoursProvider`**:
  - **功能**: 负责管理所有云工作区类型提供者实例。它监听 `ServersService` 提供的服务器列表，并为每个服务器创建一个 `CloudWorkspaceFlavourProvider` 实例。
  - **用法**: 作为 `WorkspaceFlavoursProvider` 接口的实现，由 `workspace-engine/index.ts` 中的 `configureBrowserWorkspaceFlavours` 注册。
- **`CloudWorkspaceFlavourProvider`**:
  - **功能**: 实现了 `WorkspaceFlavourProvider` 接口，为单个云服务器提供工作区管理功能。
    - **存储类型选择**: 根据 `BUILD_CONFIG`（构建配置，如 Electron、Web、iOS、Android），动态选择使用 `Sqlite` (SQLite 数据库) 或 `IndexedDB` (浏览器本地数据库) 作为文档和 Blob (二进制大对象，如图片、文件) 的本地存储方案。
    - **`deleteWorkspace(id: string)`**: 调用 GraphQL 服务删除云端工作区，并触发本地工作区列表的重新验证。
    - **`createWorkspace(initial: ...)`**: 在云端创建工作区，获取工作区 ID，然后在本地存储初始状态，并同步到云端。
    - **`revalidate`**: 响应式地从 GraphQL 服务获取云工作区列表，并更新 `workspaces$` LiveData (实时数据流)，同时将列表缓存到 `GlobalState`。
    - **`getWorkspaceProfile(id: string)`**: 从云端和本地存储获取工作区配置文件信息（名称、头像、权限等），并使用 `getWorkspaceProfileWorker` 进行处理。
    - **`getWorkspaceBlob(id: string, blob: string)`**: 从本地或云端获取 Blob 数据。
    - **`listBlobs(id: string)`**: 列出云端工作区的所有 Blob。
    - **`deleteBlob(id: string, blob: string, permanent: boolean)`**: 删除云端和本地的 Blob。
    - **`onWorkspaceInitialized(workspace: Workspace)`**: 在工作区初始化后，将其绑定到对应的云服务器。
    - **`getEngineWorkerInitOptions(workspaceId: string)`**: 为工作区引擎 Worker (Web Worker，用于在后台执行耗时操作) 提供初始化选项，包括本地存储（Doc, Blob, Sync, Awareness, Indexer）和远程存储（CloudDocStorage, CloudBlobStorage, CloudAwarenessStorage）的配置。
    - **`writeInitialDocProperties(...)`**: 写入初始文档属性，如页面 ID 和创建者 ID。
  - **依赖**: `GlobalState`, `Server`, `AuthService`, `GraphQLService`, `FeatureFlagService`, `WorkspaceServerService`。

### 6. `packages/frontend/core/src/modules/workspace-engine/impls/local.ts`

该文件实现了本地工作区类型提供者 `LocalWorkspaceFlavoursProvider` 和单个本地工作区类型提供者 `LocalWorkspaceFlavourProvider`。

- **`LOCAL_WORKSPACE_LOCAL_STORAGE_KEY`**: 用于在 `localStorage` 中存储本地工作区 ID 的键。
- **`LOCAL_WORKSPACE_CHANGED_BROADCAST_CHANNEL_KEY`**: 用于跨浏览器标签页通知本地工作区列表变化的 BroadcastChannel (广播频道) 键。
- **`getLocalWorkspaceIds()` / `setLocalWorkspaceIds()`**: 辅助函数，用于获取和设置本地工作区 ID 列表。
- **`LocalWorkspaceFlavoursProvider`**:
  - **功能**: 管理所有本地工作区类型提供者实例。它只包含一个 `LocalWorkspaceFlavourProvider` 实例。
  - **用法**: 作为 `WorkspaceFlavoursProvider` 接口的实现，由 `workspace-engine/index.ts` 中的 `configureBrowserWorkspaceFlavours` 注册。
- **`LocalWorkspaceFlavourProvider`**:
  - **功能**: 实现了 `WorkspaceFlavourProvider` 接口，提供本地工作区管理功能。
    - **存储类型选择**: 与 `CloudWorkspaceFlavourProvider` 类似，根据 `BUILD_CONFIG` 动态选择 `Sqlite` 或 `IndexedDB` 作为本地存储方案。
    - **`deleteWorkspace(id: string)`**: 从 `localStorage` 中移除工作区 ID。如果是 Electron 环境，还会调用桌面 API 将工作区文件移动到垃圾桶。通过 `BroadcastChannel` 通知其他标签页。
    - **`createWorkspace(initial: ...)`**: 创建新的本地工作区 ID，在本地存储初始状态，然后将工作区 ID 添加到 `localStorage`，并通过 `BroadcastChannel` 通知其他标签页。
    - **`workspaces$`**: LiveData，响应式地提供当前所有本地工作区的列表，通过监听 `BroadcastChannel` 实现跨标签页同步。
    - **`revalidate()`**: 通过 `BroadcastChannel` 发送消息，触发 `workspaces$` 的更新。
    - **`getWorkspaceProfile(id: string)`**: 从本地存储获取工作区配置文件信息，并使用 `getWorkspaceProfileWorker` 进行处理。
    - **`getWorkspaceBlob(id: string, blobKey: string)`**: 从本地存储获取 Blob 数据。
    - **`listBlobs(id: string)`**: 列出本地工作区的所有 Blob。
    - **`deleteBlob(id: string, blob: string, permanent: boolean)`**: 删除本地 Blob。
    - **`getEngineWorkerInitOptions(workspaceId: string)`**: 为工作区引擎 Worker 提供初始化选项，主要配置本地存储（Doc, Blob, Sync, Awareness, Indexer）。
  - **依赖**: `FrameworkProvider`, `DesktopApiService` (仅 Electron)。

### 7. `packages/frontend/core/src/modules/workspace-engine/utils/base64.ts`

该文件提供了 Base64 编码和解码 `Uint8Array` 的工具函数。

- **`uint8ArrayToBase64(array: Uint8Array): Promise<string>`**:
  - **功能**: 将 `Uint8Array` (无符号8位整数数组，常用于表示二进制数据) 转换为 Base64 编码的字符串。它通过创建 `Blob` (二进制大对象) 和使用 `FileReader` 的 `readAsDataURL` 方法实现异步转换。
  - **用法**: 当需要将二进制数据（如图像、文件内容）以 Base64 字符串形式存储或传输时使用。
- **`base64ToUint8Array(base64: string)`**:
  - **功能**: 将 Base64 编码的字符串转换为 `Uint8Array`。它使用 `atob` 函数进行解码。
  - **用法**: 当从 Base64 字符串中恢复二进制数据时使用。

## 三、`workspace-engine` 与 `workspace` 模块的关系深度分析

`workspace-engine` 和 `workspace` 模块在 AFFiNE 的前端架构中扮演着不同的角色，但它们紧密协作，共同构成了完整的工作区管理系统。理解它们之间的关系对于理解 AFFiNE 的核心架构至关重要。

#### `workspace` 模块 (核心抽象与定义)

- **定位**: `workspace` 模块是工作区概念的**核心抽象层**。它定义了工作区是什么，工作区有哪些属性，以及工作区可以执行哪些操作。它关注的是工作区的**业务逻辑和通用行为**，而不关心底层的数据存储和同步的具体实现。
- **主要职责**:
  - **定义接口和类型**: 例如 `WorkspaceFlavourProvider` 接口，它规定了不同工作区类型（本地、云端）必须实现的功能。
  - **定义实体**: 如 `Workspace` 实体，代表一个具体的工作区实例，包含其状态和行为。
  - **定义服务**: 提供了管理工作区列表、配置文件、转换、仓库等的高级服务（如 `WorkspacesService`, `WorkspaceProfileService`）。
  - **配置依赖注入**: `configureWorkspaceModule` 函数负责将这些服务、实体和接口注册到依赖注入框架中，并定义它们之间的依赖关系。
- **总结**: `workspace` 模块是工作区系统的“骨架”和“蓝图”，它提供了构建工作区所需的所有抽象和通用组件。

#### `workspace-engine` 模块 (具体实现与驱动)

- **定位**: `workspace-engine` 模块是工作区概念的**具体实现层**。它负责根据不同的“风味”（本地、云）提供 `WorkspaceFlavourProvider` 接口的具体实现，从而驱动工作区的实际数据存储、同步和生命周期管理。
- **主要职责**:
  - **实现 `WorkspaceFlavoursProvider` 接口**: 这是其核心职责。它提供了 `LocalWorkspaceFlavoursProvider` 和 `CloudWorkspaceFlavoursProvider`，分别处理本地和云端工作区的具体逻辑。
  - **集成底层存储**: 根据运行环境（Web、Electron 等），选择并配置合适的底层存储方案（IndexedDB、SQLite）来存储文档和 Blob 数据。
  - **处理工作区生命周期**: 负责工作区的创建、删除等操作，并与后端服务（云端）或本地文件系统（Electron）进行交互。
  - **提供 Worker 初始化选项**: `getEngineWorkerInitOptions` 方法为工作区引擎 Worker 提供详细的初始化参数，将上层工作区逻辑与底层的数据处理引擎连接起来。
- **总结**: `workspace-engine` 模块是工作区系统的“肌肉”和“引擎”，它将抽象的工作区概念转化为可操作的、具有实际存储和同步能力的工作区实例。

#### 关系与协作

1.  **接口与实现**: `workspace` 模块定义了 `WorkspaceFlavoursProvider` 接口，而 `workspace-engine` 模块则提供了这个接口的具体实现（`LocalWorkspaceFlavoursProvider` 和 `CloudWorkspaceFlavoursProvider`）。这种“接口-实现”模式是两者关系的核心。
2.  **依赖注入**:
    - `workspace-engine/index.ts` 中的 `configureBrowserWorkspaceFlavours` 函数将 `workspace-engine` 提供的具体实现注册到框架中，使其能够被 `workspace` 模块中的服务（如 `WorkspacesService`）所使用。
    - `CloudWorkspaceFlavourProvider` 和 `LocalWorkspaceFlavourProvider` 在其内部会使用 `workspace` 模块中定义的实体（如 `WorkspaceImpl`）来构建和操作工作区。
3.  **数据流与生命周期**:
    - 当需要创建一个新工作区时，`workspace` 模块中的 `WorkspaceFactoryService` 可能会调用 `WorkspaceFlavoursProvider` 接口的 `createWorkspace` 方法。这个调用最终会路由到 `workspace-engine` 模块中相应的 `CloudWorkspaceFlavourProvider` 或 `LocalWorkspaceFlavourProvider` 实现，由它们负责实际的存储初始化和数据写入。
    - 当需要获取工作区配置文件或 Blob 数据时，`workspace` 模块中的服务会通过 `WorkspaceFlavoursProvider` 接口调用 `workspace-engine` 模块中的相应方法来获取数据。
4.  **职责分离**:
    - `workspace` 模块专注于工作区的通用业务逻辑和高层抽象，例如工作区列表管理、权限、转换等。
    - `workspace-engine` 模块专注于工作区数据的底层存储、同步机制和不同环境下的适配。

简而言之，`workspace` 模块定义了“做什么”，而 `workspace-engine` 模块则提供了“如何做”的具体方案。它们通过依赖注入和接口实现紧密协作，共同构建了 AFFiNE 灵活且可扩展的工作区管理系统。

## 四、模块关系图

```mermaid
graph TD
    subgraph AFFiNE 前端核心模块
        subgraph 核心模块配置
            A[configureCommonModules] --> B(configureI18nModule)
            A --> C(configureWorkspaceModule)
            A --> D(configureDocModule)
            A --> E(configureEditorModule)
            A --> F(configureStorageModule)
            A --> G(configureLifecycleModule)
            A --> H(configureCloudModule)
            A --> I(configureAppSidebarModule)
        end

        subgraph Workspace 模块 (packages/frontend/core/src/modules/workspace)
            C --> C1(WorkspacesService)
            C --> C2(WorkspaceService)
            C --> C3(Workspace)
            C --> C4(WorkspaceListService)
            C --> C5(WorkspaceProfileService)
            C --> C6(WorkspaceEngineService)
            C --> C7(WorkspaceFlavoursService)
            C1 -- 依赖于 --> C7
            C1 -- 依赖于 --> C4
            C1 -- 依赖于 --> C5
            C3 -- 依赖于 --> C2
            C6 -- 依赖于 --> C2
            C -- 定义接口 --> WFPI(WorkspaceFlavoursProvider Interface):::interface
            C -- 定义实体 --> W(Workspace Entity):::entity
            C -- 定义元数据 --> WM(Workspace Metadata):::type
        end

        subgraph Doc 模块 (packages/frontend/core/src/modules/doc)
            D --> D1(DocsService)
            D --> D2(DocService)
            D --> D3(Doc)
            D --> D4(DocRecord)
            D --> D5(DocsStore)
            D --> D6(DocPropertiesStore)
            D1 -- 依赖于 --> D5
            D1 -- 依赖于 --> D6
            D3 -- 依赖于 --> D2
            D3 -- 依赖于 --> D5
            D5 -- 依赖于 --> C2[WorkspaceService]
            D6 -- 依赖于 --> C2[WorkspaceService]
        end

        subgraph Editor 模块 (packages/frontend/core/src/modules/editor)
            E --> E1(EditorsService)
            E --> E2(EditorService)
            E --> E3(Editor)
            E3 -- 依赖于 --> D2[DocService]
            E3 -- 依赖于 --> C2[WorkspaceService]
        end

        subgraph Storage 模块 (packages/frontend/core/src/modules/storage)
            F --> F1(GlobalStateService)
            F --> F2(GlobalCacheService)
            F --> F3(GlobalSessionStateService)
            F --> F4(NbstoreService)
            F1 -- 使用 --> F5(GlobalState Interface):::interface
            F2 -- 使用 --> F6(GlobalCache Interface):::interface
            F3 -- 使用 --> F7(GlobalSessionState Interface):::interface
            F4 -- 使用 --> F8(NbstoreProvider Interface):::interface
            F5 -- 实现于 --> F9(LocalStorageGlobalState)
            F6 -- 实现于 --> F10(LocalStorageGlobalCache)
            F7 -- 实现于 --> F11(SessionStorageGlobalSessionState)
            F -- 配置服务 --> PS(configureStorageModule)
            F -- 配置实现 --> PLS(configureLocalStorageStateStorageImpls)
            F -- 配置实现 --> PCGS(configureCommonGlobalStorageImpls)
        end

        subgraph Lifecycle 模块 (packages/frontend/core/src/modules/lifecycle)
            G --> G1(LifecycleService)
        end

        subgraph Cloud 模块 (packages/frontend/core/src/modules/cloud)
            H --> H1(AuthService)
            H --> H2(ServersService)
            H --> H3(SubscriptionService)
            H --> H4(UserQuotaService)
            H --> H5(InvitationService)
            H --> H6(GraphQLService)
            H1 -- 依赖于 --> H6
            H2 -- 依赖于 --> H6
            H3 -- 依赖于 --> H6
            H4 -- 依赖于 --> H6
            H5 -- 依赖于 --> H6
            H -- 交互 --> C2[WorkspaceService]
            H -- 交互 --> D2[DocService]
            H2 -- 定义 --> SS(ServersService):::class
        end

        subgraph I18n 模块 (packages/frontend/core/src/modules/i18n)
            B --> B1(I18nService)
            B --> B2(I18n)
            B2 -- 依赖于 --> F6[GlobalCache Interface]
        end

        subgraph App Sidebar 模块 (packages/frontend/core/src/modules/app-sidebar)
            I --> I1(AppSidebarService)
            I --> I2(AppSidebar)
            I2 -- 依赖于 --> I3(AppSidebarState Interface):::interface
            I3 -- 实现于 --> I4(AppSidebarStateImpl)
            I4 -- 依赖于 --> F5[GlobalState Interface]
        end
    end

    subgraph Workspace Engine 模块 (packages/frontend/core/src/modules/workspace-engine)
        WE_INDEX[index.ts]:::file --> CBWF(configureBrowserWorkspaceFlavours):::function
        WE_INDEX --> ALW(_addLocalWorkspace):::function
        WE_INDEX --> BASE64_UTILS(base64.ts):::file
        CLOUD_IMPL[impls/cloud.ts]:::file --> CWFP(CloudWorkspaceFlavoursProvider):::class
        LOCAL_IMPL[impls/local.ts]:::file --> LWFP(LocalWorkspaceFlavoursProvider):::class
        CWFP -- 包含 --> CWFP_SINGLE(CloudWorkspaceFlavourProvider):::class
        LWFP -- 包含 --> LWFP_SINGLE(LocalWorkspaceFlavourProvider):::class
    end

    CBWF -- 注册实现 --> WFPI
    CBWF -- 注册 --> CWFP
    CBWF -- 注册 --> LWFP

    CWFP -- 实现 --> WFPI
    LWFP -- 实现 --> WFPI

    CWFP -- 使用 --> SS
    CWFP -- 使用 --> F5
    CWFP_SINGLE -- 交互 --> SS
    CWFP_SINGLE -- 交互 --> F5
    CWFP_SINGLE -- 操作 --> W
    CWFP_SINGLE -- 使用 --> BASE64_UTILS
    CWFP_SINGLE -- 提供初始化选项给 --> W

    LWFP_SINGLE -- 交互 --> F5
    LWFP_SINGLE -- 操作 --> W
    LWFP_SINGLE -- 使用 --> BASE64_UTILS
    LWFP_SINGLE -- 提供初始化选项给 --> W

    C -- 使用 --> WFPI
    C -- 使用 --> W

    classDef file fill:#f9f,stroke:#333,stroke-width:2px;
    classDef interface fill:#ccf,stroke:#333,stroke-width:2px;
    classDef class fill:#bbf,stroke:#333,stroke-width:2px;
    classDef function fill:#fcf,stroke:#333,stroke-width:2px;
    classDef type fill:#ffc,stroke:#333,stroke-width:2px;
    classDef entity fill:#cfc,stroke:#333,stroke-width:2px;
```
