import type { Metadata } from 'next'
import { ServicesShowcase } from '@/components/services/services-showcase'
import { getPublicServices } from '@/lib/services/data'
import { getPageSession } from '@/lib/server/page-session'

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Health System, Beauty, Consultation & Counseling and Rehabilitation — practical services from Kingdom Library and Global Rehab Center.',
}

/** Public services overview. Programmes and life areas are loaded on the server (cached; refreshed when an admin saves). */
export default async function ServicesPage() {
  const [{ programs, areas }, session] = await Promise.all([getPublicServices(), getPageSession()])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServicesShowcase programs={programs} areas={areas} joinHref={session ? null : '/auth/register'} />
    </div>
  )
}
