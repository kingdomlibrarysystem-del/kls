'use client'

import { useState } from 'react'
import { FileText, Eye, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useRepository } from './use-repository'
import { paperStatusConfig, type ResearchPaper } from './repository-data'
import { RepositoryStats } from './repository-stats'

function buildColumns(): Column<ResearchPaper>[] {
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
        <UniversalButton
          href={`/dashboard/research/repository/${p.id}`}
          aria-label={`View ${p.title}`}
          variant="outline"
          size="sm"
          className="ml-auto"
          icon={<Eye size={12} />}
        >
          View
        </UniversalButton>
      ),
    },
  ]
}

/**
 * Paper Repository: searchable by title or keyword. Shows a brief simulated
 * loading state, then a DataTable, or an EmptyState if a search yields no
 * results. The "Author" filter reproduces the "my research" framing
 * `/contributor/research` used to provide over this exact store.
 */
export function RepositoryView() {
  const [authorFilter, setAuthorFilter] = useState('all')
  const { data: papers, loading, error } = useRepository()

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading paper repository">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the paper repository" description={error} />
  }

  if (papers.length === 0) {
    return <EmptyState icon={FileText} title="No published papers yet" description="Approved research papers will appear here once submitted and published." />
  }

  const authors = Array.from(new Set(papers.map((p) => p.author))).sort()
  const tableData = authorFilter === 'all' ? papers : papers.filter((p) => p.author === authorFilter)

  const authorSelect = (
    <select
      value={authorFilter}
      onChange={(e) => setAuthorFilter(e.target.value)}
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
      aria-label="Filter by author"
    >
      <option value="all">All Authors</option>
      {authors.map((a) => <option key={a} value={a}>{a}</option>)}
    </select>
  )

  return (
    <>
      <RepositoryStats />
      <DataTable<ResearchPaper>
        data={tableData}
        columns={buildColumns()}
        rowKey={(p) => p.id}
        searchPlaceholder="Search title or keyword..."
        searchFilter={(p, q) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
        }
        filters={authorSelect}
        emptyMessage="No papers match your search."
      />
    </>
  )
}
