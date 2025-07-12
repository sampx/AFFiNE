# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AFFiNE is an open-source, local-first workspace that combines docs, canvas, and tables - an alternative to Notion & Miro. It features real-time collaboration, AI integration, and cross-platform support.

## Development Commands

### Core Development

```bash
yarn dev                    # Start development server
yarn affine dev            # Alternative using CLI tool
yarn build                 # Build entire project
yarn affine build         # Build using CLI tool
```

### Code Quality (Always run before committing)

```bash
yarn lint                  # Run ESLint + Prettier
yarn lint:fix             # Auto-fix linting issues
yarn typecheck            # TypeScript type checking
```

### Testing

```bash
yarn test                  # Run unit tests (Vitest)
yarn test:ui              # Run tests with UI
yarn test:coverage        # Run with coverage

# E2E tests (run from specific test directories)
cd tests/affine-local && yarn e2e
cd tests/affine-cloud && yarn e2e
cd tests/affine-migration && yarn e2e
```

### Native Dependencies (Required for initial setup)

```bash
yarn affine @affine/native build        # Build frontend native modules (Rust)
yarn affine @affine/server-native build # Build backend native modules
```

## Architecture

### Monorepo Structure

- `packages/frontend/` - Web, Electron, Mobile apps and core business logic
- `packages/backend/` - NestJS GraphQL server with Rust native modules
- `packages/common/` - Shared libraries (infra, nbstore, graphql, theme)
- `blocksuite/` - Block-based editor framework
- `tools/` - CLI utilities and build tools

### Key Technologies

- **Frontend**: React 19 + TypeScript, RxJS, Emotion CSS, Vite
- **Backend**: NestJS + GraphQL, PostgreSQL + Prisma, Redis
- **Local-first**: Y.js CRDT, IndexedDB, NBStore synchronization
- **Native**: Rust modules via NAPI-RS for performance-critical operations
- **AI**: Multiple provider integrations with context management

### Dependency Injection Framework

The project uses a custom dependency injection framework (`@toeverything/infra`) with:

- **Two-phase lifecycle**: Registration (define service blueprints) → Resolution (create instances on-demand)
- **Component hierarchy**: Services (business logic), Stores (state), Entities (domain models), Scopes (contexts)
- **Type-safe service identification** with interface/implementation decoupling
- **React integration** via context providers and hooks (`useService`, `useServices`)
- **Reactive state management** using RxJS observables (`livedata` system)
- **Feature modules** organized in `/modules` directories with clear separation of concerns

### Platform Architecture

- **Shared Core**: All apps import from `@affine/core` for business logic
- **Thin Wrappers**: Platform-specific entry points (web/electron/mobile)
- **Unified Build**: Single CLI tool (`yarn affine`) handles all builds

## Development Setup

### Prerequisites

- Node.js <23.0.0 (LTS recommended)
- Rust stable toolchain
- Yarn 4.9.1 (via corepack)

### Initial Setup

```bash
git clone https://github.com/toeverything/AFFiNE
yarn install
yarn affine @affine/native build
yarn affine @affine/server-native build
```

## Code Style

- TypeScript strict mode with explicit types
- Imports auto-sorted, prefer type imports
- RxJS observables end with `$`
- Prettier formatting: single quotes, trailing commas, 2 spaces
- camelCase for variables/functions, PascalCase for components/types

## Development Workflow

### Making Changes

1. **Setup**: Ensure native dependencies are built (`yarn affine @affine/native build`)
2. **Development**: Use `yarn dev` for hot-reload development server
3. **Code Quality**: Run `yarn lint:fix && yarn typecheck` before committing
4. **Testing**: Run relevant tests (`yarn test` for unit, `cd tests/[test-name] && yarn e2e` for E2E)

### Feature Development Pattern

1. **Module Creation**: Add features to `/packages/frontend/core/src/modules/[feature]/`
2. **Service Registration**: Register services in module's `index.ts` using framework
3. **Component Integration**: Use dependency injection hooks in React components
4. **State Management**: Use stores for persistent state, entities for domain models

## Key Directories

- `/packages/frontend/core/src/bootstrap/` - App initialization and setup
- `/packages/frontend/core/src/modules/` - Feature modules with business logic
- `/packages/common/infra/src/framework/` - Dependency injection framework core
- `/packages/common/infra/src/livedata/` - RxJS-based reactive data system
- `/packages/common/nbstore/` - Local-first storage and Y.js synchronization
- `/packages/backend/server/src/` - GraphQL API and server implementation
- `/tools/cli/` - Custom build tools and CLI (`yarn affine` commands)

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
