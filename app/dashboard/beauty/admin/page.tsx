import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { BeautyAppointmentsTable } from './_components/beauty-appointments-table'

export default function BeautyAdminPage() {
  return (
    <PageTransition>
      <PageHeader title="Beauty Appointments" subtitle="All member bookings — confirm, complete, or cancel" />
      <BeautyAppointmentsTable />
    </PageTransition>
  )
}
