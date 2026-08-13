'use client'

import { useState } from 'react'
import { AlertCircle, CalendarPlus } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useClinics, bookAppointment } from '../../_shared/use-health'

interface BookCheckupFormProps {
  onBooked: () => void
}

/** Real booking form writing a new PENDING appointment for the signed-in member. */
export function BookCheckupForm({ onBooked }: BookCheckupFormProps) {
  const { user } = useAuth()
  const { data: clinics } = useClinics()
  const [clinicIdOverride, setClinicIdOverride] = useState('')
  const clinicId = clinicIdOverride || clinics[0]?.id || ''
  const [dateTime, setDateTime] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!user) throw new Error('You must be signed in to book a checkup')
      if (!clinicId) throw new Error('Select a clinic')
      if (!dateTime) throw new Error('Choose a proposed date and time')
      if (!reason.trim()) throw new Error('Briefly describe the reason for your visit')

      bookAppointment(user.id, { clinicId, dateTime: new Date(dateTime).toISOString(), reason: reason.trim() })

      setDateTime('')
      setReason('')
      onBooked()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book this checkup')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-5 space-y-4 mb-6">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 flex items-center gap-2"><CalendarPlus size={16} /> Book a Checkup</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div>
        <FieldLabel htmlFor="clinic" required>Clinic</FieldLabel>
        <select
          id="clinic"
          value={clinicId}
          onChange={(e) => setClinicIdOverride(e.target.value)}
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
        >
          {clinics.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.specialty}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="dateTime" required>Proposed Date &amp; Time</FieldLabel>
        <FormInput id="dateTime" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
      </div>

      <div>
        <FieldLabel htmlFor="reason" required>Reason for Visit</FieldLabel>
        <textarea
          id="reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Annual general checkup, follow-up on symptoms…"
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none"
        />
      </div>

      <ElegantButton type="submit" variant="primary" className="text-sm py-2">Request Appointment</ElegantButton>
    </form>
  )
}
