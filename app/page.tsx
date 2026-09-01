'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { HeroSection } from '@/components/home/hero-section'
import { TrendingBooks } from '@/components/home/trending-books'
import { ELearningSection } from '@/components/home/elearning-section'
import { ResearchSection } from '@/components/home/research-section'
import { NewsletterSection } from '@/components/home/newsletter-section'
import { MainHeader } from '@/components/main-header'
import { MainFooter } from '@/components/main-footer'
import { useLanguage } from '@/contexts/language-context'

export default function Page() {
  const { t } = useLanguage()

  const testimonials = [
    { body: t('testimonials.t1_body'), name: t('testimonials.t1_name'), role: t('testimonials.t1_role') },
    { body: t('testimonials.t2_body'), name: t('testimonials.t2_name'), role: t('testimonials.t2_role') },
    { body: t('testimonials.t3_body'), name: t('testimonials.t3_name'), role: t('testimonials.t3_role') },
  ]

  return (
    <main className="min-h-screen bg-white">
      <MainHeader />
      <HeroSection />
      <TrendingBooks />
      <ELearningSection />
      <ResearchSection />

      {/* Testimonials */}
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

      {/* Community */}
      <div className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/community-feature.png" alt="Community learning" fill className="object-cover" />
          <div className="absolute inset-0 bg-w-950/75" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-6" style={{ letterSpacing: '1.5px' }}>
            {t('community.title')}
          </h2>
          <p className="font-lato text-w-100 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            {t('community.subtitle')}
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12">
            <div>
              <p className="font-cinzel text-3xl md:text-4xl font-bold text-w-100">195+</p>
              <p className="font-lato text-sm text-w-300 mt-2">{t('common.countries')}</p>
            </div>
            <div>
              <p className="font-cinzel text-3xl md:text-4xl font-bold text-w-100">2M+</p>
              <p className="font-lato text-sm text-w-300 mt-2">{t('common.downloads')}</p>
            </div>
            <div>
              <p className="font-cinzel text-3xl md:text-4xl font-bold text-w-100">4.9/5</p>
              <p className="font-lato text-sm text-w-300 mt-2">{t('common.rating')}</p>
            </div>
          </div>
          <Link href="/auth/register">
            <ElegantButton variant="primary" className="md:px-10 md:py-4 text-lg">
              {t('community.cta')}
            </ElegantButton>
          </Link>
        </div>
      </div>

      <NewsletterSection />
      <MainFooter />
    </main>
  )
}
