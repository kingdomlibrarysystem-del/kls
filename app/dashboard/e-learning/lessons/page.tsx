import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { LessonsView } from './_components/lessons-view'

export default function LessonsManagementPage() {
  return (
    <PageTransition>
      <PageHeader title="Lessons" subtitle="Manage lesson content across the KLS e-learning catalog" />
      <LessonsView />
    </PageTransition>
  )
}
