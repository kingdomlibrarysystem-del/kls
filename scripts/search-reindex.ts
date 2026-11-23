/**
 * Rebuilds the whole site-search index (SearchDocument) from the library:
 * published books (their written chapters or the text of their PDF / Word
 * file, page by page), Life Sciences books, published news articles, and
 * published courses with their lessons. Run it once after setting up search
 * and whenever the index looks out of date; after that, every save updates
 * its own rows (lib/search/indexer.ts → reindexSoon).
 *
 *   npm run search:reindex
 *
 * Uses DATABASE_URL from .env.
 */
import prisma from '@/prisma/client'
import { reindexAll } from '@/lib/search/indexer'

async function main() {
  const started = Date.now()
  const result = await reindexAll((line) => console.log(line))
  console.log(`\nDone in ${Math.round((Date.now() - started) / 1000)} s: ${result.sources} sources, ${result.rows} rows${result.failed ? `, ${result.failed} failed` : ''}.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
