'use client'

import { useState, useEffect } from 'react'
import { FileText, Pill, ArrowRightCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CURRENT_MEMBER_NAME, clinics } from '../../_shared/health-data'
import { useHealthRecords } from '../../_shared/use-health'

/** Simulated network delay before mock health records become visible. */
const LOAD_DELAY_MS = 400

/** Read-only consultation history for the current member — no clinic portal exists yet to write these, so this is a real but read-only view. */
export function RecordsView() {
  const [loading, setLoading] = useState(true)
  const records = useHealthRecords()
  const mine = records.filter((r) => r.member === CURRENT_MEMBER_NAME)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading health records">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      </div>
    )
  }

  if (mine.length === 0) {
    return <EmptyState icon={FileText} title="No health records yet" description="Your consultation history, prescriptions, and referrals will appear here after a checkup." />
  }

  return (
    <div className="space-y-4">
      {mine.map((rec) => {
        const clinic = clinics.find((c) => c.id === rec.clinicId)
        return (
          <div key={rec.id} className="bg-white border border-w-300 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="font-cinzel text-sm font-semibold text-w-950">{clinic?.name ?? 'Unknown clinic'}</h3>
              <span className="font-lato text-xs text-w-600">{rec.date}</span>
            </div>
            <p className="font-lato text-sm text-w-700 leading-relaxed mb-3">{rec.summary}</p>

            {rec.prescriptions.length > 0 && (
              <div className="mb-2">
                <p className="font-lato text-xs font-semibold text-w-950 flex items-center gap-1.5 mb-1"><Pill size={12} /> Prescriptions</p>
                <ul className="font-lato text-xs text-w-700 space-y-1 pl-5 list-disc">
                  {rec.prescriptions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {rec.referral && (
              <p className="font-lato text-xs text-w-700 flex items-start gap-1.5 mt-2 pt-2 border-t border-w-200">
                <ArrowRightCircle size={13} className="mt-0.5 shrink-0" /> {rec.referral}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
