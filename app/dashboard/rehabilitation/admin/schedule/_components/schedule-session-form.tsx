'use client'

import { useState } from 'react'
import { AlertCircle, CalendarPlus } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useUsers } from '@/app/dashboard/users/_components/use-users'
import { useSupportGroups } from '../../../_shared/use-rehab'
import { scheduleSession } from '../../../_shared/use-rehab-schedule-admin'

interface ScheduleSessionFormProps {
  onScheduled: () => void
}

/** Staff-only form to create a real RehabSession for a member, extracted from the admin list page per the 200-line cap. */
export function ScheduleSessionForm({ onScheduled }: ScheduleSessionFormProps) {
  const { users } = useUsers()
  const { data: groups } = useSupportGroups()
  const [userId, setUserId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [focus, setFocus] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (!userId) throw new Error('Select a member')
      if (!dateTime) throw new Error('Choose a date and time')
      if (!focus.trim()) throw new Error('Describe the session focus')

      await scheduleSession({ userId, groupId: groupId || undefined, dateTime: new Date(dateTime).toISOString(), focus: focus.trim() })
      setDateTime('')
      setFocus('')
      onScheduled()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule this session')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-form-highlight border border-w-300 rounded-lg p-5 space-y-4 mb-6">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 flex items-center gap-2"><CalendarPlus size={16} /> Schedule Session</h3>
      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs"><AlertCircle size={13} /> {error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="member" required>Member</FieldLabel>
          <select id="member" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none">
            <option value="">Select a member…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="group">Support Group (optional)</FieldLabel>
          <select id="group" value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none">
            <option value="">None</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="dateTime" required>Date &amp; Time</FieldLabel>
        <FormInput id="dateTime" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
      </div>

      <div>
        <FieldLabel htmlFor="focus" required>Session Focus</FieldLabel>
        <FormInput id="focus" type="text" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Weekly check-in" />
      </div>

      <ElegantButton type="submit" variant="primary" className="text-sm py-2">Schedule Session</ElegantButton>
    </form>
  )
}
