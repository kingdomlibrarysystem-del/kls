'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useAppointments } from '../../_shared/use-health'
import { BookCheckupForm } from './book-checkup-form'
import { MyAppointmentsList } from './my-appointments-list'

/** Simulated network delay before appointments become visible. */
const LOAD_DELAY_MS = 400

/** Book a Checkup: real booking form + the signed-in member's own appointment list. */
export function CheckupsView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const appointments = useAppointments(user?.id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading checkups">
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <BookCheckupForm onBooked={() => showToast('Checkup requested — you\'ll be notified once the clinic confirms.')} />
      <MyAppointmentsList appointments={appointments} />
    </div>
  )
}
