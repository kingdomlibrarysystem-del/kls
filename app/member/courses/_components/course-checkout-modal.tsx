'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertCircle, Smartphone, CreditCard, XCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'

interface CourseCheckoutModalProps {
  course: CatalogCourse | null
  onClose: () => void
  onPaid: () => void
}

type Stage = 'form' | 'pending' | 'paid' | 'failed'

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 3 * 60_000

/**
 * Real course-payment checkout — sibling to (public)/library's
 * BuyConfirmModal rather than a shared component, since the two real
 * payment rails here (PayPack phone-prompt vs. a Stripe Checkout
 * redirect) change the flow shape enough that forcing them into one
 * resource-purchase component would make both harder to follow. Same
 * state machine and poll-fallback pattern though: form → pending →
 * paid/failed, polling GET /api/course-orders/:id as a fallback for
 * whichever webhook hasn't arrived yet.
 */
export function CourseCheckoutModal({ course, onClose, onPaid }: CourseCheckoutModalProps) {
  const { user } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState<Stage>('form')
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  if (!course) return null

  const startPolling = (id: string) => {
    const startedAt = Date.now()
    pollTimer.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setStage('failed')
        setError("We haven't received confirmation yet. Check back later — it may still complete.")
        return
      }
      try {
        const res = await fetch(`/api/course-orders/${id}`)
        const json = await res.json()
        if (json.data?.status === 'paid') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setStage('paid')
          onPaid()
        } else if (json.data?.status === 'failed') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setStage('failed')
          setError('The payment was declined or failed.')
        }
      } catch {
        // Transient network error — let the next poll tick try again.
      }
    }, POLL_INTERVAL_MS)
  }

  const startCheckout = async (method: 'PAYPACK' | 'STRIPE') => {
    if (!user) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/course-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          courseId: course.id,
          buyerName: `${user.firstName} ${user.lastName}`.trim(),
          buyerEmail: user.email,
          buyerPhone: phone,
          method,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not start checkout.')

      if (method === 'STRIPE' && json.data.checkoutUrl) {
        window.location.assign(json.data.checkoutUrl)
        return
      }
      setStage('pending')
      startPolling(json.data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (pollTimer.current) clearInterval(pollTimer.current)
    setStage('form')
    setPhone('')
    setError('')
    onClose()
  }

  return (
    <Modal open onClose={handleClose} title={`Pay to enroll — "${course.title}"`} size="sm">
      <div className="text-center py-2">
        {stage === 'form' && (
          <>
            <p className="font-lato text-sm text-w-950 mb-4">
              Enroll in <span className="font-semibold">&ldquo;{course.title}&rdquo;</span> for <span className="font-semibold">{course.price.toLocaleString()} RWF</span>
            </p>

            <div className="text-left mb-4">
              <label htmlFor="course-checkout-phone" className="block font-lato text-xs font-semibold text-w-700 mb-1">Mobile Money Number (for PayPack)</label>
              <div className="relative">
                <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-500" />
                <input
                  id="course-checkout-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="078xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 font-lato text-sm border border-w-400 rounded focus:border-w-600 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <p className="font-lato text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <ElegantButton variant="primary" loading={submitting} onClick={() => startCheckout('PAYPACK')} disabled={!phone.trim()} className="w-full text-sm py-2">
                <Smartphone size={14} className="inline mr-1" /> Pay with Mobile Money
              </ElegantButton>
              <ElegantButton variant="outline" loading={submitting} onClick={() => startCheckout('STRIPE')} className="w-full text-sm py-2">
                <CreditCard size={14} className="inline mr-1" /> Pay with Card
              </ElegantButton>
            </div>
          </>
        )}

        {stage === 'pending' && (
          <>
            <Loader2 size={32} className="mx-auto text-w-600 mb-3 animate-spin" />
            <p className="font-lato text-sm text-w-950 mb-1">Check your phone</p>
            <p className="font-lato text-xs text-w-600 mb-4">
              Approve the mobile money prompt sent to {phone} to complete enrollment.
            </p>
            <ElegantButton variant="outline" onClick={handleClose} className="w-full text-sm py-2">
              Close and check later
            </ElegantButton>
          </>
        )}

        {stage === 'paid' && (
          <>
            <CheckCircle2 size={32} className="mx-auto text-green-600 mb-3" />
            <p className="font-lato text-sm text-w-950 mb-1">Payment confirmed</p>
            <p className="font-lato text-xs text-w-600 mb-4">
              You&apos;re enrolled in <span className="font-semibold">&ldquo;{course.title}&rdquo;</span>.
            </p>
            <ElegantButton variant="primary" onClick={handleClose} className="w-full text-sm py-2">
              Done
            </ElegantButton>
          </>
        )}

        {stage === 'failed' && (
          <>
            <XCircle size={32} className="mx-auto text-red-600 mb-3" />
            <p className="font-lato text-sm text-w-950 mb-1">Payment not completed</p>
            {error && <p className="font-lato text-xs text-w-600 mb-4">{error}</p>}
            <ElegantButton variant="outline" onClick={handleClose} className="w-full text-sm py-2">
              Close
            </ElegantButton>
          </>
        )}
      </div>
    </Modal>
  )
}
