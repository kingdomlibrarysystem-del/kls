'use client'

import { useEffect, useState } from 'react'
import { Calendar, Hash, Users, ArrowLeft, FolderX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { projectStatusConfig, type ResearchProjectSummary } from '../../_components/collaborations-data'
import { ContributorAvatar } from '../../_components/contributor-avatar'

interface ProjectDetailViewProps {
  id: string
}

/**
 * Real details page for a single research project's collaboration record,
 * replacing the modal that used to open from a collaboration card's "View
 * Details" button. Fetches directly from /api/research-projects/:id so
 * this page also works when linked to directly rather than requiring the
 * grid to already be loaded.
 */
export function ProjectDetailView({ id }: ProjectDetailViewProps) {
  const [project, setProject] = useState<ResearchProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/research-projects/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Research project not found')
          return
        }
        setProject(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load research project') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Project Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div>
        <PageHeader title="Project Details" />
        <EmptyState icon={FolderX} title="Project not found" description={error || 'This research project does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/research/collaborations" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Collaborations
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/research/collaborations" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Collaborations
        </UniversalButton>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{project.title}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${projectStatusConfig[project.status].cls}`}>
            {projectStatusConfig[project.status].label}
          </span>
        </div>

        <p className="font-lato text-sm text-w-700 leading-relaxed">{project.description}</p>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Calendar size={13} className="text-w-600 mt-0.5 shrink-0" />
            <span className="font-lato text-xs text-w-700 w-20 shrink-0">Started</span>
            <span className="font-lato text-sm text-w-950 font-medium">{project.startDate}</span>
          </div>
          <div className="flex items-start gap-2">
            <Hash size={13} className="text-w-600 mt-0.5 shrink-0" />
            <span className="font-lato text-xs text-w-700 w-20 shrink-0">ID</span>
            <span className="font-lato text-sm text-w-950 font-medium">{project.id}</span>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
            <Users size={12} /> Contributors ({project.contributors.length})
          </p>
          <ul className="space-y-2">
            {project.contributors.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <ContributorAvatar contributor={c} />
                <span className="font-lato text-sm text-w-950">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
