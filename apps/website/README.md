# Rawan public website

Next.js public website, currently at the starter-page stage.

Install dependencies and configure the backend from the [monorepo README](../../README.md). From the monorepo root:

```sh
pnpm --filter @rawan/website dev
pnpm --filter @rawan/website build
pnpm --filter @rawan/website lint
pnpm --filter @rawan/website typecheck
```

The development server uses `http://localhost:3000`. This application currently has no required environment variables. Next.js root resolution is relative to the monorepo checkout and works on Windows and Linux.
