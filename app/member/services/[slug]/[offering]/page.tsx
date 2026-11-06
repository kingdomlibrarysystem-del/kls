import { notFound } from 'next/navigation'
import { OfferingDetail } from '@/components/services/offering-detail'
import { getOfferingPage } from '@/lib/services/data'
import { requirePageAuth } from '@/lib/server/page-session'

/** One sub-service inside the member portal (shop links stay in the portal). */
export default async function MemberOfferingPage({ params }: { params: Promise<{ slug: string; offering: string }> }) {
  const [{ slug, offering }] = await Promise.all([params, requirePageAuth()])
  const data = await getOfferingPage(slug, offering)
  if (!data) notFound()
  return <OfferingDetail program={data.program} offering={data.offering} products={data.products} categories={data.categories} basePath="/member/services" shopPath="/member/shop" signedIn />
}
