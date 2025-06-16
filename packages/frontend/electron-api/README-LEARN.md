# 模块技术报告：`@affine/electron-api`

## 模块功能和设计

`@affine/electron-api` 模块主要用于在 Electron 渲染进程中提供与主进程通信的 API 接口。它通过全局对象 `__appInfo`、`__apis`、`__events` 和 `__sharedStorage` 暴露 Electron 主进程的功能和数据。

### `index.ts`

这是模块的主要入口点，负责定义和导出与 Electron 主进程交互所需的类型和全局对象。

- **类型定义**: 导入并定义了 `MainHandlers`、`HelperHandlers`、MainEvents`、`HelperEvents` 等类型，这些类型描述了主进程提供的各种处理函数和事件。
- **`ClientHandler`**: 这是一个关键类型，它将主进程的 `MainHandlers` 和 `HelperHandlers` 合并，并为每个方法添加了 `Promise` 返回类型，以便在渲染进程中进行异步调用。这确保了渲染进程与主进程之间的通信始终是异步的。
- **`ClientEvents`**: 合并了主进程和辅助进程的事件类型，用于监听来自主进程的事件。
- **全局对象暴露**: 通过 `globalThis` 访问 `__appInfo` (应用信息)、`__apis` (主进程 API 接口)、`__events` (主进程事件) 和 `__sharedStorage` (共享存储)。这些全局对象通常由 Electron 的预加载脚本注入到渲染进程的上下文中，使得渲染进程可以直接访问主进程的功能。
- **类型重导出**: 重导出了 `@affine/electron/main/shared-state-schema`、`@affine/electron/main/updater/event` 和 `@affine/electron/main/windows-manager` 中的一些重要类型，方便其他模块在使用 `electron-api` 时获得完整的类型提示和检查。

## 模块面向用户的使用说明

`@affine/electron-api` 模块旨在为 Electron 渲染进程提供与主进程交互的便捷方式。开发者可以通过导入此模块来访问 Electron 应用的信息、调用主进程提供的功能以及监听主进程发出的事件。

### 安装

由于这是一个工作区包 (`"private": true, "workspace:*"`)，它通常作为 monorepo 中的一个内部依赖使用，无需单独安装。

### 使用示例

以下代码片段演示了如何使用 `@affine/electron-api` 模块来访问应用信息、调用主进程 API 和监听事件。

```typescript
// 导入 Electron API 模块中暴露的类型和常量
import { appInfo, apis, events, sharedStorage } from '@affine/electron-api';
import type { AppInfo, AddTabOption } from '@affine/electron-api';

// 访问应用信息
// appInfo 包含了 Electron 应用的基本信息，如名称、版本等。
if (appInfo) {
  console.log('应用名称:', appInfo.name);
  console.log('应用版本:', appInfo.version);
}

// 调用主进程 API
// apis 对象包含了主进程暴露的所有处理函数，可以通过它调用主进程的功能。
async function openNewTab() {
  if (apis?.windows) {
    try {
      const options: AddTabOption = {
        url: 'https://example.com',
        // 可以根据需要添加其他选项，例如：
        // tabId: 'unique-tab-id',
        // active: true,
      };
      // 调用主进程的 windows 命名空间下的 addTab 方法
      await apis.windows.addTab(options);
      console.log('新标签页已打开');
    } catch (error) {
      console.error('打开新标签页失败:', error);
    }
  }
}

// 监听主进程事件
// events 对象包含了主进程发出的所有事件，可以通过它注册事件监听器。
if (events?.updater) {
  // 监听 updater 命名空间下的 'update-available' 事件
  events.updater.on('update-available', updateMeta => {
    console.log('有新版本可用:', updateMeta.version);
    // 可以根据 updateMeta 中的信息执行更新相关的操作
  });
}

// 访问共享存储
// sharedStorage 提供了在主进程和渲染进程之间共享数据的能力。
if (sharedStorage) {
  // 设置值
  sharedStorage.set('myKey', 'myValue');
  console.log('已将 "myValue" 存储到 "myKey"');
  // 获取值
  const value = sharedStorage.get('myKey');
  console.log('从共享存储获取的值:', value);
  // 移除值
  sharedStorage.delete('myKey');
  console.log('已从共享存储中移除 "myKey"');
}

// 调用示例函数
openNewTab();
```

### 关键点说明

- **全局注入与预加载脚本**: `appInfo`、`apis`、`events` 和 `sharedStorage` 都是通过 Electron 预加载脚本注入到渲染进程的 `globalThis` 对象上的。这意味着它们在渲染进程的全局作用域中可用。`@affine/electron-api` 模块本身**不是**预加载脚本，但它是一个**用于在渲染进程中访问由预加载脚本注入的 Electron API 的模块**。它封装了对 `globalThis` 上这些属性的访问，并提供了类型安全和便捷的访问方式。为了代码的清晰性和类型安全，建议始终通过 `import` 语句显式导入这些对象。
- **异步调用**: 所有通过 `apis` 调用的主进程方法都返回 `Promise`。这是 Electron 进程间通信的常见模式，确保渲染进程的 UI 不会被阻塞，即使主进程的原始方法是同步的。开发者应使用 `await` 或 `.then()` 来处理这些异步操作的结果。
- **类型安全**: 模块提供了详细的 TypeScript 类型定义，使得开发者在使用 Electron API 时能够获得良好的类型提示、自动补全和编译时检查，从而减少潜在的错误。
- **模块职责**: 该模块的核心职责是作为 Electron 渲染进程与主进程之间的通信接口层，它不包含具体的业务逻辑实现。业务逻辑应在主进程中实现，并通过此模块暴露给渲染进程。

### 关于 `web-worker` 模块的说明

在 `package.json` 中提到了 `web-worker` 导出路径 `./src/web-worker.ts`。然而，经过文件系统检查，该文件在 `src` 目录下并不存在。这可能意味着：

1. `web-worker` 模块是一个构建产物，其源代码位于其他位置，或者在构建过程中生成。
2. `package.json` 中的 `exports` 配置可能存在错误或已过时，指向了一个不存在的源文件。

因此，在当前的技术报告中，我们主要关注 `index.ts` 提供的核心功能和其暴露的 Electron API。如果 `web-worker` 模块是项目的重要组成部分，可能需要进一步调查其真实位置和用途。
