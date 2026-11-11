import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to your Kingdom Library account to read, learn and follow your courses.',
  alternates: { canonical: '/auth/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
