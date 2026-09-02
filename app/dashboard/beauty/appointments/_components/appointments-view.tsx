'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useBeautyAppointments } from '../../_shared/use-beauty'
import { BookAppointmentForm } from './book-appointment-form'
import { MyAppointmentsList } from './my-appointments-list'

const LOAD_DELAY_MS = 400

/** Book an Appointment: real booking form + the signed-in member's own appointment list, mirrors Health's CheckupsView. */
export function AppointmentsView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const appointments = useBeautyAppointments(user?.id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading appointments">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <BookAppointmentForm onBooked={() => showToast("Appointment requested — you'll be notified once the provider confirms.")} />
      <MyAppointmentsList appointments={appointments} />
    </div>
  )
}
