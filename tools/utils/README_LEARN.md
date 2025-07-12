# @affine-tools/utils 技术备忘

## 模块功能概述

本模块为 AFFiNE 项目提供常用工具函数与辅助类，涵盖路径处理、工作区管理、进程控制、日志输出、构建配置与分发等功能，便于在项目各处复用和统一工具链。

## 模块信息

- **包名**: `@affine-tools/utils`
- **版本**: `0.21.0`
- **类型**: ESM 模块 (type: "module")
- **私有包**: 是 (private: true)

## 目录结构与主要文件

```
tools/utils/
├── src/
│   ├── index.ts              # 主入口文件，导出 format 和 path 模块
│   ├── types.ts              # TypeScript 类型定义
│   ├── format.ts             # 代码格式化工具 (Prettier)
│   ├── path.ts               # 路径处理工具类
│   ├── workspace.ts          # 工作区管理核心类
│   ├── workspace.gen.ts      # 自动生成的包列表配置
│   ├── package.ts            # 包管理工具
│   ├── yarn.ts               # Yarn 工作区集成
│   ├── logger.ts             # 日志输出工具
│   ├── process.ts            # 进程管理与执行工具
│   ├── build-config.ts       # 构建配置生成器
│   └── distribution.ts       # 分发平台映射配置
├── package.json              # 包配置文件
└── tsconfig.json             # TypeScript 配置
```

## 核心类与接口

### 1. Path 类 (path.ts)

强大的路径处理工具类，提供跨平台路径操作：

**核心属性**:

- `value: string` - 获取路径字符串
- `relativePath: string` - 获取相对于项目根目录的路径

**主要方法**:

- `static dir(url: string): Path` - 从 URL 创建目录路径
- `join(...paths: string[]): Path` - 路径拼接
- `parent(): Path` - 获取父目录
- `toPosixString(): string` - 转换为 POSIX 格式路径
- `exists(): boolean` - 检查路径是否存在
- `isFile(): boolean` - 判断是否为文件
- `isDirectory(): boolean` - 判断是否为目录
- `mkdir(): void` - 创建目录
- `rm(opts?: {recursive?: boolean}): void` - 删除文件/目录
- `readAsFile(): Buffer` - 读取文件内容
- `writeFile(content: Buffer | string): void` - 写入文件
- `toFileUrl(): URL` - 转换为文件 URL
- `relative(to: string): string` - 计算相对路径

**全局常量**:

- `ProjectRoot: Path` - 项目根目录路径

### 2. Workspace 类 (workspace.ts)

工作区管理核心类，负责包依赖分析和管理：

**静态属性**:

- `PackageNames: PackageName[]` - 所有包名列表

**实例属性**:

- `packages: Package[]` - 工作区内所有包实例
- `packageJson: CommonPackageJsonContent` - 根 package.json 内容
- `path: Path` - 工作区根路径
- `version: string` - 工作区版本
- `dependencies: {[key: string]: string}` - 依赖列表
- `devDependencies: {[key: string]: string}` - 开发依赖列表
- `isTsProject: boolean` - 是否为 TypeScript 项目

**主要方法**:

- `tryGetPackage(name: PackageName): Package | undefined` - 尝试获取包
- `getPackage(name: PackageName): Package` - 获取包（不存在则抛错）
- `join(...paths: string[]): Path` - 路径拼接
- `forEach(callback: (pkg: Package) => void): void` - 遍历所有包

**依赖管理特性**:

- 自动检测循环依赖并报错退出
- 验证公共包不能引用私有包
- 构建完整的依赖关系图

### 3. Package 类 (package.ts)

单个包的管理类，封装包的元信息和操作：

**核心属性**:

- `name: PackageName` - 包名
- `packageJson: CommonPackageJsonContent` - package.json 内容
- `path: Path` - 包根目录路径
- `srcPath: Path` - src 目录路径
- `libPath: Path` - lib 目录路径
- `distPath: Path` - dist 目录路径
- `nodeModulesPath: Path` - node_modules 目录路径
- `version: string` - 包版本
- `isTsProject: boolean` - 是否为 TypeScript 项目
- `workspaceDependencies: string[]` - 工作区依赖列表
- `deps: Package[]` - 依赖的包实例列表

