'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useBeautyAppointments, submitBeautyReview } from '../../_shared/use-beauty'

/** Prompts the member to review any COMPLETED-but-unreviewed appointment via a simple star-rating form. */
export function ReviewsView() {
  const { user } = useAuth()
  const appointments = useBeautyAppointments(user?.id)
  const [rating, setRating] = useState<Record<string, number>>({})
  const [comment, setComment] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')

  const reviewable = appointments.filter((a) => a.status === 'COMPLETED' && !submitted.has(a.id))

  const handleSubmit = async (appointmentId: string) => {
    if (!user) return
    try {
      await submitBeautyReview(user.id, appointmentId, rating[appointmentId] ?? 5, comment[appointmentId])
      setSubmitted((s) => new Set(s).add(appointmentId))
      setToast('Thanks for your review!')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not submit this review')
      setTimeout(() => setToast(''), 3000)
    }
  }

  if (reviewable.length === 0) {
    return <EmptyState icon={Star} title="No completed appointments to review" description="Once a beauty appointment is marked complete, you can rate it here." />
  }

  return (
    <div className="space-y-4">
      {toast && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      {reviewable.map((appt) => (
        <div key={appt.id} className="border border-w-300 rounded-lg bg-white p-4">
          <p className="font-lato text-sm font-semibold text-w-950 mb-2">{appt.serviceName ?? 'Service'} — {appt.providerName ?? 'Provider'}</p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating((r) => ({ ...r, [appt.id]: n }))} aria-label={`Rate ${n} stars`}>
                <Star size={20} className={n <= (rating[appt.id] ?? 5) ? 'text-yellow-500' : 'text-w-300'} fill={n <= (rating[appt.id] ?? 5) ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={comment[appt.id] ?? ''}
            onChange={(e) => setComment((c) => ({ ...c, [appt.id]: e.target.value }))}
            placeholder="Share your experience (optional)…"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none mb-3"
          />
          <ElegantButton type="button" variant="primary" className="text-sm py-2" onClick={() => handleSubmit(appt.id)}>Submit Review</ElegantButton>
        </div>
      ))}
    </div>
  )
}
