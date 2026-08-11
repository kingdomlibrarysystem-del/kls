import NextAuth from 'next-auth'
import { NextResponse, type NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth-options'
import { checkRateLimit } from '@/lib/rate-limit'
import { ApiError } from '@/lib/api-error-handler'

const handler = NextAuth(authOptions)

/** Rate-limits only the credentials sign-in callback (the actual login attempt) — every other next-auth POST (session refresh, CSRF token, etc.) passes through untouched. */
async function rateLimitedPost(request: NextRequest, context: unknown) {
  if (request.nextUrl.pathname.endsWith('/callback/credentials')) {
    try {
      checkRateLimit(request, 'auth:login', { max: 10, windowMs: 15 * 60 * 1000 })
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }
  return handler(request, context)
}

export { handler as GET, rateLimitedPost as POST }
