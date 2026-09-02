import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ElearningTabs } from '../_components/elearning-tabs'
import { LessonsView } from './_components/lessons-view'

export default function LessonsManagementPage() {
  return (
    <PageTransition>
      <PageHeader title="Lessons" subtitle="Manage lesson content across the KLS e-learning catalog" />
      <ElearningTabs active="lessons" />
      <LessonsView />
    </PageTransition>
  )
}
