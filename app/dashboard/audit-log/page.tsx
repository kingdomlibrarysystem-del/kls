import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { AuditLogView } from './_components/audit-log-view'

export default function AuditLogPage() {
  return (
    <PageTransition>
      <PageHeader title="Audit Log" subtitle="Login, role assignment, approvals, and payment events" />
      <AuditLogView />
    </PageTransition>
  )
}
