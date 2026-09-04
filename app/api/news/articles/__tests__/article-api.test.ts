import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as getArticle, PATCH as patchArticle, DELETE as deleteArticle } from '../[id]/route'
import { POST as createArticle } from '../route'

/**
 * Real integration tests against the actual configured database — same
 * convention as cart.test.ts / borrow-reserve-concurrency.test.ts.
 *
 * getServerSession() needs a mock — returns a staff session so requireStaff
 * passes. Article creation requires authorId pointing at a real user.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testUserId: string
const createdArticleIds: string[] = []

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: testUserId, roleName: 'Admin' } })),
}))

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function patchRequest(url: string, body: unknown) {
  return new NextRequest(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const user = await prisma.user.create({
    data: { name: 'Vitest Article', firstName: 'Vitest', lastName: 'Article', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id
})

afterAll(async () => {
  if (createdArticleIds.length) {
    await prisma.newsArticle.deleteMany({ where: { id: { in: createdArticleIds } } })
  }
  await prisma.user.delete({ where: { id: testUserId } })
})

async function createDraftArticle(): Promise<string> {
  const res = await createArticle(postRequest('http://localhost/api/news/articles', {
    authorId: testUserId,
    title: `Test Article ${RUN_ID}`,
    content: '<p>Test content</p>',
    summary: 'Test summary',
    category: 'Test Category',
    language: 'EN',
    isEdition: false,
  }))
  const json = await res.json()
  createdArticleIds.push(json.data.id)
  return json.data.id
}

describe('POST /api/news/articles (create)', () => {
  it('creates a draft article with sanitized content', async () => {
    const id = await createDraftArticle()
    const article = await prisma.newsArticle.findUnique({ where: { id } })
    expect(article).not.toBeNull()
    expect(article!.status).toBe('DRAFT')
  })
})

describe('GET /api/news/articles/[id]', () => {
  it('returns the article for staff', async () => {
    const id = await createDraftArticle()
    const res = await getArticle(new NextRequest(`http://localhost/api/news/articles/${id}`), { params: Promise.resolve({ id }) })
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.id).toBe(id)
    expect(json.data.status).toBe('DRAFT')
  })

  it('returns 404 for nonexistent article', async () => {
    const fakeId = '000000000000000000000000'
    const res = await getArticle(new NextRequest(`http://localhost/api/news/articles/${fakeId}`), { params: Promise.resolve({ id: fakeId }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/news/articles/[id] — field editing', () => {
  it('updates DRAFT article fields successfully', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, {
      title: 'Updated Title',
      summary: 'Updated summary',
      content: '<p>Updated content</p>',
      category: 'Updated Category',
      language: 'FR',
      isEdition: true,
    }), { params: Promise.resolve({ id }) })
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.title).toBe('Updated Title')
    expect(json.data.summary).toBe('Updated summary')
    expect(json.data.category).toBe('Updated Category')
    expect(json.data.language).toBe('fr')
    expect(json.data.isEdition).toBe(true)
  })

  it('sanitizes HTML content on edit', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, {
      content: '<p>Safe</p><script>alert("xss")</script>',
    }), { params: Promise.resolve({ id }) })
    const json = await res.json()
    expect(json.data.content).toContain('<p>Safe</p>')
    expect(json.data.content).not.toContain('<script>')
  })

  it('rejects editing a non-DRAFT article', async () => {
    const id = await createDraftArticle()
    // Submit the article (DRAFT -> SUBMITTED)
    await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { title: 'Should Fail' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.message).toContain('Only a draft article can be edited')
  })

  it('rejects update with title too short', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { title: 'ab' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(400)
  })

  it('rejects update with empty content', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { content: '' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(400)
  })

  it('does not allow changing protected fields', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { featured: true, status: 'PUBLISHED' }), { params: Promise.resolve({ id }) })
    // strict() schema rejects unknown keys (featured, status) with 400
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/news/articles/[id] — workflow actions', () => {
  it('submit action transitions DRAFT -> SUBMITTED', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.status).toBe('SUBMITTED')
  })

  it('approve action transitions SUBMITTED -> APPROVED', async () => {
    const id = await createDraftArticle()
    await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'approve' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.status).toBe('APPROVED')
  })

  it('reject action transitions SUBMITTED -> REJECTED', async () => {
    const id = await createDraftArticle()
    await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'reject' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.status).toBe('REJECTED')
  })

  it('publish action transitions APPROVED -> PUBLISHED with publishedAt set', async () => {
    const id = await createDraftArticle()
    await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'approve' }), { params: Promise.resolve({ id }) })
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'publish' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.status).toBe('PUBLISHED')
    expect(json.data.publishedAt).not.toBeNull()
  })

  it('submit rejects non-DRAFT article', async () => {
    const id = await createDraftArticle()
    await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'submit' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(409)
  })

  it('toggleFeatured toggles featured flag', async () => {
    const id = await createDraftArticle()
    const res = await patchArticle(patchRequest(`http://localhost/api/news/articles/${id}`, { action: 'toggleFeatured' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.featured).toBe(true)
  })
})

describe('DELETE /api/news/articles/[id]', () => {
  it('deletes an article', async () => {
    const id = await createDraftArticle()
    const res = await deleteArticle(new NextRequest(`http://localhost/api/news/articles/${id}`, { method: 'DELETE' }), { params: Promise.resolve({ id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.code).toBe('success')
    const deleted = await prisma.newsArticle.findUnique({ where: { id } })
    expect(deleted).toBeNull()
    // Remove from cleanup list since it's already deleted
    const idx = createdArticleIds.indexOf(id)
    if (idx > -1) createdArticleIds.splice(idx, 1)
  })
})
