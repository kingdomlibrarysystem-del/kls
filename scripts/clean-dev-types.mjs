// Runs automatically before `npm run build` (the "prebuild" script).
//
// `next dev` writes generated type files to .next/dev/types (routes.d.ts,
// validator.ts, ...), and tsconfig.json includes that folder, so
// `next build` type-checks them too. Those files are sometimes left
// half-written/corrupted by the dev server (e.g. a stray "Route]>" after the
// end of routes.d.ts), which then fails the production build with a
// "Type error" in a file that isn't source code.
//
// They are a dev-only cache: deleting them is safe — the dev server
// regenerates them, and the production build generates its own copy under
// .next/types.
import { rmSync } from 'node:fs'

rmSync('.next/dev/types', { recursive: true, force: true })
console.log('prebuild: cleared .next/dev/types (dev-only generated types)')
