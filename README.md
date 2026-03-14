# pixattica

A Turborepo monorepo centered on the landing app, with shared packages for reusable UI and embedded features.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm build    # Build all apps
pnpm dev      # Dev server for all apps
pnpm lint     # Lint all apps
pnpm test     # Test all apps
pnpm clean    # Clean build artifacts

# Filter to a single app
pnpm turbo build --filter=@pixattica/<app-name>
pnpm turbo dev --filter=@pixattica/<app-name>
```

## Structure

```
apps/              Individual React apps (Vite + React 19)
apps/_template     Copy this to create a new app
packages/
  tsconfig/        Shared TypeScript configs
  eslint-config/   Shared ESLint flat config
```

## Creating a New App

1. Copy `apps/_template` to `apps/<new-app-name>`
2. Update `name` in `package.json` to `@pixattica/<new-app-name>`
3. Run `pnpm install` from the root
