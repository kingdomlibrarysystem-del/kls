import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { AppointmentsAdminView } from './_components/appointments-admin-view'

export default function HealthAppointmentsAdminPage() {
  return (
    <PageTransition>
      <PageHeader title="Appointments" subtitle="All member checkup appointments — confirm, complete, or cancel" />
      <AppointmentsAdminView />
    </PageTransition>
  )
}
