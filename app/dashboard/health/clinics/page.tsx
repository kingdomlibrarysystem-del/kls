import { PageHeader } from '@/components/ui/page-header'
import { ClinicsView } from './_components/clinics-view'

export default function ClinicDirectoryPage() {
  return (
    <div>
      <PageHeader title="Clinic Directory" subtitle="Browse partnered clinics and health practitioners by specialty" />
      <ClinicsView />
    </div>
  )
}
