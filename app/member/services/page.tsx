import { ServicesShowcase } from '@/components/services/services-showcase'
import { getPublicServices } from '@/lib/services/data'
import { requirePageAuth } from '@/lib/server/page-session'

/** Services overview inside the member portal (same content as /services, links stay in the portal). */
export default async function MemberServicesPage() {
  const [{ programs, areas }] = await Promise.all([getPublicServices(), requirePageAuth()])
  return <ServicesShowcase programs={programs} areas={areas} basePath="/member/services" joinHref={null} />
}
