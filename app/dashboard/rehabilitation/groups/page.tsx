import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { GroupsView } from './_components/groups-view'

export default function RehabGroupsPage() {
  return (
    <PageTransition>
      <PageHeader title="Support Groups" subtitle="Join peer support groups facilitated by program staff" />
      <GroupsView />
    </PageTransition>
  )
}
