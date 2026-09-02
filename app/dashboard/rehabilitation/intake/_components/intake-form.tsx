'use client'

import { useState } from 'react'
import { AlertCircle, ClipboardPlus } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { submitIntake } from '../../_shared/use-rehab'

interface IntakeFormProps {
  onSubmitted: () => void
}

/** Real intake-submission form writing a new SUBMITTED assessment for the signed-in member, mirrors Health's BookCheckupForm. */
export function IntakeForm({ onSubmitted }: IntakeFormProps) {
  const { user } = useAuth()
  const [concernArea, setConcernArea] = useState('')
  const [history, setHistory] = useState('')
  const [goals, setGoals] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!user) throw new Error('You must be signed in to submit an assessment')
      if (!concernArea.trim()) throw new Error('Describe your primary area of concern')
      if (!history.trim()) throw new Error('Briefly describe relevant history')
      if (!goals.trim()) throw new Error('Describe your recovery goals')

      submitIntake(user.id, { concernArea: concernArea.trim(), history: history.trim(), goals: goals.trim() })

      setConcernArea('')
      setHistory('')
      setGoals('')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this assessment')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-5 space-y-4 mb-6">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 flex items-center gap-2"><ClipboardPlus size={16} /> Intake & Assessment</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div>
        <FieldLabel htmlFor="concernArea" required>Area of Concern</FieldLabel>
        <textarea id="concernArea" rows={2} value={concernArea} onChange={(e) => setConcernArea(e.target.value)} placeholder="What are you seeking support for?" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" />
      </div>

      <div>
        <FieldLabel htmlFor="history" required>Relevant History</FieldLabel>
        <textarea id="history" rows={3} value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Any relevant background staff should know…" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" />
      </div>

      <div>
        <FieldLabel htmlFor="goals" required>Recovery Goals</FieldLabel>
        <textarea id="goals" rows={2} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="What would you like to achieve?" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" />
      </div>

      <ElegantButton type="submit" variant="primary" className="text-sm py-2">Submit Assessment</ElegantButton>
    </form>
  )
}
