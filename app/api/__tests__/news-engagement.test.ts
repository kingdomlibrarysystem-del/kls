import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { PUT as putReaction, DELETE as resetReactions } from '../news/reactions/route'
import { POST as postComment } from '../news/comments/route'
import { GET as getEngagement } from '../news/engagement/route'
import { POST as postView } from '../news/views/route'
import { getArticleStatsMap } from '@/lib/data/news-engagement'
import { PATCH as patchComment, DELETE as deleteComment } from '../news/comments/[id]/route'

/**
 * Real integration tests against the configured database (same convention as
 * reviews.test.ts) for news article likes/dislikes and comments:
 *   GET  /api/news/engagement?articleId=   PUT/DELETE /api/news/reactions
 *   POST /api/news/comments                PATCH/DELETE /api/news/comments/[id]
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
let memberId: string
let adminId: string
let articleId: string
let draftId: string
/** Who the mocked session belongs to; null = signed out. */
let session: { id: string; roleName: string } | null = null

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': RUN_ID },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeAll(async () => {
  const memberRole = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const adminRole = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  const member = await prisma.user.create({ data: { name: 'Vitest Reader', firstName: 'Vitest', lastName: 'Reader', email: `${RUN_ID}-m@vitest.local`, roleId: memberRole.id, status: 'ACTIVE' } })
  const admin = await prisma.user.create({ data: { name: 'Vitest Admin', firstName: 'Vitest', lastName: 'Admin', email: `${RUN_ID}-a@vitest.local`, roleId: adminRole.id, status: 'ACTIVE' } })
  memberId = member.id
  adminId = admin.id
  const base = { content: 'Body', summary: 'Summary', category: 'General', authorId: adminId, authorName: 'Vitest Admin' }
  articleId = (await prisma.newsArticle.create({ data: { ...base, title: `Vitest Article ${RUN_ID}`, status: 'PUBLISHED', publishedAt: new Date() } })).id
  draftId = (await prisma.newsArticle.create({ data: { ...base, title: `Vitest Draft ${RUN_ID}`, status: 'DRAFT' } })).id
}, 60_000)

afterAll(async () => {
  const ids = [articleId, draftId]
  await Promise.all([
    prisma.newsArticleReaction.deleteMany({ where: { articleId: { in: ids } } }),
    prisma.newsArticleComment.deleteMany({ where: { articleId: { in: ids } } }),
    prisma.newsArticleView.deleteMany({ where: { articleId: { in: ids } } }),
  ])
  await prisma.newsArticle.deleteMany({ where: { id: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: [memberId, adminId] } } })
}, 60_000)

describe('PUT /api/news/reactions', () => {
  it('requires an account', async () => {
    session = null
    const res = await putReaction(req('/api/news/reactions', 'PUT', { articleId, type: 'LIKE' }))
    expect(res.status).toBe(401)
  })

  it('likes, switches to dislike, and clears — one reaction per reader', async () => {
    session = { id: memberId, roleName: 'Member' }
    let res = await putReaction(req('/api/news/reactions', 'PUT', { articleId, type: 'LIKE' }))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ likes: 1, dislikes: 0, myReaction: 'LIKE' })

    res = await putReaction(req('/api/news/reactions', 'PUT', { articleId, type: 'DISLIKE' }))
    expect((await res.json()).data).toMatchObject({ likes: 0, dislikes: 1, myReaction: 'DISLIKE' })

    res = await putReaction(req('/api/news/reactions', 'PUT', { articleId, type: null }))
    expect((await res.json()).data).toMatchObject({ likes: 0, dislikes: 0, myReaction: null })
  })

  it('rejects unpublished articles', async () => {
    session = { id: memberId, roleName: 'Member' }
    const res = await putReaction(req('/api/news/reactions', 'PUT', { articleId: draftId, type: 'LIKE' }))
    expect(res.status).toBe(404)
  })

  it('only staff can reset an article\'s reactions', async () => {
    session = { id: memberId, roleName: 'Member' }
    await putReaction(req('/api/news/reactions', 'PUT', { articleId, type: 'LIKE' }))
    expect((await resetReactions(req(`/api/news/reactions?articleId=${articleId}`, 'DELETE'))).status).toBe(403)

    session = { id: adminId, roleName: 'Admin' }
    const res = await resetReactions(req(`/api/news/reactions?articleId=${articleId}`, 'DELETE'))
    expect(res.status).toBe(200)
    expect((await res.json()).data.removed).toBe(1)
  })
})

