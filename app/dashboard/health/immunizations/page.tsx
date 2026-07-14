import { PageHeader } from '@/components/ui/page-header'
import { ImmunizationsView } from './_components/immunizations-view'

export default function ImmunizationTrackerPage() {
  return (
    <div>
      <PageHeader title="Immunization Tracker" subtitle="Track vaccination records and upcoming immunization reminders" />
      <ImmunizationsView />
    </div>
  )
}
