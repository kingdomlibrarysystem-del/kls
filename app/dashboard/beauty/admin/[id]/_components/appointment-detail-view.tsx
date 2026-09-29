'use client'

import { useState } from 'react'
import { ArrowLeft, User, Palette, Scissors, Calendar, CheckCircle, CheckCheck, Ban } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { beautyAppointmentStatusConfig, type BeautyAppointment } from '../../../_shared/beauty-data'
import { confirmBeautyAppointment, completeBeautyAppointment, cancelBeautyAppointmentAdmin } from '../../../_shared/use-beauty-admin'

interface AppointmentDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialAppointment: BeautyAppointment
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/** Real details page for a single beauty appointment, mirrors borrowing-detail-view.tsx. */
export function AppointmentDetailView({ initialAppointment }: AppointmentDetailViewProps) {
  const id = initialAppointment.id
  const [appt, setAppt] = useState<BeautyAppointment | null>(initialAppointment)

  /** Re-reads the record after an action (the first copy comes from the server page); keeps the last known copy if the refresh fails. */
  const load = () => {
    fetch(`/api/beauty/appointments/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success' && json.data) setAppt(json.data) })
      .catch(() => {})
  }

  if (!appt) {
    return (
      <div>
        <PageHeader title="Appointment Details" />
        <EmptyState icon={Calendar} title="Appointment not found" description={'This appointment does not exist.'} />
        <div className="mt-4"><UniversalButton href="/dashboard/beauty/admin" variant="outline" icon={<ArrowLeft size={14} />}>Back to Appointments</UniversalButton></div>
      </div>
    )
  }

  const act = async (fn: (id: string) => Promise<BeautyAppointment>) => {
    try { await fn(id); load() } catch { /* real error surfaced via a future toast pass if needed */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/beauty/admin" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Appointments</UniversalButton>
        <div className="flex gap-2">
          {appt.status === 'PENDING' && <UniversalButton variant="outline" size="sm" icon={<CheckCircle size={13} />} onClick={() => act(confirmBeautyAppointment)}>Confirm</UniversalButton>}
          {appt.status === 'CONFIRMED' && <UniversalButton variant="outline" size="sm" icon={<CheckCheck size={13} />} onClick={() => act(completeBeautyAppointment)}>Complete</UniversalButton>}
          {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && <UniversalButton variant="destructive" size="sm" icon={<Ban size={13} />} onClick={() => act(cancelBeautyAppointmentAdmin)}>Cancel</UniversalButton>}
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{appt.serviceName ?? 'Service'}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${beautyAppointmentStatusConfig[appt.status].cls}`}>{beautyAppointmentStatusConfig[appt.status].label}</span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Member" value={appt.memberName ?? '—'} />
          <DetailRow icon={<Palette size={13} />} label="Provider" value={appt.providerName ?? '—'} />
          <DetailRow icon={<Scissors size={13} />} label="Service" value={`${appt.serviceName ?? '—'}${appt.priceRwf ? ` — ${appt.priceRwf.toLocaleString()} RWF` : ''}`} />
          <DetailRow icon={<Calendar size={13} />} label="Date/Time" value={new Date(appt.dateTime).toLocaleString()} />
          {appt.notes && <DetailRow icon={<Calendar size={13} />} label="Notes" value={appt.notes} />}
        </div>
      </div>
    </div>
  )
}
