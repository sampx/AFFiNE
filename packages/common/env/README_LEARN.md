# @affine/env 模块技术备忘文档

## 📋 模块概览

`@affine/env` 是 AFFiNE 项目的环境配置管理模块，负责跨平台环境检测、全局环境变量管理和运行时配置。该模块为整个应用提供统一的环境信息接口，支持浏览器、桌面端、移动端等多种运行环境。

**模块信息：**

- 包名：`@affine/env`
- 版本：`0.21.0`
- 类型：私有模块 (private: true)
- 模块类型：ES Module (type: "module")

## 🏗️ 模块架构

### 核心依赖

- **zod**: `^3.24.1` - 运行时类型验证
- **@affine/templates**: workspace:\* (peer dependency)
- **@blocksuite/affine**: workspace:\* (peer dependency)

### 导出模块结构

```typescript
{
  "./automation": "./src/automation.ts",
  "./global": "./src/global.ts",
  "./constant": "./src/constant.ts",
  "./workspace": "./src/workspace.ts",
  "./workspace/legacy-cloud": "./src/workspace/legacy-cloud/index.ts",
  "./filter": "./src/filter.ts",
  "./blocksuite": "./src/blocksuite/index.ts",
  "./worker": "./src/worker.ts"
}
```

## 🔧 核心功能模块

### 1. 全局环境配置 (global.ts)

**主要功能：**

- 初始化全局环境配置
- 跨平台环境检测
- 用户代理分析
- 环境变量覆盖机制

**核心接口：**

```typescript
interface Environment {
  // 设备类型检测
  isLinux: boolean;
  isMacOs: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isWindows: boolean;
  isFireFox: boolean;
  isMobile: boolean;
  isChrome: boolean;
  isPwa: boolean;
  chromeVersion?: number;

  // 部署配置
  isSelfHosted: boolean;
  publicPath: string; // 静态资源根路径
  subPath: string; // 服务访问路径
}
```

**核心函数：**

```typescript
export function setupGlobal(): void;
```

- 检测运行环境并设置全局环境变量
- 防重复初始化机制 (globalThis.$AFFINE_SETUP)
- 支持 HTML meta 标签环境变量覆盖

### 2. 用户代理检测 (ua-helper.ts)

**UaHelper 类：**

```typescript
export class UaHelper {
  // 平台检测属性
  public isLinux: boolean;
  public isMacOs: boolean;
  public isSafari: boolean;
  public isWindows: boolean;
  public isFireFox: boolean;
  public isMobile: boolean;
  public isChrome: boolean;
  public isIOS: boolean;
  public isStandalone: boolean;

  // 方法
  getChromeVersion(): number;
  checkUseragent(isUseragent: string): boolean;
}
```

**检测能力：**

- 操作系统识别 (Windows/macOS/Linux/iOS/Android)
- 浏览器识别 (Chrome/Safari/Firefox)
- 移动设备检测
- PWA 独立模式检测
- Chrome 版本获取

### 3. 常量定义 (constant.ts)

**工作区常量：**

```typescript
export const DEFAULT_WORKSPACE_NAME = 'Demo Workspace';
export const UNTITLED_WORKSPACE_NAME = 'Untitled';
export const DEFAULT_SORT_KEY = 'updatedDate';
```

**错误码定义：**

```typescript
export const MessageCode = {
  loginError: 0,
  noPermission: 1,
  loadListFailed: 2,
  createWorkspaceFailed: 4,
  // ... 更多错误码
} as const;
```

**自定义错误类：**

```typescript
export class WorkspaceNotFoundError extends TypeError {
  readonly workspaceId: string;
}

export class QueryParamError extends TypeError {
  readonly targetKey: string;
  readonly query: unknown;
}

export class Unreachable extends Error {}
```

### 4. 过滤器系统 (filter.ts)

**数据类型定义：**

```typescript
export type LiteralValue = number | string | boolean | { [K: string]: LiteralValue } | Array<LiteralValue>;

export type Ref = {
  type: 'ref';
  name: keyof VariableMap;
};

export type Literal = {
  type: 'literal';
  value: LiteralValue;
};

export type Filter = {
  type: 'filter';
  left: Ref;
  funcName: string;
  args: Literal[];
};
```

**集合定义：**

