'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Archive, BookOpenCheck, BookX, Eye } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useMediaTypes } from '@/lib/client/use-media-types'
import { mediaCapabilities } from '@/lib/media-types-shared'
import { ResourceFormModal } from '../../_components/resource-form-modal'
import { type Resource, isResourceReadable } from '../../_components/resources-data'
import { updateResource, archiveResource } from '../../_components/use-resources'
import { realChaptersFrom, syncResourceChapters } from '../../_components/sync-resource-chapters'
import { ResourceCoverGallery } from './resource-cover-gallery'
import { ResourceDetailRows, ResourceMediaLinks } from './resource-detail-rows'
import type { ResourceFormData } from '../../_components/resource-form-schema'

interface ResourceDetailViewProps {
  /** GET /api/resources/[id] shape, loaded on the server by page.tsx (which 404s when missing). */
  initialResource: Resource
}

/**
 * Real details page for a single library resource, replacing the modal
 * that used to open from the Book Inventory table's "View" button.
 * The resource arrives from the server page (no fetch on mount).
 */
export function ResourceDetailView({ initialResource }: ResourceDetailViewProps) {
  const router = useRouter()
  const [resource, setResource] = useState<Resource | null>(initialResource)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState('')
  // Readable = real authored chapters (the server-derived chapterCount) or an
  // uploaded PDF. Previously this pulled the whole chapter catalog
  // (useReadableContent -> GET /api/chapters, every chapter body in the
  // library) just to answer this one yes/no question.
  const isReadable = !!resource && isResourceReadable(resource)
  const { mediaTypes } = useMediaTypes()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSave = async (formData: ResourceFormData, editingId: string | null) => {
    if (!editingId) return
    try {
      // `chapters` is client-only (see resource-form-media-files.tsx) — it is
      // not a Resource field, so it is split out of the PATCH body and
      // reconciled against the real Chapter rows below instead.
      const { coverImage, documentUrl, audioUrl, videoUrl, chapters, ...rest } = formData
      const realChapters = realChaptersFrom({ chapters }, mediaCapabilities(formData.mediaType, mediaTypes).allowsChapters)
      const updated = await updateResource(editingId, {
        ...rest,
        coverImages: [coverImage],
        documentUrl: documentUrl || undefined,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
      })
      // Previously the chapters were destructured away and never saved, so
      // authoring a TEXT book from THIS page's Edit button silently discarded
      // the whole book — the form even promises "edited chapters are updated,
      // new ones are added, and removed ones are deleted".
      await syncResourceChapters(editingId, realChapters)
      // Re-read so chapterCount (and so the Read button) reflects the chapter sync above.
      const fresh = await fetch(`/api/resources/${editingId}`).then((r) => r.json()).catch(() => null)
      setResource(fresh?.code === 'success' && fresh.data ? fresh.data : updated)
      setEditing(false)
      showToast(`Updated "${formData.title}".`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save this resource — please try again.')
    }
  }

  const handleArchive = async () => {
    if (!resource) return
    try {
      const updated = await archiveResource(resource.id)
      setResource(updated)
      showToast(`"${resource.title}" archived.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not archive this resource — please try again.')
    }
  }

  if (!resource) {
    return (
      <div>
        <PageHeader title="Resource Details" />
        <EmptyState icon={BookX} title="Resource not found" description="This resource does not exist or was deleted." />
        <div className="mt-4">
          <UniversalButton href="/dashboard/library" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Library
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/library" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Library
        </UniversalButton>
      </div>

      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <div className="flex flex-col md:flex-row gap-6">
        <ResourceCoverGallery resource={resource} />

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="font-cinzel text-lg font-semibold text-w-950 leading-snug">{resource.title}</h1>
            <p className="font-lato text-sm text-w-700 mt-0.5">by {resource.author}</p>
            <p className="font-cinzel text-base font-bold text-w-600 mt-1" suppressHydrationWarning>{resource.price.toLocaleString()} RWF <span className="font-lato text-xs font-semibold text-w-500">to reserve</span></p>
            <p className="font-lato text-xs text-w-600" suppressHydrationWarning>{resource.borrowPrice.toLocaleString()} RWF to borrow · {resource.borrowDurationDays} days</p>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3">
            <p className="font-lato text-xs text-w-700 leading-relaxed">{resource.description}</p>
          </div>

          <ResourceDetailRows resource={resource} />

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">#{t}</span>)}
            </div>
          )}

          <ResourceMediaLinks resource={resource} />

          <div className="flex gap-2 pt-2 border-t border-w-300">
            <ElegantButton variant="primary" className="flex items-center gap-1.5 text-xs py-2" onClick={() => setEditing(true)}>
              <Pencil size={13} /> Edit Resource
            </ElegantButton>
            {resource.status !== 'archived' && (
              <ElegantButton variant="outline" className="flex items-center gap-1.5 text-xs py-2" onClick={handleArchive}>
                <Archive size={13} /> Archive
              </ElegantButton>
            )}
            {isReadable && (
              <Link href={`/dashboard/library/read/${resource.id}`}>
                <ElegantButton variant="outline" className="flex items-center gap-1.5 text-xs py-2">
                  <BookOpenCheck size={13} /> Read
                </ElegantButton>
              </Link>
            )}
            {resource.documentUrl && resource.price > 0 && (
              <Link href={`/dashboard/library/read/${resource.id}?preview=1`}>
                <ElegantButton variant="outline" className="flex items-center gap-1.5 text-xs py-2">
                  <Eye size={13} /> Preview
                </ElegantButton>
              </Link>
            )}
          </div>
        </div>
      </div>

      <ResourceFormModal open={editing} editing={resource} onClose={() => setEditing(false)} onSave={handleSave} />
    </div>
  )
}
