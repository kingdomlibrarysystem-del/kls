import { AuditEntryDetailView } from './_components/audit-entry-detail-view'

interface AuditEntryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AuditEntryDetailPage({ params }: AuditEntryDetailPageProps) {
  const { id } = await params
  return <AuditEntryDetailView id={id} />
}
