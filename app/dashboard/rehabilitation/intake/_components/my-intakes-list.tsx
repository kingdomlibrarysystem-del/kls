'use client'

import { ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { rehabIntakeStatusConfig, type RehabIntake } from '../../_shared/rehab-data'

interface MyIntakesListProps {
  intakes: RehabIntake[]
}

/** Read-only view of the signed-in member's submitted assessments — no cancel action, only staff-reviewed. */
export function MyIntakesList({ intakes }: MyIntakesListProps) {
  if (intakes.length === 0) {
    return <EmptyState icon={ClipboardList} title="No assessments yet" description="Submit an assessment above to see it listed here." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-w-300 font-cinzel text-sm font-semibold text-w-950">My Assessments</div>
      {intakes.map((intake) => (
        <div key={intake.id} className="px-4 py-3 border-b border-w-200 last:border-b-0 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <p className="font-lato text-sm font-semibold text-w-950">{intake.concernArea}</p>
            <p className="font-lato text-xs text-w-700">Submitted {new Date(intake.submittedAt).toLocaleDateString()}</p>
            {intake.reviewNotes && <p className="font-lato text-xs text-w-700 mt-1"><span className="font-semibold">Staff notes:</span> {intake.reviewNotes}</p>}
          </div>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${rehabIntakeStatusConfig[intake.status].cls}`}>
            {rehabIntakeStatusConfig[intake.status].label}
          </span>
        </div>
      ))}
    </div>
  )
}
