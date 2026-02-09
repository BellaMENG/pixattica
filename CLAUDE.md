# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pixattica is a Turborepo monorepo containing multiple React TypeScript projects. Each app is a standalone Vite + React 19 SPA.

## Commands

```bash
yarn install              # Install all dependencies
yarn build                # Build all apps
yarn dev                  # Dev server for all apps
yarn lint                 # Lint all apps
yarn test                 # Test all apps

# Filter to a single app
yarn turbo build --filter=@pixattica/<app-name>
yarn turbo dev --filter=@pixattica/<app-name>
yarn turbo test --filter=@pixattica/<app-name>
```

Within an individual app directory, standard scripts apply: `yarn dev`, `yarn build`, `yarn lint`, `yarn test`.

## Architecture

```
apps/          — Individual React apps (each is a Vite + React 19 SPA)
packages/      — Shared workspace packages
  tsconfig/    — Shared TypeScript configs (base.json, react-app.json)
  eslint-config/ — Shared ESLint flat config for React
```

## Creating a New App

1. Copy an existing app (e.g. `apps/pixel-collage`) to `apps/<new-app-name>`
2. Update `name` in `package.json` to `@pixattica/<new-app-name>`
3. Run `yarn install` from the root

## Conventions

- Package scope: `@pixattica/*`
- All apps use Vite, React 19, TypeScript, Vitest
- ESLint flat config via `@pixattica/eslint-config/react`
- TSConfig extends `@pixattica/tsconfig/react-app.json` — each app must specify its own `"include": ["src"]`
