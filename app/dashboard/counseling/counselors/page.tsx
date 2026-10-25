import prisma from '@/prisma/client'
import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage } from '@/lib/server/page-session'
import { listCounselors, type CounselorItem } from '@/lib/care/data'
import { NOT_TRASHED } from '@/lib/data/user-trash'
import { toPlain } from '@/lib/server/to-plain'
import { CounselorsManageView } from './_components/counselors-manage-view'

/**
 * Counselors (staff): who members can book. Each counselor can be linked to a
 * staff account so members can message them. Server-loaded.
 */
export default async function CounselorsPage() {
  await requireStaffPage()
  const [counselors, staff] = await Promise.all([
    listCounselors(false),
    prisma.user.findMany({
      where: { AND: [NOT_TRASHED, { role: { is: { name: { not: 'Member' } } } }] },
      select: { id: true, name: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } },
      orderBy: { name: 'asc' },
      take: 500,
    }),
  ])
  const staffOptions = staff.map((u) => ({ id: u.id, label: `${u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email} — ${u.role?.name ?? ''}` }))
  return (
    <div>
      <PageHeader title="Counselors" subtitle="The people members can book and message for support" />
      <CounselorsManageView initialCounselors={toPlain<CounselorItem[]>(counselors)} staffOptions={staffOptions} />
    </div>
  )
}