**主要方法**:

- `join(...paths: string[]): Path` - 基于包路径的路径拼接

**工具函数**:

- `readPackageJson(path: Path): CommonPackageJsonContent` - 读取 package.json

### 4. Logger 类 (logger.ts)

统一的日志输出工具，支持彩色输出和标签：

**日志方法**:

- `log(...args: StringLike[]): void` - 普通日志
- `info(...args: StringLike[]): void` - 信息日志（蓝色）
- `warn(...args: StringLike[]): void` - 警告日志（黄色背景）
- `error(...args: StringLike[]): void` - 错误日志（红色背景）
- `success(...args: StringLike[]): void` - 成功日志（绿色）

**构造函数**:

- `constructor(tag?: string)` - 可选的标签前缀

**特性**:

- 自动处理多行文本分割
- 支持彩色输出（基于 chalk）
- 可配置标签前缀

### 5. 进程管理 (process.ts)

提供进程执行和管理功能：

**主要函数**:

- `spawn(tag: string, cmd: string | string[], options?: SpawnOptions): ChildProcess`

  - 启动子进程，支持实时日志输出
  - 自动处理 yarn 命令的特殊配置
  - 返回 ChildProcess 实例

- `execAsync(tag: string, cmd: string | string[], options?: SpawnOptions): Promise<void>`

  - 异步执行命令，返回 Promise
  - 非零退出码会抛出异常

- `exec(tag: string, cmd: string, options?: {silent: boolean}): string`
  - 同步执行命令，返回输出字符串
  - 支持静默模式

**特性**:

- 自动管理子进程生命周期
- 实时日志输出和错误处理
- 支持 yarn 命令的特殊处理

### 6. 格式化工具 (format.ts)

基于 Prettier 的代码格式化工具：

**主要函数**:

- `prettier(content: string, parser: BuiltInParserName): string`
  - 格式化代码内容
  - 自动读取项目 .prettierrc 配置
  - 支持多种解析器类型

**特性**:

- 配置缓存（使用 lodash.once）
- 自动读取项目根目录的 .prettierrc 配置

### 7. 构建配置 (build-config.ts)

构建配置生成器，根据包和构建标志生成配置：

**接口定义**:

```typescript
interface BuildFlags {
  channel: 'stable' | 'beta' | 'internal' | 'canary';
  mode: 'development' | 'production';
}
```

**主要函数**:

- `getBuildConfig(pkg: Package, buildFlags: BuildFlags): BUILD_CONFIG_TYPE`
  - 根据包和构建标志生成完整的构建配置
  - 支持多种发布渠道配置
  - 包含应用版本、URL、环境变量等信息

**支持的构建渠道**:

- `stable` - 稳定版本
- `beta` - 测试版本
- `internal` - 内部版本
- `canary` - 金丝雀版本

### 8. 分发配置 (distribution.ts)

包到分发平台的映射配置：

**主要常量**:

- `PackageToDistribution: Map<PackageName, BUILD_CONFIG_TYPE['distribution']>`

  - 包名到分发平台的映射

- `AliasToPackage: Map<string, PackageName>`
  - 别名到包名的映射

**支持的分发平台**:

- `admin` - 管理后台
- `web` - Web 应用
- `desktop` - 桌面应用
- `mobile` - 移动端 Web
- `ios` - iOS 应用
- `android` - Android 应用

### 9. Yarn 集成 (yarn.ts)

Yarn 工作区集成工具：

**主要函数**:

- `yarnList(): YarnWorkspaceItem[]` - 获取 yarn 工作区包列表
- `loadPackageList(): Promise<YarnWorkspaceItem[]>` - 异步加载包列表

**导出内容**:

- `PackageList: YarnWorkspaceItem[]` - 包列表数据
- `PackageName` - 包名类型定义

### 10. 类型定义 (types.ts)

核心类型接口定义：

```typescript
interface YarnWorkspaceItem {
  name: string;
  location: string;
  workspaceDependencies: string[];
  mismatchedWorkspaceDependencies?: string[];
}

interface CommonPackageJsonContent {
  name: string;
  type?: 'module' | 'commonjs';
  version: string;
  private?: boolean;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  scripts?: { [key: string]: string };
  main?: string;
  exports?: { [key: string]: string | { [key: string]: string } };
}
```

