'use client'

import { useState } from 'react'
import { AlertCircle, CalendarPlus } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useBeautyProviders, useBeautyServices, bookBeautyAppointment } from '../../_shared/use-beauty'

interface BookAppointmentFormProps {
  onBooked: () => void
}

/** Real booking form — provider select cascades into a service select scoped to that provider, mirrors Health's BookCheckupForm. */
export function BookAppointmentForm({ onBooked }: BookAppointmentFormProps) {
  const { user } = useAuth()
  const { data: providers } = useBeautyProviders()
  const [providerIdOverride, setProviderIdOverride] = useState('')
  const providerId = providerIdOverride || providers[0]?.id || ''
  const { data: services } = useBeautyServices(providerId)
  const [serviceIdOverride, setServiceIdOverride] = useState('')
  const serviceId = serviceIdOverride || services[0]?.id || ''
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!user) throw new Error('You must be signed in to book an appointment')
      if (!providerId) throw new Error('Select a provider')
      if (!serviceId) throw new Error('Select a service')
      if (!dateTime) throw new Error('Choose a proposed date and time')

      bookBeautyAppointment(user.id, { providerId, serviceId, dateTime: new Date(dateTime).toISOString(), notes: notes.trim() || undefined })

      setDateTime('')
      setNotes('')
      onBooked()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book this appointment')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-5 space-y-4 mb-6">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 flex items-center gap-2"><CalendarPlus size={16} /> Book an Appointment</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div>
        <FieldLabel htmlFor="provider" required>Provider</FieldLabel>
        <select
          id="provider"
          value={providerId}
          onChange={(e) => { setProviderIdOverride(e.target.value); setServiceIdOverride('') }}
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
        >
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="service" required>Service</FieldLabel>
        <select
          id="service"
          value={serviceId}
          onChange={(e) => setServiceIdOverride(e.target.value)}
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
        >
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.priceRwf.toLocaleString()} RWF ({s.durationMins} min)</option>)}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="dateTime" required>Proposed Date &amp; Time</FieldLabel>
        <FormInput id="dateTime" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
      </div>

      <div>
        <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any preferences or special requests…"
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none"
        />
      </div>

      <ElegantButton type="submit" variant="primary" className="text-sm py-2">Request Appointment</ElegantButton>
    </form>
  )
}
