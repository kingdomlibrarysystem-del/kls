'use client'

import { GraduationCap } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Intentionally an honest "not yet linked" placeholder, not a fabricated
 * list — `Course.category` (course-form-schema.ts) is a free-text field
 * ("Theology", "Discipleship", ...) with zero structural link (no
 * categoryId, no slug match) to this KCS taxonomy, same confirmed gap
 * `scroll-detail-view.tsx` already documents one taxonomy level down.
 * Faking a course list against an unrelated field would be worse than
 * admitting the relationship doesn't exist yet.
 */
export function CategoryCoursesSection() {
  return (
    <EmptyState
      icon={GraduationCap}
      title="Not yet linked"
      description="Courses in the E-Learning catalog aren't linked to a KCS category yet — a course's own category field (e.g. Theology, Discipleship) is a separate concept from this taxonomy. This section will show real linked courses once that relationship exists."
      style={{ color: 'var(--text-secondary)' }}
    />
  )
}
