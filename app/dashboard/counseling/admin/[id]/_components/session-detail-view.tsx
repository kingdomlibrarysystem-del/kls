'use client'

import { useState } from 'react'
import { ArrowLeft, User, Users, Calendar, MessageCircle, CheckCircle, CheckCheck, Ban } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { counselingSessionStatusConfig, counselingModeLabels, type CounselingSession } from '../../../_shared/counseling-data'
import { confirmSession, completeSession, cancelSessionAdmin } from '../../../_shared/use-counseling-admin'
import { AddNoteForm } from './add-note-form'

interface SessionDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialSession: CounselingSession
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/** Real details page for a single counseling session, mirrors Beauty's AppointmentDetailView + adds an inline Add Note form. */
export function SessionDetailView({ initialSession }: SessionDetailViewProps) {
  const id = initialSession.id
  const [session, setSession] = useState<CounselingSession | null>(initialSession)
  const [noteAdded, setNoteAdded] = useState(0)

  /** Re-reads the record after an action (the first copy comes from the server page); keeps the last known copy if the refresh fails. */
  const load = () => {
    fetch(`/api/counseling/sessions/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success' && json.data) setSession(json.data) })
      .catch(() => {})
  }

  if (!session) {
    return (
      <div>
        <PageHeader title="Session Details" />
        <EmptyState icon={Calendar} title="Session not found" description={'This session does not exist.'} />
        <div className="mt-4"><UniversalButton href="/dashboard/counseling/admin" variant="outline" icon={<ArrowLeft size={14} />}>Back to Sessions</UniversalButton></div>
      </div>
    )
  }

  const act = async (fn: (id: string) => Promise<CounselingSession>) => {
    try { await fn(id); load() } catch { /* real error surfaced via a future toast pass if needed */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/counseling/admin" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Sessions</UniversalButton>
        <div className="flex gap-2">
          {session.status === 'PENDING' && <UniversalButton variant="outline" size="sm" icon={<CheckCircle size={13} />} onClick={() => act(confirmSession)}>Confirm</UniversalButton>}
          {session.status === 'CONFIRMED' && <UniversalButton variant="outline" size="sm" icon={<CheckCheck size={13} />} onClick={() => act(completeSession)}>Complete</UniversalButton>}
          {(session.status === 'PENDING' || session.status === 'CONFIRMED') && <UniversalButton variant="destructive" size="sm" icon={<Ban size={13} />} onClick={() => act(cancelSessionAdmin)}>Cancel</UniversalButton>}
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{session.reason}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${counselingSessionStatusConfig[session.status].cls}`}>{counselingSessionStatusConfig[session.status].label}</span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Member" value={session.memberName ?? '—'} />
          <DetailRow icon={<Users size={13} />} label="Counselor" value={`${session.counselorName ?? '—'} (${session.counselorSpecialty ?? '—'})`} />
          <DetailRow icon={<Calendar size={13} />} label="Date/Time" value={new Date(session.proposedTime).toLocaleString()} />
          <DetailRow icon={<MessageCircle size={13} />} label="Mode" value={counselingModeLabels[session.mode]} />
        </div>

        {session.userId && <AddNoteForm key={noteAdded} sessionId={id} userId={session.userId} onAdded={() => setNoteAdded((n) => n + 1)} />}
      </div>
    </div>
  )
}
