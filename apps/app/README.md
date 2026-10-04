# Rawan author workspace

Next.js private author workspace connected to the real NestJS API. Register, sign in, manage the Project → Book → Chapter → Scene hierarchy, and save plain-text scene content. The public website is a separate application and is unchanged.

Install dependencies and configure the backend from the [monorepo README](../../README.md). From the monorepo root:

```sh
pnpm --filter @rawan/app dev
pnpm --filter @rawan/app build
pnpm --filter @rawan/app lint
pnpm --filter @rawan/app typecheck
pnpm --filter @rawan/app test
pnpm --filter @rawan/app test:session
```

The development server uses `http://localhost:3001`. Copy `.env.example` to `.env.local` only if the destination does not exist. `API_URL` is a server-only variable containing the complete API base URL, including `/api/v1`. Development defaults to `http://localhost:3002/api/v1`; production requires explicit configuration. This is intentionally not a `NEXT_PUBLIC_*` variable: the browser communicates with Next.js Server Actions, while Next.js forwards requests to NestJS. Remote production API connections require HTTPS; loopback HTTP is permitted for API processes on the same host. The author application itself must use HTTPS in production.

The API still needs its existing `DATABASE_URL` and `JWT_SECRET` configuration and deployed migrations. Do not put either secret in this app's environment. Build shared packages before running this app independently on a fresh checkout (`pnpm --filter @rawan/types build`); root `pnpm dev` handles dependency builds automatically.

See [author experience implementation notes](../../docs/author-experience.md) for routes, session/security details, file inventory, verification results and the manual live-flow checklist. Next.js root resolution remains relative to the monorepo checkout and works on Windows and Linux.
