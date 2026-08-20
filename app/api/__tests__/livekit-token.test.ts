import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { isLiveKitConfigured, createLiveKitToken } from '@/lib/livekit'
import { GET as getLiveKitToken } from '../session-requests/[id]/livekit-token/route'

/**
 * Real integration tests against the actual configured database — same
 * convention as cart.test.ts/reviews.test.ts. Covers the real/mock
 * fallback gate and the token route's auth checks; does NOT assert
 * against a real LiveKit Cloud connection (no live credentials in this
 * test environment) — that part is verified manually per
 * PROGRESS.md/CLAUDE.md's "needs human input" convention once real
 * LIVEKIT_* keys exist.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testLearnerId: string
let testOtherUserId: string
let testCourseId: string
let testSessionRequestId: string
let mockUserId = ''
const originalLiveKitEnv = { url: process.env.LIVEKIT_URL, key: process.env.LIVEKIT_API_KEY, secret: process.env.LIVEKIT_API_SECRET }

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (mockUserId ? { user: { id: mockUserId, roleName: 'Member' } } : null)),
}))

function getRequest(url: string) {
  return new NextRequest(url)
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const learner = await prisma.user.create({
    data: { name: 'Vitest Learner', firstName: 'Vitest', lastName: 'Learner', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testLearnerId = learner.id
  const other = await prisma.user.create({
    data: { name: 'Vitest Other', firstName: 'Vitest', lastName: 'Other', email: `other-${TEST_EMAIL}`, roleId: role.id, status: 'ACTIVE' },
  })
  testOtherUserId = other.id

  const course = await prisma.course.create({
    data: { title: `Vitest Course ${RUN_ID}`, description: 'Test', category: 'Test', author: 'Test' },
  })
  testCourseId = course.id

  const sessionRequest = await prisma.sessionRequest.create({
    data: {
      learnerId: testLearnerId, learnerName: 'Vitest Learner', courseId: testCourseId, courseTitle: course.title,
      proposedTime: new Date(), mode: 'INSTANT', status: 'APPROVED', scheduledAt: new Date(),
    },
  })
  testSessionRequestId = sessionRequest.id
})

afterEach(() => { mockUserId = '' })

afterAll(async () => {
  if (originalLiveKitEnv.url === undefined) delete process.env.LIVEKIT_URL; else process.env.LIVEKIT_URL = originalLiveKitEnv.url
  if (originalLiveKitEnv.key === undefined) delete process.env.LIVEKIT_API_KEY; else process.env.LIVEKIT_API_KEY = originalLiveKitEnv.key
  if (originalLiveKitEnv.secret === undefined) delete process.env.LIVEKIT_API_SECRET; else process.env.LIVEKIT_API_SECRET = originalLiveKitEnv.secret
  await prisma.sessionRequest.delete({ where: { id: testSessionRequestId } })
  await Promise.all([
    prisma.course.delete({ where: { id: testCourseId } }),
    prisma.user.delete({ where: { id: testLearnerId } }),
    prisma.user.delete({ where: { id: testOtherUserId } }),
  ])
}, 30_000)

describe('isLiveKitConfigured', () => {
  it('reflects whether all three LIVEKIT_* env vars are set', () => {
    const originalUrl = process.env.LIVEKIT_URL
    const originalKey = process.env.LIVEKIT_API_KEY
    const originalSecret = process.env.LIVEKIT_API_SECRET
    try {
      delete process.env.LIVEKIT_URL
      delete process.env.LIVEKIT_API_KEY
      delete process.env.LIVEKIT_API_SECRET
      expect(isLiveKitConfigured()).toBe(false)

      process.env.LIVEKIT_URL = 'wss://example.livekit.cloud'
      process.env.LIVEKIT_API_KEY = 'key'
      process.env.LIVEKIT_API_SECRET = 'secret'
      expect(isLiveKitConfigured()).toBe(true)
    } finally {
      if (originalUrl === undefined) delete process.env.LIVEKIT_URL; else process.env.LIVEKIT_URL = originalUrl
      if (originalKey === undefined) delete process.env.LIVEKIT_API_KEY; else process.env.LIVEKIT_API_KEY = originalKey
      if (originalSecret === undefined) delete process.env.LIVEKIT_API_SECRET; else process.env.LIVEKIT_API_SECRET = originalSecret
    }
  })
})

describe('createLiveKitToken', () => {
  it('throws when LiveKit is not configured', async () => {
    const originalUrl = process.env.LIVEKIT_URL
    delete process.env.LIVEKIT_URL
    await expect(createLiveKitToken('room', 'user', 'Name')).rejects.toThrow(/not configured/)
    if (originalUrl !== undefined) process.env.LIVEKIT_URL = originalUrl
  })

  it('issues a real signed JWT scoped to the room and identity when configured', async () => {
    const originalUrl = process.env.LIVEKIT_URL
    const originalKey = process.env.LIVEKIT_API_KEY
    const originalSecret = process.env.LIVEKIT_API_SECRET
    process.env.LIVEKIT_URL = 'wss://example.livekit.cloud'
    process.env.LIVEKIT_API_KEY = 'vitest-key'
    process.env.LIVEKIT_API_SECRET = 'vitest-secret-at-least-32-bytes-long'
    try {
      const token = await createLiveKitToken('room-123', 'user-456', 'Vitest User')
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
      expect(payload.sub).toBe('user-456')
      expect(payload.name).toBe('Vitest User')
      expect(payload.video.room).toBe('room-123')
      expect(payload.video.roomJoin).toBe(true)
    } finally {
      if (originalUrl === undefined) delete process.env.LIVEKIT_URL; else process.env.LIVEKIT_URL = originalUrl
      if (originalKey === undefined) delete process.env.LIVEKIT_API_KEY; else process.env.LIVEKIT_API_KEY = originalKey
      if (originalSecret === undefined) delete process.env.LIVEKIT_API_SECRET; else process.env.LIVEKIT_API_SECRET = originalSecret
    }
  })
})

describe('GET /api/session-requests/[id]/livekit-token', () => {
  it('returns 503 when LiveKit is not configured', async () => {
    const originalUrl = process.env.LIVEKIT_URL
    delete process.env.LIVEKIT_URL
    mockUserId = testLearnerId
    const res = await getLiveKitToken(getRequest(`http://localhost/api/session-requests/${testSessionRequestId}/livekit-token`), { params: Promise.resolve({ id: testSessionRequestId }) })
    expect(res.status).toBe(503)
    if (originalUrl !== undefined) process.env.LIVEKIT_URL = originalUrl
  })

  it('returns 401 when not signed in, even if LiveKit is configured', async () => {
    process.env.LIVEKIT_URL = 'wss://example.livekit.cloud'
    process.env.LIVEKIT_API_KEY = 'vitest-key'
    process.env.LIVEKIT_API_SECRET = 'vitest-secret-at-least-32-bytes-long'
    mockUserId = ''
    const res = await getLiveKitToken(getRequest(`http://localhost/api/session-requests/${testSessionRequestId}/livekit-token`), { params: Promise.resolve({ id: testSessionRequestId }) })
    expect(res.status).toBe(401)
  })

  it('returns a real token scoped to the caller\'s own identity for a real session request', async () => {
    mockUserId = testOtherUserId
    const res = await getLiveKitToken(getRequest(`http://localhost/api/session-requests/${testSessionRequestId}/livekit-token?displayName=Observer`), { params: Promise.resolve({ id: testSessionRequestId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.roomName).toBe(testSessionRequestId)
    const payload = JSON.parse(Buffer.from(json.data.token.split('.')[1], 'base64url').toString())
    expect(payload.sub).toBe(testOtherUserId)
  })

  it('returns 404 for a session request that does not exist', async () => {
    mockUserId = testLearnerId
    const res = await getLiveKitToken(getRequest('http://localhost/api/session-requests/000000000000000000000000/livekit-token'), { params: Promise.resolve({ id: '000000000000000000000000' }) })
    expect(res.status).toBe(404)
  })
})
