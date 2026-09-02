'use client'

import { useState } from 'react'
import { AlertCircle, CalendarPlus } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useCounselors, requestCounselingSession } from '../../_shared/use-counseling'
import { counselingModeLabels, type CounselingSessionMode } from '../../_shared/counseling-data'

interface RequestSessionFormProps {
  onRequested: () => void
}

/** Real session-request form writing a new PENDING session for the signed-in member, mirrors Health's BookCheckupForm. */
export function RequestSessionForm({ onRequested }: RequestSessionFormProps) {
  const { user } = useAuth()
  const { data: counselors } = useCounselors()
  const [counselorIdOverride, setCounselorIdOverride] = useState('')
  const counselorId = counselorIdOverride || counselors[0]?.id || ''
  const [proposedTime, setProposedTime] = useState('')
  const [mode, setMode] = useState<CounselingSessionMode>('IN_PERSON')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!user) throw new Error('You must be signed in to request a session')
      if (!counselorId) throw new Error('Select a counselor')
      if (!proposedTime) throw new Error('Choose a proposed date and time')
      if (!reason.trim()) throw new Error('Briefly describe the reason for your session')

      requestCounselingSession(user.id, { counselorId, proposedTime: new Date(proposedTime).toISOString(), mode, reason: reason.trim() })

      setProposedTime('')
      setReason('')
      onRequested()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request this session')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-5 space-y-4 mb-6">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 flex items-center gap-2"><CalendarPlus size={16} /> Book a Session</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div>
        <FieldLabel htmlFor="counselor" required>Counselor</FieldLabel>
        <select
          id="counselor"
          value={counselorId}
          onChange={(e) => setCounselorIdOverride(e.target.value)}
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
        >
          {counselors.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.specialty}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="proposedTime" required>Proposed Date &amp; Time</FieldLabel>
          <FormInput id="proposedTime" type="datetime-local" value={proposedTime} onChange={(e) => setProposedTime(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="mode" required>Mode</FieldLabel>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as CounselingSessionMode)}
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
          >
            {(Object.keys(counselingModeLabels) as CounselingSessionMode[]).map((m) => <option key={m} value={m}>{counselingModeLabels[m]}</option>)}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="reason" required>Reason for Session</FieldLabel>
        <textarea
          id="reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe what you'd like to discuss…"
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none"
        />
      </div>

      <ElegantButton type="submit" variant="primary" className="text-sm py-2">Request Session</ElegantButton>
    </form>
  )
}
