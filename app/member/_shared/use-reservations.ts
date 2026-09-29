'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSharedList } from '@/lib/client/use-shared-list'
import type { Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

/** Fetches the signed-in member's own reservations from the real /api/reservations, filtered by their session userId. */
export function useReservations() {
  const { user } = useAuth()
  // Shared + de-duplicated per URL (see lib/client/use-shared-list.ts): every
  // component on a page reuses one request, revisits render cached data first.
  return useSharedList<Reservation>(user ? `/api/reservations?userId=${user.id}&pageSize=1000` : null)
}
