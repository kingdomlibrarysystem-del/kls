import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create your free Kingdom Library account — read books, take online courses and get certificates.',
  alternates: { canonical: '/auth/register' },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
