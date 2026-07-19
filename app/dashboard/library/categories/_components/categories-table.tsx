import { FolderOpen, Eye, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { getParentName, resourceCountFor, type Category } from '@/lib/kcs-taxonomy'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'

interface CategoriesTableProps {
  categories: Category[]
  resources: Resource[]
  onView: (category: Category) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

/** DataTable of categories with View/Edit/Delete row actions, extracted from the original page.tsx (View added). Resource counts are computed live from `resources`, not a stored field. */
export function CategoriesTable({ categories, resources, onView, onEdit, onDelete }: CategoriesTableProps) {
  const columns: Column<Category>[] = [
    {
      key: 'name', label: 'Category', sortable: true,
      render: (c) => {
        const parentName = getParentName(c)
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-w-100 dark:bg-white/10 flex items-center justify-center shrink-0">
              <FolderOpen size={13} className="text-w-600" />
            </div>
            <div>
              <p className="font-semibold text-w-950 dark:text-white text-sm">{c.name.en}</p>
              {parentName && (
                <p className="text-xs text-w-600 dark:text-white/40 flex items-center gap-0.5">
                  <ChevronRight size={10} />{parentName}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'slug', label: 'Slug', sortable: true,
      render: (c) => <span className="font-mono text-xs text-w-600 dark:text-white/50 bg-w-100 dark:bg-white/5 px-2 py-0.5 rounded">{c.slug}</span>,
    },
    {
      key: 'name_fr', label: 'FR / RW',
      render: (c) => (
        <div className="text-xs text-w-700 dark:text-white/50 space-y-0.5">
          <p>{c.name.fr}</p>
          <p className="text-w-500 dark:text-white/30">{c.name.rw}</p>
        </div>
      ),
    },
    {
      key: 'resourceCount', label: 'Resources', sortable: true,
      render: (c) => {
        const count = resourceCountFor(c.id, resources)
        return <span className={`font-cinzel font-bold text-sm ${count > 0 ? 'text-w-600' : 'text-w-400 dark:text-white/30'}`}>{count}</span>
      },
    },
    {
      key: 'createdAt', label: 'Created', sortable: true,
      render: (c) => <span className="font-lato text-xs text-w-600 dark:text-white/40">{c.createdAt}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => onView(c)} aria-label={`View ${c.name.en}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 dark:bg-white/5 text-w-950 dark:text-white/70 border border-w-300 dark:border-white/10 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors">
            <Eye size={11} /> View
          </button>
          <button onClick={() => onEdit(c)} aria-label={`Edit ${c.name.en}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 dark:bg-white/5 text-w-950 dark:text-white/70 border border-w-300 dark:border-white/10 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors">
            <Pencil size={11} /> Edit
          </button>
          <button onClick={() => onDelete(c)} aria-label={`Delete ${c.name.en}`} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-xs font-lato hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<Category>
      data={categories}
      columns={columns}
      rowKey={(c) => c.id}
      searchPlaceholder="Search categories..."
      searchFilter={(c, q) => c.name.en.toLowerCase().includes(q) || c.name.fr.toLowerCase().includes(q) || c.name.rw.toLowerCase().includes(q) || c.slug.includes(q)}
      defaultPageSize={10}
      emptyMessage="No categories found."
    />
  )
}
