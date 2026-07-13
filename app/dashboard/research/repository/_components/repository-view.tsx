'use client'

import { useState, useEffect } from 'react'
import { FileText, Eye } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useRepository } from './use-repository'
import { paperStatusConfig, type ResearchPaper } from './repository-data'
import { PaperDetailModal } from './paper-detail-modal'
import { RepositoryStats } from './repository-stats'

/** Simulated network delay before mock papers become visible. */
const LOAD_DELAY_MS = 400

function buildColumns(onView: (p: ResearchPaper) => void): Column<ResearchPaper>[] {
  return [
    { key: 'title', label: 'Title', sortable: true, render: (p) => <span className="font-semibold text-w-950 max-w-55 truncate block">{p.title}</span> },
    { key: 'author', label: 'Author', sortable: true, render: (p) => <span className="text-w-700">{p.author}</span> },
    { key: 'project', label: 'Project', sortable: true, render: (p) => <span className="text-w-700 max-w-45 truncate block">{p.project}</span> },
    {
      key: 'keywords', label: 'Keywords',
      render: (p) => (
        <div className="flex flex-wrap gap-1 max-w-50">
          {p.keywords.map((k) => (
            <span key={k} className="px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">{k}</span>
          ))}
        </div>
      ),
    },
    { key: 'publishedAt', label: 'Published', sortable: true, render: (p) => <span className="text-w-700">{p.publishedAt}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (p) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${paperStatusConfig[p.status].cls}`}>
          {paperStatusConfig[p.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (p) => (
        <button onClick={() => onView(p)} aria-label={`View ${p.title}`} className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
          <Eye size={12} /> View
        </button>
      ),
    },
  ]
}

/**
 * Paper Repository: searchable by title or keyword. Shows a brief simulated
 * loading state, then a DataTable, or an EmptyState if a search yields no
 * results.
 */
export function RepositoryView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<ResearchPaper | null>(null)
  const papers = useRepository()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading paper repository">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (papers.length === 0) {
    return <EmptyState icon={FileText} title="No published papers yet" description="Approved research papers will appear here once submitted and published." />
  }

  return (
    <>
      <RepositoryStats />
      <DataTable<ResearchPaper>
        data={papers}
        columns={buildColumns(setViewing)}
        rowKey={(p) => p.id}
        searchPlaceholder="Search title or keyword..."
        searchFilter={(p, q) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
        }
        emptyMessage="No papers match your search."
      />
      <PaperDetailModal paper={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
