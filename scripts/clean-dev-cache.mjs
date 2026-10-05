// `npm run dev:clean` — deletes the dev server's cache (.next/dev) and starts
// `next dev` fresh.
//
// Use it when the dev server misbehaves in ways the source code can't explain:
//   - pages or API routes that exist return the 404 page (e.g. /auth/login,
//     /api/auth/session -> next-auth "Unexpected token '<'" errors);
//   - newly added/removed routes are not picked up;
//   - type errors pointing into .next/dev/types/*.
// Cause: Turbopack's persistent dev cache in .next/dev/cache went stale or
// corrupt (it had grown to 7.2 GB here). It is only a cache — Next rebuilds
// it; the first page loads after a clean are slower.
//
// Stop any running dev server first: Windows can't delete files it has open.
import { rmSync } from 'node:fs'

try {
  rmSync('.next/dev', { recursive: true, force: true })
  console.log('dev:clean: removed .next/dev (dev cache)')
} catch (err) {
  console.error('dev:clean: could not remove .next/dev — is a dev server still running? Stop it and try again.')
  console.error(String(err?.message ?? err))
  process.exit(1)
}