describe('comments', () => {
  let commentId: string

  it('requires an account to comment', async () => {
    session = null
    const res = await postComment(req('/api/news/comments', 'POST', { articleId, body: 'Hello' }))
    expect(res.status).toBe(401)
  })

  it('rejects an empty comment and unpublished articles', async () => {
    session = { id: memberId, roleName: 'Member' }
    expect((await postComment(req('/api/news/comments', 'POST', { articleId, body: '   ' }))).status).toBe(400)
    expect((await postComment(req('/api/news/comments', 'POST', { articleId: draftId, body: 'Hi' }))).status).toBe(404)
  })

  it('posts a comment that appears in GET /api/news/engagement', async () => {
    session = { id: memberId, roleName: 'Member' }
    const res = await postComment(req('/api/news/comments', 'POST', { articleId, body: 'Great article' }))
    expect(res.status).toBe(201)
    const created = (await res.json()).data
    commentId = created.id
    expect(created.authorName).toBe('Vitest Reader')

    session = null
    const eng = await (await getEngagement(req(`/api/news/engagement?articleId=${articleId}`, 'GET'))).json()
    expect(eng.data.comments.map((c: { id: string }) => c.id)).toContain(commentId)
  })

  it('only staff can hide a comment; hidden comments leave the public view', async () => {
    session = { id: memberId, roleName: 'Member' }
    expect((await patchComment(req(`/api/news/comments/${commentId}`, 'PATCH', { status: 'HIDDEN' }), ctx(commentId))).status).toBe(403)

    session = { id: adminId, roleName: 'Admin' }
    expect((await patchComment(req(`/api/news/comments/${commentId}`, 'PATCH', { status: 'HIDDEN' }), ctx(commentId))).status).toBe(200)

    const eng = await (await getEngagement(req(`/api/news/engagement?articleId=${articleId}`, 'GET'))).json()
    expect(eng.data.comments.map((c: { id: string }) => c.id)).not.toContain(commentId)
  })

  it('a reader cannot delete someone else\'s comment, but can delete their own', async () => {
    session = { id: adminId, roleName: 'Admin' }
    const other = (await (await postComment(req('/api/news/comments', 'POST', { articleId, body: 'Admin note' }))).json()).data

    session = { id: memberId, roleName: 'Member' }
    expect((await deleteComment(req(`/api/news/comments/${other.id}`, 'DELETE'), ctx(other.id))).status).toBe(403)
    expect((await deleteComment(req(`/api/news/comments/${commentId}`, 'DELETE'), ctx(commentId))).status).toBe(200)
  })

  it('GET /api/news/engagement 404s for unpublished articles', async () => {
    session = null
    expect((await getEngagement(req(`/api/news/engagement?articleId=${draftId}`, 'GET'))).status).toBe(404)
  })
})

describe('POST /api/news/views', () => {
  it('needs an anonymous id when signed out, and only counts published articles', async () => {
    session = null
    expect((await postView(req('/api/news/views', 'POST', { articleId }))).status).toBe(400)
    expect((await postView(req('/api/news/views', 'POST', { articleId: draftId, anonymousId: 'anon-12345678' }))).status).toBe(404)
  })

  it('counts each reader once — per device when signed out, per account when signed in', async () => {
    session = null
    let res = await postView(req('/api/news/views', 'POST', { articleId, anonymousId: 'anon-aaaaaaaa' }))
    expect(res.status).toBe(200)
    expect((await res.json()).data.views).toBe(1)
    res = await postView(req('/api/news/views', 'POST', { articleId, anonymousId: 'anon-aaaaaaaa' }))
    expect((await res.json()).data.views).toBe(1)

    session = { id: memberId, roleName: 'Member' }
    res = await postView(req('/api/news/views', 'POST', { articleId, anonymousId: 'anon-bbbbbbbb' }))
    expect((await res.json()).data.views).toBe(2)
    res = await postView(req('/api/news/views', 'POST', { articleId }))
    expect((await res.json()).data.views).toBe(2)
  })

  it('the article page and every article list report the same numbers', async () => {
    session = null
    const eng = await (await getEngagement(req(`/api/news/engagement?articleId=${articleId}`, 'GET'))).json()
    expect(eng.data.views).toBe(2)

    const stats = await getArticleStatsMap([articleId, draftId])
    expect(stats.get(articleId)).toEqual({ views: 2, likes: eng.data.likes, comments: eng.data.comments.length })
    expect(stats.get(draftId)).toEqual({ views: 0, likes: 0, comments: 0 })
  })
})
