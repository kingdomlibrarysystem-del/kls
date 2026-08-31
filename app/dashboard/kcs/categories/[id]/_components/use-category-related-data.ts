'use client'

import { useMemo } from 'react'
import { resourcesForCategory } from '@/lib/kcs-taxonomy'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useBorrowingsAdmin } from '@/app/dashboard/library/borrowings/_components/use-borrowings-admin'
import { useReservationsAdmin } from '@/app/dashboard/reservations/_components/use-reservations-admin'
import { useOrdersAdmin } from '@/app/dashboard/library/sales/_components/use-orders-admin'
import type { CategoryMemberRow } from './category-members-section'

/**
 * Real, categoryId-derived related data for the category detail page —
 * fetches the same admin stores Resources/Borrowings/Reservations/Sales
 * already use, then joins Borrowings/Reservations/Orders down to this
 * category by real resourceId membership (no server-side categoryId
 * filter exists on those three endpoints today, so the join happens
 * client-side over each store's own resourceId field — same approach
 * `resourceCountFor`/`resourcesForCategory` already establish one level
 * up, for resources themselves).
 */
export function useCategoryRelatedData(categoryId: string) {
  const { data: allResources, loading: resourcesLoading, error: resourcesError } = useResources()
  const { data: allBorrowings, loading: borrowingsLoading, error: borrowingsError } = useBorrowingsAdmin()
  const { data: allReservations, loading: reservationsLoading, error: reservationsError } = useReservationsAdmin()
  const { data: allOrders, loading: ordersLoading, error: ordersError } = useOrdersAdmin()

  const resources = useMemo(() => resourcesForCategory(categoryId, allResources), [categoryId, allResources])

  const resourceIds = useMemo(() => new Set(resources.map((r) => r.id)), [resources])

  const borrowings = useMemo(() => allBorrowings.filter((b) => resourceIds.has(b.resourceId)), [allBorrowings, resourceIds])
  const reservations = useMemo(() => allReservations.filter((r) => resourceIds.has(r.resourceId)), [allReservations, resourceIds])
  const orders = useMemo(() => allOrders.filter((o) => resourceIds.has(o.resourceId)), [allOrders, resourceIds])

  const members = useMemo(() => {
    const byId = new Map<string, CategoryMemberRow>()
    for (const b of borrowings) {
      const existing = byId.get(b.memberId)
      if (existing) existing.borrowCount += 1
      else byId.set(b.memberId, { memberId: b.memberId, memberName: b.memberName, memberEmail: b.memberEmail, borrowCount: 1, reservationCount: 0 })
    }
    for (const r of reservations) {
      const existing = byId.get(r.memberId)
      if (existing) existing.reservationCount += 1
      else byId.set(r.memberId, { memberId: r.memberId, memberName: r.memberName, memberEmail: r.memberEmail, borrowCount: 0, reservationCount: 1 })
    }
    return Array.from(byId.values())
  }, [borrowings, reservations])

  const revenueRwf = useMemo(() => orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0), [orders])

  const loading = resourcesLoading || borrowingsLoading || reservationsLoading || ordersLoading
  const error = resourcesError ?? borrowingsError ?? reservationsError ?? ordersError

  return { resources, borrowings, reservations, orders, members, revenueRwf, loading, error }
}
