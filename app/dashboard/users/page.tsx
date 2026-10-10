import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { UsersView } from './_components/users-view'

/**
 * Platform users (sidebar "Members"). This page used to have a second
 * "Digital Library" tab that only linked to /dashboard/library; it was
 * removed (2026-10-14) — the library has its own sidebar section.
 */
export default function UsersPage() {
  return (
    <PageTransition>
      <PageHeader title="Admin Dashboard" subtitle="Manage platform users" />
      <UsersView />
    </PageTransition>
  )
}
