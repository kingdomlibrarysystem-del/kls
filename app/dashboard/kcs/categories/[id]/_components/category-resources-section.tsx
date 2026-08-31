'use client'

import { Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable, type Column } from '@/components/ui/data-table'
import { UniversalButton } from '@/components/ui/universal-button'
import type { Resource, BindingType, MediaType } from '@/app/dashboard/library/_components/resources-data'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'

interface CategoryResourcesSectionProps {
  resources: Resource[]
}

/** Real Resources filed under this category (recursive for a root — includes every child's own resources), via the same categoryId FK join `resourceCountFor`/`resourcesForCategory` already establish. */
export function CategoryResourcesSection({ resources }: CategoryResourcesSectionProps) {
  if (resources.length === 0) {
    return <EmptyState icon={Package} title="No resources yet" description="No library resource is currently filed under this category." style={{ color: 'var(--text-secondary)' }} />
  }

  const columns: Column<Resource>[] = [
    {
      key: 'title', label: 'Title', sortable: true,
      render: (r) => (
        <UniversalButton href={`/dashboard/library/${r.id}`} variant="ghost" size="sm" className="!p-0 !h-auto font-semibold text-w-950 dark:text-white hover:text-w-600">
          {r.title}
        </UniversalButton>
      ),
    },
    { key: 'author', label: 'Author', sortable: true, render: (r) => r.author },
    { key: 'bindingType', label: 'Binding', render: (r) => bindingTypeLabels[r.bindingType as BindingType] },
    { key: 'mediaType', label: 'Media', render: (r) => mediaTypeLabels[r.mediaType as MediaType] },
    { key: 'price', label: 'Price', sortable: true, render: (r) => `${r.price.toLocaleString()} RWF` },
    {
      key: 'availableQty', label: 'Available', sortable: true,
      render: (r) => <span className={`font-semibold ${r.availableQty === 0 ? 'text-red-500' : 'text-w-950 dark:text-white'}`}>{r.availableQty}</span>,
    },
  ]

  return (
    <DataTable
      data={resources}
      columns={columns}
      rowKey={(r) => r.id}
      emptyMessage="No resources found."
      caption={`${resources.length} resource${resources.length !== 1 ? 's' : ''}`}
    />
  )
}
