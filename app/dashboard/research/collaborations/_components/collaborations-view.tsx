'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockProjects, type ResearchProjectSummary } from './collaborations-data'
import { ProjectCollaborationCard } from './project-collaboration-card'
import { ProjectDetailModal } from './project-detail-modal'
import { CollaborationsStats } from './collaborations-stats'

/** Simulated network delay before mock project data becomes visible. */
const LOAD_DELAY_MS = 400

/**
 * Grid of research projects with their contributor lists, preceded by a
 * brief simulated loading state. The "Contributor" filter reproduces the
 * "my research" framing `/contributor/research` used to provide over
 * this exact `mockProjects` data.
 */
export function CollaborationsView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<ResearchProjectSummary | null>(null)
  const [contributorFilter, setContributorFilter] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Loading collaborations">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (mockProjects.length === 0) {
    return <EmptyState icon={Users} title="No research projects yet" description="Projects and their contributors will appear here once created." />
  }

  const contributors = Array.from(new Set(mockProjects.flatMap((p) => p.contributors.map((c) => c.name)))).sort()
  const filtered = contributorFilter === 'all' ? mockProjects : mockProjects.filter((p) => p.contributors.some((c) => c.name === contributorFilter))

  return (
    <>
      <CollaborationsStats />
      <div className="mb-4">
        <select
          value={contributorFilter}
          onChange={(e) => setContributorFilter(e.target.value)}
          className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          aria-label="Filter by contributor"
        >
          <option value="all">All Contributors</option>
          {contributors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No projects found" description="This contributor isn't listed on any project." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCollaborationCard key={project.id} project={project} onViewDetails={setViewing} />
          ))}
        </div>
      )}
      <ProjectDetailModal project={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
