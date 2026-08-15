'use client'

import { useState } from 'react'
import { PlusCircle, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCategories } from '@/lib/kcs-taxonomy/use-categories'
import { type Resource } from './resources-data'
import { useResources, addResource, updateResource, archiveResource } from './use-resources'
import { ResourcesStats } from './resources-stats'
import { ResourcesTable } from './resources-table'
import { ResourceFormModal } from './resource-form-modal'
import type { ResourceFormData } from './resource-form-schema'

/**
 * Book Inventory: full CRUD over the shared resources store — Create (via
 * modal, posted to the real Resource API), Details (existing modal, now
 * wired to Edit), Edit (pre-filled modal writing back via PATCH),
 * soft-Delete (Archive, a PATCH of `status`, already functional and left
 * unchanged in spirit). The public library browse/detail pages read this
 * same store, so changes here are immediately visible there.
 */
export function LibraryView() {
  const [statusFilter, setStatusFilter] = useState<Resource['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [toast, setToast] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const { data, loading: resourcesLoading, error: resourcesError } = useResources()
  const { loading: categoriesLoading, error: categoriesError } = useCategories()

  const loading = resourcesLoading || categoriesLoading
  const error = resourcesError ?? categoriesError

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleArchive = async (r: Resource) => {
    try {
      await archiveResource(r.id)
      showToast(`"${r.title}" archived.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not archive this resource — please try again.')
    }
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (r: Resource) => { setEditing(r); setFormOpen(true) }

  const handleSave = async (formData: ResourceFormData, editingId: string | null) => {
    try {
      const { coverImage, documentUrl, documentName, audioUrl, audioName, videoUrl, videoName, ...rest } = formData
      const fileFields = {
        documentUrl: documentUrl || undefined,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
      }
      if (editingId) {
        await updateResource(editingId, { ...rest, coverImages: [coverImage], ...fileFields })
        showToast(`Updated "${formData.title}".`)
      } else {
        await addResource({
          ...rest,
          type: 'Scroll',
          format: 'Physical',
          year: new Date().getFullYear(),
          availableQty: formData.totalQty,
          status: 'available',
          coverImages: [coverImage],
          ...fileFields,
        })
        showToast(`Added "${formData.title}".`)
      }
      setFormOpen(false)
      setEditing(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save this resource — please try again.')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" aria-label="Loading resources">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the book inventory" description={error} />
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <PageHeader className="mb-0" title="Book Inventory" subtitle="Kingdom Classification System — manage scrolls across all 8 KCS sections" />
        <ElegantButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5 shrink-0">
          <PlusCircle size={15} /> Add Resource
        </ElegantButton>
      </div>

      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <ResourcesStats data={data} />

      <ResourcesTable
        data={data}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onEdit={openEdit}
        onArchive={handleArchive}
      />

      <ResourceFormModal open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} onSave={handleSave} />
    </div>
  )
}
