import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { authenticator } from 'otplib'
import prisma from '@/prisma/client'

/** Same x-forwarded-for/x-real-ip extraction as lib/rate-limit.ts's clientKey, applied here to attribute a login attempt to a real IP. */
function clientIp(headers: Record<string, string> | undefined): string {
  const forwardedFor = headers?.['x-forwarded-for']
  return forwardedFor?.split(',')[0]?.trim() || headers?.['x-real-ip'] || 'unknown'
}

/** Fire-and-forget: a login-history write must never block or fail the actual login. */
function logLoginAttempt(fields: { userId: string | null; email: string; ip: string; userAgent: string; success: boolean }) {
  prisma.loginHistory.create({ data: fields }).catch(() => {})
}

/**
 * Real credentials-based auth, replacing contexts/auth-context.tsx's
 * login() (which matched against 4 hardcoded mock personas and fell
 * back to a fake "member" identity on any unrecognized email — no
 * password check ever happened). JWT session strategy — no Prisma
 * adapter needed since Credentials doesn't do OAuth account linking;
 * the Account/Session/VerificationToken models already in schema.prisma
 * are unused by this config but harmless to leave (built for a future
 * OAuth provider, not removed here since that's out of this task's scope).
 *
 * Session revocation: NextAuth v4 throws UnsupportedStrategy if
 * session.strategy is "database" with only a Credentials provider (a
 * deliberate core-level guard — the adapter's database-session flow is
 * wired to the OAuth/Email signIn callback, not to authorize()'s return
 * value). So real "Sessions & Devices" revocation is layered on top of
 * JWT via a real UserSession table: a `sessionId` is embedded in the JWT
 * at sign-in, a matching UserSession row is created, and every
 * subsequent `jwt` callback invocation re-checks that row's `revokedAt`
 * — a revocable-JWT / server-side allowlist pattern. The JWT itself
 * remains cryptographically valid until `maxAge`; enforcement is this
 * callback rejecting a session whose row has been revoked, which is why
 * `maxAge` is kept short (see `session.maxAge` below) rather than
 * NextAuth's default 30 days — that bounds how stale a "not yet
 * re-checked" session can be if a revocation somehow missed a check
 * point.
 *
 * IMPORTANT: this custom claim is named `sessionId`, NOT `jti` — NextAuth
 * v4's own JWT encoder (next-auth/jwt/index.js's `encode()`) calls
 * `.setJti(uuid())` unconditionally on every encode, silently
 * overwriting any `token.jti` an app callback sets. Discovered by
 * observing every login's very next session read decode a completely
 * different jti than the one just persisted to UserSession — costly to
 * debug, so documented here to prevent re-introducing the bug.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'Authenticator Code', type: 'text' },
      },
      async authorize(credentials, req) {
        const ip = clientIp(req.headers)
        const userAgent = req.headers?.['user-agent'] || 'unknown'

        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: { select: { name: true } }, twoFactorSecret: true },
        })
        if (!user || !user.password) {
          logLoginAttempt({ userId: null, email: credentials.email, ip, userAgent, success: false })
          return null
        }

        const validPassword = await bcrypt.compare(credentials.password, user.password)
        if (!validPassword) {
          logLoginAttempt({ userId: user.id, email: user.email, ip, userAgent, success: false })
          return null
        }

        if (user.twoFactorSecret?.enabled) {
          const code = credentials.totpCode?.trim()
          const validTotp = !!code && (
            authenticator.check(code, user.twoFactorSecret.secret) ||
            consumeRecoveryCode(user.id, user.twoFactorSecret.recoveryCodes, code)
          )
          if (!validTotp) {
            logLoginAttempt({ userId: user.id, email: user.email, ip, userAgent, success: false })
            return null
          }
        }

        logLoginAttempt({ userId: user.id, email: user.email, ip, userAgent, success: true })

        const sessionId = randomUUID()
        await prisma.userSession.create({ data: { jti: sessionId, userId: user.id, userAgent, ip } })

        return {
          id: user.id,
          name: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          roleName: user.role?.name ?? 'Member',
          sessionId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in: the UserSession row was just created in
        // authorize() in the same request — trust it here rather than
        // re-reading it back immediately.
        token.id = user.id
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.roleName = user.roleName
        token.sessionId = (user as { sessionId?: string }).sessionId
        return token
      }

      /**
       * Re-checked on every subsequent session read: if this token's
       * session row has been revoked (or deleted) since the last check,
       * invalidate the token by clearing its id — next-auth treats a
       * session with no user.id as unauthenticated. This is the actual
       * revocation enforcement point.
       */
      if (token.sessionId) {
        const dbSession = await prisma.userSession.findUnique({ where: { jti: token.sessionId as string } })
        if (!dbSession || dbSession.revokedAt) {
          token.id = undefined
        } else {
          prisma.userSession.update({ where: { jti: token.sessionId as string }, data: { lastActive: new Date() } }).catch(() => {})
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.roleName = token.roleName as string
        session.sessionId = token.sessionId as string
      } else {
        // Revoked session — next-auth's useSession()/getServerSession() will report unauthenticated.
        return { ...session, user: undefined, expires: new Date(0).toISOString() }
      }
      return session
    },
  },
}

/**
 * A recovery code is single-use: if it matches, it's atomically removed
 * from the stored list so it can't be replayed. Returns false (without
 * consuming anything) if no code matches.
 */
function consumeRecoveryCode(userId: string, codes: string[], candidate: string): boolean {
  const normalized = candidate.trim().toUpperCase()
  if (!codes.includes(normalized)) return false
  prisma.twoFactorSecret.update({
    where: { userId },
    data: { recoveryCodes: codes.filter((c) => c !== normalized) },
  }).catch(() => {})
  return true
}
