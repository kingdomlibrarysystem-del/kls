import type { Metadata } from 'next'
import { NotFoundContent } from '@/components/app-shell/not-found-content'

export const metadata: Metadata = {
  title: 'Page not found — Kingdom Library',
}

/** Site-wide 404 (any unknown URL) — replaces Next's default "This page could not be found." */
export default function NotFound() {
  return <NotFoundContent />
}
