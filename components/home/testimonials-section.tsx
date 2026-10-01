'use client'

import { Star } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

/** Landing-page testimonials (translated copy). Split out of app/page.tsx so the page itself can be a Server Component that loads its data. */
export function TestimonialsSection() {
  const { t } = useLanguage()

  const testimonials = [
    { body: t('testimonials.t1_body'), name: t('testimonials.t1_name'), role: t('testimonials.t1_role') },
    { body: t('testimonials.t2_body'), name: t('testimonials.t2_name'), role: t('testimonials.t2_role') },
    { body: t('testimonials.t3_body'), name: t('testimonials.t3_name'), role: t('testimonials.t3_role') },
  ]

  return (
    <div className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-lato text-sm font-semibold text-w-600 uppercase tracking-widest">
            {t('testimonials.label')}
          </span>
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-w-950 mt-4 mb-4" style={{ letterSpacing: '1.5px' }}>
            {t('testimonials.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div key={item.name} className="bg-form-highlight border border-w-300 rounded-lg p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-w-600 text-w-600" />
                ))}
              </div>
              <p className="font-cormorant text-lg text-w-950 italic mb-6 leading-relaxed">{item.body}</p>
              <div className="border-t border-w-300 pt-4">
                <p className="font-cinzel font-semibold text-w-950">{item.name}</p>
                <p className="font-lato text-sm text-w-700">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
