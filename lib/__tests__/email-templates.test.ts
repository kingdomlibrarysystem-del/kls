import { describe, it, expect } from 'vitest'
import { verificationEmailHtml, passwordResetEmailHtml } from '../email-templates'

describe('verificationEmailHtml', () => {
  it('embeds the verify URL and greets the user by first name', () => {
    const html = verificationEmailHtml('Jane', 'https://kcs.example.com/auth/verify-email?token=abc')
    expect(html).toContain('Jane')
    expect(html).toContain('https://kcs.example.com/auth/verify-email?token=abc')
    expect(html).toContain('Verify Email')
  })
})

describe('passwordResetEmailHtml', () => {
  it('embeds the reset URL and greets the user by first name', () => {
    const html = passwordResetEmailHtml('Jane', 'https://kcs.example.com/auth/reset-password?token=abc')
    expect(html).toContain('Jane')
    expect(html).toContain('https://kcs.example.com/auth/reset-password?token=abc')
    expect(html).toContain('Reset Password')
  })
})
