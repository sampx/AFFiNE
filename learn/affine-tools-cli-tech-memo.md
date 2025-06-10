# AFFiNE Tools CLI - 技术备忘录

## 概述

`@affine-tools/cli` 是 AFFiNE 项目的 Monorepo 管理工具，提供统一的构建、开发、部署和维护命令。它基于 TypeScript 开发，使用 Clipanion 作为命令行框架。

## 目录结构

```
tools/cli/
├── bin/                     # 可执行文件入口
│   ├── cli.js              # 主 CLI 入口
│   └── runner.js           # 脚本运行器
├── src/                     # 源代码
│   ├── affine.ts           # CLI 应用主入口
│   ├── command.ts          # 基础命令类定义
│   ├── context.ts          # CLI 上下文类型
│   ├── build.ts            # 构建命令
│   ├── dev.ts              # 开发服务器命令
│   ├── run.ts              # 脚本运行命令
│   ├── clean.ts            # 清理命令
│   ├── init.ts             # 初始化命令
│   ├── bundle.ts           # 打包命令
│   ├── cert.ts             # 证书相关命令
│   └── webpack/            # Webpack 配置目录
├── package.json            # 包配置
├── README.md              # 使用说明
├── register.js            # TypeScript 注册器
├── hooks.js               # Git hooks
└── tsconfig.json          # TypeScript 配置
```

## 核心功能模块

### 1. 命令系统架构

#### 基础命令类 (`command.ts`)

- **Command**: 所有命令的基类

  - 提供日志记录器 (`logger`)
  - 工作区访问 (`workspace`)
  - 进程执行方法 (`exec`, `execAsync`, `spawn`)

- **PackageCommand**: 单包操作命令基类

  - 必须指定包名或别名 (`--package/-p`)
  - 支持依赖处理 (`--deps`)
  - 支持等待依赖 (`--wait-deps`)

- **PackagesCommand**: 多包操作命令基类

  - 支持多个包同时操作
  - 批量依赖处理

- **PackageSelectorCommand**: 交互式包选择命令基类
  - 支持命令行参数或交互式选择
  - 内置包列表和选择界面

### 2. 核心命令实现

#### 2.1 运行命令 (`RunCommand`)

**功能**: 执行包的脚本或命令

- **路径**: `[]`, `['run']`, `['r']`
- **用法**: `affine <package> <script> [args...]`

**关键特性**:

- 自动 TypeScript 加载器注入
- 环境变量提取和传递
- 依赖脚本执行
- AFFiNE 命令递归处理
- 智能脚本检测 (vitest, vite, ts-node, prisma 等)

**核心方法**:

- `run()`: 执行包脚本或命令
- `runScript()`: 执行特定脚本
- `runCommand()`: 执行原始命令
- `extractEnvs()`: 提取环境变量

#### 2.2 构建命令 (`BuildCommand`)

**功能**: 执行包的构建脚本

- **路径**: `['build']`, `['b']`
- **用法**: `affine build -p <package> [--deps]`

**特性**:

- 支持依赖预构建
- 自动传递依赖参数

#### 2.3 开发命令 (`DevCommand`)

**功能**: 启动开发服务器

- **路径**: `['dev']`, `['d']`
- **用法**: `affine dev [-p <package>] [--deps]`

**支持的包**:

- `@affine/web` - Web 应用
- `@affine/server` - 服务器
- `@affine/electron` - Electron 应用
- `@affine/electron-renderer` - Electron 渲染进程
- `@affine/mobile` - 移动端应用
- `@affine/ios` - iOS 应用
- `@affine/android` - Android 应用
- `@affine/admin` - 管理后台

#### 2.4 清理命令 (`CleanCommand`)

**功能**: 清理构建输出和缓存

- **路径**: `['clean']`
- **选项**:
  - `--dist`: 清理 dist 目录
  - `--rust`: 清理 Rust 构建缓存
  - `--node-modules`: 清理 node_modules
  - `--all/-a`: 清理所有

**清理策略**:

- 递归删除所有包的输出目录
- 支持 dist 和 lib 目录清理
- Rust cargo clean 集成

#### 2.5 初始化命令 (`InitCommand`)

**功能**: 生成工作区配置文件

- **路径**: `['init']`, `['i']`, `['codegen']`

**生成的文件**:

- 根 `tsconfig.json` - 项目引用配置
- `@affine-tools/utils/src/workspace.gen.ts` - 工作区信息
- `oxlint.json` - Linting 配置
- 各包的 `tsconfig.json` - 包依赖引用

**代码生成功能**:

- 自动分析包依赖关系
- 生成 TypeScript 项目引用
- 同步 Prettier 忽略规则

#### 2.6 打包命令 (`BundleCommand`)

**功能**: Webpack 打包和开发服务器

- **路径**: `['bundle']`, `['webpack']`, `['pack']`, `['bun']`
- **选项**: `--dev/-d` 开发模式

**支持的包配置**:

