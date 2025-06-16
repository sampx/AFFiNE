分析报告：`@affine/reader` 模块

**模块名称：** `@affine/reader`

**文件路径：** `packages/common/reader`

**功能概述：**
`@affine/reader` 模块主要负责从 BlockSuite 的 Yjs 文档中读取和解析数据，并提供生成 Markdown 预览的能力。它充当了一个数据读取层，将底层的 Yjs 数据结构转换为更易于消费的 `BlockDocumentInfo` 格式，并支持对文档和块进行遍历和信息提取。

**核心文件及功能：**

1.  [`packages/common/reader/src/index.ts`](packages/common/reader/src/index.ts:1)

    - **功能：** 作为模块的入口文件，它将 [`./reader.ts`](packages/common/reader/src/reader.ts) 中导出的所有内容重新导出，使得外部模块可以直接从 `@affine/reader` 导入 `reader.ts` 中定义的函数和接口。

    **使用说明：**
    通常情况下，你只需要从 `@affine/reader` 导入所需的函数，而无需直接访问 `index.ts`。

    ```typescript
    import { readAllBlocksFromDoc, readAllDocsFromRootDoc } from '@affine/reader';

    // 现在你可以使用这些函数了
    // ...
    ```

2.  [`packages/common/reader/src/bs-store.ts`](packages/common/reader/src/bs-store.ts:1)

    - **功能：** `bs-store.ts` 模块的核心职责是初始化并提供 BlockSuite 的存储扩展管理器 (`StoreExtensionManager`) 的单例实例。`StoreExtensionManager` 是 BlockSuite 架构中的一个关键组件，它负责管理和加载各种存储相关的扩展，这些扩展定义了 BlockSuite 如何处理数据存储、同步和持久化。通过这个管理器，BlockSuite 能够灵活地支持不同的存储后端和数据处理逻辑。
    - **关键点：**
      - 导入 [`StoreExtensionManager`](@blocksuite/affine/ext-loader) 和 [`getInternalStoreExtensions`](@blocksuite/affine/extensions/store)。`getInternalStoreExtensions()` 用于获取 BlockSuite 内部预定义的存储扩展。
      - `manager` 变量是一个单例的 `StoreExtensionManager` 实例。这意味着在整个应用程序生命周期中，只会存在一个 `StoreExtensionManager` 的实例，确保了存储扩展管理的统一性和一致性。
      - `getStoreManager()` 函数返回这个单例管理器。其他模块（特别是 `reader.ts`）通过调用此函数来获取 `StoreExtensionManager` 实例，进而访问或注册 BlockSuite 存储相关的扩展。

    **使用说明：**
    `getStoreManager()` 函数提供了一个访问 BlockSuite 存储扩展管理器的入口。这对于需要与 BlockSuite 存储层进行深度交互的场景非常有用，例如：

    - **获取已注册的存储扩展：** 你可以通过 `storeManager.get('extension-name')` 来获取特定的存储扩展实例，并调用其提供的方法。
    - **注册自定义存储扩展：** 如果你需要为 BlockSuite 添加新的存储能力（例如，集成新的数据库或云存储服务），你可以创建自己的存储扩展并使用 `storeManager.add()` 或在初始化时通过 `StoreExtensionManager` 构造函数进行注册。
    - **自定义 BlockSuite 行为：** 通过操作存储扩展，你可以影响 BlockSuite 如何加载、保存和同步文档数据。

    以下是一个简单的示例，演示如何获取 `StoreExtensionManager` 并尝试访问一个假设的存储扩展：

    ```typescript
    import { getStoreManager } from '@affine/reader/bs-store';
    import { DocProvider } from '@blocksuite/affine/store'; // 假设你需要一个 DocProvider 类型的扩展

    // 获取存储管理器实例
    const storeManager = getStoreManager();

    // 示例：尝试获取一个名为 'doc-provider' 的存储扩展
    // 实际的扩展名称取决于 BlockSuite 内部的实现或你注册的自定义扩展
    const docProviderExtension = storeManager.get('doc-provider') as DocProvider | undefined;

    if (docProviderExtension) {
      console.log('成功获取 DocProvider 扩展:', docProviderExtension);
      // 现在你可以使用 docProviderExtension 提供的方法，例如：
      // docProviderExtension.loadDoc(docId);
    } else {
      console.log('未找到 DocProvider 扩展。');
    }

    // 另一个示例：如果你需要手动设置扩展（通常在 BlockSuite 内部完成）
    // import { SomeCustomExtension } from './your-custom-extension';
    // storeManager.add(new SomeCustomExtension());
    // console.log('已注册自定义扩展。');
    ```

    请注意，直接操作 `StoreExtensionManager` 通常是高级用法，主要用于 BlockSuite 内部开发或深度定制。对于大多数应用场景，你可能更多地通过 BlockSuite 提供的上层 API 来与文档进行交互，而无需直接接触存储管理器。

