import { RoleDetailView } from './_components/role-detail-view'

interface RoleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = await params
  return <RoleDetailView id={id} />
}
