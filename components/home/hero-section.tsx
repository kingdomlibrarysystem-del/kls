'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, GraduationCap, BookCopy } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useLanguage } from '@/contexts/language-context'

const SLIDE_DURATION = 5000
const ANIM_DURATION  = 700

export function HeroSection() {
  const { t } = useLanguage()
  const [current,  setCurrent]  = useState(0)
  const [animKey,  setAnimKey]  = useState(0)

  const slides = [
    {
      id: 'library',
      icon: <BookOpen size={18} className="text-w-600" />,
      tag: t('hero.library_tag'),
      heading: (
        <>
          <span className="text-w-600">{t('hero.library_heading_1')}</span>{' '}
          {t('hero.library_heading_2')}
        </>
      ),
      body: t('hero.library_body'),
      cta: { label: t('hero.library_cta'), href: '/library' },
      images: { left: '/images/book-A.jpg', center: '/images/book-C.jpg', right: '/images/book-B.jpg' },
    },
    {
      id: 'elearning',
      icon: <GraduationCap size={18} className="text-w-600" />,
      tag: t('hero.elearning_tag'),
      heading: (
        <>
          {t('hero.elearning_heading_1')}{' '}
          <span className="text-w-600">{t('hero.elearning_heading_2')}</span>{' '}
          {t('hero.elearning_heading_3')}
        </>
      ),
      body: t('hero.elearning_body'),
      cta: { label: t('hero.elearning_cta'), href: '/auth/register' },
      images: { left: '/images/book-B.jpg', center: '/images/book-A.jpg', right: '/images/book-C.jpg' },
    },
    {
      id: 'publishing',
      icon: <BookCopy size={18} className="text-w-600" />,
      tag: t('hero.publishing_tag'),
      heading: (
        <>
          {t('hero.publishing_heading_1')}{' '}
          <span className="text-w-600">{t('hero.publishing_heading_2')}</span>{' '}
          {t('hero.publishing_heading_3')}
        </>
      ),
      body: t('hero.publishing_body'),
      cta: { label: t('hero.publishing_cta'), href: '/auth/register' },
      images: { left: '/images/book-C.jpg', center: '/images/book-B.jpg', right: '/images/book-A.jpg' },
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
      setAnimKey((k) => k + 1)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTo = (idx: number) => {
    if (idx === current) return
    setCurrent(idx)
    setAnimKey((k) => k + 1)
  }

  const slide = slides[current]

  return (
    <div className="relative py-12 px-4 bg-gradient-to-b from-w-50 to-white overflow-hidden min-h-[460px]">
      <div className="absolute top-4 left-4 max-w-[220px] z-20">
        <p className="hidden md:block font-cormorant text-sm italic text-w-700 leading-snug">{t('hero.bible_verse')}</p>
        <span className="font-cinzel not-italic text-xs text-w-600 tracking-widest mt-1 block">{t('hero.bible_ref')}</span>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          <div
            key={`left-${animKey}`}
            className="max-w-md text-center mx-auto slide-from-left"
            style={{ animationDuration: `${ANIM_DURATION}ms` }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              {slide.icon}
              <span className="font-lato text-xs font-semibold text-w-600 uppercase tracking-widest">
                {slide.tag}
              </span>
            </div>

            <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-w-950 mb-4 leading-tight">
              {slide.heading}
            </h1>
            <p className="font-lato text-w-700 text-base mb-8 leading-relaxed">{slide.body}</p>
            <Link href={slide.cta.href}>
              <ElegantButton variant="primary" className="md:px-8">
                {slide.cta.label}
              </ElegantButton>
            </Link>

            <div className="flex gap-2 mt-8 justify-center">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 h-3 bg-w-600' : 'w-3 h-3 bg-w-300 hover:bg-w-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            key={`right-${animKey}`}
            className="relative h-[420px] w-full flex items-center justify-center overflow-visible slide-from-right"
            style={{ animationDuration: `${ANIM_DURATION}ms` }}
          >
            <div className="absolute left-0 top-10 w-36 h-52 rounded-lg overflow-hidden shadow-lg z-0">
              <Image src={slide.images.left} alt="cover" fill className="object-cover" sizes="144px" />
            </div>
            <div className="absolute right-0 bottom-10 w-32 h-48 rounded-lg overflow-hidden shadow-lg z-0">
              <Image src={slide.images.right} alt="cover" fill className="object-cover" sizes="128px" />
            </div>
            <div className="relative w-56 h-80 md:w-64 md:h-96 rounded-lg overflow-hidden shadow-2xl z-10">
              <Image src={slide.images.center} alt="featured cover" fill className="object-cover" priority sizes="(max-width: 768px) 224px, 256px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
