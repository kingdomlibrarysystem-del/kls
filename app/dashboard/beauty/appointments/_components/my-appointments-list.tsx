'use client'

import { CalendarClock, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { beautyAppointmentStatusConfig, type BeautyAppointment } from '../../_shared/beauty-data'
import { cancelBeautyAppointment } from '../../_shared/use-beauty'

interface MyAppointmentsListProps {
  appointments: BeautyAppointment[]
}

/** Read + cancel view of the signed-in member's booked appointments, mirrors Health's MyAppointmentsList. */
export function MyAppointmentsList({ appointments }: MyAppointmentsListProps) {
  if (appointments.length === 0) {
    return <EmptyState icon={CalendarClock} title="No appointments yet" description="Book an appointment above to see it listed here." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-w-300 font-cinzel text-sm font-semibold text-w-950">My Appointments</div>
      {appointments.map((appt) => {
        const cancellable = appt.status === 'PENDING' || appt.status === 'CONFIRMED'
        return (
          <div key={appt.id} className="px-4 py-3 border-b border-w-200 last:border-b-0 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-40">
              <p className="font-lato text-sm font-semibold text-w-950">{appt.serviceName ?? 'Service'} — {appt.providerName ?? 'Provider'}</p>
              <p className="font-lato text-xs text-w-700">{new Date(appt.dateTime).toLocaleString()}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${beautyAppointmentStatusConfig[appt.status].cls}`}>
              {beautyAppointmentStatusConfig[appt.status].label}
            </span>
            {cancellable && (
              <button
                onClick={() => cancelBeautyAppointment(appt.id)}
                aria-label={`Cancel appointment with ${appt.providerName ?? 'provider'}`}
                className="flex items-center gap-1 text-xs font-lato font-semibold text-red-600 hover:text-red-800"
              >
                <XCircle size={13} /> Cancel
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
