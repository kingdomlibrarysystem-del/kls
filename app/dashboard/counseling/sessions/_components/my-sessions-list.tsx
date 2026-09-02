'use client'

import { CalendarClock, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { counselingSessionStatusConfig, counselingModeLabels, type CounselingSession } from '../../_shared/counseling-data'
import { cancelCounselingSession } from '../../_shared/use-counseling'

interface MySessionsListProps {
  sessions: CounselingSession[]
}

/** Read + cancel view of the signed-in member's requested sessions, mirrors Health's MyAppointmentsList. */
export function MySessionsList({ sessions }: MySessionsListProps) {
  if (sessions.length === 0) {
    return <EmptyState icon={CalendarClock} title="No sessions yet" description="Request a session above to see it listed here." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-w-300 font-cinzel text-sm font-semibold text-w-950">My Sessions</div>
      {sessions.map((s) => {
        const cancellable = s.status === 'PENDING' || s.status === 'CONFIRMED'
        return (
          <div key={s.id} className="px-4 py-3 border-b border-w-200 last:border-b-0 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-40">
              <p className="font-lato text-sm font-semibold text-w-950">{s.counselorName ?? 'Counselor'} — {counselingModeLabels[s.mode]}</p>
              <p className="font-lato text-xs text-w-700">{new Date(s.proposedTime).toLocaleString()} — {s.reason}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${counselingSessionStatusConfig[s.status].cls}`}>
              {counselingSessionStatusConfig[s.status].label}
            </span>
            {cancellable && (
              <button
                onClick={() => cancelCounselingSession(s.id)}
                aria-label={`Cancel session with ${s.counselorName ?? 'counselor'}`}
                className="flex items-center gap-1 text-xs font-lato font-semibold text-red-600 hover:text-red-800"
              >
                <XCircle size={13} /> Cancel
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
