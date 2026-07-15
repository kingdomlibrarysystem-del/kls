'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FlaskConical, Upload, FileText, Eye, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockProjects } from '@/app/dashboard/research/collaborations/_components/collaborations-data'
import { useRepository } from '@/app/dashboard/research/repository/_components/use-repository'
import { CONTRIBUTOR_NAME } from '@/lib/identity/contributor-identity'
import { projectStatusConfig, type ResearchProjectSummary } from './my-research-data'
import { MyResearchDetailModal } from './my-research-detail-modal'
import { ContributorInitials } from './contributor-initials'

/** Simulated network delay before mock projects become visible. */
const LOAD_DELAY_MS = 400

/**
 * My Research: research projects this contributor is a member of, filtered
 * from the shared admin collaborations dataset by contributor membership.
 * Paper counts are computed live from the shared paper repository store, so
 * a paper submitted via "Submit Paper" (which links to the real admin form)
 * immediately counts here. Plus a "Submit Paper" entry point linking to the
 * existing admin `/dashboard/research/submit` form — see page-level note.
 */
export function MyResearchView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<ResearchProjectSummary | null>(null)
  const papers = useRepository()
  const myProjects = mockProjects.filter((p) => p.contributors.some((c) => c.name === CONTRIBUTOR_NAME))

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const papersForProject = (project: ResearchProjectSummary) =>
    papers.filter((p) => p.project === project.title && p.author === CONTRIBUTOR_NAME)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href="/dashboard/research/submit" className="btn btn-gold btn-sm" aria-label="Submit a research paper">
          <Upload size={13} /> Submit Paper
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Loading my research projects">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 88, borderRadius: 8 }} />
          ))}
        </div>
      ) : myProjects.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No research projects yet" description="Use Submit Paper above to link your first paper to a project." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myProjects.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="flex items-start justify-between gap-2">
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.title}</p>
                <span
                  className="shrink-0"
                  style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    border: `1px solid ${projectStatusConfig[p.status].border}`, background: projectStatusConfig[p.status].bg, color: projectStatusConfig[p.status].color,
                  }}
                >
                  {projectStatusConfig[p.status].label}
                </span>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.description}</p>

              <p className="flex items-center gap-1.5" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                <Calendar size={11} /> Started {p.startDate}
              </p>

              <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                <div className="flex items-center" style={{ marginLeft: 6 }}>
                  {p.contributors.map((c) => <ContributorInitials key={c.id} contributor={c} overlap />)}
                </div>
                <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  <FileText size={11} /> {papersForProject(p).length} {papersForProject(p).length === 1 ? 'paper' : 'papers'}
                </span>
              </div>

              <button
                onClick={() => setViewing(p)}
                aria-label={`View details for ${p.title}`}
                className="flex items-center justify-center gap-1.5"
                style={{ marginTop: 4, padding: '6px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                <Eye size={12} /> View Details
              </button>
            </div>
          ))}
        </div>
      )}

      <MyResearchDetailModal project={viewing} myPapers={viewing ? papersForProject(viewing) : []} onClose={() => setViewing(null)} />
    </div>
  )
}
