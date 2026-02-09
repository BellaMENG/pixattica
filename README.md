# pixattica

A Turborepo monorepo containing multiple React TypeScript apps. Each app is a standalone Vite + React 19 SPA.

## Getting Started

```bash
yarn install
yarn dev
```

## Commands

```bash
yarn build    # Build all apps
yarn dev      # Dev server for all apps
yarn lint     # Lint all apps
yarn test     # Test all apps
yarn clean    # Clean build artifacts

# Filter to a single app
yarn turbo build --filter=@pixattica/<app-name>
yarn turbo dev --filter=@pixattica/<app-name>
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
3. Run `yarn install` from the root
