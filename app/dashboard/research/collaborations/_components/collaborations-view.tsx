'use client'

import { useState } from 'react'
import { Users, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useResearchProjects } from '../../_shared/use-research-projects'
import { ProjectCollaborationCard } from './project-collaboration-card'
import { CollaborationsStats } from './collaborations-stats'

/**
 * Grid of research projects with their contributor lists, reading the
 * real ResearchProject collection. Read-only today — no create/edit/
 * delete UI exists for projects or their contributor lists. The
 * "Contributor" filter reproduces the "my research" framing
 * `/contributor/research` used to provide over this data.
 */
export function CollaborationsView() {
  const [contributorFilter, setContributorFilter] = useState('all')
  const { data: projects, loading, error } = useResearchProjects()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Loading collaborations">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load research projects" description={error} />
  }

  if (projects.length === 0) {
    return <EmptyState icon={Users} title="No research projects yet" description="Projects and their contributors will appear here once created." />
  }

  const contributors = Array.from(new Set(projects.flatMap((p) => p.contributors.map((c) => c.name)))).sort()
  const filtered = contributorFilter === 'all' ? projects : projects.filter((p) => p.contributors.some((c) => c.name === contributorFilter))

  return (
    <>
      <CollaborationsStats data={projects} />
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
            <ProjectCollaborationCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  )
}
