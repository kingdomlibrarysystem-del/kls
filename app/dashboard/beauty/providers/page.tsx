import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ProvidersView } from './_components/providers-view'

export default function BeautyProvidersPage() {
  return (
    <PageTransition>
      <PageHeader title="Provider Directory" subtitle="Accredited stylists and therapists in the Kingdom network" />
      <ProvidersView />
    </PageTransition>
  )
}
