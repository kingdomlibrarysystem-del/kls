import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Only TEST_DATABASE_URL is forwarded from .env: prisma/client.tsx connects to
// it (and nothing else) while tests run, and refuses a production database.
const env = loadEnv('test', process.cwd(), '')

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', '.claude'],
    env: { TEST_DATABASE_URL: env.TEST_DATABASE_URL ?? '' },
    // Integration tests hit a real remote MongoDB Atlas TEST database — real network round trips need more headroom than Vitest's 5s default.
    testTimeout: 20_000,
  },
})
