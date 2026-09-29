'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Hash, Layers, Calendar, Globe, ArrowLeft, Pencil, Trash2, FolderX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useCategories, removeCategory } from '@/lib/kcs-taxonomy/use-categories'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { resourceCountFor, type Category } from '@/lib/kcs-taxonomy'
import { DeleteCategoryModal } from '../../../_components/manage-categories/delete-category-modal'
import { CategoryEditModal } from './category-edit-modal'
import { CategoryRelatedPanel } from './category-related-panel'

interface CategoryDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialCategory: Category
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single KCS category: identity card + Edit/Delete,
 * plus a tabbed CategoryRelatedPanel below showing real, categoryId-joined
 * Resources/Analytics/Borrowings/Reservations/Members/Finance data (see
 * that component and use-category-related-data.ts for how each is derived)
 * and an honest "not yet linked" Courses placeholder. Fetches the category
 * itself directly from /api/categories/:id so this page also works when
 * linked to directly; parent name and live resource count still read from
 * the shared useCategories/useResources stores since the single-category
 * API response doesn't include either.
 */
export function CategoryDetailView({ initialCategory }: CategoryDetailViewProps) {
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(initialCategory)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { data: allCategories } = useCategories()
  const { data: resources } = useResources()

  const parentName = category?.parentId
    ? allCategories.find((c) => c.id === category.parentId)?.name.en ?? null
    : null
  const resourceCount = category ? resourceCountFor(category.id, resources) : 0
  const parentOptions = allCategories.filter((c) => !c.parentId && c.id !== category?.id)

  const handleDelete = async () => {
    if (!category) return
    await removeCategory(category.id)
    router.push('/dashboard/library/kcs')
  }

  if (!category) {
    return (
      <div>
        <PageHeader title="Category Details" />
        <EmptyState icon={FolderX} title="Category not found" description={'This category does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/library/kcs" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to KCS Map
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/library/kcs" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to KCS Map
        </UniversalButton>
        <div className="flex gap-2">
          <UniversalButton variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            Edit
          </UniversalButton>
          <UniversalButton variant="destructive" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleting(true)}>
            Delete
          </UniversalButton>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-w-100 flex items-center justify-center shrink-0">
            <FolderOpen size={22} className="text-w-600" />
          </div>
          <div>
            <h1 className="font-cinzel text-xl font-semibold text-w-950">{category.name.en}</h1>
            <p className="font-lato text-sm text-w-600">{parentName ?? 'Root category'}</p>
          </div>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<Hash size={13} />} label="Slug" value={category.slug} />
          <DetailRow icon={<Globe size={13} />} label="Français" value={category.name.fr} />
          <DetailRow icon={<Globe size={13} />} label="Kinyarwanda" value={category.name.rw} />
          <DetailRow icon={<Layers size={13} />} label="Resources" value={String(resourceCount)} />
          <DetailRow icon={<Calendar size={13} />} label="Created" value={category.createdAt} />
        </div>
      </div>

      <CategoryEditModal
        category={category}
        parentOptions={parentOptions}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={(updated) => { setCategory(updated); setEditing(false) }}
      />

      <DeleteCategoryModal category={deleting ? category : null} resourceCount={resourceCount} onClose={() => setDeleting(false)} onConfirm={handleDelete} />

      <CategoryRelatedPanel category={category} />
    </div>
  )
}
