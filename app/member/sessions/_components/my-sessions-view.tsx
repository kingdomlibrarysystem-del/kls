'use client'

import { useState, useEffect } from 'react'
import { CalendarClock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests } from '@/app/lecturer/_shared/use-session-requests'
import { SessionCard } from '@/app/lecturer/_shared/session-card'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

/** Simulated network delay before mock session requests become visible. */
const LOAD_DELAY_MS = 300

/** This learner's own session requests, read from the real shared store — a request made from /member/courses appears here immediately. */
export function MySessionsView() {
  const [loading, setLoading] = useState(true)
  const requests = useSessionRequests()
  const mine = requests.filter((r) => r.learnerName === CURRENT_MEMBER_NAME)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Loading your sessions">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 90, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (mine.length === 0) {
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
      {mine.map((r) => (
        <SessionCard key={r.id} request={r} viewer="learner" />
      ))}
    </div>
  )
}
