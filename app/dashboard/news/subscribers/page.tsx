import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { SubscribersView } from './_components/subscribers-view'

export default function NewsletterSubscribersPage() {
  return (
    <PageTransition>
      <PageHeader title="Newsletter Subscribers" subtitle="Everyone signed up for newsletter updates from the homepage" />
      <SubscribersView />
    </PageTransition>
  )
}