import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createPublication } from '../publications/route'
import { PATCH as patchPublication } from '../publications/[id]/route'
import { GET as downloadReport } from '../downloads/reports/[report]/route'
import { PUT as putCommission } from '../publishing/commission/route'
import { creditPaidOrdersToPublishers } from '@/lib/data/publishing-revenue'

/**
 * The publishing flow end to end on the TEST database: a publisher (role with
 * "publications:submit") adds a book under a KCS category, a reviewer (role
 * with "publications:approve") sends it back with a reason, the publisher
 * fixes and resubmits, the reviewer approves — and only then does a library
 * Resource exist, filed under the same KCS category. Plus the CSV reports.
 */
const RUN = `vitest-pub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { publisher: '', reviewer: '', nobody: '', admin: '', pillar: '', scroll: '', publication: '', resource: '', textPublication: '', textResource: '', order: '' }
let commissionBefore = 30
const roles = { publisher: `Vitest Publisher ${RUN}`, reviewer: `Vitest Reviewer ${RUN}`, nobody: `Vitest Nobody ${RUN}` }

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const post = (body: unknown) => createPublication(new NextRequest('http://localhost/api/publications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))
const patch = (id: string, body: unknown) =>
  patchPublication(new NextRequest(`http://localhost/api/publications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) })
const as = (who: 'publisher' | 'reviewer' | 'nobody' | 'admin') => { session = { id: ids[who], roleName: who === 'admin' ? 'Admin' : roles[who] } }
const commission = (percent: number) => putCommission(new NextRequest('http://localhost/api/publishing/commission', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ percent }) }))

const book = () => ({
  title: `Vitest Book ${RUN}`,
  description: 'A test book about walking in the covenant, long enough to submit.',
  categoryId: ids.scroll,
  mediaType: 'DOCUMENT',
  coverImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  documentUrl: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf',
  pages: 42,
  price: 1500,
  borrowPrice: 500,
  quantity: 3,
  language: 'en',
})

beforeAll(async () => {
  const [pubRole, revRole, noRole] = await Promise.all([
    prisma.role.create({ data: { name: roles.publisher, permissions: ['publications:submit'] } }),
    prisma.role.create({ data: { name: roles.reviewer, permissions: ['publications:approve', 'reports:view'] } }),
    prisma.role.create({ data: { name: roles.nobody, permissions: [] } }),
  ])
  const mk = (tag: string, roleId: string) =>
    prisma.user.create({ data: { name: `Vitest ${tag}`, firstName: 'Vitest', lastName: tag, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  const adminRole = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  ;[ids.publisher, ids.reviewer, ids.nobody, ids.admin] = await Promise.all([mk('publisher', pubRole.id), mk('reviewer', revRole.id), mk('nobody', noRole.id), mk('admin', adminRole.id)])
  commissionBefore = (await prisma.settings.findFirst())?.publishingCommissionPercent ?? 30
  ids.pillar = (await prisma.category.create({ data: { slug: `${RUN}-pillar`, nameEn: 'Vitest Pillar', nameFr: 'P', nameRw: 'P', code: 'KCS-VT' } })).id
  ids.scroll = (await prisma.category.create({ data: { slug: `${RUN}-scroll`, nameEn: 'Vitest Scroll', nameFr: 'S', nameRw: 'S', parentId: ids.pillar, status: 'AVAILABLE' } })).id
}, 60_000)

afterAll(async () => {
  const settings = await prisma.settings.findFirst()
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data: { publishingCommissionPercent: commissionBefore } })
  if (ids.order) await prisma.order.deleteMany({ where: { id: ids.order } })
  if (ids.textPublication) {
    await prisma.revenueShare.deleteMany({ where: { publicationId: ids.textPublication } })
    await prisma.publication.deleteMany({ where: { id: ids.textPublication } })
  }
  if (ids.textResource) {
    await prisma.chapter.deleteMany({ where: { resourceId: ids.textResource } })
    await prisma.resource.deleteMany({ where: { id: ids.textResource } })
  }
  if (ids.publication) {
    await prisma.revenueShare.deleteMany({ where: { publicationId: ids.publication } })
    await prisma.publication.deleteMany({ where: { id: ids.publication } })
  }
  if (ids.resource) await prisma.resource.deleteMany({ where: { id: ids.resource } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: [ids.publisher, ids.reviewer, ids.nobody, ids.admin] } } })
  // Scroll before pillar: the parent relation cannot be removed while a child points at it.
  await prisma.category.deleteMany({ where: { id: ids.scroll } })
  await prisma.category.deleteMany({ where: { id: ids.pillar } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.publisher, ids.reviewer, ids.nobody, ids.admin] } } })
  await prisma.role.deleteMany({ where: { name: { in: Object.values(roles) } } })
}, 60_000)

