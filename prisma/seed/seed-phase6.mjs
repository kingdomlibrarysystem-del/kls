/**
 * One-off Phase 6 seed script: populates the real ResearchProject,
 * ProjectMember, and ResearchPaper collections from this app's current
 * mock data. Contributor names are resolved to real Users by
 * upsert-by-derived-email (several already exist as real Users from
 * Phase 3/4/5's own seeds — e.g. "Pastor Emmanuel Rugamba" and "Dr.
 * Alice Mutoni" are both real contributors from Phase 4's Publishing
 * seed — so this reuses those exact User rows rather than creating
 * duplicates, matching the same person across modules).
 *
 * Run via `npx tsx prisma/seed/seed-phase6.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const projects = [
  { title: 'Faith & Technology in Rural Rwanda', description: 'Exploring how digital tools shape discipleship and community life in rural congregations.', status: 'ACTIVE', startDate: '2026-02-10', contributors: ['Dr. Alice Mutoni', 'Elder Samuel Byiringiro', 'Pastor Emmanuel Rugamba'] },
  { title: 'Discipleship Retention Among Youth', description: 'A longitudinal study on what keeps young adults engaged in discipleship programs.', status: 'ACTIVE', startDate: '2026-03-01', contributors: ['Elder Samuel Byiringiro', 'Grace Mukamana'] },
  { title: 'Oral History of the East African Revival', description: 'Recording and archiving first-hand accounts from the mid-20th century revival movement.', status: 'COMPLETED', startDate: '2025-09-15', contributors: ['Pastor Emmanuel Rugamba', 'David Ndayisenga', 'Sarah Uwase'] },
  { title: 'Mental Health Stigma in Faith Communities', description: 'Suspended pending additional ethics review before data collection can resume.', status: 'SUSPENDED', startDate: '2025-11-20', contributors: ['Grace Mukamana'] },
]

const papers = [
  { title: 'Faith and Resilience in Rural Communities', abstract: 'This paper examines how faith practices contribute to psychological and communal resilience in rural congregations facing socioeconomic hardship, drawing on interviews conducted across three districts.', author: 'Dr. Alice Mutoni', project: 'Faith & Technology in Rural Rwanda', keywords: ['faith', 'resilience', 'rural ministry'], publishedAt: '2026-04-20', status: 'PUBLISHED' },
  { title: 'Digital Tools for Discipleship Retention', abstract: 'A study of mobile-first discipleship curricula and their measurable effect on youth program retention over a two-year period.', author: 'Elder Samuel Byiringiro', project: 'Discipleship Retention Among Youth', keywords: ['technology', 'discipleship', 'youth'], publishedAt: '2026-05-14', status: 'PUBLISHED' },
  { title: 'Voices of the Revival: An Oral History Study', abstract: 'First-hand testimonies from surviving participants of the East African Revival, transcribed and archived with thematic analysis of recurring spiritual motifs.', author: 'Pastor Emmanuel Rugamba', project: 'Oral History of the East African Revival', keywords: ['oral history', 'revival', 'east africa'], publishedAt: '2026-06-02', status: 'PUBLISHED' },
]

async function main() {
  console.log('Clearing existing ResearchProject/ProjectMember/ResearchPaper collections...')
  await prisma.researchPaper.deleteMany({})
  await prisma.projectMember.deleteMany({})
  await prisma.researchProject.deleteMany({})

  const allContributors = [...new Set(projects.flatMap((p) => p.contributors))]
  console.log(`Resolving ${allContributors.length} contributors to real Users (upsert by email — reusing any User already seeded by an earlier phase)...`)
  const nameToUserId = new Map()
  for (const name of allContributors) {
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@contributors.example.com`
    const [firstName, ...rest] = name.trim().split(/\s+/)
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, firstName, lastName: rest.join(' '), email },
    })
    nameToUserId.set(name, user.id)
  }

  console.log(`Seeding ${projects.length} research projects...`)
  const titleToProjectId = new Map()
  for (const p of projects) {
    const created = await prisma.researchProject.create({
      data: {
        title: p.title,
        description: p.description,
        status: p.status,
        startDate: new Date(p.startDate),
        members: { create: p.contributors.map((name) => ({ userId: nameToUserId.get(name) })) },
      },
    })
    titleToProjectId.set(p.title, created.id)
  }

  console.log(`Seeding ${papers.length} research papers...`)
  for (const paper of papers) {
    const projectId = titleToProjectId.get(paper.project)
    if (!projectId) {
      throw new Error(`Paper "${paper.title}" references unknown project "${paper.project}"`)
    }
    await prisma.researchPaper.create({
      data: {
        title: paper.title,
        abstract: paper.abstract,
        authorId: nameToUserId.get(paper.author),
        authorName: paper.author,
        projectId,
        keywords: paper.keywords,
        publishedAt: new Date(paper.publishedAt),
        status: paper.status,
      },
    })
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.researchProject.count(),
    prisma.projectMember.count(),
    prisma.researchPaper.count(),
  ])
  console.log(`Done. User: ${counts[0]}, ResearchProject: ${counts[1]}, ProjectMember: ${counts[2]}, ResearchPaper: ${counts[3]}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
