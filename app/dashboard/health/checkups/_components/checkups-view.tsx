'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAppointments } from '../../_shared/use-health'
import { BookCheckupForm } from './book-checkup-form'
import { MyAppointmentsList } from './my-appointments-list'

/** Book a Checkup: real booking form + the signed-in member's own appointment list. */
export function CheckupsView() {
  const { user } = useAuth()
  const [toast, setToast] = useState('')
  const appointments = useAppointments(user?.id)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <BookCheckupForm onBooked={() => showToast('Checkup requested — you\'ll be notified once the clinic confirms.')} />
      <MyAppointmentsList appointments={appointments} />
    </div>
  )
}
