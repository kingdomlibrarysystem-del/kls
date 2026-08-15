import { UserDetailView } from './_components/user-detail-view'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  return <UserDetailView id={id} />
}
