import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', '.claude'],
    // Integration tests hit a real remote MongoDB Atlas cluster (no local test DB exists — see PROGRESS.md's testing section) — real network round trips need more headroom than Vitest's 5s default.
    testTimeout: 20_000,
  },
})
