import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { DELETE as deleteUser } from '../users/[id]/route'
import { POST as trashUser, DELETE as restoreUser } from '../users/[id]/trash/route'
import { GET as listUsers } from '../users/route'

/**
 * DELETE /api/users/[id] against the real configured database (same
 * convention as the other integration tests). A user with ordinary personal
 * records (a review, a returned borrow, a reservation, a comment) is deleted
 * together with those records; deletion is refused for a user who authored a
 * news article or still has a book out, and for the admin's own account.
 */
const RUN = `vitest-del-${Date.now()}-${Math.random().toString(36).slice(2)}`
let session: { id: string; roleName: string } | null = null
let adminId = ''
let memberId = ''
let authorId = ''
let borrowerId = ''
let resourceId = ''
let articleId = ''

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const del = (id: string) => deleteUser(new NextRequest(`http://localhost/api/users/${id}`, { method: 'DELETE' }), { params: Promise.resolve({ id }) })

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const adminRole = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  const mk = (tag: string, roleId = role.id) =>
    prisma.user.create({ data: { name: `Vitest ${tag}`, firstName: 'Vitest', lastName: tag, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[adminId, memberId, authorId, borrowerId] = await Promise.all([mk('Admin', adminRole.id), mk('Member'), mk('Author'), mk('Borrower')])

  resourceId = (await prisma.resource.create({
    data: {
      title: `Vitest Delete Resource ${RUN}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, isbn: `vitest-del-${RUN}`, price: 0, freePreviewChapterCount: 0,
      totalQty: 3, availableQty: 3, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
    },
  })).id
  articleId = (await prisma.newsArticle.create({
    data: { title: `Vitest Delete Article ${RUN}`, content: 'Body', summary: 'Summary', category: 'General', authorId, authorName: 'Vitest Author', status: 'PUBLISHED', publishedAt: new Date() },
  })).id

  const now = new Date()
  await Promise.all([
    prisma.review.create({ data: { userId: memberId, resourceId, rating: 5, comment: 'Great' } }),
    prisma.borrow.create({ data: { userId: memberId, memberName: 'Vitest Member', memberEmail: 'm@vitest.local', resourceId, status: 'RETURNED', borrowDate: now, dueDate: now } }),
    prisma.reservation.create({ data: { userId: memberId, memberName: 'Vitest Member', memberEmail: 'm@vitest.local', resourceId, queuePosition: 1 } }),
    prisma.newsArticleComment.create({ data: { articleId, userId: memberId, authorName: 'Vitest Member', body: 'Nice' } }),
    prisma.borrow.create({ data: { userId: borrowerId, memberName: 'Vitest Borrower', memberEmail: 'b@vitest.local', resourceId, status: 'ACTIVE', borrowDate: now, dueDate: now } }),
  ])
  await prisma.resource.update({ where: { id: resourceId }, data: { avgRating: 5, reviewCount: 1 } })
}, 60_000)

afterAll(async () => {
  const users = [adminId, memberId, authorId, borrowerId]
  await prisma.newsArticleComment.deleteMany({ where: { articleId } })
  await prisma.newsArticle.deleteMany({ where: { id: articleId } })
  await prisma.borrow.deleteMany({ where: { resourceId } })
  await prisma.reservation.deleteMany({ where: { resourceId } })
  await prisma.review.deleteMany({ where: { resourceId } })
  await prisma.resource.deleteMany({ where: { id: resourceId } })
  await prisma.user.deleteMany({ where: { id: { in: users } } })
}, 60_000)

describe('DELETE /api/users/[id]', () => {
  it('is admin-only', async () => {
    session = { id: memberId, roleName: 'Member' }
    expect((await del(authorId)).status).toBe(403)
  })

  it('refuses an admin deleting their own account', async () => {
    session = { id: adminId, roleName: 'Admin' }
    expect((await del(adminId)).status).toBe(409)
  })

  it('refuses when the user wrote shared content or still has a book out', async () => {
    session = { id: adminId, roleName: 'Admin' }
    const a = await del(authorId)
    expect(a.status).toBe(409)
    expect((await a.json()).message).toContain('news article')
    const b = await del(borrowerId)
    expect(b.status).toBe(409)
    expect((await b.json()).message).toContain('not returned')
  }, 60_000)

  it('deletes a user with personal records, removes those records, and recomputes book ratings', async () => {
    session = { id: adminId, roleName: 'Admin' }
    const res = await del(memberId)
    expect(res.status).toBe(200)

    const [user, reviews, borrows, reservations, comments, resource] = await Promise.all([
      prisma.user.findUnique({ where: { id: memberId } }),
      prisma.review.count({ where: { userId: memberId } }),
      prisma.borrow.count({ where: { userId: memberId } }),
      prisma.reservation.count({ where: { userId: memberId } }),
      prisma.newsArticleComment.count({ where: { userId: memberId } }),
      prisma.resource.findUnique({ where: { id: resourceId }, select: { reviewCount: true, avgRating: true } }),
    ])
    expect(user).toBeNull()
    expect([reviews, borrows, reservations, comments]).toEqual([0, 0, 0, 0])
    expect(resource).toEqual({ reviewCount: 0, avgRating: 0 })

    expect((await del(memberId)).status).toBe(404)
  }, 60_000)
})

describe('DELETE /api/users/[id] with progress (NDJSON stream)', () => {
  it('streams one progress line per step, ending with done, and the user is gone', async () => {
    session = { id: adminId, roleName: 'Admin' }
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'Member' } })
    const streamUserId = (await prisma.user.create({ data: { name: 'Vitest Stream', firstName: 'Vitest', lastName: 'Stream', email: `${RUN}-stream@vitest.local`, roleId: role.id, status: 'ACTIVE' } })).id
    await prisma.review.create({ data: { userId: streamUserId, resourceId, rating: 4 } })

    const res = await deleteUser(
      new NextRequest(`http://localhost/api/users/${streamUserId}`, { method: 'DELETE', headers: { Accept: 'application/x-ndjson' } }),
      { params: Promise.resolve({ id: streamUserId }) },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/x-ndjson')

    const lines = (await res.text()).trim().split('\n').map((l) => JSON.parse(l) as { type: string; done?: number; total?: number; label?: string })
    const progress = lines.filter((l) => l.type === 'progress')
    expect(progress.length).toBeGreaterThan(3)
    expect(progress.map((p) => p.done)).toEqual(progress.map((_, i) => i + 1))
    expect(progress.at(-1)?.done).toBe(progress.at(-1)?.total)
    expect(lines.at(-1)?.type).toBe('done')

    expect(await prisma.user.findUnique({ where: { id: streamUserId } })).toBeNull()
    expect(await prisma.review.count({ where: { userId: streamUserId } })).toBe(0)
  }, 60_000)

  it('a refused delete is still a plain JSON 409, before anything is deleted', async () => {
    session = { id: adminId, roleName: 'Admin' }
    const res = await deleteUser(
      new NextRequest(`http://localhost/api/users/${authorId}`, { method: 'DELETE', headers: { Accept: 'application/x-ndjson' } }),
      { params: Promise.resolve({ id: authorId }) },
    )
    expect(res.status).toBe(409)
    expect((await res.json()).message).toContain('news article')
  }, 60_000)
})

describe('Trash (soft delete): POST/DELETE /api/users/[id]/trash', () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
  const req = (id: string, method: string) => new NextRequest(`http://localhost/api/users/${id}/trash`, { method })
  const listIds = async (trash: boolean) => {
    const url = `http://localhost/api/users?pageSize=1000${trash ? '&trash=1' : ''}&search=${encodeURIComponent(RUN)}`
    const res = await listUsers(new NextRequest(url))
    return ((await res.json()).data as { id: string }[]).map((u) => u.id)
  }

  it('moves a user to Trash without erasing anything, hides them from the list, and restores them', async () => {
    session = { id: adminId, roleName: 'Admin' }
    expect((await trashUser(req(borrowerId, 'POST'), ctx(borrowerId))).status).toBe(200)
    expect((await trashUser(req(borrowerId, 'POST'), ctx(borrowerId))).status).toBe(409)

    const user = await prisma.user.findUnique({ where: { id: borrowerId }, select: { deletedAt: true, deletedBy: true } })
    expect(user?.deletedAt).toBeInstanceOf(Date)
    expect(user?.deletedBy).toBe(adminId)
    expect(await prisma.borrow.count({ where: { userId: borrowerId } })).toBe(1)

    expect(await listIds(false)).not.toContain(borrowerId)
    expect(await listIds(true)).toContain(borrowerId)

    expect((await restoreUser(req(borrowerId, 'DELETE'), ctx(borrowerId))).status).toBe(200)
    expect(await listIds(false)).toContain(borrowerId)
    expect(await listIds(true)).not.toContain(borrowerId)
  }, 60_000)

  it('is admin-only and an admin cannot trash their own account', async () => {
    session = { id: authorId, roleName: 'Member' }
    expect((await trashUser(req(borrowerId, 'POST'), ctx(borrowerId))).status).toBe(403)
    session = { id: adminId, roleName: 'Admin' }
    expect((await trashUser(req(adminId, 'POST'), ctx(adminId))).status).toBe(409)
  })
})
