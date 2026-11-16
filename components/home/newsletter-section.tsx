'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    <section className="relative overflow-hidden px-4 py-20">
      {/* Background photo under a deep navy shade, so the text stays easy to read. */}
      <Image src="/home/classroom-reading.jpg" alt="" fill sizes="100vw" className="object-cover" />
      <div aria-hidden className="absolute inset-0 bg-[#0b2136]/85 dark:bg-[#05070f]/90" />
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="font-cinzel text-3xl font-bold text-[#f6efe0] mb-4">{t('newsletter.title')}</h2>
        <p className="font-lato text-[#f6efe0]/75 mb-8">{t('newsletter.subtitle')}</p>

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
                  className={`w-full px-6 py-3 font-lato text-sm text-[#1a1a2e] border bg-white rounded focus:outline-none focus:ring-3 focus:ring-primary/40 ${
                    errors.email ? 'border-red-500' : 'border-transparent'
                  }`}
                  {...register('email')}
                />
                {error && <p className="mt-1 text-xs text-red-300 font-lato">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-primary-foreground font-lato font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? '...' : t('newsletter.subscribe')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
