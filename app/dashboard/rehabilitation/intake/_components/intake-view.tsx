'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useRehabIntakes } from '../../_shared/use-rehab'
import { IntakeForm } from './intake-form'
import { MyIntakesList } from './my-intakes-list'

const LOAD_DELAY_MS = 400

/** Intake & Assessment: real submission form + the signed-in member's own intake history, mirrors Health's CheckupsView. */
export function IntakeView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const intakes = useRehabIntakes(user?.id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading intake">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <IntakeForm onSubmitted={() => showToast("Assessment submitted — a staff member will review it soon.")} />
      <MyIntakesList intakes={intakes} />
    </div>
  )
}
