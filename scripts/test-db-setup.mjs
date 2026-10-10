// Creates/updates the collections and indexes of the TEST database
// (TEST_DATABASE_URL in .env) so the integration tests can run against it.
// Same safety rule as prisma/client.tsx: refuses anything that looks like
// production. Usage: npm run test:db-setup
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

function readEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  try {
    const line = readFileSync('.env', 'utf8').split(/\r?\n/).find((l) => l.trim().startsWith(`${name}=`))
    return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
}

const url = readEnv('TEST_DATABASE_URL')
const main = readEnv('DATABASE_URL')
const dbName = (url.split('?')[0].split('/').pop() ?? '').toLowerCase()
if (!url || url === main || !dbName || dbName.includes('prod')) {
  console.error('TEST_DATABASE_URL must be set in .env to a separate test database (e.g. ...mongodb.net/kls_db_test), never production.')
  process.exit(1)
}

console.log(`Pushing the Prisma schema to the test database "${dbName}"…`)
const result = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
})
process.exit(result.status ?? 1)
