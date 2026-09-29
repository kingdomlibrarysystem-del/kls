import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getUserDetail } from '@/lib/data/users'
import { toPlain } from '@/lib/server/to-plain'
import { UserDetailView } from './_components/user-detail-view'
import type { PlatformUser } from '../_components/users-data'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const user = await getUserDetail(id)
  if (!user) notFound()
  return <UserDetailView initialUser={toPlain<PlatformUser>(user)} />
}