1. **Web 应用** (`@affine/web`, `@affine/mobile`, `@affine/ios`, `@affine/android`):

   - HTML 入口配置
   - Worker 文件打包 (workspace-profile, pdf, turbo-painter, nbstore)

2. **Electron 渲染进程** (`@affine/electron-renderer`):

   - 多入口点 (index, shell, popup, backgroundWorker)
   - 禁用全局错误处理
   - 禁用自托管入口

3. **服务器** (`@affine/server`):

   - Node.js 目标配置

4. **管理后台** (`@affine/admin`):
   - 简单 HTML 入口

**开发服务器配置**:

- 热重载和实时刷新
- CORS 头设置
- API 代理 (端口 3010)
- WebSocket 支持
- 历史路由回退

## 技术架构设计

### 1. 依赖注入模式

CLI 使用 Clipanion 的上下文注入:

```typescript
interface CliContext {
  workspace: Workspace;
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
}
```

### 2. 工作区抽象

通过 `@affine-tools/utils/workspace` 提供统一的包管理:

- 包发现和元数据
- 依赖关系分析
- 路径管理
- 脚本执行

### 3. 模块化命令设计

每个命令都是独立的类，继承自基础命令类:

- 单一职责原则
- 可扩展的参数系统
- 一致的错误处理

### 4. TypeScript 运行时支持

自动注入 TypeScript 加载器:

- 使用 SWC 进行快速编译
- 智能检测需要加载器的脚本
- 无缝支持 `.ts` 文件执行

## 使用指南

### 基本命令

```bash
# 查看帮助
yarn affine -h

# 运行包脚本
yarn affine web dev
yarn affine server build

# 使用别名
yarn af web dev

# 带依赖构建
yarn affine build -p web --deps

# 清理操作
yarn affine clean --dist
yarn affine clean --all

# 初始化工作区
yarn affine init

# 打包
yarn affine bundle -p web
yarn affine bundle -p web --dev
```

### 高级特性

#### 1. 自定义脚本执行

在包的 `package.json` 中:

```json
{
  "scripts": {
    "custom": "r ./custom-script.ts"
  }
}
```

#### 2. 环境变量支持

自动提取和传递环境变量:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development r ./dev.ts"
  }
}
```

#### 3. 快捷方式设置

创建 `af` 脚本文件:

```bash
#!/usr/bin/env sh
./tools/cli/bin/runner.js affine.ts $@
```

## 依赖说明

### 核心依赖

- **clipanion**: 命令行框架
- **inquirer**: 交互式命令行界面
- **webpack**: 模块打包器
- **@swc/core**: 快速 TypeScript/JavaScript 编译器
- **ts-node**: TypeScript 运行时

### 构建工具

- **webpack-dev-server**: 开发服务器
- **html-webpack-plugin**: HTML 模板处理
- **mini-css-extract-plugin**: CSS 提取
- **copy-webpack-plugin**: 文件复制

### 样式处理

- **tailwindcss**: CSS 框架
- **postcss**: CSS 后处理器
- **autoprefixer**: CSS 前缀自动添加
- **@vanilla-extract/webpack-plugin**: CSS-in-JS 支持

### 质量工具

- **prettier**: 代码格式化
- **jsonc-parser**: JSON 配置解析

## 扩展开发

### 添加新命令

1. 创建命令类:

```typescript
export class MyCommand extends Command {
  static override paths = [['my-command']];

  async execute() {
    // 实现命令逻辑
  }
}
```

2. 注册命令:

```typescript
// 在 affine.ts 中
cli.register(MyCommand);
```

### 扩展打包配置

在 `bundle.ts` 的 `getBundleConfigs()` 中添加新包支持:

```typescript
case '@my/package': {
  return [createHTMLTargetConfig(pkg, entry)];
}
```

## 最佳实践

1. **使用包别名**: 通过 `AliasToPackage` 映射简化包名
2. **依赖管理**: 合理使用 `--deps` 参数控制依赖构建
3. **环境变量**: 利用自动环境变量提取功能
4. **脚本组织**: 保持脚本简单，复杂逻辑放入独立文件
5. **错误处理**: 利用内置日志系统进行调试

## 性能优化

- **并行构建**: 使用 CPU 核心数配置 Webpack 并行度
- **智能加载器**: 只在需要时注入 TypeScript 加载器
- **缓存策略**: 利用 Webpack 缓存加速重复构建
- **依赖分析**: 避免不必要的依赖构建

## 故障排除

### 常见问题

1. **TypeScript 文件无法执行**: 检查 `register.js` 加载器配置
2. **包名解析失败**: 确认包在工作区中存在
3. **依赖构建失败**: 检查依赖关系和脚本定义
4. **开发服务器端口冲突**: 修改代理配置或端口设置

### 调试技巧

- 使用 `--verbose` 查看详细日志
- 检查环境变量传递
- 验证工作区配置正确性
- 确认 Webpack 配置匹配包结构
