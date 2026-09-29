'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSharedList } from '@/lib/client/use-shared-list'
import type { Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

/** Fetches the signed-in member's own borrowings from the real /api/borrowings, filtered by their session userId. */
export function useBorrowings() {
  const { user } = useAuth()
  // Shared + de-duplicated per URL (see lib/client/use-shared-list.ts): every
  // component on a page reuses one request, revisits render cached data first.
  return useSharedList<Borrowing>(user ? `/api/borrowings?userId=${user.id}&pageSize=1000` : null)
}
