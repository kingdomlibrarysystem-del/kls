'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useCounselingSessions } from '../../_shared/use-counseling'
import { RequestSessionForm } from './request-session-form'
import { MySessionsList } from './my-sessions-list'

const LOAD_DELAY_MS = 400

/** Book a Session: real request form + the signed-in member's own session list, mirrors Health's CheckupsView. */
export function SessionsView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const sessions = useCounselingSessions(user?.id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading sessions">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <RequestSessionForm onRequested={() => showToast("Session requested — you'll be notified once the counselor confirms.")} />
      <MySessionsList sessions={sessions} />
    </div>
  )
}
