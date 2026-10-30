import { MainHeader } from '@/components/main-header'
import { MainFooter } from '@/components/main-footer'
import { getServicesNav } from '@/lib/services/data'

/** Header menu data (service programmes) is loaded here on the server — cached, refreshed when an admin saves. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const services = await getServicesNav().catch(() => [])
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader services={services} />
      <main className="flex-1">{children}</main>
      <MainFooter />
    </div>
  )
}