```typescript
export type Collection = {
  id: string;
  name: string;
  filterList: Filter[];
  allowList: string[];
  createDate?: Date | number;
  updateDate?: Date | number;
};
```

### 5. 自动化系统 (automation.ts)

**Action 类型定义：**

```typescript
export type Action<InputSchema extends z.ZodObject<any, any, any, any>, Args extends readonly any[]> = {
  id: string;
  name: string;
  description: string;
  inputSchema: InputSchema;
  action: (input: z.input<InputSchema>, ...args: Args) => void;
};
```

### 6. Worker 工具 (worker.ts)

**Worker URL 生成：**

```typescript
export function getWorkerUrl(name: string): string {
  return (environment.subPath || '/') + 'js/' + `${name}-${BUILD_CONFIG.appVersion}.worker.js`;
}
```

### 7. IP 地址验证 (is-valid-ip-address.ts)

**IP 验证函数：**

```typescript
export function isValidIPAddress(address: string): boolean;
```

- 支持 IPv4 地址验证
- 支持 localhost 特殊处理
- 使用正则表达式验证格式

### 8. 页面信息类型 (page-info.ts)

**页面信息接口：**

```typescript
export type PageInfo = {
  isEdgeless: boolean;
  title: string;
  id: string;
};

export type GetPageInfoById = (id: string) => PageInfo | undefined;
```

### 9. 遗留云服务类型 (workspace/legacy-cloud/index.ts)

**用户和工作区类型：**

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  create_at: string;
}

export enum WorkspaceType {
  Private = 0,
  Normal = 1,
}

export enum PermissionType {
  Read = 0,
  Write = 1,
  Admin = 10,
  Owner = 99,
}
```

## 🚀 使用指南

### 基础环境初始化

```typescript
import { setupGlobal } from '@affine/env/global';

// 初始化全局环境配置
setupGlobal();

// 访问全局环境变量
console.log(globalThis.environment.isChrome);
console.log(globalThis.environment.isMobile);
```

### 环境检测

```typescript
import { UaHelper } from '@affine/env/ua-helper';

const uaHelper = new UaHelper(navigator);
console.log('是否为移动设备:', uaHelper.isMobile);
console.log('Chrome版本:', uaHelper.getChromeVersion());
```

### 常量使用

```typescript
import { DEFAULT_WORKSPACE_NAME, MessageCode, WorkspaceNotFoundError } from '@affine/env/constant';

// 使用默认工作区名称
const workspaceName = DEFAULT_WORKSPACE_NAME;

// 错误处理
if (!workspace) {
  throw new WorkspaceNotFoundError(workspaceId);
}
```

### Worker URL 生成

```typescript
import { getWorkerUrl } from '@affine/env/worker';

const workerUrl = getWorkerUrl('pdf-parser');
const worker = new Worker(workerUrl);
```

### IP 地址验证

```typescript
import { isValidIPAddress } from '@affine/env/is-valid-ip-address';

console.log(isValidIPAddress('192.168.1.1')); // true
console.log(isValidIPAddress('localhost')); // true
console.log(isValidIPAddress('invalid')); // false
```

## 🔍 技术特点

### 1. 类型安全

- 使用 Zod 进行运行时类型验证
- TypeScript 严格类型检查
- 全局类型声明

### 2. 跨平台兼容

- 支持浏览器、Electron、移动端
- 统一的环境检测接口
- 渐进式功能检测

### 3. 性能优化

- 防重复初始化机制
- 延迟加载和按需检测
- 缓存检测结果

### 4. 扩展性设计

- 模块化导出结构
- 可插拔的环境覆盖机制
- 标准化的错误处理

## 📝 开发注意事项

1. **初始化顺序**: 确保在使用环境变量前调用 `setupGlobal()`
2. **类型安全**: 使用提供的类型定义，避免直接访问 `globalThis`
3. **错误处理**: 使用模块提供的自定义错误类
4. **测试覆盖**: 参考 `__tests__` 目录中的测试用例
5. **环境覆盖**: 可通过 HTML meta 标签覆盖环境配置

## 🧪 测试

模块包含完整的测试套件，使用 Vitest 框架：

```bash
# 运行测试
npm test

# 测试覆盖的功能
- IP 地址验证
- 环境检测逻辑
- 错误处理机制
```

该模块是 AFFiNE 应用的基础设施之一，为整个应用提供可靠的环境信息和配置管理能力。
