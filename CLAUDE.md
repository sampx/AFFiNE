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
