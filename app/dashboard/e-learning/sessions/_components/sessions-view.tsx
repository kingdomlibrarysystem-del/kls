'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CalendarClock, Zap, CheckCircle, XCircle, Video } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests, approveSession, rejectSession } from '@/app/lecturer/_shared/use-session-requests'
import { sessionStatusConfig, type SessionRequest, type SessionStatus } from '@/app/lecturer/_shared/session-requests-data'
import { SessionDecisionModal } from '@/app/lecturer/sessions/requests/_components/session-decision-modal'
import { SessionsStats } from './sessions-stats'

/** Simulated network delay before mock session requests become visible. */
const LOAD_DELAY_MS = 400

type ModalAction = 'approve' | 'reject' | null

function buildColumns(onOpenModal: (r: SessionRequest, action: 'approve' | 'reject') => void): Column<SessionRequest>[] {
  return [
    { key: 'learnerName', label: 'Learner', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.learnerName}</span> },
    { key: 'lecturerName', label: 'Lecturer', sortable: true, render: (r) => <span className="text-w-700">{r.lecturerName}</span> },
    { key: 'courseTitle', label: 'Course', sortable: true, render: (r) => <span className="text-w-700 max-w-55 truncate block">{r.courseTitle}</span> },
    { key: 'requestedAt', label: 'Requested', sortable: true, render: (r) => <span className="text-w-700">{r.requestedAt}</span> },
    {
      key: 'scheduledAt', label: 'Scheduled', sortable: true,
      render: (r) => <span className="text-w-700">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</span>,
    },
    {
      key: 'mode', label: 'Mode', sortable: true,
      render: (r) => r.mode === 'INSTANT' ? (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-xs font-lato font-semibold w-fit">
          <Zap size={10} /> Instant
        </span>
      ) : <span className="text-w-500 text-xs">Scheduled</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${sessionStatusConfig[r.status].cls}`}>
          {sessionStatusConfig[r.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === 'PENDING' && (
            <>
              <button onClick={() => onOpenModal(r, 'approve')} aria-label={`Approve session request from ${r.learnerName}`} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
                <CheckCircle size={12} /> Approve
              </button>
              <button onClick={() => onOpenModal(r, 'reject')} aria-label={`Reject session request from ${r.learnerName}`} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
          {r.status !== 'PENDING' && (
            <Link href={`/dashboard/e-learning/sessions/${r.id}/room`} aria-label={`Enter room for session with ${r.learnerName}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-700 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <Video size={12} /> Room
            </Link>
          )}
        </div>
      ),
    },
  ]
}

/**
 * Admin oversight of every live-session request, across every lecturer —
 * now with real Approve/Reject actions (previously read-only; approving/
 * rejecting was only possible from the lecturer's own Session Requests
 * queue). Reuses the exact same approveSession()/rejectSession() store
 * functions and SessionDecisionModal component the lecturer UI calls —
 * no second parallel action path. This is a genuine superset of the
 * lecturer view: an admin can act on ANY request platform-wide, not just
 * ones for courses one specific lecturer teaches.
 */
export function SessionsView() {
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all')
  const [modalTarget, setModalTarget] = useState<SessionRequest | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [toast, setToast] = useState('')
  const requests = useSessionRequests()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }
  const closeModal = () => { setModalTarget(null); setModalAction(null) }

  const handleApprove = (scheduledAt: string, notes: string) => {
    if (!modalTarget) return
    approveSession(modalTarget.id, scheduledAt, notes || undefined)
    showToast(`Approved session with ${modalTarget.learnerName}`)
    closeModal()
  }

  const handleReject = (notes: string) => {
    if (!modalTarget) return
    rejectSession(modalTarget.id, notes)
    showToast(`Rejected session with ${modalTarget.learnerName}`)
    closeModal()
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading session requests">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const tableData = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter)

  const statusSelect = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
    >
      <option value="all">All Statuses</option>
      {(Object.keys(sessionStatusConfig) as SessionStatus[]).map((s) => (
        <option key={s} value={s}>{sessionStatusConfig[s].label}</option>
      ))}
    </select>
  )

  return (
    <>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <SessionsStats data={requests} />
      {requests.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No session requests yet" description="Requests learners make across all courses will appear here." />
      ) : (
        <DataTable<SessionRequest>
          data={tableData}
          columns={buildColumns((r, action) => { setModalTarget(r); setModalAction(action) })}
          rowKey={(r) => r.id}
          searchPlaceholder="Search learner, lecturer, or course..."
          searchFilter={(r, q) => r.learnerName.toLowerCase().includes(q) || r.lecturerName.toLowerCase().includes(q) || r.courseTitle.toLowerCase().includes(q)}
          filters={statusSelect}
          emptyMessage="No requests match your search."
        />
      )}

      <SessionDecisionModal
        request={modalTarget}
        action={modalAction}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  )
}
