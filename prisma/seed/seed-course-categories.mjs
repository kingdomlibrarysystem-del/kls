/**
 * One-off seed for the CourseCategory collection — populates the category
 * vocabulary that the admin Add/Edit Course category dropdown and the
 * /dashboard/e-learning/categories management page read from the real
 * CourseCategory collection. These are exactly the categories the (now
 * removed) hardcoded `courseCategories` const tuple used to expose, so
 * existing courses' `category` strings continue to match a selectable
 * option on first load; an admin can add/rename/remove freely from then on.
 *
 * Run via `npx tsx prisma/seed/seed-course-categories.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaults = [
  'Theology',
  'Discipleship',
  'Leadership',
  'Family & Marriage',
  'Youth Ministry',
  'Missions',
]

async function main() {
  for (const name of defaults) {
    await prisma.courseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  const count = await prisma.courseCategory.count()
  console.log(`Done. CourseCategory: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
