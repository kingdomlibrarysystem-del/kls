'use client'

import { useState, useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ElegantButton } from '@/components/ui/elegant-button'
import { type Resource } from './resources-data'
import { useResources, addResource, updateResource, archiveResource } from './use-resources'
import { ResourcesStats } from './resources-stats'
import { ResourcesTable } from './resources-table'
import { ResourceDetailModal } from './resource-detail-modal'
import { ResourceFormModal } from './resource-form-modal'
import type { ResourceFormData } from './resource-form-schema'

/** Simulated network delay before mock resources become visible. */
const LOAD_DELAY_MS = 400

/**
 * Book Inventory: full CRUD over the shared resources store — Create (via
 * modal, appended to the store), Details (existing modal, now wired to
 * Edit), Edit (pre-filled modal writing back to the store), soft-Delete
 * (Archive, already functional and left unchanged). The public library
 * browse/detail pages read this same store, so changes here are
 * immediately visible there.
 */
export function LibraryView() {
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Resource | null>(null)
  const [statusFilter, setStatusFilter] = useState<Resource['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [toast, setToast] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const data = useResources()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleArchive = (r: Resource) => {
    try {
      archiveResource(r.id)
      setSelected(null)
      showToast(`"${r.title}" archived.`)
    } catch {
      showToast('Could not archive this resource — please try again.')
    }
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (r: Resource) => { setEditing(r); setSelected(null); setFormOpen(true) }

  const handleSave = (formData: ResourceFormData, editingId: string | null) => {
    try {
      const { coverImage, documentUrl, documentName, audioUrl, audioName, videoUrl, videoName, ...rest } = formData
      const fileFields = {
        documentUrl: documentUrl || undefined,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
      }
      if (editingId) {
        updateResource(editingId, { ...rest, coverImages: [coverImage], ...fileFields })
        showToast(`Updated "${formData.title}".`)
      } else {
        const newResource: Resource = {
          id: crypto.randomUUID(),
          ...rest,
          type: 'Scroll',
          format: 'Physical',
          year: new Date().getFullYear(),
          availableQty: formData.totalQty,
          status: 'available',
          coverImages: [coverImage],
          ...fileFields,
        }
        addResource(newResource)
        showToast(`Added "${formData.title}".`)
      }
      setFormOpen(false)
      setEditing(null)
    } catch {
      showToast('Could not save this resource — please try again.')
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
        onView={setSelected}
        onEdit={openEdit}
        onArchive={handleArchive}
      />

      <ResourceDetailModal resource={selected} onClose={() => setSelected(null)} onEdit={openEdit} onArchive={handleArchive} />
      <ResourceFormModal open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} onSave={handleSave} />
    </div>
  )
}
