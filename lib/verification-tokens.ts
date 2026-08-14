import crypto from 'crypto'
import prisma from '@/prisma/client'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24h for email verification
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1h for password reset

/** Creates a real, single-use token in the VerificationToken collection, keyed by email + a distinct `identifier` so verify-email and reset-password tokens for the same address never collide. */
async function createToken(email: string, identifier: string, ttlMs: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.verificationToken.deleteMany({ where: { email, identifier } })
  await prisma.verificationToken.create({
    data: { email, identifier, token, expires: new Date(Date.now() + ttlMs) },
  })
  return token
}

/** Consumes a token if it exists and hasn't expired — deletes it either way so it can never be replayed. */
async function consumeToken(email: string, identifier: string, token: string): Promise<boolean> {
  const record = await prisma.verificationToken.findFirst({ where: { email, identifier, token } })
  if (!record) return false
  await prisma.verificationToken.delete({ where: { id: record.id } })
  return record.expires.getTime() > Date.now()
}

export function createEmailVerificationToken(email: string) {
  return createToken(email, 'email-verify', TOKEN_TTL_MS)
}

export function consumeEmailVerificationToken(email: string, token: string) {
  return consumeToken(email, 'email-verify', token)
}

export function createPasswordResetToken(email: string) {
  return createToken(email, 'password-reset', RESET_TOKEN_TTL_MS)
}

export function consumePasswordResetToken(email: string, token: string) {
  return consumeToken(email, 'password-reset', token)
}
