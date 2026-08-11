import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { appBaseUrl } from '../mailer'

describe('appBaseUrl', () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it('prefers NEXT_PUBLIC_BASE_URL when set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://kcs.example.com'
    process.env.NEXTAUTH_URL = 'https://should-not-be-used.example.com'
    expect(appBaseUrl()).toBe('https://kcs.example.com')
  })

  it('falls back to NEXTAUTH_URL when NEXT_PUBLIC_BASE_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    process.env.NEXTAUTH_URL = 'https://auth.example.com'
    expect(appBaseUrl()).toBe('https://auth.example.com')
  })

  it('falls back to localhost when neither is set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    delete process.env.NEXTAUTH_URL
    expect(appBaseUrl()).toBe('http://localhost:3000')
  })
})
