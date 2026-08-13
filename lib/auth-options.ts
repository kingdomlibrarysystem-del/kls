import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
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
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const ip = clientIp(req.headers)
        const userAgent = req.headers?.['user-agent'] || 'unknown'

        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: { select: { name: true } } },
        })
        if (!user || !user.password) {
          logLoginAttempt({ userId: null, email: credentials.email, ip, userAgent, success: false })
          return null
        }

        const valid = await bcrypt.compare(credentials.password, user.password)
        logLoginAttempt({ userId: user.id, email: user.email, ip, userAgent, success: valid })
        if (!valid) return null

        return {
          id: user.id,
          name: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          roleName: user.role?.name ?? 'Member',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.roleName = user.roleName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.roleName = token.roleName as string
      }
      return session
    },
  },
}
