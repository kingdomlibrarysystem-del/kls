'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { recordMilestone } from '../../../../_shared/use-rehab-schedule-admin'

interface RecordMilestoneFormProps {
  userId: string
  sessionId: string
  onRecorded: () => void
}

/** Staff-only inline form to log a real RehabMilestone for a session, extracted from the detail view per the 200-line cap. */
export function RecordMilestoneForm({ userId, sessionId, onRecorded }: RecordMilestoneFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (!user) throw new Error('You must be signed in to record a milestone')
      if (!title.trim()) throw new Error('Title is required')
      if (!description.trim()) throw new Error('Description is required')
      await recordMilestone(userId, user.id, title.trim(), description.trim(), sessionId)
      setTitle('')
      setDescription('')
      onRecorded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record this milestone')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-4 space-y-3">
      <h3 className="font-cinzel text-xs font-semibold text-w-950 flex items-center gap-2"><TrendingUp size={14} /> Record Milestone</h3>
      {error && <p className="font-lato text-xs text-red-700">{error}</p>}
      <div>
        <FieldLabel htmlFor="title" required>Title</FieldLabel>
        <FormInput id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <FieldLabel htmlFor="description" required>Description</FieldLabel>
        <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" />
      </div>
      <ElegantButton type="submit" variant="primary" className="text-xs py-1.5">Record Milestone</ElegantButton>
    </form>
  )
}
