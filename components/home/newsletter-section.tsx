'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const newsletterSchema = z.object({
  email: z.string().email(),
})

type NewsletterFormData = z.infer<typeof newsletterSchema>

export function NewsletterSection() {
  const { t } = useLanguage()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  })

  const onSubmit = async (data: NewsletterFormData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.message ?? 'Subscription failed. Please try again.')
        return
      }
      // Both new subscriptions and already-subscribed show the success banner
      setSubscribed(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-16 px-4 bg-form-highlight">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-cinzel text-3xl font-bold text-w-950 mb-4">{t('newsletter.title')}</h2>
        <p className="font-lato text-w-700 mb-8">{t('newsletter.subtitle')}</p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded font-lato text-sm">
            <CheckCircle2 size={16} /> {t('newsletter.success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 text-left">
                <input
                  type="email"
                  placeholder={t('newsletter.placeholder')}
                  aria-label={t('newsletter.placeholder')}
                  className={`w-full px-6 py-3 font-lato text-sm border bg-white rounded focus:outline-none ${
                    errors.email ? 'border-red-500' : 'border-w-400 focus:border-w-600'
                  }`}
                  {...register('email')}
                />
                {error && <p className="mt-1 text-xs text-red-600 font-lato">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-w-600 text-white font-lato font-semibold rounded hover:bg-w-700 transition-colors disabled:opacity-60"
              >
                {loading ? '...' : t('newsletter.subscribe')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
