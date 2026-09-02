import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ServicesView } from './_components/services-view'

export default function BeautyServicesCatalogPage() {
  return (
    <PageTransition>
      <PageHeader title="Service Catalog" subtitle="Haircare, skincare, and grooming services with pricing" />
      <ServicesView />
    </PageTransition>
  )
}
