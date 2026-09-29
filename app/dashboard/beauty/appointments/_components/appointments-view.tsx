'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useBeautyAppointments } from '../../_shared/use-beauty'
import { BookAppointmentForm } from './book-appointment-form'
import { MyAppointmentsList } from './my-appointments-list'

/** Book an Appointment: real booking form + the signed-in member's own appointment list, mirrors Health's CheckupsView. */
export function AppointmentsView() {
  const { user } = useAuth()
  const [toast, setToast] = useState('')
  const appointments = useBeautyAppointments(user?.id)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <BookAppointmentForm onBooked={() => showToast("Appointment requested — you'll be notified once the provider confirms.")} />
      <MyAppointmentsList appointments={appointments} />
    </div>
  )
}
