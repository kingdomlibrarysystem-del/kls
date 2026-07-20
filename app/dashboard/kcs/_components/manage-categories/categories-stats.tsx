import { resourceCountFor, type Category } from '@/lib/kcs-taxonomy'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'

interface CategoriesStatsProps {
  categories: Category[]
  resources: Resource[]
}

/** Total categories / root sections / avg resources-per-category stat cards, derived from the same list state the table below renders. Resource counts are computed live, not stored. */
export function CategoriesStats({ categories, resources }: CategoriesStatsProps) {
  const rootSections = categories.filter((c) => !c.parentId).length
  // Sum only leaf categories' own counts to avoid double-counting a root's recursive total on top of its children.
  const totalResources = categories.filter((c) => c.parentId !== null).reduce((sum, c) => sum + resourceCountFor(c.id, resources), 0)
  const avgResources = categories.length > 0 ? Math.round((totalResources / categories.length) * 10) / 10 : 0

  const stats = [
    { label: 'Total Categories', value: categories.length, color: 'text-w-950' },
    { label: 'Root Sections', value: rootSections, color: 'text-w-600' },
    { label: 'Avg Resources / Category', value: avgResources, color: 'text-green-700' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
