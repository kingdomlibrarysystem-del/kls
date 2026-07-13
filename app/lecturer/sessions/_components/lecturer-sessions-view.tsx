'use client'

import { useState, useEffect } from 'react'
import { CalendarClock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { LECTURER_NAME } from '@/app/lecturer/_components/lecturer-identity'
import { useSessionRequests } from '@/app/lecturer/_shared/use-session-requests'
import { SessionCard } from '@/app/lecturer/_shared/session-card'

/** Simulated network delay before mock session requests become visible. */
const LOAD_DELAY_MS = 300

/** This lecturer's own sessions (any status), read from the real shared store — reuses SessionCard, the same component /member/sessions renders. */
export function LecturerSessionsView() {
  const [loading, setLoading] = useState(true)
  const requests = useSessionRequests()
  const mine = requests.filter((r) => r.lecturerName === LECTURER_NAME && r.status !== 'PENDING')

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
        title="No sessions yet"
        description="Approved, rejected, and completed session requests will appear here."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {mine.map((r) => (
        <SessionCard key={r.id} request={r} viewer="lecturer" />
      ))}
    </div>
  )
}
