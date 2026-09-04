import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as subscribe } from '../subscribe/route'

const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeAll(async () => {
  await prisma.newsletterSubscriber.deleteMany({ where: { email: TEST_EMAIL } })
})

afterAll(async () => {
  await prisma.newsletterSubscriber.deleteMany({ where: { email: TEST_EMAIL } })
})

describe('POST /api/newsletter/subscribe', () => {
  it('creates a new subscriber for a valid email', async () => {
    const res = await subscribe(postRequest('http://localhost/api/newsletter/subscribe', { email: TEST_EMAIL }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.email).toBe(TEST_EMAIL)
  })

  it('returns success for a duplicate email (idempotent)', async () => {
    const res = await subscribe(postRequest('http://localhost/api/newsletter/subscribe', { email: TEST_EMAIL }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.message).toBe('This email is already subscribed.')
  })

  it('normalizes email to lowercase', async () => {
    const upperEmail = `UPPER-${RUN_ID}@VITEST.LOCAL`
    const res = await subscribe(postRequest('http://localhost/api/newsletter/subscribe', { email: upperEmail }))
    expect(res.status).toBe(201)
    const db = await prisma.newsletterSubscriber.findUnique({ where: { email: upperEmail.toLowerCase() } })
    expect(db).not.toBeNull()
    await prisma.newsletterSubscriber.delete({ where: { email: upperEmail.toLowerCase() } })
  })

  it('rejects an invalid email with 400', async () => {
    const res = await subscribe(postRequest('http://localhost/api/newsletter/subscribe', { email: 'not-an-email' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe('error')
  })

  it('rejects a missing email field', async () => {
    const res = await subscribe(postRequest('http://localhost/api/newsletter/subscribe', {}))
    expect(res.status).toBe(400)
  })

  it('rejects a blank email', async () => {
    const res = await subscribe(postRequest('http://localhost/api/newsletter/subscribe', { email: '   ' }))
    expect(res.status).toBe(400)
  })
})
