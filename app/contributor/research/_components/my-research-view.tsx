'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FlaskConical, Upload, FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { myResearchProjects, projectStatusConfig } from './my-research-data'

/** Simulated network delay before mock projects become visible. */
const LOAD_DELAY_MS = 400

/**
 * My Research: this contributor's research projects, plus a "Submit Paper"
 * entry point. The entry point links to the existing admin
 * `/dashboard/research/submit` form rather than duplicating it here — see
 * page-level note.
 */
export function MyResearchView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

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
      ) : myResearchProjects.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No research projects yet" description="Use Submit Paper above to link your first paper to a project." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myResearchProjects.map((p) => (
            <div key={p.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded border text-xs font-lato font-semibold ${projectStatusConfig[p.status].cls}`}>
                  {projectStatusConfig[p.status].label}
                </span>
                <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  <FileText size={11} /> {p.paperCount}
                </span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
