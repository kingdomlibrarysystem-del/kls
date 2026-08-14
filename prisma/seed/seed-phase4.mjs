/**
 * One-off Phase 4 seed script: populates the real Publication and
 * RevenueShare collections from this app's current mock data, plus
 * placeholder User documents for each distinct contributor name found
 * (same technique as seed-phase3.mjs — the real User collection has no
 * row for these contributor personas, since auth is still fully mocked).
 *
 * mockSubmissions (review-data.ts) and mockCatalog (catalog-data.ts) are
 * two separate mock arrays that are NOT 1:1 by id, but several rows do
 * share the same title (e.g. "Walking in Covenant" is both pub-001 and
 * cat-001). Where a submission's title matches a catalog title, price/
 * quantity/bindingType/mediaType/featured are merged onto the resulting
 * PUBLISHED Publication row. Catalog-only rows (translated editions with
 * no matching submission, e.g. "Marcher dans l'Alliance") are seeded as
 * their own already-PUBLISHED Publication rows with a synthetic
 * contributor-only submission history, since every real catalog entry
 * must be a Publication now (there is no separate catalog model).
 * mockRevenue rows are matched to their Publication by title and become
 * that Publication's RevenueShare row (approve-time side effect in the
 * real API, but here simply seeded directly since these are historical
 * mock rows, not live approvals).
 *
 * Run via `npx tsx prisma/seed/seed-phase4.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const submissions = [
  { title: 'Walking in Covenant', contributor: 'Pastor Emmanuel Rugamba', category: 'Theology', submittedAt: '2026-06-02', status: 'SUBMITTED', language: 'EN', coverImage: '/images/book-A.jpg', description: 'A study of covenant relationship and what it means to walk faithfully within it, drawing on Kingdom Foundation principles.' },
  { title: 'Raising Kingdom Families', contributor: 'Dr. Alice Mutoni', category: 'Family & Marriage', submittedAt: '2026-06-05', status: 'UNDER_REVIEW', language: 'EN', coverImage: '/images/book-B.jpg', description: 'Biblical foundations for raising children with Kingdom identity and purpose in a modern context.' },
  { title: 'The Discipleship Journey', contributor: 'Elder Samuel Byiringiro', category: 'Discipleship', submittedAt: '2026-06-10', status: 'SUBMITTED', language: 'EN', coverImage: '/images/book-C.jpg', description: 'A practical guide to walking with new believers from first steps of faith to mature discipleship.' },
  { title: 'Leading with Humility', contributor: 'Pastor Emmanuel Rugamba', category: 'Leadership', submittedAt: '2026-06-14', status: 'UNDER_REVIEW', language: 'EN', coverImage: '/images/book-A.jpg', description: 'On servant leadership and why humility, not position, is the true measure of Kingdom authority.' },
  { title: 'Voices of the Revival', contributor: 'Pastor Emmanuel Rugamba', category: 'History', submittedAt: '2026-04-28', status: 'APPROVED', language: 'EN', coverImage: '/images/book-B.jpg', description: 'Oral histories and testimonies gathered from a season of revival, preserved for future generations.' },
  { title: 'The Weight of Servant Leadership', contributor: 'Pastor Emmanuel Rugamba', category: 'Leadership', submittedAt: '2026-03-10', status: 'PUBLISHED', language: 'EN', coverImage: '/images/book-C.jpg', description: 'A deeper look at the cost and calling of leading others through service rather than status.' },
]

const catalog = [
  { title: 'Walking in Covenant', contributor: 'Pastor Emmanuel Rugamba', language: 'EN', coverImage: '/images/book-A.jpg', description: 'A study of covenant relationship and what it means to walk faithfully within it, drawing on Kingdom Foundation principles.', featured: true, bindingType: 'HARD', mediaType: 'TEXT', price: 6500, quantity: 24, category: 'Theology' },
  { title: "Marcher dans l'Alliance", contributor: 'Pastor Emmanuel Rugamba', language: 'FR', coverImage: '/images/book-A.jpg', description: "Une étude de la relation d'alliance et de ce que signifie y marcher fidèlement.", featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 6500, quantity: 15, category: 'Theology' },
  { title: "Kurera Imiryango y'Ubwami", contributor: 'Dr. Alice Mutoni', language: 'RW', coverImage: '/images/book-B.jpg', description: "Inyigisho ku burere bw'imiryango ishingiye ku mahame y'Ubwami.", featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 5000, quantity: 0, category: 'Family & Marriage' },
  { title: 'The Discipleship Journey', contributor: 'Elder Samuel Byiringiro', language: 'EN', coverImage: '/images/book-C.jpg', description: 'A practical guide to walking with new believers from first steps of faith to mature discipleship.', featured: true, bindingType: 'HARD', mediaType: 'COMBINATION', price: 7000, quantity: 18, category: 'Discipleship' },
  { title: 'Leading with Humility', contributor: 'Pastor Emmanuel Rugamba', language: 'EN', coverImage: '/images/book-B.jpg', description: 'On servant leadership and why humility, not position, is the true measure of Kingdom authority.', featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 5500, quantity: 30, category: 'Leadership' },
  { title: 'La Discipline Spirituelle', contributor: 'Dr. Alice Mutoni', language: 'FR', coverImage: '/images/book-C.jpg', description: "Un guide sur les disciplines spirituelles essentielles à la croissance chrétienne.", featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 5000, quantity: 0, category: 'Discipleship' },
]

const revenueRows = [
  { title: 'Walking in Covenant', contributorShare: 70, platformShare: 30, totalRevenue: 245000 },
  { title: 'Raising Kingdom Families', contributorShare: 65, platformShare: 35, totalRevenue: 182500 },
  { title: 'The Discipleship Journey', contributorShare: 70, platformShare: 30, totalRevenue: 96000 },
  { title: 'Leading with Humility', contributorShare: 70, platformShare: 30, totalRevenue: 138000 },
  { title: 'The Weight of Servant Leadership', contributorShare: 65, platformShare: 35, totalRevenue: 176000 },
]

async function main() {
  console.log('Clearing existing Publication/RevenueShare collections, and Resources created from a prior Phase 4 seed run...')
  await prisma.resource.deleteMany({ where: { publisher: 'Kingdom Library System' } })
  await prisma.revenueShare.deleteMany({})
  await prisma.publication.deleteMany({})

  const allContributors = [...new Set([...submissions, ...catalog].map((r) => r.contributor))]
  console.log(`Seeding ${allContributors.length} placeholder contributor Users...`)
  const contributorEmails = new Map(allContributors.map((name) => [name, `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@contributors.example.com`]))
  await prisma.user.deleteMany({ where: { email: { in: [...contributorEmails.values()] } } })
  const nameToUserId = new Map()
  for (const name of allContributors) {
    const [firstName, ...rest] = name.trim().split(/\s+/)
    const created = await prisma.user.create({
      data: { name, firstName, lastName: rest.join(' '), email: contributorEmails.get(name) },
    })
    nameToUserId.set(name, created.id)
  }

  // Rows present in both submissions and catalog merge into one PUBLISHED Publication.
  const catalogByTitle = new Map(catalog.map((c) => [c.title, c]))
  const submissionTitles = new Set(submissions.map((s) => s.title))

  console.log(`Seeding ${submissions.length} publications from the review queue mock...`)
  const titleToPublicationId = new Map()
  for (const s of submissions) {
    const match = catalogByTitle.get(s.title)
    const created = await prisma.publication.create({
      data: {
        title: s.title,
        contributorId: nameToUserId.get(s.contributor),
        contributorName: s.contributor,
        category: s.category,
        language: s.language,
        coverImage: s.coverImage,
        description: s.description,
        status: s.status,
        submittedAt: new Date(s.submittedAt),
        featured: match?.featured ?? false,
        bindingType: match?.bindingType ?? null,
        mediaType: match?.mediaType ?? null,
        price: match?.price ?? null,
        quantity: match?.quantity ?? null,
      },
    })
    titleToPublicationId.set(s.title, created.id)
  }

  const catalogOnly = catalog.filter((c) => !submissionTitles.has(c.title))
  console.log(`Seeding ${catalogOnly.length} catalog-only publications (translated editions with no matching submission)...`)
  for (const c of catalogOnly) {
    const created = await prisma.publication.create({
      data: {
        title: c.title,
        contributorId: nameToUserId.get(c.contributor),
        contributorName: c.contributor,
        category: c.category,
        language: c.language,
        coverImage: c.coverImage,
        description: c.description,
        status: 'PUBLISHED',
        featured: c.featured,
        bindingType: c.bindingType,
        mediaType: c.mediaType,
        price: c.price,
        quantity: c.quantity,
      },
    })
    titleToPublicationId.set(c.title, created.id)
  }

  console.log(`Seeding ${revenueRows.length} revenue shares...`)
  for (const r of revenueRows) {
    const publicationId = titleToPublicationId.get(r.title)
    if (!publicationId) {
      console.warn(`  Skipping revenue row for "${r.title}" — no matching publication found.`)
      continue
    }
    const publication = await prisma.publication.findUnique({ where: { id: publicationId } })
    // mockRevenue (the original mock) has a row for "The Discipleship
    // Journey" even though mockSubmissions shows it still SUBMITTED, not
    // PUBLISHED — a pre-existing inconsistency in the mock data itself.
    // A RevenueShare only makes sense for an actually-published title
    // (the real API only ever creates one at approval time), so this
    // skips seeding one for a not-yet-published row rather than
    // reproducing that inconsistency in the real database.
    if (publication.status !== 'PUBLISHED') {
      console.warn(`  Skipping revenue row for "${r.title}" — publication status is ${publication.status}, not PUBLISHED (mock data inconsistency, not reproduced here).`)
      continue
    }
    await prisma.revenueShare.create({
      data: { publicationId, contributorShare: r.contributorShare, platformShare: r.platformShare, totalRevenue: r.totalRevenue },
    })
  }

  const userCount = await prisma.user.count()
  const publicationCount = await prisma.publication.count()
  const revenueCount = await prisma.revenueShare.count()
  console.log(`Done. User count: ${userCount}, Publication count: ${publicationCount}, RevenueShare count: ${revenueCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
