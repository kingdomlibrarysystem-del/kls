import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getRoleDetail } from '@/lib/data/roles'
import { toPlain } from '@/lib/server/to-plain'
import { RoleDetailView } from './_components/role-detail-view'
import type { Role } from '../_components/roles-data'

interface RoleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const role = await getRoleDetail(id)
  if (!role) notFound()
  return <RoleDetailView initialRole={toPlain<Role>(role)} />
}
