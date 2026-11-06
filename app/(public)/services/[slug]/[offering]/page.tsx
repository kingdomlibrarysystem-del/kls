import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OfferingDetail } from '@/components/services/offering-detail'
import { getOfferingPage } from '@/lib/services/data'
import { getPageSession } from '@/lib/server/page-session'

type Props = { params: Promise<{ slug: string; offering: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, offering } = await params
  const data = await getOfferingPage(slug, offering)
  return data ? { title: `${data.offering.name} — ${data.program.name}`, description: data.offering.summary } : { title: 'Service not found' }
}

/** One sub-service, public. "Get this service" asks guests to sign in first. */
export default async function OfferingPage({ params }: Props) {
  const { slug, offering } = await params
  const [data, session] = await Promise.all([getOfferingPage(slug, offering), getPageSession()])
  if (!data) notFound()
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <OfferingDetail program={data.program} offering={data.offering} products={data.products} categories={data.categories} basePath="/services" shopPath="/shop" signedIn={!!session} />
    </div>
  )
}
