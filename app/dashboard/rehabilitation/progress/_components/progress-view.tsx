'use client'

import { TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useRehabProgress } from '../../_shared/use-rehab'

/** Read-only milestone timeline, mirrors Health's RecordsView. */
export function ProgressView() {
  const { user } = useAuth()
  const milestones = useRehabProgress(user?.id)

  if (milestones.length === 0) {
    return <EmptyState icon={TrendingUp} title="No milestones yet" description="Your program staff will log recovery milestones here as you progress." />
  }

  return (
    <div className="space-y-3">
      {milestones.map((m) => (
        <div key={m.id} className="border border-w-300 rounded-lg bg-white p-4">
          <p className="font-lato text-xs text-w-600 mb-1">{new Date(m.achievedAt).toLocaleDateString()}{m.recordedByName && ` · Logged by ${m.recordedByName}`}</p>
          <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-1">{m.title}</h3>
          <p className="font-lato text-sm text-w-700">{m.description}</p>
        </div>
      ))}
    </div>
  )
}
