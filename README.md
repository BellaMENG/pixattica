# pixattica

A Turborepo monorepo centered on the landing app, with shared packages for reusable UI and embedded features.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm build          # Build all apps and packages
pnpm build:landing  # Build the deployed landing app
pnpm dev            # Default local dev for the landing app
pnpm dev:all        # Run every workspace dev task
pnpm lint           # Lint all apps and packages
pnpm test           # Test all apps and packages
pnpm test:landing   # Test the landing app
pnpm clean    # Clean build artifacts

# Filter to a single workspace
pnpm turbo build --filter=@pixattica/<workspace-name>
pnpm turbo dev --filter=@pixattica/<workspace-name>
```

## Structure

```
apps/
  landing/                 Deployed website
  water-widget-extension/  Chrome extension
packages/
  pixel-collage/           Embedded collage feature
  tsconfig/                Shared TypeScript configs
  ui/                      Shared UI primitives
```

## Creating a New App

1. Copy `apps/_template` to `apps/<new-app-name>`
2. Update `name` in `package.json` to `@pixattica/<new-app-name>`
3. Run `pnpm install` from the root
