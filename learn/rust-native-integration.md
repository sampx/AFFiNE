# AFFiNE 项目中 Rust Native 模块与前端集成分析

在 AFFiNE 项目中，Rust 编写的 native 模块主要用于提升性能关键路径的执行效率，并通过 **NAPI (Node-API)** 和 **WebAssembly (Wasm)** 技术与前端功能进行交互。以下是详细的集成方式和调用流程。

## 1. Rust Native 模块的作用

### `backend/native`

- **目录结构**

  ```
  backend/native/
  ├── Cargo.toml       # Rust 项目配置文件
  ├── build.rs         # 构建脚本
  ├── index.d.ts       # TypeScript 类型定义文件
  ├── index.js         # JavaScript 入口文件
  ├── package.json     # NPM 包配置文件
  ├── tsconfig.json    # TypeScript 配置文件
  └── src/             # Rust 源代码目录
      ├── lib.rs       # 主要逻辑模块
      ├── doc_loader.rs
      ├── file_type.rs
      ├── hashcash.rs
      ├── html_sanitize.rs
      ├── tiktoken.rs
      └── utils.rs
  ```

- **核心功能**
  - **文档加载 (`doc_loader`)**：实现文档的加载与更新合并，用于处理 Yjs 格式的文档更新。
  - **哈希计算 (`hashcash`)**：提供哈希计算功能，可能用于生成唯一标识或校验数据完整性。
  - **HTML 清理 (`html_sanitize`)**：对 HTML 内容进行清理，防止 XSS 攻击或非法标签注入。
  - **Token 计算 (`tiktoken`)**：实现 Token 计数功能，可能用于限制 API 请求频率或统计文档长度。
  - **内存优化**：使用 `mimalloc` 作为全局分配器，提升内存管理效率。
  - **NAPI 集成**：通过 `napi` crate 与 Node.js 集成，支持在前端调用 Rust 编写的高性能函数。

### `common/native`

- **目录结构**

  ```
  common/native/
  ├── Cargo.toml       # Rust 项目配置文件
  ├── benches/         # 性能测试模块
  ├── fixtures/        # 测试数据集
  └── src/             # Rust 源代码目录
      ├── lib.rs       # 主要逻辑模块
      ├── doc_loader.rs
      └── hashcash.rs
  ```

- **核心功能**
  - **跨平台文档加载 (`doc_loader`)**：提供通用的文档加载逻辑，可能用于前端和后端共享的文档处理功能。
  - **哈希计算 (`hashcash`)**：提供基础的哈希计算功能，用于数据校验、签名等场景。
  - **测试支持**：包含性能测试代码和测试数据集，确保模块行为一致性。

## 2. Rust Native 模块如何与前端集成

### 2.1 使用 NAPI 与 Node.js 集成

#### NAPI 的作用

