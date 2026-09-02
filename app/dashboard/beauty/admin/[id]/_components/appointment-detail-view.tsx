'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, User, Palette, Scissors, Calendar, CheckCircle, CheckCheck, Ban } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { beautyAppointmentStatusConfig, type BeautyAppointment } from '../../../_shared/beauty-data'
import { confirmBeautyAppointment, completeBeautyAppointment, cancelBeautyAppointmentAdmin } from '../../../_shared/use-beauty-admin'

interface AppointmentDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Real details page for a single beauty appointment, mirrors borrowing-detail-view.tsx. */
export function AppointmentDetailView({ id }: AppointmentDetailViewProps) {
  const [appt, setAppt] = useState<BeautyAppointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`/api/beauty/appointments/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !json.data) { setError(json.message ?? 'Appointment not found'); return }
        setAppt(json.data)
      })
      .catch(() => setError('Failed to load appointment'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Appointment Details" />
        <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-40 w-full rounded-lg" /></div>
      </div>
    )
  }

  if (error || !appt) {
    return (
      <div>
        <PageHeader title="Appointment Details" />
        <EmptyState icon={Calendar} title="Appointment not found" description={error || 'This appointment does not exist.'} />
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
