'use client'

import { useState, useEffect } from 'react'
import { Syringe, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CURRENT_MEMBER_NAME } from '../../_shared/health-data'
import { useImmunizations } from '../../_shared/use-health'

/** Simulated network delay before mock immunization entries become visible. */
const LOAD_DELAY_MS = 400

/** A next-due date in the past means a booster/follow-up is overdue. */
function isOverdue(nextDue?: string): boolean {
  return !!nextDue && new Date(nextDue) < new Date()
}

/** Read-only vaccination record + upcoming reminders for the current member. */
export function ImmunizationsView() {
  const [loading, setLoading] = useState(true)
  const immunizations = useImmunizations()
  const mine = immunizations.filter((i) => i.member === CURRENT_MEMBER_NAME)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading immunization records">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    )
  }

  if (mine.length === 0) {
    return <EmptyState icon={Syringe} title="No immunization records yet" description="Your vaccination history and upcoming reminders will appear here." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      {mine.map((imm) => {
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
