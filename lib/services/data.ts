import { unstable_cache } from 'next/cache'
import prisma from '@/prisma/client'
import type { LifeArea, ServiceProgram } from '@prisma/client'
import type { LifeAreaItem, ServiceNavItem, ServiceProgramItem } from './shared'

/**
 * Service programmes and life areas. The four programmes and six life areas
 * of the Kingdom Library overview are seeded ONCE when the tables are empty
 * (bootstrap data, same pattern as media types); afterwards admins manage
 * everything at /dashboard/services.
 */
const SEED_PROGRAMS: Omit<ServiceProgram, 'id' | 'createdAt' | 'updatedAt' | 'active'>[] = [
  {
    slug: 'health-system', name: 'Health System', tagline: 'Understand health. Protect life.', icon: 'heart-pulse', color: 'blue', image: null, sortOrder: 1,
    description: 'Practical health knowledge for individuals and families — how the body and mind work, how to prevent disease, and where to get the right care.',
    keyServices: ['Health education & disease prevention', 'Nutrition & healthy lifestyle', 'Medicine use & safety education', 'Mental & emotional well-being', 'Health system guidance & referrals'],
    ctaLabel: 'Explore health resources', ctaHref: '/member/care/resources',
  },
  {
    slug: 'beauty', name: 'Beauty', tagline: 'Care for your skin. Renew your confidence.', icon: 'sparkles', color: 'gold', image: null, sortOrder: 2,
    description: 'Skin health education, personal care guidance and trusted beauty and personal care products you can order online.',
    keyServices: ['Skin health education', 'Personal care & skincare guidance', 'Beauty & personal care products', 'Healthy self-care and confidence'],
    ctaLabel: 'Shop beauty products', ctaHref: '/shop',
  },
  {
    slug: 'consultation-counseling', name: 'Consultation & Counseling', tagline: 'Understand your challenges. Find a path forward.', icon: 'messages', color: 'green', image: null, sortOrder: 3,
    description: 'Talk to a qualified counselor by phone, video or in person about personal, family, health or leadership challenges.',
    keyServices: ['Personal development consultation', 'Family & relationship support', 'Health & addiction counseling', 'Management & leadership guidance', 'Kubora assessment & restoration education'],
    ctaLabel: 'Talk to a counselor', ctaHref: '/member/care/counseling',
  },
  {
    slug: 'rehabilitation', name: 'Rehabilitation', tagline: 'Restore your life. Rebuild your future.', icon: 'person-standing', color: 'purple', image: null, sortOrder: 4,
    description: 'A guided recovery programme with support groups, life skills and reintegration into family, work and society.',
    keyServices: ['Recovery support & relapse prevention', 'Emotional & behavioral restoration', 'Life skills & personal development', 'Family restoration & support', 'Vocational training & reintegration'],
    ctaLabel: 'Start your recovery', ctaHref: '/member/care/rehabilitation',
  },
]

const SEED_AREAS: Omit<LifeArea, 'id' | 'createdAt' | 'updatedAt' | 'active'>[] = [
  { name: 'Life', description: 'Understand existence, design and purpose.', icon: 'tree', color: 'green', sortOrder: 1 },
  { name: 'Health', description: 'Learn how the body and mind function.', icon: 'heart-pulse', color: 'blue', sortOrder: 2 },
  { name: 'Management', description: 'Practice stewardship and responsible action.', icon: 'cog', color: 'gold', sortOrder: 3 },
  { name: 'Corruption', description: 'Identify destructive patterns and disconnection from truth.', icon: 'link-off', color: 'red', sortOrder: 4 },
  { name: 'Restoration', description: 'Recover, renew and realign.', icon: 'heart-handshake', color: 'teal', sortOrder: 5 },
  { name: 'Reintegration', description: 'Apply what is restored to family, work and society.', icon: 'users', color: 'purple', sortOrder: 6 },
]

let seeding: Promise<void> | null = null

/**
 * Writes the overview's programmes / areas when a table is empty. The first
 * page load runs several loaders at once (header menu, page, home section);
 * they all wait for ONE seeding run instead of each inserting the rows — that
 * race once created 6 copies of a programme and 8 of each life area. Each row
 * is also only created when its slug / name is missing, and ServiceProgram.slug
 * / LifeArea.name are unique in the schema as a last guard.
 */
export function ensureServiceSeed(): Promise<void> {
  seeding ??= (async () => {
    const [programs, areas] = await Promise.all([prisma.serviceProgram.count(), prisma.lifeArea.count()])
    if (programs === 0) {
      for (const p of SEED_PROGRAMS) {
        if (!(await prisma.serviceProgram.findFirst({ where: { slug: p.slug }, select: { id: true } }))) await prisma.serviceProgram.create({ data: p })
      }
    }
    if (areas === 0) {
      for (const a of SEED_AREAS) {
        if (!(await prisma.lifeArea.findFirst({ where: { name: a.name }, select: { id: true } }))) await prisma.lifeArea.create({ data: a })
      }
    }
  })().catch((e) => { seeding = null; throw e })
  return seeding
}

export const serializeProgram = (p: ServiceProgram): ServiceProgramItem => ({
  id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, description: p.description, image: p.image, icon: p.icon, color: p.color,
  keyServices: p.keyServices, ctaLabel: p.ctaLabel, ctaHref: p.ctaHref, sortOrder: p.sortOrder, active: p.active,
})
export const serializeArea = (a: LifeArea): LifeAreaItem => ({ id: a.id, name: a.name, description: a.description, icon: a.icon, color: a.color, sortOrder: a.sortOrder, active: a.active })

/** Everything (incl. hidden) for the admin page. */
export async function listAllServices(): Promise<{ programs: ServiceProgramItem[]; areas: LifeAreaItem[] }> {
  await ensureServiceSeed()
  const [programs, areas] = await Promise.all([
    prisma.serviceProgram.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.lifeArea.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ])
  return { programs: programs.map(serializeProgram), areas: areas.map(serializeArea) }
}

async function publicServices() {
  await ensureServiceSeed()
  const [programs, areas] = await Promise.all([
    prisma.serviceProgram.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.lifeArea.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ])
  return { programs: programs.map(serializeProgram), areas: areas.map(serializeArea) }
}

/** Visible programmes + areas, cached 5 minutes; admin saves expire the 'services' tag immediately. */
export const getPublicServices = unstable_cache(publicServices, ['public-services'], { revalidate: 300, tags: ['services'] })

/** The header menu: just names/links (cached with the same tag). */
export const getServicesNav = unstable_cache(
  async (): Promise<ServiceNavItem[]> => (await publicServices()).programs.map(({ slug, name, tagline, icon, color }) => ({ slug, name, tagline, icon, color })),
  ['services-nav'],
  { revalidate: 300, tags: ['services'] },
)

export async function getProgramBySlug(slug: string): Promise<ServiceProgramItem | null> {
  const { programs } = await getPublicServices()
  return programs.find((p) => p.slug === slug) ?? null
}

/** Call after any admin change so header, home page and /services refresh at once. */
export async function expireServicesCache(): Promise<void> {
  try { (await import('next/cache')).revalidateTag('services', { expire: 0 }) } catch { /* outside a request (tests) */ }
}
