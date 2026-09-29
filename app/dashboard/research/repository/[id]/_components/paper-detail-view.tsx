'use client'

import { User, FolderOpen, CalendarDays, Tag, Hash, ArrowLeft, FileX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { paperStatusConfig, type ResearchPaper } from '../../_components/repository-data'

export interface PaperDetailData extends ResearchPaper {
  abstract: string
}

interface PaperDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialPaper: PaperDetailData
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
 * Real details page for a single research paper, replacing the modal
 * that used to open from the Paper Repository table's "View" button.
 * The paper is loaded on the server by page.tsx.
 */
export function PaperDetailView({ initialPaper }: PaperDetailViewProps) {
  const paper: PaperDetailData | null = initialPaper

  if (!paper) {
    return (
      <div>
        <PageHeader title="Paper Details" />
        <EmptyState icon={FileX} title="Paper not found" description={'This research paper does not exist or was removed.'} />
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
