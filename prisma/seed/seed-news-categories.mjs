/**
 * One-off seed for the NewsArticleCategory collection — populates the
 * category vocabulary that the admin /dashboard/news/categories page and the
 * Add/Edit Article category dropdown read from the real collection. These
 * are the default categories a church newsroom needs; an admin can add,
 * rename or remove freely from then on (renames propagate to the articles
 * carrying the old name).
 *
 * Run via `npx tsx prisma/seed/seed-news-categories.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaults = [
  { name: 'Announcement', color: '#f59e0b' },
  { name: 'General',      color: '#3b82f6' },
  { name: 'Events',       color: '#8b5cf6' },
  { name: 'Spiritual',    color: '#10b981' },
  { name: 'Devotional',   color: '#f97316' },
  { name: 'Prayer',       color: '#6366f1' },
  { name: 'Testimony',    color: '#ec4899' },
  { name: 'Ministry',     color: '#14b8a6' },
  { name: 'Youth',        color: '#22c55e' },
  { name: 'Family',       color: '#06b6d4' },
  { name: 'Editorial',    color: '#a855f7' },
  { name: 'Publishing',   color: '#ef4444' },
]

async function main() {
  for (const { name, color } of defaults) {
    await prisma.newsArticleCategory.upsert({
      where: { name },
      update: { color },
      create: { name, color },
    })
  }
  const count = await prisma.newsArticleCategory.count()
  console.log(`Done. NewsArticleCategory: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })