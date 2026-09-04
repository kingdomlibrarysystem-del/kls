'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const newsletterSchema = z.object({
  email: z.string().email(),
})

type NewsletterFormData = z.infer<typeof newsletterSchema>

export function NewsletterSection() {
  const { t } = useLanguage()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  })

  const onSubmit = async (data: NewsletterFormData) => {
    setLoading(true)
    setServerError('')
    setAlreadySubscribed(false)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.code !== 'success') throw new Error(json.message ?? 'Subscription failed')
      if (json.message === 'This email is already subscribed.') {
        setAlreadySubscribed(true)
      } else {
        setSubscribed(true)
      }
    } catch {
      setServerError(t('newsletter.error'))
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
                  disabled={loading}
                  className={`w-full px-6 py-3 font-lato text-sm border bg-white rounded focus:outline-none ${
                    errors.email ? 'border-red-500' : 'border-w-400 focus:border-w-600'
                  }`}
                  {...register('email')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-w-600 text-white font-lato font-semibold rounded hover:bg-w-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t('newsletter.loading') : t('newsletter.subscribe')}
              </button>
            </div>
            {errors.email && <p className="text-red-600 text-xs mt-2 font-lato">{errors.email.message}</p>}
            {alreadySubscribed && (
              <p className="text-yellow-700 text-xs mt-2 font-lato">{t('newsletter.already_subscribed')}</p>
            )}
            {serverError && (
              <div className="flex items-center gap-2 mt-2 text-red-700 text-xs font-lato">
                <AlertCircle size={13} /> {serverError}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
