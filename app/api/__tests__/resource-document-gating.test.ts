import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import prisma from '@/prisma/client'
import { GET as getEntitlement } from '../resources/[id]/entitlement/route'
import { GET as getDocument } from '../resources/[id]/download/route'

/**
 * Real integration tests against the actual configured database (see
 * chapters-entitlement.test.ts / borrow-reserve-concurrency.test.ts for
 * the same pattern). Covers the PDF reading/download gate added
 * alongside the existing chapter paywall — a PDF-only resource
 * previously had zero entitlement checks at all.
 */
let mockUserId = 'vitest-doc-user'
let mockRoleName = 'Member'
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: mockUserId, roleName: mockRoleName } })),
}))

const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testUserId: string
let testResourceId: string
let testOrderId = ''

async function makeThreePagePdfDataUrl(): Promise<string> {
  const doc = await PDFDocument.create()
  doc.addPage()
  doc.addPage()
  doc.addPage()
  const bytes = await doc.save()
  return `data:application/pdf;base64,${Buffer.from(bytes).toString('base64')}`
}

function getRequest(url: string) {
  return new NextRequest(url)
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const user = await prisma.user.create({
    data: { name: 'Vitest Doc', firstName: 'Vitest', lastName: 'Doc', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id
  mockUserId = testUserId

  const documentUrl = await makeThreePagePdfDataUrl()
  const resource = await prisma.resource.create({
    data: {
      title: `Vitest PDF Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 3, isbn: `vitest-doc-${RUN_ID}`, price: 5000, freePreviewChapterCount: 1,
      totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'DOCUMENT', description: '',
      tags: [], documentUrl,
    },
  })
  testResourceId = resource.id
})

afterAll(async () => {
  if (testOrderId) await prisma.order.deleteMany({ where: { id: testOrderId } })
  await prisma.resource.delete({ where: { id: testResourceId } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('GET /api/resources/[id]/entitlement', () => {
  it('is not entitled and cannot download before any purchase', async () => {
    mockRoleName = 'Member'
    const res = await getEntitlement(getRequest(`http://localhost/api/resources/${testResourceId}/entitlement`), { params: Promise.resolve({ id: testResourceId }) })
    const json = await res.json()
    expect(json.data.entitled).toBe(false)
    expect(json.data.canDownload).toBe(false)
    expect(json.data.freePreviewPages).toBe(1)
  })

  it('forces the non-entitled view for staff when preview=1 is passed', async () => {
    mockRoleName = 'Admin'
    const res = await getEntitlement(getRequest(`http://localhost/api/resources/${testResourceId}/entitlement?preview=1`), { params: Promise.resolve({ id: testResourceId }) })
    const json = await res.json()
    expect(json.data.entitled).toBe(false)
    expect(json.data.canDownload).toBe(false)
  })

  it('is entitled for staff without preview=1', async () => {
    mockRoleName = 'Admin'
    const res = await getEntitlement(getRequest(`http://localhost/api/resources/${testResourceId}/entitlement`), { params: Promise.resolve({ id: testResourceId }) })
    const json = await res.json()
    expect(json.data.entitled).toBe(true)
    mockRoleName = 'Member'
  })

  it('grants canDownload only for a PAID SALE order, not a RENTAL', async () => {
    const rental = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: TEST_EMAIL, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'DOCUMENT', type: 'RENTAL',
        amountRwf: 5000, status: 'PAID', paypackRef: `${RUN_ID}-rental`, stripeSessionId: `${RUN_ID}-rental-st`,
      },
    })
    const res = await getEntitlement(getRequest(`http://localhost/api/resources/${testResourceId}/entitlement`), { params: Promise.resolve({ id: testResourceId }) })
    const json = await res.json()
    expect(json.data.entitled).toBe(true)
    expect(json.data.canDownload).toBe(false)
    await prisma.order.delete({ where: { id: rental.id } })
  })
})

describe('GET /api/resources/[id]/download', () => {
  it('rejects a member with no PAID SALE order', async () => {
    const res = await getDocument(getRequest(`http://localhost/api/resources/${testResourceId}/download`), { params: Promise.resolve({ id: testResourceId }) })
    expect(res.status).toBe(403)
  })

  it('allows download once a PAID SALE order exists', async () => {
    const order = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: TEST_EMAIL, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'DOCUMENT', type: 'SALE',
        amountRwf: 5000, status: 'PAID', paypackRef: `${RUN_ID}-sale`, stripeSessionId: `${RUN_ID}-sale-st`,
      },
    })
    testOrderId = order.id
    const res = await getDocument(getRequest(`http://localhost/api/resources/${testResourceId}/download`), { params: Promise.resolve({ id: testResourceId }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('attachment')
  })
})
