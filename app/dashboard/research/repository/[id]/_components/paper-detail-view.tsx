'use client'

import { useEffect, useState } from 'react'
import { User, FolderOpen, CalendarDays, Tag, Hash, ArrowLeft, FileX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { paperStatusConfig, type ResearchPaper } from '../../_components/repository-data'

interface PaperDetailData extends ResearchPaper {
  abstract: string
}

interface PaperDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/**
 * Real details page for a single research paper, replacing the modal
 * that used to open from the Paper Repository table's "View" button.
 * Fetches directly from /api/research-papers/:id so this page also
 * works when linked to directly, without the list being loaded first.
 */
export function PaperDetailView({ id }: PaperDetailViewProps) {
  const [paper, setPaper] = useState<PaperDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/research-papers/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Research paper not found')
          return
        }
        setPaper(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load research paper') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Paper Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div>
        <PageHeader title="Paper Details" />
        <EmptyState icon={FileX} title="Paper not found" description={error || 'This research paper does not exist or was removed.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/research/repository" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Repository
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/research/repository" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Repository
        </UniversalButton>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{paper.title}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${paperStatusConfig[paper.status].cls}`}>
            {paperStatusConfig[paper.status].label}
          </span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Author" value={paper.author} />
          <DetailRow icon={<FolderOpen size={13} />} label="Project" value={paper.project} />
          <DetailRow icon={<CalendarDays size={13} />} label="Published" value={paper.publishedAt} />
          <DetailRow icon={<Hash size={13} />} label="ID" value={paper.id} />
        </div>

        {paper.abstract && (
          <div>
            <p className="font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">Abstract</p>
            <p className="font-lato text-sm text-w-950 bg-form-highlight border border-w-300 rounded p-3 whitespace-pre-wrap">
              {paper.abstract}
            </p>
          </div>
        )}

        <div>
          <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
            <Tag size={12} /> Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {paper.keywords.map((k) => (
              <span key={k} className="px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">{k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
