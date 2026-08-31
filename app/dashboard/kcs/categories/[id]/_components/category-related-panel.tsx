'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { Category } from '@/lib/kcs-taxonomy'
import { useCategoryRelatedData } from './use-category-related-data'
import { CategoryRelatedTabs, type CategoryRelatedTab } from './category-related-tabs'
import { CategoryResourcesSection } from './category-resources-section'
import { CategoryAnalyticsSection } from './category-analytics-section'
import { CategoryBorrowingsSection } from './category-borrowings-section'
import { CategoryReservationsSection } from './category-reservations-section'
import { CategoryMembersSection } from './category-members-section'
import { CategoryFinanceSection } from './category-finance-section'
import { CategoryCoursesSection } from './category-courses-section'

interface CategoryRelatedPanelProps {
  category: Category
}

/**
 * Tabbed related-data area for the category detail page: real, categoryId-
 * derived Resources/Analytics/Borrowings/Reservations/Members/Finance, plus
 * an honest "not yet linked" Courses placeholder (see CategoryCoursesSection).
 * Fetches once via useCategoryRelatedData and passes the already-filtered
 * slices down — no section re-fetches or re-derives on its own.
 */
export function CategoryRelatedPanel({ category }: CategoryRelatedPanelProps) {
  const [tab, setTab] = useState<CategoryRelatedTab>('resources')
  const { resources, borrowings, reservations, orders, members, revenueRwf, loading, error } = useCategoryRelatedData(category.id)

  if (loading) {
    return (
      <div className="space-y-3 mt-6" aria-label="Loading category-related data">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load related data" description={error} style={{ marginTop: 24 }} />
  }

  return (
    <div className="mt-6">
      <CategoryRelatedTabs
        active={tab}
        counts={{ resources: resources.length, analytics: 0, borrowings: borrowings.length, reservations: reservations.length, members: members.length, finance: orders.length, courses: 0 }}
        onChange={setTab}
      />

      {tab === 'resources' && <CategoryResourcesSection resources={resources} />}
      {tab === 'analytics' && (
        <CategoryAnalyticsSection
          categoryName={category.name.en}
          resources={resources}
          borrowings={borrowings}
          reservations={reservations}
          memberCount={members.length}
          revenueRwf={revenueRwf}
        />
      )}
      {tab === 'borrowings' && <CategoryBorrowingsSection borrowings={borrowings} />}
      {tab === 'reservations' && <CategoryReservationsSection reservations={reservations} />}
      {tab === 'members' && <CategoryMembersSection members={members} />}
      {tab === 'finance' && <CategoryFinanceSection orders={orders} />}
      {tab === 'courses' && <CategoryCoursesSection />}
    </div>
  )
}
