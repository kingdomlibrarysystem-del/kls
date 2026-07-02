'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockProjects, type ResearchProjectSummary } from './collaborations-data'
import { ProjectCollaborationCard } from './project-collaboration-card'
import { ProjectDetailModal } from './project-detail-modal'

/** Simulated network delay before mock project data becomes visible. */
const LOAD_DELAY_MS = 400

/** Grid of research projects with their contributor lists, preceded by a brief simulated loading state. */
export function CollaborationsView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<ResearchProjectSummary | null>(null)

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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockProjects.map((project) => (
          <ProjectCollaborationCard key={project.id} project={project} onViewDetails={setViewing} />
        ))}
      </div>
      <ProjectDetailModal project={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
