# GEMINI.md - AFFiNE Development Guidelines

This document provides a summary of the development guidelines for the AFFiNE project, tailored for use with the Gemini AI assistant.

## Commands

- **Build**: `yarn build` - Build the entire project
- **Dev**: `yarn dev` - Start development server
- **Test**: `yarn test` - Run all tests with Vitest
- **Test single**: `vitest <test-file-pattern>` - Run specific test file
- **Test UI**: `yarn test:ui` - Run tests with UI
- **Lint**: `yarn lint` - Run ESLint and Prettier checks
- **Lint fix**: `yarn lint:fix` - Auto-fix linting issues
- **Typecheck**: `yarn typecheck` - Run TypeScript compiler

## Code Style

- **Imports**: Auto-sorted with `simple-import-sort` plugin
- **Formatting**: Prettier with single quotes, trailing commas, 2 spaces, avoid arrow parens
- **TypeScript**: Strict mode enabled, prefer type imports
- **React**: JSX runtime (no React import needed), hooks rules enforced
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error handling**: Prefer explicit error types, avoid any
- **Package imports**: Never import from `/dist` or `/src`, use package exports
- **RxJS**: Observables should end with `$` (controlled by finnish rule)

## Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, Emotion CSS, Radix UI, Vite
- **Backend**: NestJS, GraphQL, Prisma, PostgreSQL, BullMQ
- **Editor**: BlockSuite (block-based editor framework)
- **Build**: Yarn workspaces, Vite, Rust (native modules), Electron
- **Testing**: Vitest, Playwright, Happy DOM
- **Infrastructure**: Docker, Y.js (CRDT), IndexedDB, S3

### Project Structure

```
packages/
├── frontend/
│   ├── apps/         # Platform-specific apps (web, electron, mobile, iOS/Android)
│   ├── core/         # Shared business logic and modules
│   ├── component/    # Reusable UI components
│   ├── i18n/         # Internationalization
│   └── routes/       # Routing configuration
├── backend/
│   ├── server/       # NestJS GraphQL API server
│   └── native/       # Rust native modules
├── common/           # Shared libraries (infra, nbstore, graphql, etc.)
└── blocksuite/       # Block-based editor framework
```

### Frontend Architecture

- **Shared Core Pattern**: All apps import from `@affine/core` for business logic
- **Platform Apps**: Thin wrappers with platform-specific configurations
- **Module System**: Feature-based modules in `/modules` directory
- **State Management**: RxJS observables, React Context, local-first architecture

### Module src directory map

