# pixattica

A Turborepo monorepo centered on Bella Meng's landing site, with shared packages for reusable UI, embedded features, and a small blog backend/admin stack.

## Apps

- `apps/landing`: the public portfolio site and desktop-style shell, including `about.app`, `blogs.app`, `books.app`, `cats.app`, and `collage.app`
- `apps/blog-api`: the Cloudflare Worker + D1 blog backend with public post endpoints and password-protected admin CRUD
- `apps/blog-admin`: the separate admin app for writing markdown posts, saving drafts, and publishing
- `apps/water-widget-extension`: Chrome extension

## Blog Stack

The blog feature is split into three parts:

1. `blogs.app` in the landing site fetches published posts from the backend and renders them as markdown notes.
2. `blog-api` stores posts in D1 and exposes public and admin endpoints.
3. `blog-admin` is the writing surface for creating drafts, editing, publishing, unpublishing, and deleting posts.

Posts are stored in D1 with draft/published state. Only published posts are visible in the public site.

## Getting Started

```bash
pnpm install
pnpm setup:env
pnpm dev
```

`pnpm dev` now starts the public site, blog API Worker, and blog admin together.

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
- blog api worker: `4176`
- blog admin: `4177`

The landing app proxies `/api` to the blog backend in local dev, and the admin app does the same.

## Commands

```bash
pnpm build          # Build all apps and packages
pnpm build:blog-api # Build the blog backend Worker
pnpm build:blog-admin # Build the blog admin app
pnpm build:landing  # Build the deployed landing app
pnpm build:reading  # Build the reading slideshow app
pnpm build:site     # Build a single deployable site bundle for Cloudflare Pages
pnpm dev            # Run landing + blog-api + blog-admin together
pnpm dev:blog       # Alias for the full blog stack
pnpm dev:landing    # Run only the landing app
pnpm dev:all        # Run every workspace dev task
pnpm setup:env      # Copy missing .env/.dev.vars files from their example files
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
  blog-api/                Cloudflare Worker + D1 blog backend
  landing/                 Public portfolio site
  water-widget-extension/  Chrome extension
packages/
  pixel-collage/           Embedded collage feature
  tsconfig/                Shared TypeScript configs
  ui/                      Shared UI primitives
```

## Blog Environment

`apps/blog-api/.dev.vars.example` includes:

- `ADMIN_PASSWORD`
- `SESSION_SECRET`

`apps/blog-api/wrangler.jsonc` includes default local values for:

- `CORS_ORIGINS`
- `SEED_PLACEHOLDER`

To create a local D1 database and apply migrations manually:

```bash
pnpm --filter=@pixattica/blog-api run db:migrate:local
```

To deploy the Worker after creating a Cloudflare D1 database and filling in the database IDs in `apps/blog-api/wrangler.jsonc`:

```bash
pnpm --filter=@pixattica/blog-api run db:migrate:remote
pnpm --filter=@pixattica/blog-api run deploy
```

`apps/blog-admin/.env.example` includes:

- `VITE_BLOG_API_BASE_URL`

### Move the blog to bellameng.com

The existing `pixattica-blog-api` Worker and D1 database hold the posts. Keep their names and the D1 database ID when changing domains; no data migration or database migration is needed.

1. Deploy `apps/blog-api/wrangler.jsonc` with `pnpm --filter=@pixattica/blog-api run deploy`. Its routes include `bellameng.com/api/*` and `www.bellameng.com/api/*`, alongside the old routes. The `bellameng.com` zone must be in the same Cloudflare account and its hostnames must have proxied DNS records.
2. Check `https://bellameng.com/api/health` returns `{"ok":true}` and `https://bellameng.com/api/posts` returns JSON with a `posts` array. The public `/blog` page uses `/api` on its own domain, so redeploy the public Pages project to pick up this repo's sitemap and error handling.
3. In the existing blog admin Pages project, add `admin.bellameng.com` under **Custom domains**. Ensure a proxied CNAME for `admin.bellameng.com` points to `pixattica-blog-admin.pages.dev`; the custom domain stays pending without it. Set the production build variable `VITE_BLOG_API_BASE_URL=https://bellameng.com/api`, then redeploy that Pages project. The admin app reads this value at build time. Keep its build output and existing Pages project so drafts and published posts continue using the same Worker and D1 database.
4. Check `https://admin.bellameng.com` can log in and list posts. After the new domain works, add a redirect from `admin.pixattica.com` if desired. Keep the old API routes until all old clients stop using them.

On a fresh database, `blog-api` seeds one placeholder published post so `blogs.app` is not empty on first run.

## Creating a New App

1. Copy `apps/_template` to `apps/<new-app-name>`
2. Update `name` in `package.json` to `@pixattica/<new-app-name>`
3. Run `pnpm install` from the root

## Cloudflare Pages

The landing site shows the “What’s in My Bag” page by default. Set `VITE_OS_LANDING=true` when
building the landing app to show the OS interface instead. The flag is resolved at build time.
The laptop opens the web CV at `/cv`, and the book opens the ratings page at `/books`.
Replace `apps/landing/src/assets/bag/book-cover.jpeg` to update the book cover.

To deploy the public site and the reading slideshow together at `bellameng.com/` and `bellameng.com/reading`, use:

- Build command: `pnpm build:site`
- Output directory: `dist`

`build:site` assembles `apps/landing/dist` at the site root and mounts `apps/reading/dist` under `dist/reading/`.
