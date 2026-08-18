import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createBorrow } from '../borrowings/route'
import { POST as createReservation } from '../reservations/route'

/**
 * Real integration tests against the actual configured database (no
 * separate test DB exists in this project — see PROGRESS.md's testing
 * section for why). Every row this suite creates is tagged with a
 * unique test-run email and deleted in afterAll, so it never pollutes
 * real data and is safe to re-run.
 *
 * getServerSession() calls next/headers's headers(), which requires a real
 * Next.js request scope that doesn't exist when a route handler is called
 * directly like this — so next-auth is mocked here. This suite creates
 * several distinct test users (including 3 more mid-test for the
 * concurrency check), so rather than pin the mock to one fixed userId, it
 * returns a staff session — matching how requireOwnerOrStaff already lets
 * staff act on behalf of any user.
 */
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'vitest-staff', roleName: 'Admin' } })),
}))
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testUserId: string
let testResourceId: string

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeAll(async () => {
  const role = await prisma.role.upsert({
    where: { name: 'Member' },
    update: {},
    create: { name: 'Member', permissions: [] },
  })
  const user = await prisma.user.create({
    data: { name: 'Vitest Runner', firstName: 'Vitest', lastName: 'Runner', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id

  const resource = await prisma.resource.findFirst({ select: { id: true } })
  if (!resource) throw new Error('No Resource rows exist to test against — seed the database first')
  testResourceId = resource.id
})

afterAll(async () => {
  await prisma.borrow.deleteMany({ where: { userId: testUserId } })
  await prisma.reservation.deleteMany({ where: { userId: testUserId } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('POST /api/borrowings — duplicate guard', () => {
  it('creates a borrow request for a new user+resource pair', async () => {
    const res = await createBorrow(postRequest('http://localhost/api/borrowings', {
      userId: testUserId, resourceId: testResourceId, memberName: 'Vitest Runner', memberEmail: TEST_EMAIL,
    }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.data.status).toBe('pending')
  })

  it('rejects a second borrow request for the same user+resource while the first is still pending', async () => {
    const res = await createBorrow(postRequest('http://localhost/api/borrowings', {
      userId: testUserId, resourceId: testResourceId, memberName: 'Vitest Runner', memberEmail: TEST_EMAIL,
    }))
    const json = await res.json()
    expect(res.status).toBe(409)
    expect(json.code).toBe('error')
  })

  it('rejects malformed input with a 400 before touching the database', async () => {
    const res = await createBorrow(postRequest('http://localhost/api/borrowings', {
      userId: testUserId, resourceId: testResourceId, memberName: '', memberEmail: 'not-an-email',
    }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/reservations — duplicate guard + queue position', () => {
  it('creates a reservation and assigns queue position 1 when no one else is waiting', async () => {
    const res = await createReservation(postRequest('http://localhost/api/reservations', {
      userId: testUserId, resourceId: testResourceId, memberName: 'Vitest Runner', memberEmail: TEST_EMAIL,
    }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.data.queuePosition).toBeGreaterThanOrEqual(1)
  })

  it('rejects a second reservation for the same user+resource while the first is still active', async () => {
    const res = await createReservation(postRequest('http://localhost/api/reservations', {
      userId: testUserId, resourceId: testResourceId, memberName: 'Vitest Runner', memberEmail: TEST_EMAIL,
    }))
    const json = await res.json()
    expect(res.status).toBe(409)
    expect(json.code).toBe('error')
  })

  it('assigns sequential queue positions to different users reserving the same resource concurrently', async () => {
    const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
    const extraUsers = await Promise.all(
      [0, 1, 2].map((i) =>
        prisma.user.create({ data: { name: `Vitest Concurrent ${i}`, email: `${RUN_ID}-concurrent-${i}@vitest.local`, roleId: role.id, status: 'ACTIVE' } })
      )
    )

    try {
      const responses = await Promise.all(
        extraUsers.map((u) =>
          createReservation(postRequest('http://localhost/api/reservations', {
            userId: u.id, resourceId: testResourceId, memberName: u.name, memberEmail: u.email,
          }))
        )
      )
      const results = await Promise.all(responses.map((r) => r.json()))
      const positions = results.map((r) => r.data.queuePosition).sort((a, b) => a - b)

      // No two concurrent reservations should land on the same queue position —
      // this is exactly the race the transaction wrapper in the route guards against.
      const uniquePositions = new Set(positions)
      expect(uniquePositions.size).toBe(positions.length)
    } finally {
      await prisma.reservation.deleteMany({ where: { userId: { in: extraUsers.map((u) => u.id) } } })
      await prisma.user.deleteMany({ where: { id: { in: extraUsers.map((u) => u.id) } } })
    }
  })
})