3.  [`packages/common/reader/src/reader.ts`](packages/common/reader/src/reader.ts:1)

    - **功能：** 模块的核心逻辑所在，包含了从 Yjs 文档中读取块数据、生成 Markdown 预览以及获取文档元数据的主要函数。
    - **关键接口：**
      - [`BlockDocumentInfo`](packages/common/reader/src/reader.ts:51): 定义了从 Yjs 块中提取的文档块信息结构，包括 `docId`、`blockId`、`content`、`flavour`、`blob`、`refDocId`、`ref`、`parentFlavour`、`parentBlockId`、`additional` 信息以及原始的 `yblock` 和生成的 `markdownPreview`。
    - **核心函数：**
      - `generateMarkdownPreviewBuilder(workspaceId: string, blocks: BlockDocumentInfo[], yRootDoc?: YDoc)`:
        - **功能：** 返回一个异步函数 `generateMarkdownPreview`，用于根据 `BlockDocumentInfo` 生成对应的 Markdown 预览。
        - **关键点：**
          - 处理不同 `flavour`（如 `affine:paragraph`、`affine:list`、`affine:code`、`affine:database`、`affine:image`、`affine:embed-linked-doc`、`affine:attachment`、`affine:latex`、`affine:table` 等）的 Markdown 转换逻辑。
          - 对代码块和段落进行内容裁剪 (`trimCodeBlock`, `trimParagraph`)。
          - 处理列表块的缩进 (`indentMarkdown`, `unindentMarkdown`)。
          - 生成数据库、图片、嵌入文档、附件、LaTeX 和表格等特殊块的 Markdown 预览。
          - 利用 `WeakMap` 实现 Markdown 预览缓存 (`markdownPreviewCache`) 以提高性能。
          - 通过 `titleMiddleware` 和 `docLinkBaseURLMiddleware` 为 Markdown 转换器提供文档标题和链接基础 URL。
      - `readAllBlocksFromDoc({ ydoc, rootYDoc, spaceId, maxSummaryLength })`:
        - **功能：** 从给定的 Yjs 文档 (`ydoc`) 中读取所有 BlockSuite 块，并构建 `BlockDocumentInfo` 数组，同时提取文档标题和摘要。
        - **关键点：**
          - 通过广度优先搜索（BFS）遍历文档中的块，确保处理顺序。
          - 提取文本块 (`affine:paragraph`, `affine:list`, `affine:code`) 的内容，并识别其中的引用 (`reference`) 信息。
          - 处理嵌入文档 (`affine:embed-linked-doc`, `affine:embed-synced-doc`)、附件 (`affine:attachment`)、图片 (`affine:image`)、画布 (`affine:surface`)、数据库 (`affine:database`)、LaTeX (`affine:latex`) 和表格 (`affine:table`) 等特殊块的数据提取。
          - 计算文档摘要 (`summary`)。
          - 在第二个循环中，为包含引用的块生成上下文相关的 Markdown 预览，通过向前和向后查找相关块来提供更丰富的上下文。
      - `readAllDocsFromRootDoc(rootDoc: YDoc, options?: { includeTrash?: boolean })`:
        - **功能：** 从根 Yjs 文档 (`rootDoc`) 中读取所有子文档（页面）的元数据，包括文档 ID 和标题。
        - **关键点：** 可选地包含已删除（`inTrash`）的文档。
      - `readAllDocIdsFromRootDoc(rootDoc: YDoc, options?: { includeTrash?: boolean })`:
        - **功能：** 从根 Yjs 文档 (`rootDoc`) 中读取所有子文档（页面）的 ID 列表。
        - **关键点：** 可选地包含已删除（`inTrash`）的文档。

    **使用示例：**

    本节将演示 `@affine/reader` 模块中主要函数的使用方法。

    #### 1. 读取文档中的所有块信息 (`readAllBlocksFromDoc`)

    此函数用于从一个 Yjs 文档中提取所有 BlockSuite 块的详细信息，包括其内容、类型、引用关系以及生成的 Markdown 预览。

    ```typescript
    import * as Y from 'yjs';
    import { readAllBlocksFromDoc } from '@affine/reader';
    import { AffineSchemas } from '@blocksuite/affine/schemas';
    import { Schema } from '@blocksuite/affine/store';

    // 假设你有一个 Yjs 文档实例
    const ydoc = new Y.Doc();
    const blocksMap = ydoc.getMap('blocks');

    // 注册 BlockSuite Schema (重要步骤，否则无法正确解析块类型)
    const blocksuiteSchema = new Schema();
    blocksuiteSchema.register([...AffineSchemas]);

    // 示例：创建一个简单的段落块
    ydoc.transact(() => {
      const pageBlock = new Y.Map();
      pageBlock.set('sys:id', 'page001');
      pageBlock.set('sys:flavour', 'affine:page');
      pageBlock.set('prop:title', new Y.Text('我的文档标题'));
      pageBlock.set('sys:children', new Y.Array());
      blocksMap.set('page001', pageBlock);

      const paragraphBlock = new Y.Map();
      paragraphBlock.set('sys:id', 'block001');
      paragraphBlock.set('sys:flavour', 'affine:paragraph');
      paragraphBlock.set('prop:text', new Y.Text('这是一个示例文本块。'));
      blocksMap.set('block001', paragraphBlock);

      // 将段落块添加到页面块的子节点中
      pageBlock.get('sys:children').push(['block001']);
    });

    async function exampleReadAllBlocks() {
      const spaceId = 'test-workspace-id'; // 你的工作区 ID
      const result = await readAllBlocksFromDoc({
        ydoc: ydoc,
        spaceId: spaceId,
        maxSummaryLength: 500, // 可选：限制摘要长度
      });

      if (result) {
        console.log('文档标题:', result.title);
        console.log('文档摘要:', result.summary);
        console.log('所有块信息:');
        result.blocks.forEach(block => {
          console.log(`  - Block ID: ${block.blockId}`);
          console.log(`    Flavour: ${block.flavour}`);
          console.log(`    Content: ${block.content}`);
          console.log(`    Markdown Preview: ${block.markdownPreview}`);
          console.log('---');
        });
      } else {
        console.log('文档为空或无法解析。');
      }
    }

    exampleReadAllBlocks();
    ```

    #### 2. 读取根文档中的所有子文档元数据 (`readAllDocsFromRootDoc`)

    此函数用于获取根 Yjs 文档中所有子文档（页面）的 ID 和标题信息。

    ```typescript
    import * as Y from 'yjs';
    import { readAllDocsFromRootDoc } from '@affine/reader';

    // 假设你有一个根 Yjs 文档实例
    const rootDoc = new Y.Doc();
    const metaMap = rootDoc.getMap('meta');
    const pagesArray = new Y.Array();
    metaMap.set('pages', pagesArray);

    // 示例：添加一些页面元数据
    rootDoc.transact(() => {
      const page1 = new Y.Map();
      page1.set('id', 'doc-id-1');
      page1.set('title', '文档 A');
      page1.set('trash', false); // 未在回收站
      pagesArray.push([page1]);

      const page2 = new Y.Map();
      page2.set('id', 'doc-id-2');
      page2.set('title', '文档 B (已删除)');
      page2.set('trash', true); // 在回收站
      pagesArray.push([page2]);

      const page3 = new Y.Map();
      page3.set('id', 'doc-id-3');
      page3.set('title', '文档 C');
      page3.set('trash', false);
      pagesArray.push([page3]);
    });

    function exampleReadAllDocs() {
      // 读取所有未在回收站的文档
      const availableDocs = readAllDocsFromRootDoc(rootDoc);
      console.log('所有可用文档:');
      availableDocs.forEach((info, docId) => {
        console.log(`  - ID: ${docId}, Title: ${info.title}`);
      });

      console.log('\n---');

      // 读取所有文档，包括在回收站中的
      const allDocs = readAllDocsFromRootDoc(rootDoc, { includeTrash: true });
      console.log('所有文档 (包括回收站):');
      allDocs.forEach((info, docId) => {
        console.log(`  - ID: ${docId}, Title: ${info.title}`);
      });
    }

    exampleReadAllDocs();
    ```

    #### 3. 读取根文档中的所有子文档 ID (`readAllDocIdsFromRootDoc`)

    此函数用于获取根 Yjs 文档中所有子文档（页面）的 ID 列表。

    ```typescript
    import * as Y from 'yjs';
    import { readAllDocIdsFromRootDoc } from '@affine/reader';

    // 假设你有一个根 Yjs 文档实例 (同上)
    const rootDoc = new Y.Doc();
    const metaMap = rootDoc.getMap('meta');
    const pagesArray = new Y.Array();
    metaMap.set('pages', pagesArray);

    rootDoc.transact(() => {
      const page1 = new Y.Map();
      page1.set('id', 'doc-id-1');
      page1.set('title', '文档 A');
      page1.set('trash', false);
      pagesArray.push([page1]);

      const page2 = new Y.Map();
      page2.set('id', 'doc-id-2');
      page2.set('title', '文档 B (已删除)');
      page2.set('trash', true);
      pagesArray.push([page2]);
    });

    function exampleReadAllDocIds() {
      // 读取所有未在回收站的文档 ID
      const availableDocIds = readAllDocIdsFromRootDoc(rootDoc);
      console.log('所有可用文档 ID:', availableDocIds);

      // 读取所有文档 ID，包括在回收站中的
      const allDocIds = readAllDocIdsFromRootDoc(rootDoc, { includeTrash: true });
      console.log('所有文档 ID (包括回收站):', allDocIds);
    }

    exampleReadAllDocIds();
    ```

