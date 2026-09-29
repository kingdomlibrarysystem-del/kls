'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCounselingSessions } from '../../_shared/use-counseling'
import { RequestSessionForm } from './request-session-form'
import { MySessionsList } from './my-sessions-list'

/** Book a Session: real request form + the signed-in member's own session list, mirrors Health's CheckupsView. */
export function SessionsView() {
  const { user } = useAuth()
  const [toast, setToast] = useState('')
  const sessions = useCounselingSessions(user?.id)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <RequestSessionForm onRequested={() => showToast("Session requested — you'll be notified once the counselor confirms.")} />
      <MySessionsList sessions={sessions} />
    </div>
  )
}
