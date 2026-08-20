'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Archive, BookOpenCheck, BookX, Eye } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { ResourceFormModal } from '../../_components/resource-form-modal'
import { type Resource } from '../../_components/resources-data'
import { updateResource, archiveResource } from '../../_components/use-resources'
import { ResourceCoverGallery } from './resource-cover-gallery'
import { ResourceDetailRows, ResourceMediaLinks } from './resource-detail-rows'
import type { ResourceFormData } from '../../_components/resource-form-schema'

interface ResourceDetailViewProps {
  id: string
}

/**
 * Real details page for a single library resource, replacing the modal
 * that used to open from the Book Inventory table's "View" button.
 * Fetches directly from /api/resources/:id rather than relying on the
 * already-loaded list, so this page also works when linked to directly.
 */
export function ResourceDetailView({ id }: ResourceDetailViewProps) {
  const router = useRouter()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState('')
  const readableContent = useReadableContent()
  // A resource is readable either through real authored Chapter rows
  // (readableContent) or a real uploaded PDF (documentUrl) — ReaderView
  // itself already falls back to the page-native PdfReaderView for the
  // latter, but this button never showed for a PDF-only resource before
  // this fix, since readableContent only ever contains chapter-backed
  // resources (from /api/chapters, grouped by resource).
  const isReadable = !!resource && (!!readableContent[resource.id] || !!resource.documentUrl)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/resources/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Resource not found')
          return
        }
        setResource(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load resource') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSave = async (formData: ResourceFormData, editingId: string | null) => {
    if (!editingId) return
    try {
      // chapterTitle/chapterContent are create-only (see resource-form-media-files.tsx) and never sent here.
      const { coverImage, documentUrl, audioUrl, videoUrl, chapterTitle: _chapterTitle, chapterContent: _chapterContent, ...rest } = formData
      const updated = await updateResource(editingId, {
        ...rest,
        coverImages: [coverImage],
        documentUrl: documentUrl || undefined,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
      })
      setResource(updated)
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

  if (loading) {
    return (
      <div>
        <PageHeader title="Resource Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div>
        <PageHeader title="Resource Details" />
        <EmptyState icon={BookX} title="Resource not found" description={error || 'This resource does not exist or was deleted.'} />
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

      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <div className="flex flex-col md:flex-row gap-6">
        <ResourceCoverGallery resource={resource} />

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="font-cinzel text-lg font-semibold text-w-950 leading-snug">{resource.title}</h1>
            <p className="font-lato text-sm text-w-700 mt-0.5">by {resource.author}</p>
            <p className="font-cinzel text-base font-bold text-w-600 mt-1">{resource.price.toLocaleString()} RWF</p>
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
