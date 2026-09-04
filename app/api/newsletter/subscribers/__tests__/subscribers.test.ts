import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as listSubscribers } from '../route'
import { DELETE as deleteSubscriber } from '../[id]/route'

/**
 * Real integration tests against the actual configured database —
 * same convention as the newsletter subscribe tests. Staff-only
 * endpoints need getServerSession() mocked to a staff session.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAILS = [`${RUN_ID}-1@vitest.local`, `${RUN_ID}-2@vitest.local`]

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'vitest-staff', roleName: 'Admin' } })),
}))

function getRequest(url: string) {
  return new NextRequest(url, { method: 'GET' })
}

beforeAll(async () => {
  await prisma.newsletterSubscriber.deleteMany({ where: { email: { in: TEST_EMAILS } } })
  await prisma.newsletterSubscriber.createMany({
    data: TEST_EMAILS.map((email) => ({ email })),
  })
})

afterAll(async () => {
  await prisma.newsletterSubscriber.deleteMany({ where: { email: { in: TEST_EMAILS } } })
})

describe('GET /api/newsletter/subscribers', () => {
  it('returns all subscribers paginated', async () => {
    const res = await listSubscribers(getRequest('http://localhost/api/newsletter/subscribers?pageSize=100'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.some((s: { email: string }) => TEST_EMAILS.includes(s.email))).toBe(true)
    expect(json.pagination).toBeDefined()
    expect(json.pagination.totalItems).toBeGreaterThanOrEqual(2)
  })

  it('filters by search query', async () => {
    const res = await listSubscribers(getRequest(`http://localhost/api/newsletter/subscribers?search=${RUN_ID}-1`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].email).toBe(TEST_EMAILS[0])
  })

  it('paginates correctly', async () => {
    const res = await listSubscribers(getRequest('http://localhost/api/newsletter/subscribers?page=1&pageSize=1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.pagination.totalItems).toBeGreaterThanOrEqual(2)
    expect(json.pagination.hasNext).toBe(true)
    expect(json.pagination.hasPrevious).toBe(false)
  })

  it('exports CSV when export=csv', async () => {
    const res = await listSubscribers(getRequest('http://localhost/api/newsletter/subscribers?export=csv'))
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(res.headers.get('Content-Type')).toBe('text/csv')
    expect(text.startsWith('Email,Subscribed At')).toBe(true)
    for (const email of TEST_EMAILS) {
      expect(text).toContain(email)
    }
  })
})

describe('DELETE /api/newsletter/subscribers/[id]', () => {
  it('removes an existing subscriber', async () => {
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email: TEST_EMAILS[1] } })
    expect(subscriber).not.toBeNull()
    const res = await deleteSubscriber(new NextRequest('http://localhost/api/newsletter/subscribers/x', { method: 'DELETE' }), { params: Promise.resolve({ id: subscriber!.id }) })
    expect(res.status).toBe(200)
    const gone = await prisma.newsletterSubscriber.findUnique({ where: { email: TEST_EMAILS[1] } })
    expect(gone).toBeNull()
  })

  it('returns 404 for a missing subscriber', async () => {
    const res = await deleteSubscriber(new NextRequest('http://localhost/api/newsletter/subscribers/x', { method: 'DELETE' }), { params: Promise.resolve({ id: 'nonexistent-id' }) })
    expect(res.status).toBe(404)
  })
})