'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, User, FileText, Target, ClipboardCheck, FilePlus2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { rehabIntakeStatusConfig, type RehabIntake } from '../../../../_shared/rehab-data'
import { reviewIntake, createPlanFromIntake, declineIntake } from '../../../../_shared/use-rehab-intake-admin'

interface IntakeDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Real details page for a single intake, mirrors Beauty/Counseling's detail-view pattern. */
export function IntakeDetailView({ id }: IntakeDetailViewProps) {
  const [intake, setIntake] = useState<RehabIntake | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    fetch(`/api/rehabilitation/intake/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !json.data) { setError(json.message ?? 'Intake not found'); return }
        setIntake(json.data)
      })
      .catch(() => setError('Failed to load intake'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { Promise.resolve().then(load) }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Intake Details" />
        <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-40 w-full rounded-lg" /></div>
      </div>
    )
  }

  if (error || !intake) {
    return (
      <div>
        <PageHeader title="Intake Details" />
        <EmptyState icon={FileText} title="Intake not found" description={error || 'This intake does not exist.'} />
        <div className="mt-4"><UniversalButton href="/dashboard/rehabilitation/admin/intake" variant="outline" icon={<ArrowLeft size={14} />}>Back to Intake Review</UniversalButton></div>
      </div>
    )
  }

  const act = async (fn: (id: string) => Promise<RehabIntake>) => {
    try { await fn(id); load() } catch { /* real error surfaced via a future toast pass if needed */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/rehabilitation/admin/intake" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Intake Review</UniversalButton>
        <div className="flex gap-2">
          {intake.status === 'SUBMITTED' && <UniversalButton variant="outline" size="sm" icon={<ClipboardCheck size={13} />} onClick={() => act(reviewIntake)}>Review</UniversalButton>}
          {intake.status === 'UNDER_REVIEW' && <UniversalButton variant="outline" size="sm" icon={<FilePlus2 size={13} />} onClick={() => act(createPlanFromIntake)}>Create Plan</UniversalButton>}
          {(intake.status === 'SUBMITTED' || intake.status === 'UNDER_REVIEW') && <UniversalButton variant="destructive" size="sm" icon={<XCircle size={13} />} onClick={() => act(declineIntake)}>Decline</UniversalButton>}
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{intake.concernArea}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${rehabIntakeStatusConfig[intake.status].cls}`}>{rehabIntakeStatusConfig[intake.status].label}</span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Member" value={intake.memberName ?? '—'} />
          <DetailRow icon={<FileText size={13} />} label="History" value={intake.history} />
          <DetailRow icon={<Target size={13} />} label="Goals" value={intake.goals} />
          {intake.reviewNotes && <DetailRow icon={<FileText size={13} />} label="Notes" value={intake.reviewNotes} />}
        </div>
      </div>
    </div>
  )
}