```json
{
  "@blocksuite/affine": "blocksuite/affine/all/src",
  "@blocksuite/affine-block-attachment": "blocksuite/affine/blocks/attachment/src",
  "@blocksuite/affine-block-bookmark": "blocksuite/affine/blocks/bookmark/src",
  "@blocksuite/affine-block-callout": "blocksuite/affine/blocks/callout/src",
  "@blocksuite/affine-block-code": "blocksuite/affine/blocks/code/src",
  "@blocksuite/affine-block-data-view": "blocksuite/affine/blocks/data-view/src",
  "@blocksuite/affine-block-database": "blocksuite/affine/blocks/database/src",
  "@blocksuite/affine-block-divider": "blocksuite/affine/blocks/divider/src",
  "@blocksuite/affine-block-edgeless-text": "blocksuite/affine/blocks/edgeless-text/src",
  "@blocksuite/affine-block-embed": "blocksuite/affine/blocks/embed/src",
  "@blocksuite/affine-block-embed-doc": "blocksuite/affine/blocks/embed-doc/src",
  "@blocksuite/affine-block-frame": "blocksuite/affine/blocks/frame/src",
  "@blocksuite/affine-block-image": "blocksuite/affine/blocks/image/src",
  "@blocksuite/affine-block-latex": "blocksuite/affine/blocks/latex/src",
  "@blocksuite/affine-block-list": "blocksuite/affine/blocks/list/src",
  "@blocksuite/affine-block-note": "blocksuite/affine/blocks/note/src",
  "@blocksuite/affine-block-paragraph": "blocksuite/affine/blocks/paragraph/src",
  "@blocksuite/affine-block-root": "blocksuite/affine/blocks/root/src",
  "@blocksuite/affine-block-surface": "blocksuite/affine/blocks/surface/src",
  "@blocksuite/affine-block-surface-ref": "blocksuite/affine/blocks/surface-ref/src",
  "@blocksuite/affine-block-table": "blocksuite/affine/blocks/table/src",
  "@blocksuite/affine-components": "blocksuite/affine/components/src",
  "@blocksuite/data-view": "blocksuite/affine/data-view/src",
  "@blocksuite/affine-ext-loader": "blocksuite/affine/ext-loader/src",
  "@blocksuite/affine-foundation": "blocksuite/affine/foundation/src",
  "@blocksuite/affine-fragment-adapter-panel": "blocksuite/affine/fragments/adapter-panel/src",
  "@blocksuite/affine-fragment-doc-title": "blocksuite/affine/fragments/doc-title/src",
  "@blocksuite/affine-fragment-frame-panel": "blocksuite/affine/fragments/frame-panel/src",
  "@blocksuite/affine-fragment-outline": "blocksuite/affine/fragments/outline/src",
  "@blocksuite/affine-gfx-brush": "blocksuite/affine/gfx/brush/src",
  "@blocksuite/affine-gfx-connector": "blocksuite/affine/gfx/connector/src",
  "@blocksuite/affine-gfx-group": "blocksuite/affine/gfx/group/src",
  "@blocksuite/affine-gfx-link": "blocksuite/affine/gfx/link/src",
  "@blocksuite/affine-gfx-mindmap": "blocksuite/affine/gfx/mindmap/src",
  "@blocksuite/affine-gfx-note": "blocksuite/affine/gfx/note/src",
  "@blocksuite/affine-gfx-pointer": "blocksuite/affine/gfx/pointer/src",
  "@blocksuite/affine-gfx-shape": "blocksuite/affine/gfx/shape/src",
  "@blocksuite/affine-gfx-template": "blocksuite/affine/gfx/template/src",
  "@blocksuite/affine-gfx-text": "blocksuite/affine/gfx/text/src",
  "@blocksuite/affine-gfx-turbo-renderer": "blocksuite/affine/gfx/turbo-renderer/src",
  "@blocksuite/affine-inline-footnote": "blocksuite/affine/inlines/footnote/src",
  "@blocksuite/affine-inline-latex": "blocksuite/affine/inlines/latex/src",
  "@blocksuite/affine-inline-link": "blocksuite/affine/inlines/link/src",
  "@blocksuite/affine-inline-mention": "blocksuite/affine/inlines/mention/src",
  "@blocksuite/affine-inline-preset": "blocksuite/affine/inlines/preset/src",
  "@blocksuite/affine-inline-reference": "blocksuite/affine/inlines/reference/src",
  "@blocksuite/affine-model": "blocksuite/affine/model/src",
  "@blocksuite/affine-rich-text": "blocksuite/affine/rich-text/src",
  "@blocksuite/affine-shared": "blocksuite/affine/shared/src",
  "@blocksuite/affine-widget-drag-handle": "blocksuite/affine/widgets/drag-handle/src",
  "@blocksuite/affine-widget-edgeless-auto-connect": "blocksuite/affine/widgets/edgeless-auto-connect/src",
  "@blocksuite/affine-widget-edgeless-dragging-area": "blocksuite/affine/widgets/edgeless-dragging-area/src",
  "@blocksuite/affine-widget-edgeless-selected-rect": "blocksuite/affine/widgets/edgeless-selected-rect/src",
  "@blocksuite/affine-widget-edgeless-toolbar": "blocksuite/affine/widgets/edgeless-toolbar/src",
  "@blocksuite/affine-widget-edgeless-zoom-toolbar": "blocksuite/affine/widgets/edgeless-zoom-toolbar/src",
  "@blocksuite/affine-widget-frame-title": "blocksuite/affine/widgets/frame-title/src",
  "@blocksuite/affine-widget-keyboard-toolbar": "blocksuite/affine/widgets/keyboard-toolbar/src",
  "@blocksuite/affine-widget-linked-doc": "blocksuite/affine/widgets/linked-doc/src",
  "@blocksuite/affine-widget-note-slicer": "blocksuite/affine/widgets/note-slicer/src",
  "@blocksuite/affine-widget-page-dragging-area": "blocksuite/affine/widgets/page-dragging-area/src",
  "@blocksuite/affine-widget-remote-selection": "blocksuite/affine/widgets/remote-selection/src",
  "@blocksuite/affine-widget-scroll-anchoring": "blocksuite/affine/widgets/scroll-anchoring/src",
  "@blocksuite/affine-widget-slash-menu": "blocksuite/affine/widgets/slash-menu/src",
  "@blocksuite/affine-widget-toolbar": "blocksuite/affine/widgets/toolbar/src",
  "@blocksuite/affine-widget-viewport-overlay": "blocksuite/affine/widgets/viewport-overlay/src",
  "@blocksuite/bs-docs": "blocksuite/docs",
  "@blocksuite/global": "blocksuite/framework/global/src",
  "@blocksuite/std": "blocksuite/framework/std/src",
  "@blocksuite/store": "blocksuite/framework/store/src",
  "@blocksuite/sync": "blocksuite/framework/sync/src",
  "@blocksuite/integration-test": "blocksuite/integration-test/src",
  "@blocksuite/playground": "blocksuite/playground",
  "@affine/docs": "docs/reference",
  "@affine/server-native": "packages/backend/native/src",
  "@affine/server": "packages/backend/server/src",
  "@affine/debug": "packages/common/debug/src",
  "@affine/env": "packages/common/env/src",
  "@affine/error": "packages/common/error/src",
  "@affine/graphql": "packages/common/graphql/src",
  "@toeverything/infra": "packages/common/infra/src",
  "@affine/nbstore": "packages/common/nbstore/src",
  "@affine/reader": "packages/common/reader/src",
  "@y-octo/node": "packages/common/y-octo/node/src",
  "@affine/admin": "packages/frontend/admin/src",
  "@affine/android": "packages/frontend/apps/android/src",
  "@affine/electron": "packages/frontend/apps/electron/src",
  "@affine/electron-renderer": "packages/frontend/apps/electron-renderer/src",
  "@affine/ios": "packages/frontend/apps/ios/src",
  "@affine/mobile": "packages/frontend/apps/mobile/src",
  "@affine/web": "packages/frontend/apps/web/src",
  "@affine/component": "packages/frontend/component/src",
  "@affine/core": "packages/frontend/core/src",
  "@affine/electron-api": "packages/frontend/electron-api/src",
  "@affine/i18n": "packages/frontend/i18n/src",
  "@affine/media-capture-playground": "packages/frontend/media-capture-playground/web",
  "@affine/native": "packages/frontend/native/src",
  "@affine/routes": "packages/frontend/routes/src",
  "@affine/templates": "packages/frontend/templates",
  "@affine/track": "packages/frontend/track/src",
  "@affine-test/affine-cloud": "tests/affine-cloud/e2e",
  "@affine-test/affine-cloud-copilot": "tests/affine-cloud-copilot/e2e",
  "@affine-test/affine-desktop": "tests/affine-desktop/e2e",
  "@affine-test/affine-desktop-cloud": "tests/affine-desktop-cloud/e2e",
  "@affine-test/affine-local": "tests/affine-local/e2e",
  "@affine-test/affine-mobile": "tests/affine-mobile/e2e",
  "@affine-test/blocksuite": "tests/blocksuite/e2e",
  "@affine-test/kit": "tests/kit/src",
  "@types/build-config": "tools/@types/build-config",
  "@types/affine__env": "tools/@types/env",
  "@affine/changelog": "tools/changelog",
  "@affine-tools/cli": "tools/cli/src",
  "@affine/commitlint-config": "tools/commitlint",
  "@affine/copilot-result": "tools/copilot-result",
  "@affine/playstore-auto-bump": "tools/playstore-auto-bump",
  "@affine-tools/utils": "tools/utils/src"
}
```

## Language

- **speak language**: always use Chinese
- **code comment language**: always use English

## Reference Analysis.md

When answering my questions, coding, designing, or analyzing projects or modules, you can refer to the Technical Specifications Document:

- TECH_SPEC.md: Usually located in the root directory of the project or the root directory of a sub-repo (in a monorepo), this file describes the technical architecture of the project or module. You can trust the content of this file.
- When listing the files of a certain module, please refer to the README_LEARN.md file in the directory (if it exists). This is the detailed documentation for using the module and learning about its technology. However, this file is compiled by AI analysis, and some content may not be accurately described. If there is a discrepancy with the actual code, please rely on the code.
