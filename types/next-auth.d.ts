import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?: ({
      id: string
      firstName: string
      lastName: string
      roleName: string
    } & DefaultSession['user']) | undefined
    /** This device's UserSession.jti — named sessionId (not jti) to avoid colliding with next-auth's own reserved JWT `jti` claim, which its encoder overwrites on every encode. */
    sessionId?: string
  }

  interface User {
    firstName: string
    lastName: string
    roleName: string
    sessionId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    firstName: string
    lastName: string
    roleName: string
    sessionId?: string
  }
}