describe('publisher submits, reviewer approves', () => {
  it('a role without "publications:submit" cannot add a book', async () => {
    as('nobody')
    expect((await post(book())).status).toBe(403)
  })

  it('submitting needs a KCS category, a description and a cover', async () => {
    as('publisher')
    const res = await post({ ...book(), categoryId: undefined, submit: true })
    expect(res.status).toBe(400)
    expect((await res.json()).message).toContain('KCS category')
    expect((await post({ ...book(), categoryId: ids.pillar, submit: true })).status).toBe(400) // a pillar is not a scroll
  })

  it('the publisher submits; nothing is in the library yet; they cannot approve their own book', async () => {
    as('publisher')
    const res = await post({ ...book(), submit: true })
    expect(res.status).toBe(201)
    const pub = (await res.json()).data
    ids.publication = pub.id
    expect(pub).toMatchObject({ status: 'SUBMITTED', categoryId: ids.scroll, category: 'Vitest Scroll', contributorId: ids.publisher })
    expect(await prisma.resource.count({ where: { title: book().title } })).toBe(0)

    expect((await patch(pub.id, { action: 'approve' })).status).toBe(403)
  }, 60_000)

  it('the reviewer must give a reason to send it back; the publisher edits and resubmits', async () => {
    as('reviewer')
    expect((await patch(ids.publication, { action: 'reject', notes: '' })).status).toBe(400)
    const rejected = await patch(ids.publication, { action: 'reject', notes: 'Please add the table of contents.' })
    expect(rejected.status).toBe(200)
    expect((await rejected.json()).data).toMatchObject({ status: 'REJECTED', reviewNotes: 'Please add the table of contents.' })

    as('nobody')
    expect((await patch(ids.publication, { action: 'update', fields: { title: 'Hijack' } })).status).toBe(403)

    as('publisher')
    expect((await patch(ids.publication, { action: 'update', fields: { pages: 48 } })).status).toBe(200)
    const resubmitted = await patch(ids.publication, { action: 'submit' })
    expect(resubmitted.status).toBe(200)
    expect((await resubmitted.json()).data).toMatchObject({ status: 'SUBMITTED', pages: 48 })
  }, 60_000)

  it('approval publishes it to the library under the same KCS category, with the admin-set commission', async () => {
    as('reviewer')
    expect((await commission(25)).status).toBe(403) // only an admin sets the rate
    as('admin')
    expect((await commission(25)).status).toBe(200)

    as('reviewer')
    const res = await patch(ids.publication, { action: 'approve' })
    expect(res.status).toBe(200)
    const pub = (await res.json()).data
    expect(pub.status).toBe('PUBLISHED')
    ids.resource = pub.resourceId

    const resource = await prisma.resource.findUniqueOrThrow({ where: { id: pub.resourceId } })
    expect(resource).toMatchObject({
      categoryId: ids.scroll, status: 'AVAILABLE', mediaType: 'DOCUMENT', documentUrl: book().documentUrl,
      pages: 48, price: 1500, borrowPrice: 500, totalQty: 3, format: 'Digital',
    })
    // No self-made ISBN: an internal record key; the official ISBN stays pending until the ISBN agency issues one.
    expect(resource.isbn).toBe(`KL-${resource.id}`)
    expect(resource.officialIsbn).toBeNull()
    expect(pub.revenueShare).toMatchObject({ platformShare: 25, contributorShare: 75, totalRevenue: 0 })

    as('publisher')
    expect((await patch(ids.publication, { action: 'update', fields: { title: 'Too late' } })).status).toBe(409)
  }, 60_000)

  it('a paid sale adds to the book’s revenue exactly once', async () => {
    const order = await prisma.order.create({
      data: {
        userId: ids.nobody, buyerName: 'Vitest Buyer', buyerEmail: 'b@vitest.local', buyerPhone: '0780000000',
        resourceId: ids.resource, resourceTitle: book().title, resourceFormat: 'Digital', type: 'SALE', amountRwf: 1500,
        status: 'PAID', paidAt: new Date(),
      },
    })
    ids.order = order.id
    await creditPaidOrdersToPublishers([order.id])
    await creditPaidOrdersToPublishers([order.id]) // a second payment callback for the same order
    const share = await prisma.revenueShare.findUniqueOrThrow({ where: { publicationId: ids.publication } })
    expect(share.totalRevenue).toBe(1500)
  }, 60_000)

  it('a Text book needs written chapters, which become the library book’s chapters on approval', async () => {
    as('publisher')
    const base = { ...book(), title: `Vitest Text Book ${RUN}`, mediaType: 'TEXT', documentUrl: '' }
    const empty = await post({ ...base, chapters: [{ title: '', body: '   ' }], submit: true })
    expect(empty.status).toBe(400)
    expect((await empty.json()).message).toContain('write at least one chapter')

    const res = await post({ ...base, chapters: [{ title: 'In the beginning', body: 'First chapter text.' }, { title: '', body: 'Second chapter text.' }], submit: true })
    expect(res.status).toBe(201)
    const pub = (await res.json()).data
    ids.textPublication = pub.id
    expect(pub.chapters).toEqual([{ title: 'In the beginning', body: 'First chapter text.' }, { title: 'Chapter 2', body: 'Second chapter text.' }])

    as('reviewer')
    const approved = (await (await patch(pub.id, { action: 'approve' })).json()).data
    ids.textResource = approved.resourceId
    const chapters = await prisma.chapter.findMany({ where: { resourceId: approved.resourceId }, orderBy: { order: 'asc' } })
    expect(chapters.map((c) => [c.order, c.title, c.body])).toEqual([[1, 'In the beginning', 'First chapter text.'], [2, 'Chapter 2', 'Second chapter text.']])
  }, 60_000)
})

describe('GET /api/downloads/reports/[report]', () => {
  const get = (report: string, qs = '') => downloadReport(new NextRequest(`http://localhost/api/downloads/reports/${report}${qs}`), { params: Promise.resolve({ report }) })

  it('needs "reports:view"', async () => {
    as('publisher')
    expect((await get('borrowing-activity')).status).toBe(403)
  })

  it('returns a CSV file for each report, with the approved book in the revenue statement', async () => {
    as('reviewer')
    for (const key of ['borrowing-activity', 'learning-progress']) {
      const res = await get(key)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/csv')
      expect(res.headers.get('content-disposition')).toContain(`${key}_`)
    }
    const res = await get('publishing-revenue')
    const csv = await res.text()
    expect(csv.split('\r\n')[0]).toContain('Book,Publisher,KCS category')
    expect(csv).toContain(book().title)

    expect((await get('nope')).status).toBe(404)
    expect((await get('borrowing-activity', '?from=2026-02-01&to=2026-01-01')).status).toBe(400)
  }, 60_000)
})
