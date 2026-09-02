'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { addCounselingNote } from '../../../_shared/use-counseling-admin'

interface AddNoteFormProps {
  sessionId: string
  userId: string
  onAdded: () => void
}

/** Staff-only inline form to add a real CounselingNote for a session, extracted from the detail view per the 200-line cap. */
export function AddNoteForm({ sessionId, userId, onAdded }: AddNoteFormProps) {
  const { user } = useAuth()
  const [summary, setSummary] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (!user) throw new Error('You must be signed in to add a note')
      if (!summary.trim()) throw new Error('Summary is required')
      await addCounselingNote(sessionId, userId, user.id, summary.trim(), followUp.trim() || undefined)
      setSummary('')
      setFollowUp('')
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this note')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-4 space-y-3">
      <h3 className="font-cinzel text-xs font-semibold text-w-950 flex items-center gap-2"><FileText size={14} /> Add Session Note</h3>
      {error && <p className="font-lato text-xs text-red-700">{error}</p>}
      <div>
        <FieldLabel htmlFor="summary" required>Summary</FieldLabel>
        <textarea id="summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full px-3 py-2 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" />
      </div>
      <div>
        <FieldLabel htmlFor="followUp">Follow-up (optional)</FieldLabel>
        <textarea id="followUp" rows={2} value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="w-full px-3 py-2 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" />
      </div>
      <ElegantButton type="submit" variant="primary" className="text-xs py-1.5">Add Note</ElegantButton>
    </form>
  )
}
