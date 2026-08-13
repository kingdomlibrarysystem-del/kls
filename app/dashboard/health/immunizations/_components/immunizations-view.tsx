'use client'

import { Syringe, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useImmunizations } from '../../_shared/use-health'

/** A next-due date in the past means a booster/follow-up is overdue. */
function isOverdue(nextDue?: string): boolean {
  return !!nextDue && new Date(nextDue) < new Date()
}

/** Read-only vaccination record + upcoming reminders for the signed-in member. */
export function ImmunizationsView() {
  const { user } = useAuth()
  const immunizations = useImmunizations(user?.id)

  if (immunizations.length === 0) {
    return <EmptyState icon={Syringe} title="No immunization records yet" description="Your vaccination history and upcoming reminders will appear here." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      {immunizations.map((imm) => {
        const overdue = isOverdue(imm.nextDue)
        return (
          <div key={imm.id} className="px-4 py-3 border-b border-w-200 last:border-b-0 flex items-center gap-3 flex-wrap">
            <Syringe size={16} className="text-w-600 shrink-0" />
            <div className="flex-1 min-w-40">
              <p className="font-lato text-sm font-semibold text-w-950">{imm.vaccine}</p>
              <p className="font-lato text-xs text-w-700">Administered {imm.dateAdministered}</p>
            </div>
            {imm.nextDue && (
              <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${
                overdue ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
              }`}>
                {overdue && <AlertTriangle size={11} />} Next due {imm.nextDue}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
