import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { roleNameToUserRole } from '@/lib/roles'

/**
 * Route protection — previously nonexistent: every /dashboard/* and
 * /member/* route was reachable server-side by an anonymous visitor,
 * enforced only client-side (a component checking useAuth() after the
 * page had already rendered/fetched). This is Edge-runtime middleware,
 * so per the NextAuth v4 constraint researched for this phase, it does
 * ONLY a cheap JWT presence/role check via getToken (Web Crypto, no
 * Node-only APIs, Edge-safe) — it does NOT re-check the UserSession
 * revocation table, since a Prisma/MongoDB call isn't available in Edge
 * runtime without switching middleware to the Node.js runtime. A
 * revoked-but-not-yet-expired session can therefore still pass THIS
 * gate; the actual revocation enforcement lives in lib/auth-options.ts's
 * `jwt` callback, which runs in the Node runtime on every
 * getServerSession()/useSession() call within a page/route — this
 * middleware is coarse routing protection, not the security boundary.
 */
const ADMIN_ROLES = new Set(['admin', 'manager', 'staff'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (pathname.startsWith('/dashboard')) {
    if (!token?.id) {
      return NextResponse.redirect(new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url))
    }
    const role = roleNameToUserRole(token.roleName ?? '')
    if (!ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/member', request.url))
    }
  }

  if (pathname.startsWith('/member')) {
    if (!token?.id) {
      return NextResponse.redirect(new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/member/:path*'],
}
