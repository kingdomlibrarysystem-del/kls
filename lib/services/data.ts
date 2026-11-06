import { unstable_cache } from 'next/cache'
import prisma from '@/prisma/client'
import type { LifeArea, ServiceOffering, ServiceProgram } from '@prisma/client'
import { slugify, type LifeAreaItem, type ServiceNavItem, type ServiceOfferingItem, type ServiceProgramItem } from './shared'

/**
 * Service programmes and life areas. The four programmes and six life areas
 * of the Kingdom Library overview are seeded ONCE when the tables are empty
 * (bootstrap data, same pattern as media types); afterwards admins manage
 * everything at /dashboard/services.
 */
const SEED_PROGRAMS: Omit<ServiceProgram, 'id' | 'createdAt' | 'updatedAt' | 'active'>[] = [
  {
    slug: 'health-system', name: 'Health System', tagline: 'Understand health. Protect life.', icon: 'heart-pulse', color: 'ink', image: null, sortOrder: 1,
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
    slug: 'consultation-counseling', name: 'Consultation & Counseling', tagline: 'Understand your challenges. Find a path forward.', icon: 'messages', color: 'espresso', image: null, sortOrder: 3,
    description: 'Talk to a qualified counselor by phone, video or in person about personal, family, health or leadership challenges.',
    keyServices: ['Personal development consultation', 'Family & relationship support', 'Health & addiction counseling', 'Management & leadership guidance', 'Kubora assessment & restoration education'],
    ctaLabel: 'Talk to a counselor', ctaHref: '/member/care/counseling',
  },
  {
    slug: 'rehabilitation', name: 'Rehabilitation', tagline: 'Restore your life. Rebuild your future.', icon: 'person-standing', color: 'bronze', image: null, sortOrder: 4,
    description: 'A guided recovery programme with support groups, life skills and reintegration into family, work and society.',
    keyServices: ['Recovery support & relapse prevention', 'Emotional & behavioral restoration', 'Life skills & personal development', 'Family restoration & support', 'Vocational training & reintegration'],
    ctaLabel: 'Start your recovery', ctaHref: '/member/care/rehabilitation',
  },
]

const SEED_AREAS: Omit<LifeArea, 'id' | 'createdAt' | 'updatedAt' | 'active'>[] = [
  { name: 'Life', description: 'Understand existence, design and purpose.', icon: 'tree', color: 'espresso', sortOrder: 1 },
  { name: 'Health', description: 'Learn how the body and mind function.', icon: 'heart-pulse', color: 'ink', sortOrder: 2 },
  { name: 'Management', description: 'Practice stewardship and responsible action.', icon: 'cog', color: 'gold', sortOrder: 3 },
  { name: 'Corruption', description: 'Identify destructive patterns and disconnection from truth.', icon: 'link-off', color: 'bronze', sortOrder: 4 },
  { name: 'Restoration', description: 'Recover, renew and realign.', icon: 'heart-handshake', color: 'espresso', sortOrder: 5 },
  { name: 'Reintegration', description: 'Apply what is restored to family, work and society.', icon: 'users', color: 'bronze', sortOrder: 6 },
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
    await migrateKeyServices()
  })().catch((e) => { seeding = null; throw e })
  return seeding
}

/**
 * Turns each programme's old "key services" text list into real sub-services
 * (ServiceOffering rows, all three ways to get help), then empties the list —
 * so this runs once per programme and a sub-service an admin deletes later
 * never comes back.
 */
async function migrateKeyServices(): Promise<void> {
  const legacy = await prisma.serviceProgram.findMany({ where: { keyServices: { isEmpty: false } }, select: { id: true, keyServices: true } })
  for (const p of legacy) {
    for (const [i, name] of p.keyServices.entries()) {
      const slug = slugify(name) || `service-${i + 1}`
      const exists = await prisma.serviceOffering.findFirst({ where: { programId: p.id, slug }, select: { id: true } })
      if (!exists) {
        await prisma.serviceOffering.create({
          data: { programId: p.id, slug, name, summary: name, channels: ['CALL', 'MESSAGE', 'MEETING'], productIds: [], sortOrder: i + 1 },
        }).catch((e) => { if ((e as { code?: string }).code !== 'P2002') throw e })
      }
    }
    await prisma.serviceProgram.update({ where: { id: p.id }, data: { keyServices: [] } })
  }
}

