/**
 * One-time (safe to re-run): creates the Atlas Search index "site_search"
 * on the SearchDocument collection, used by lib/search/query.ts. Without it
 * the site search still works, but only as a plain word match (no typo
 * tolerance, no word forms, no ranking by relevance).
 *
 *   npm run search:setup
 *
 * Atlas builds the index in the background (a minute or two); `status`
 * below turns READY when it can be used. Needs MongoDB Atlas (any tier;
 * the free M0 tier allows 3 search indexes).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const NAME = 'site_search'
const definition = {
  mappings: {
    dynamic: false,
    fields: {
      // Plain words, plus English and French word forms (corrupt / corruption / corrompu…).
      text: {
        type: 'string',
        analyzer: 'lucene.standard',
        multi: {
          english: { type: 'string', analyzer: 'lucene.english' },
          french: { type: 'string', analyzer: 'lucene.french' },
        },
      },
      title: { type: 'string', analyzer: 'lucene.standard' },
      sourceType: { type: 'token' },
    },
  },
}

// The collection must exist before Atlas can index it.
try { await prisma.$runCommandRaw({ create: 'SearchDocument' }) } catch { /* already there */ }

const existing = await prisma.searchDocument.aggregateRaw({ pipeline: [{ $listSearchIndexes: { name: NAME } }] })
if (existing.length > 0) {
  await prisma.$runCommandRaw({ updateSearchIndex: 'SearchDocument', name: NAME, definition })
  console.log(`Updated the search index "${NAME}".`)
} else {
  await prisma.$runCommandRaw({ createSearchIndexes: 'SearchDocument', indexes: [{ name: NAME, definition }] })
  console.log(`Created the search index "${NAME}".`)
}
const [index] = await prisma.searchDocument.aggregateRaw({ pipeline: [{ $listSearchIndexes: { name: NAME } }] })
console.log(`Status: ${index?.status ?? 'unknown'} (READY means it is in use).`)
await prisma.$disconnect()
