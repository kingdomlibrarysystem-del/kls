'use client'

import { CalendarClock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useRehabSchedule } from '../../_shared/use-rehab'
import { rehabSessionStatusConfig } from '../../_shared/rehab-data'

/** Read-only upcoming/past session list — staff schedules sessions, a member cannot self-book here (see /api/rehabilitation/schedule's staff-only POST). */
export function ScheduleView() {
  const { user } = useAuth()
  const sessions = useRehabSchedule(user?.id)

  if (sessions.length === 0) {
    return <EmptyState icon={CalendarClock} title="No sessions scheduled" description="Your program staff will schedule sessions here as your recovery plan develops." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      {sessions.map((s) => (
        <div key={s.id} className="px-4 py-3 border-b border-w-200 last:border-b-0 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <p className="font-lato text-sm font-semibold text-w-950">{s.focus}</p>
            <p className="font-lato text-xs text-w-700">
              {new Date(s.dateTime).toLocaleString()}
              {s.groupName && ` — ${s.groupName}`}
              {s.facilitatorName && ` · Facilitated by ${s.facilitatorName}`}
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${rehabSessionStatusConfig[s.status].cls}`}>
            {rehabSessionStatusConfig[s.status].label}
          </span>
        </div>
      ))}
    </div>
  )
}
