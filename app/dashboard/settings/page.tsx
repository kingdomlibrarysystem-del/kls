import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { SettingsForm } from './_components/settings-form'

export default function SystemSettingsPage() {
  return (
    <PageTransition>
      <PageHeader title="System Settings" subtitle="Platform-wide borrowing and reservation policy defaults" />
      <SettingsForm />
    </PageTransition>
  )
}
