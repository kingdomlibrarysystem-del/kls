import type { Category } from './categories-data'

interface CategoriesStatsProps {
  categories: Category[]
}

/** Total categories / root sections / avg resources-per-category stat cards, derived from the same list state the table below renders. */
export function CategoriesStats({ categories }: CategoriesStatsProps) {
  const rootSections = categories.filter((c) => !c.parentId).length
  const totalResources = categories.reduce((sum, c) => sum + c.resourceCount, 0)
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
