'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRehabIntakes } from '../../_shared/use-rehab'
import { IntakeForm } from './intake-form'
import { MyIntakesList } from './my-intakes-list'

/** Intake & Assessment: real submission form + the signed-in member's own intake history, mirrors Health's CheckupsView. */
export function IntakeView() {
  const { user } = useAuth()
  const [toast, setToast] = useState('')
  const intakes = useRehabIntakes(user?.id)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <IntakeForm onSubmitted={() => showToast("Assessment submitted — a staff member will review it soon.")} />
      <MyIntakesList intakes={intakes} />
    </div>
  )
}
