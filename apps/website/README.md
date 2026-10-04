# Rawan public website

Next.js public homepage with a dark editorial hero, a static workspace concept, three product ideas, and a closing CTA/footer. All navigation stays on the homepage. Writing and sign-in links lead to a coming-soon note; there is no API or authentication integration.

Install dependencies and configure the backend from the [monorepo README](../../README.md). From the monorepo root:

```sh
pnpm --filter @rawan/website dev
pnpm --filter @rawan/website build
pnpm --filter @rawan/website lint
pnpm --filter @rawan/website typecheck
```

The development server uses `http://localhost:3000`. This application currently has no required environment variables. Next.js root resolution is relative to the monorepo checkout and works on Windows and Linux. Responsive styles simplify the static preview on mobile, and motion respects the visitor's reduced-motion preference.
