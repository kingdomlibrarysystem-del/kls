import Image from 'next/image'
import Link from 'next/link'
import { Eye, Pencil, Archive, BookOpenCheck } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { UniversalButton } from '@/components/ui/universal-button'
import { getCategoryById } from '@/lib/kcs-taxonomy'
import { statusConfig, bindingTypeLabels, mediaTypeLabels, type Resource } from './resources-data'

interface ResourcesTableProps {
  data: Resource[]
  statusFilter: Resource['status'] | 'all'
  typeFilter: string
  onStatusFilterChange: (value: Resource['status'] | 'all') => void
  onTypeFilterChange: (value: string) => void
  onEdit: (resource: Resource) => void
  onArchive: (resource: Resource) => void
}

/** DataTable of library resources with View/Edit/Archive row actions and status/type filters. */
export function ResourcesTable({ data, statusFilter, typeFilter, onStatusFilterChange, onTypeFilterChange, onEdit, onArchive }: ResourcesTableProps) {
  const tableData = data.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchType = typeFilter === 'all' || r.type.toLowerCase() === typeFilter
    return matchStatus && matchType
  })

  const types = ['all', ...Array.from(new Set(data.map((r) => r.type.toLowerCase())))]

  const columns: Column<Resource>[] = [
    {
      key: 'title', label: 'Resource', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden bg-w-200">
            <Image src={r.coverImages[0]} alt={r.title} fill className="object-cover" />
          </div>
          <div>
            <p className="font-semibold text-w-950 max-w-45 truncate">{r.title}</p>
            <p className="text-xs text-w-600">{r.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryId', label: 'KCS Section', sortable: true,
      render: (r) => {
        const category = getCategoryById(r.categoryId)
        const rootCode = category ? getCategoryById(category.parentId ?? '')?.code : undefined
        return (
          <div>
            <p>{category?.name.en ?? 'Uncategorized'}</p>
            {rootCode && <span className="inline-block px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-mono font-semibold mt-0.5">{rootCode}</span>}
          </div>
        )
      },
    },
    { key: 'language', label: 'Lang', sortable: true, render: (r) => <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{r.language}</span> },
    {
      key: 'bindingType', label: 'Binding / Media', sortable: true,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">{bindingTypeLabels[r.bindingType]}</span>
          <span className="px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">{mediaTypeLabels[r.mediaType]}</span>
        </div>
      ),
    },
    {
      key: 'availableQty', label: 'Stock', sortable: true,
      render: (r) => (
        <div>
          <p className={`font-semibold ${r.availableQty === 0 ? 'text-red-700' : 'text-green-700'}`}>{r.availableQty} / {r.totalQty}</p>
          <p className="text-xs text-w-600">available / total</p>
        </div>
      ),
    },
    { key: 'price', label: 'Price', sortable: true, render: (r) => <span className="font-cinzel text-sm font-semibold text-w-600">{r.price.toLocaleString()} RWF</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[r.status].cls}`}>{statusConfig[r.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <UniversalButton
            href={`/dashboard/library/${r.id}`}
            variant="outline"
            size="sm"
            aria-label={`View ${r.title}`}
            icon={<Eye size={12} />}
            className="!px-2.5 !py-1 bg-w-100 text-w-950 border-w-300 hover:bg-w-200"
          >
            View
          </UniversalButton>
          <button onClick={() => onEdit(r)} aria-label={`Edit ${r.title}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
            <Pencil size={12} /> Edit
          </button>
          {r.status !== 'archived' && (
            <button onClick={() => onArchive(r)} aria-label={`Archive ${r.title}`} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
              <Archive size={12} /> Archive
            </button>
          )}
          {r.documentUrl && (
            <Link
              href={`/member/library/read/${r.id}`}
              target="_blank"
              aria-label={`Read ${r.title}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
            >
              <BookOpenCheck size={12} /> Read
            </Link>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable<Resource>
      data={tableData}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search title, author, ISBN..."
      searchFilter={(r, q) => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q) || r.isbn.includes(q) || (getCategoryById(r.categoryId)?.name.en.toLowerCase().includes(q) ?? false)}
      filters={
        <>
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as Resource['status'] | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(statusConfig) as Resource['status'][]).map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            {types.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </>
      }
      emptyMessage="No resources match your filters."
    />
  )
}
