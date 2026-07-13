'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'

const newsletterSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type NewsletterFormData = z.infer<typeof newsletterSchema>

/**
 * Newsletter signup — previously a bare `<form>` with no `onSubmit`, so a
 * click on Subscribe triggered the browser's default GET navigation
 * (reloading the page with `?email=...` in the URL) instead of doing
 * anything. Now validates the email and shows a real success state,
 * matching the same useState + RHF/Zod + confirmation-view pattern
 * `/auth/register` already uses for its own no-backend mock submit.
 */
export function NewsletterSection() {
  const [subscribed, setSubscribed] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsletterFormData>({ resolver: zodResolver(newsletterSchema) })

  const onSubmit = async (_data: NewsletterFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    setSubscribed(true)
  }

  return (
    <div className="py-16 px-4 bg-form-highlight">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-cinzel text-3xl font-bold text-w-950 mb-4">Stay Updated</h2>
        <p className="font-lato text-w-700 mb-8">
          Get recommendations, new arrivals, and exclusive content delivered to your inbox monthly.
        </p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded font-lato text-sm">
            <CheckCircle2 size={16} /> You&apos;re subscribed — thanks for joining!
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 text-left">
                <input
                  type="email"
                  placeholder="Your email address"
                  aria-label="Email address"
                  className={`w-full px-6 py-3 font-lato text-sm border bg-white rounded focus:outline-none ${
                    errors.email ? 'border-red-500' : 'border-w-400 focus:border-w-600'
                  }`}
                  {...register('email')}
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-w-600 text-white font-lato font-semibold rounded hover:bg-w-700 transition-colors"
              >
                Subscribe
              </button>
            </div>
            {errors.email && <p className="text-red-600 text-xs mt-2 font-lato">{errors.email.message}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
