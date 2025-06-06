# AGENT.md - AFFiNE Development Guidelines

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

## Language

- **speak language**: always use Chinese
- **code comment language**: always use English
