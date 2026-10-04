# Rawan author workspace

Next.js author dashboard/workspace, currently at the starter-page stage.

Install dependencies and configure the backend from the [monorepo README](../../README.md). From the monorepo root:

```sh
pnpm --filter @rawan/app dev
pnpm --filter @rawan/app build
pnpm --filter @rawan/app lint
pnpm --filter @rawan/app typecheck
```

The development server uses `http://localhost:3001`. This application currently has no required environment variables. Next.js root resolution is relative to the monorepo checkout and works on Windows and Linux.
