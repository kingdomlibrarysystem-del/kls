'use client'

import { CalendarClock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests } from '@/lib/sessions/use-session-requests'
import { SessionCard } from '@/lib/sessions/session-card'

/** This learner's own session requests, fetched from the real /api/session-requests filtered by the real session userId. */
export function MySessionsView() {
  const { data: requests, loading } = useSessionRequests()

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Loading your sessions">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 90, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No session requests yet"
        description='Use "Request Session" on My Courses to ask for a live Q&A with your lecturer.'
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {requests.map((r) => (
        <SessionCard key={r.id} request={r} viewer="learner" />
      ))}
    </div>
  )
}
