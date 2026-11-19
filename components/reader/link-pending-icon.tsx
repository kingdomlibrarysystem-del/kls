'use client'

import { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'

/**
 * Put inside a <Link>: shows `icon` normally and a spinner while that link's
 * page is still opening — so a click on "Read" is answered at once instead of
 * looking like nothing happened while the reader loads.
 */
export function LinkPendingIcon({ icon, size = 14 }: { icon: React.ReactNode; size?: number }) {
  const { pending } = useLinkStatus()
  return pending ? <Loader2 size={size} className="animate-spin" aria-label="Opening…" /> : <>{icon}</>
}
