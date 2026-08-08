import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/client'

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: { select: { name: true } } },
        })
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
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