## 模块导出配置

根据 package.json 的 exports 字段，模块支持以下导入方式：

```typescript
// 主入口（format + path）
import { prettier, Path, ProjectRoot } from '@affine-tools/utils';

// 子模块导入
import { Path, ProjectRoot } from '@affine-tools/utils/path';
import { Workspace, Package } from '@affine-tools/utils/workspace';
import { spawn, exec, execAsync } from '@affine-tools/utils/process';
import { Logger } from '@affine-tools/utils/logger';
import { getBuildConfig } from '@affine-tools/utils/build-config';
import { PackageToDistribution, AliasToPackage } from '@affine-tools/utils/distribution';
```

## 使用说明

### 1. 基本路径操作

```typescript
import { Path, ProjectRoot } from '@affine-tools/utils/path';

// 创建路径实例
const srcPath = ProjectRoot.join('packages', 'frontend', 'core', 'src');

// 路径操作
console.log(srcPath.value); // 绝对路径
console.log(srcPath.relativePath); // 相对路径
console.log(srcPath.exists()); // 检查存在性

// 文件操作
if (srcPath.isDirectory()) {
  const indexFile = srcPath.join('index.ts');
  if (indexFile.isFile()) {
    const content = indexFile.readAsFile();
    console.log(content.toString());
  }
}
```

### 2. 工作区管理

```typescript
import { Workspace } from '@affine-tools/utils/workspace';

// 创建工作区实例
const workspace = new Workspace();

// 获取包信息
const corePackage = workspace.getPackage('@affine/core');
console.log(`包版本: ${corePackage.version}`);
console.log(`包路径: ${corePackage.path.value}`);

// 遍历所有包
workspace.forEach(pkg => {
  console.log(`${pkg.name}: ${pkg.version}`);
});
```

### 3. 进程执行

```typescript
import { spawn, exec, execAsync } from '@affine-tools/utils/process';

// 同步执行
const output = exec('git', 'git status --porcelain');
console.log('Git 状态:', output);

// 异步执行
try {
  await execAsync('build', ['yarn', 'build']);
  console.log('构建成功');
} catch (error) {
  console.error('构建失败:', error);
}

// 启动子进程
const child = spawn('dev', ['yarn', 'dev']);
child.on('exit', code => {
  console.log(`进程退出，代码: ${code}`);
});
```

### 4. 日志输出

```typescript
import { Logger } from '@affine-tools/utils/logger';

const logger = new Logger('MyApp');

logger.info('应用启动中...');
logger.success('启动成功！');
logger.warn('这是一个警告');
logger.error('发生错误');
```

### 5. 代码格式化

```typescript
import { prettier } from '@affine-tools/utils';

const code = `const  x=1;const y =   2;`;
const formatted = prettier(code, 'typescript');
console.log(formatted);
// 输出格式化后的代码
```

### 6. 构建配置生成

```typescript
import { getBuildConfig } from '@affine-tools/utils/build-config';
import { Workspace } from '@affine-tools/utils/workspace';

const workspace = new Workspace();
const webPackage = workspace.getPackage('@affine/web');

const config = getBuildConfig(webPackage, {
  channel: 'stable',
  mode: 'production',
});

console.log('构建配置:', config);
```

## 依赖关系

本模块依赖以下外部包：

- `chalk` - 终端彩色输出
- `lodash-es` - 工具函数库
- `prettier` - 代码格式化
- `typescript` - TypeScript 支持

## 注意事项

1. **私有模块**: 本模块为私有包，仅供 AFFiNE 项目内部使用
2. **ESM 模块**: 使用 ES 模块格式，需要 Node.js 14+ 支持
3. **路径处理**: Path 类自动处理跨平台路径差异
4. **依赖检查**: Workspace 类会自动检测循环依赖和不当引用
5. **进程管理**: 进程工具会自动清理子进程，避免僵尸进程
6. **配置缓存**: 格式化工具会缓存 Prettier 配置，提高性能

---

如需详细 API 说明，请查阅各子模块源码与类型定义。
