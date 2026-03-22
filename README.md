# pixattica

A Turborepo monorepo centered on Bella Meng's landing site, with shared packages for reusable UI, embedded features, and a small blog backend/admin stack.

## Apps

- `apps/landing`: the public portfolio site and desktop-style shell, including `about.app`, `blogs.app`, `books.app`, `cats.app`, and `collage.app`
- `apps/blog-api`: the Fastify + SQLite blog backend with public post endpoints and password-protected admin CRUD
- `apps/blog-admin`: the separate admin app for writing markdown posts, saving drafts, and publishing
- `apps/water-widget-extension`: Chrome extension

## Blog Stack

The blog feature is split into three parts:

1. `blogs.app` in the landing site fetches published posts from the backend and renders them as markdown notes.
2. `blog-api` stores posts in SQLite and exposes public and admin endpoints.
3. `blog-admin` is the writing surface for creating drafts, editing, publishing, unpublishing, and deleting posts.

Posts are stored in SQLite with draft/published state. Only published posts are visible in the public site.

## Getting Started

```bash
pnpm install
pnpm setup:env
pnpm dev
```

`pnpm dev` now starts the public site, blog API, and blog admin together.

To run only the landing app:

```bash
pnpm dev:landing
```

To run the full blog stack explicitly:

```bash
pnpm setup:env
pnpm dev:blog
```

Default local ports:

- landing: `5173`
- blog api: `4176`
- blog admin: `4177`

The landing app proxies `/api` to the blog backend in local dev, and the admin app does the same.

## Commands

```bash
pnpm build          # Build all apps and packages
pnpm build:blog-api # Build the blog backend
pnpm build:blog-admin # Build the blog admin app
pnpm build:landing  # Build the deployed landing app
pnpm dev            # Run landing + blog-api + blog-admin together
pnpm dev:blog       # Alias for the full blog stack
pnpm dev:landing    # Run only the landing app
pnpm dev:all        # Run every workspace dev task
pnpm setup:env      # Copy missing .env files from .env.example
pnpm lint           # Lint all apps and packages
pnpm test           # Test all apps and packages
pnpm test:blog-api  # Test the blog backend
pnpm test:blog-admin # Test the blog admin app
pnpm test:landing   # Test the landing app
pnpm clean          # Clean build artifacts

# Filter to a single workspace
pnpm turbo build --filter=@pixattica/<workspace-name>
pnpm turbo dev --filter=@pixattica/<workspace-name>
```

## Structure

```
apps/
  blog-admin/              Blog writing and publishing UI
  blog-api/                Fastify + SQLite blog backend
  landing/                 Public portfolio site
  water-widget-extension/  Chrome extension
packages/
  pixel-collage/           Embedded collage feature
  tsconfig/                Shared TypeScript configs
  ui/                      Shared UI primitives
```

## Blog Environment

`apps/blog-api/.env.example` includes:

- `PORT`
- `HOST`
- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `CORS_ORIGINS`

`apps/blog-admin/.env.example` includes:

- `VITE_BLOG_API_BASE_URL`

On a fresh database, `blog-api` seeds one placeholder published post so `blogs.app` is not empty on first run.

## Creating a New App

1. Copy `apps/_template` to `apps/<new-app-name>`
2. Update `name` in `package.json` to `@pixattica/<new-app-name>`
3. Run `pnpm install` from the root
