'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSharedList } from '@/lib/client/use-shared-list'
import type { MemberCheckout } from '../orders/_components/orders-data'

/** Fetches the signed-in member's own combined checkouts from /api/checkout, filtered by their session userId. */
export function useCheckouts() {
  const { user } = useAuth()
  // Shared + de-duplicated per URL (see lib/client/use-shared-list.ts): every
  // component on a page reuses one request, revisits render cached data first.
  return useSharedList<MemberCheckout>(user ? `/api/checkout?userId=${user.id}` : null)
}