- NAPI 是 Node.js 提供的一组 C API，用于构建原生插件（Native Addons），允许 Rust 编写的高性能代码直接暴露给 JavaScript/TypeScript 调用。
- 在 AFFiNE 中，`backend/native` 模块使用了 [napi-rs](https://github.com/napi-rs/napi-rs) 这个框架来生成兼容 Node.js 的原生模块。

#### 示例：如何导出函数

在 [`backend/native/src/lib.rs`](file:///Users/sam/Coding/sampx/AFFiNE/packages/backend/native/src/lib.rs) 中：

```rust
#[napi(catch_unwind)]
pub fn merge_updates_in_apply_way(updates: Vec<Buffer>) -> Result<Buffer> {
  let mut doc = Doc::default();
  for update in updates {
    map_err!(doc.apply_update_from_binary_v1(update.as_ref()))?;
  }

  let buf = map_err!(doc.encode_update_v1())?;
  Ok(Buffer::from(buf))
}
```

这段代码定义了一个可以被 JavaScript 调用的函数 `merge_updates_in_apply_way`，它接收多个文档更新并合并它们。

#### 前端调用方式

在前端 TypeScript 中，你可以像调用普通 JavaScript 函数一样使用这些 Rust 函数：

```ts
import { mergeUpdatesInApplyWay } from '@affine/native';

const mergedUpdate = mergeUpdatesInApplyWay([update1, update2]);
```

#### 构建过程

- 使用 `build.rs` 和 `Cargo.toml` 配置编译为 `.node` 文件（二进制文件）。
- 最终打包到 Electron 应用中，确保在桌面端可以直接调用。

### 2.2 使用 WebAssembly (Wasm) 实现跨平台调用

#### Wasm 的作用

- WebAssembly 是一种可以在现代浏览器中高效运行的二进制格式，适合将 Rust 编写的高性能逻辑嵌入网页应用。
- 在 AFFiNE 中，虽然主要使用 NAPI 进行集成，但其也提供了对 Wasm 的支持作为备用方案。

#### 实际使用情况

在 [`frontend/native/index.js`](file:///Users/sam/Coding/sampx/AFFiNE/packages/frontend/native/index.js) 中可以看到如下逻辑：

```js
if (!nativeBinding || process.env.NAPI_RS_FORCE_WASI) {
  try {
    nativeBinding = require('./affine.wasi.cjs');
  } catch (err) {
    //...
  }
  if (!nativeBinding) {
    try {
      nativeBinding = require('@affine/native-wasm32-wasi');
    } catch (err) {
      //...
    }
  }
}
```

这表明 AFFiNE 支持以下执行顺序：

1. 原生模块（`.node`）
2. WASI 模块（`.wasi.cjs`）
3. 最终回退到 Wasm 模块（`@affine/native-wasm32-wasi`）

#### 示例：编译为 Wasm

虽然目前提供的代码片段中没有明确展示 Wasm 支持，但可以通过以下步骤将 Rust 模块编译为 Wasm：

1. 安装 `wasm-pack`：
   ```bash
   cargo install wasm-pack
   ```
2. 创建 [`Cargo.toml`](file:///Users/sam/Coding/sampx/AFFiNE/Cargo.toml) 配置文件：
   ```toml
   [lib]
   crate-type = ["cdylib", "rlib"]
   ```
3. 使用 `wasm-bindgen` 导出函数：

   ```rust
   use wasm_bindgen::prelude::*;

   #[wasm_bindgen]
   pub fn hashcash(input: &str) -> String {
       // 实现哈希计算逻辑
       format!("hashcash_result_for_{}", input)
   }
   ```

4. 构建 Wasm 模块：
   ```bash
   wasm-pack build --target web
   ```

#### 总结

- AFFiNE **确实支持 Wasm**，但将其作为 **后备执行路径**，主要用于兼容性和容错场景。
- 主流部署仍以 NAPI 为主，提供更高的性能和更直接的系统调用能力。
- 若需启用 Wasm 模式，可通过设置 `NAPI_RS_FORCE_WASI=1` 强制加载 WASM 模块。

## 3. 两种方式的对比

| 特性           | NAPI                            | Wasm                                     |
| -------------- | ------------------------------- | ---------------------------------------- |
| **性能**       | 更高（直接调用原生代码）        | 略低（需要沙箱执行）                     |
| **平台限制**   | 仅限于 Node.js/Electron 环境    | 支持所有现代浏览器                       |
| **安全性**     | 需要处理内存安全                | 内存安全由 Wasm 沙箱保障                 |
| **开发复杂度** | 相对简单（依赖 napi-rs 工具链） | 较复杂（需配置 wasm-pack、wasm-bindgen） |
| **部署**       | 需要构建 `.node` 文件并打包     | 只需加载 `.wasm` 文件                    |

## 4. AFFiNE 中的实际应用场景

### 4.1 后端 Native 模块

- **文档同步引擎**：负责实时协作中的文档更新合并，确保多用户编辑时的数据一致性。
- **加密/解密**：处理敏感数据的加密存储和传输。
- **Token 计数**：统计文档长度，用于 API 限流或模型输入限制。
- **HTML 清理**：防止 XSS 攻击，确保富文本内容的安全性。

### 4.2 共享 Native 模块

- **文档加载器 (`doc_loader`)**：提供通用的文档解析逻辑，适用于前后端共享的文档处理场景。
- **哈希计算 (`hashcash`)**：用于生成唯一标识或校验数据完整性，确保文档版本的一致性。

## 5. 总结

- **NAPI** 是 AFFiNE 中最常用的 Rust 与前端集成方式，尤其适用于 Electron 桌面应用，提供高性能的本地调用能力。
- **Wasm** 是 Web 端的理想选择，确保跨平台一致性，同时避免复杂的原生构建流程。
- **两者结合** 可以实现一个统一的模块体系，既能满足桌面端的性能需求，又能确保 Web 端的安全性和可移植性。

如果你希望进一步探索某个具体模块（如 `doc_loader` 或 `hashcash`）的实现细节，可以继续查阅相关源码或询问更深入的内容！
