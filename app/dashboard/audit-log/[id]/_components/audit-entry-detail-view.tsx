'use client'

import { ArrowLeft, User, Target, CalendarClock, Globe, Hash, StickyNote, ScrollText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuditLog } from '../../_components/use-audit-log'
import { auditActionLabels } from '../../_components/audit-log-data'

interface AuditEntryDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium break-words">{value ?? '—'}</span>
    </div>
  )
}

/**
 * Real details page for a single audit-log entry, replacing the modal that
 * used to open from the Audit Log table's "View" button. Looks the entry up
 * out of the already-loaded list (via the existing `useAuditLog` hook, which
 * pulls `pageSize=1000` in one call) rather than fetching by id directly —
 * there is no `/api/audit-log/[id]` route, and audit entries are always
 * bulk-loaded already for the table/stats above this page, so a dedicated
 * by-id endpoint would just duplicate data the client already fetches.
 */
export function AuditEntryDetailView({ id }: AuditEntryDetailViewProps) {
  const { data: entries, loading } = useAuditLog()
  const entry = entries.find((e) => e.id === id)

  if (loading) {
    return (
      <div>
        <PageHeader title="Audit Entry Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div>
        <PageHeader title="Audit Entry Details" />
        <EmptyState icon={ScrollText} title="Audit entry not found" description="This audit entry does not exist." />
        <div className="mt-4">
          <UniversalButton href="/dashboard/audit-log" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Audit Log
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/audit-log" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Audit Log
        </UniversalButton>
      </div>

      <div className="max-w-2xl space-y-4">
        <span className="inline-block px-2.5 py-0.5 rounded border border-w-300 bg-w-100 text-w-950 text-xs font-lato font-semibold">
          {auditActionLabels[entry.action]}
        </span>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Actor" value={entry.actor} />
          <DetailRow icon={<Target size={13} />} label="Target" value={entry.target} />
          <DetailRow icon={<CalendarClock size={13} />} label="Time" value={new Date(entry.timestamp).toLocaleString()} />
          <DetailRow icon={<Globe size={13} />} label="IP" value={entry.ipAddress} />
          <DetailRow icon={<Hash size={13} />} label="ID" value={entry.id} />
        </div>

        <div>
          <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-1.5">
            <StickyNote size={12} /> Notes
          </p>
          <p className="font-lato text-sm text-w-700 leading-relaxed">{entry.notes ?? 'No notes recorded.'}</p>
        </div>
      </div>
    </div>
  )
}