export const serializeOffering = (o: ServiceOffering): ServiceOfferingItem => ({
  id: o.id, programId: o.programId, slug: o.slug, name: o.name, summary: o.summary, description: o.description, image: o.image,
  channels: o.channels, productIds: o.productIds, priceNote: o.priceNote, sortOrder: o.sortOrder, active: o.active,
})

export const serializeProgram = (p: ServiceProgram, offerings: ServiceOffering[] = []): ServiceProgramItem => ({
  id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, description: p.description, image: p.image, icon: p.icon, color: p.color,
  keyServices: p.keyServices, ctaLabel: p.ctaLabel, ctaHref: p.ctaHref, sortOrder: p.sortOrder, active: p.active,
  offerings: offerings.filter((o) => o.programId === p.id).map(serializeOffering),
})
export const serializeArea = (a: LifeArea): LifeAreaItem => ({ id: a.id, name: a.name, description: a.description, icon: a.icon, color: a.color, sortOrder: a.sortOrder, active: a.active })

/** Everything (incl. hidden) for the admin page. */
export async function listAllServices(): Promise<{ programs: ServiceProgramItem[]; areas: LifeAreaItem[] }> {
  await ensureServiceSeed()
  const [programs, areas, offerings] = await Promise.all([
    prisma.serviceProgram.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.lifeArea.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.serviceOffering.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ])
  return { programs: programs.map((p) => serializeProgram(p, offerings)), areas: areas.map(serializeArea) }
}

async function publicServices() {
  await ensureServiceSeed()
  const [programs, areas, offerings] = await Promise.all([
    prisma.serviceProgram.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.lifeArea.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.serviceOffering.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ])
  return { programs: programs.map((p) => serializeProgram(p, offerings)), areas: areas.map(serializeArea) }
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

/** The most products a service page shows before "see all in the shop". */
const SERVICE_PRODUCTS_LIMIT = 12

/** Unique by id, first occurrence wins, capped. */
function mergeProducts<T extends { id: string }>(lists: T[][], limit: number): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const list of lists) for (const p of list) if (!seen.has(p.id) && out.length < limit) { seen.add(p.id); out.push(p) }
  return out
}

/**
 * Products for a programme page: products in the shop categories linked to the
 * programme (ProductCategory.serviceProgramId — optional, set in the shop
 * category form), plus products hand-picked on any of its sub-services.
 * Also returns the linked categories for "see all in the shop" links.
 */
export async function getProgramProducts(program: ServiceProgramItem) {
  const { listServiceProducts, listProductsByIds } = await import('@/lib/shop/data')
  const picked = [...new Set(program.offerings.flatMap((o) => o.productIds))]
  const [fromCategories, fromOfferings] = await Promise.all([listServiceProducts(program.id, SERVICE_PRODUCTS_LIMIT), listProductsByIds(picked)])
  return { products: mergeProducts([fromCategories.products, fromOfferings], SERVICE_PRODUCTS_LIMIT), categories: fromCategories.categories }
}

/**
 * A sub-service page: its programme (with the other visible sub-services), the
 * products hand-picked for this sub-service first, then the programme's
 * category products, and the linked categories.
 */
export async function getOfferingPage(programSlug: string, offeringSlug: string) {
  const { programs, areas } = await getPublicServices()
  const program = programs.find((p) => p.slug === programSlug)
  const offering = program?.offerings.find((o) => o.slug === offeringSlug)
  if (!program || !offering) return null
  const { listProductsByIds, listServiceProducts } = await import('@/lib/shop/data')
  const [picked, fromCategories] = await Promise.all([listProductsByIds(offering.productIds), listServiceProducts(program.id, SERVICE_PRODUCTS_LIMIT)])
  return { program, offering, areas, products: mergeProducts([picked, fromCategories.products], SERVICE_PRODUCTS_LIMIT), categories: fromCategories.categories }
}
