# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pixattica is a Turborepo monorepo centered on the landing app, with shared packages for reusable UI and embedded features.

## Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all apps and packages
pnpm build:landing        # Build the deployed landing app
pnpm dev                  # Default local dev for the landing app
pnpm dev:all              # Run every workspace dev task
pnpm lint                 # Lint all apps
pnpm format               # Auto-format all files
pnpm format:check         # Check formatting (CI)
pnpm test                 # Test all apps and packages
pnpm test:landing         # Test the landing app

# Filter to a single workspace
pnpm turbo build --filter=@pixattica/<workspace-name>
pnpm turbo dev --filter=@pixattica/<workspace-name>
pnpm turbo test --filter=@pixattica/<workspace-name>
```

Within an individual app directory, standard scripts apply: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`.

## Architecture

```
apps/                    — Deployable apps
  landing/               — Main site
  water-widget-extension/ — Browser extension
packages/                — Shared workspace packages
  pixel-collage/         — Embedded collage feature
  tsconfig/              — Shared TypeScript configs (base.json, react-app.json)
  ui/                    — Shared UI utilities/components
```

## Creating a New App

1. Copy an existing app (e.g. `apps/landing`) to `apps/<new-app-name>`
2. Update `name` in `package.json` to `@pixattica/<new-app-name>`
3. Run `pnpm install` from the root

## Conventions

- Package scope: `@pixattica/*`
- All apps use Vite, React 19, TypeScript, Vitest
- ESLint flat config via `@pixattica/eslint-config/react`
- TSConfig extends `@pixattica/tsconfig/react-app.json` — each app must specify its own `"include": ["src"]`