**依赖关系：**

- **内部依赖：**
  - [`./bs-store`](packages/common/reader/src/bs-store.ts): 用于获取 BlockSuite 的存储扩展管理器。
- **外部依赖 (来自 `package.json`)：**
  - `lodash-es`: 提供 `uniq` 等实用函数。
  - `yjs`: Yjs 核心库，用于处理协同编辑的文档数据结构（`YDoc`, `YMap`, `YArray`, `YText`）。
- **Peer 依赖：**
  - `@blocksuite/affine`: 核心 BlockSuite 库，提供了 `Container`、`AffineSchemas`、`MarkdownAdapter`、`Transformer`、`createYProxy`、`DraftModel`、`Schema` 等关键组件和类型定义。

**模块结构：**

```
packages/common/reader/
├── src/
│   ├── index.ts          // 模块入口，导出 reader.ts
│   ├── bs-store.ts       // BlockSuite 存储扩展管理器
│   └── reader.ts         // 核心逻辑：读取块、生成Markdown预览、读取文档元数据
├── package.json          // 模块元数据和依赖
├── README.md
├── tsconfig.json
└── esbuild.config.js
```

**总结：**
`@affine/reader` 模块是 AFFiNE 项目中用于解析和展示 BlockSuite 文档内容的关键组件。它通过与 Yjs 和 BlockSuite 核心库的紧密集成，实现了从底层数据结构到可读信息的转换，并提供了灵活的 Markdown 预览生成能力，这对于文档的搜索、摘要和引用展示至关重要。
