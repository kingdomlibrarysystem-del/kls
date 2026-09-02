import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { AppointmentsView } from './_components/appointments-view'

export default function BeautyAppointmentsPage() {
  return (
    <PageTransition>
      <PageHeader title="Book an Appointment" subtitle="Schedule a session with a beauty service provider" />
      <AppointmentsView />
    </PageTransition>
  )
}
