'use client'

import { DataTable, type Column } from '@/components/ui/data-table'
import type { Resource, BindingType, MediaType } from '@/app/dashboard/library/_components/resources-data'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'

interface ScrollResourcesTableProps {
  resources: Resource[]
}

/** Table view of a scroll's matched Related Resources, reusing the shared `DataTable` primitive. */
export function ScrollResourcesTable({ resources }: ScrollResourcesTableProps) {
  const columns: Column<Resource>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (r) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</span> },
    { key: 'author', label: 'Author', sortable: true, render: (r) => r.author },
    { key: 'bindingType', label: 'Binding', render: (r) => bindingTypeLabels[r.bindingType as BindingType] },
    { key: 'mediaType', label: 'Media', render: (r) => mediaTypeLabels[r.mediaType as MediaType] },
    { key: 'price', label: 'Price', sortable: true, render: (r) => `${r.price.toLocaleString()} RWF` },
    {
      key: 'availableQty',
      label: 'Available',
      sortable: true,
      render: (r) => (
        <span style={{ fontWeight: 600, color: r.availableQty === 0 ? 'var(--red-light)' : 'var(--text-primary)' }}>
          {r.availableQty}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      data={resources}
      columns={columns}
      rowKey={(r) => r.id}
      emptyMessage="No related resources."
      caption={`${resources.length} related resource${resources.length !== 1 ? 's' : ''}`}
    />
  )
}
