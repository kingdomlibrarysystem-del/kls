import type { PublishedBook } from './catalog-data'

interface CatalogStatsProps {
  data: PublishedBook[]
}

/** Total published / featured stat cards — every row in this catalog is published by definition (Prisma status PUBLISHED), so "featured" is the one real split worth surfacing here. */
export function CatalogStats({ data }: CatalogStatsProps) {
  const featured = data.filter((b) => b.featured).length

  const stats = [
    { label: 'Total Published', value: data.length, color: 'text-w-950' },
    { label: 'Featured', value: featured, color: 'text-green-700' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 mb-5 max-w-md">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
