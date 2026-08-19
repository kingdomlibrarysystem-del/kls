'use client'

import Link from 'next/link'
import { Bell, BookOpen, CalendarClock, GraduationCap, BookCopy, AlertCircle, ChevronRight, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import type { NotificationType } from '@/app/dashboard/notifications/_components/notifications-data'
import { useMemberNotifications, markMemberNotificationRead } from '@/app/member/_shared/use-member-notifications'

const iconMap: Record<NotificationType, React.ReactNode> = {
  borrow:      <BookOpen size={18} className="text-green-600" />,
  reservation: <CalendarClock size={18} className="text-blue-600" />,
  course:      <GraduationCap size={18} className="text-purple-600" />,
  publication: <BookCopy size={18} className="text-w-600" />,
  due:         <AlertCircle size={18} className="text-orange-500" />,
  system:      <Bell size={18} className="text-w-700" />,
}

/**
 * Member's own notifications — real per-person rows (recipientId-scoped),
 * unlike the admin dashboard's role-broadcast-only
 * app/dashboard/notifications/page.tsx. Mirrors that page's visual
 * pattern exactly (same icon map, same list-item shape) so the two
 * portals stay visually consistent.
 */
export default function MemberNotificationsPage() {
  const { user } = useAuth()
  const { data: notifications, loading, error, refetch } = useMemberNotifications(user?.id)
  const unread = notifications.filter((n) => !n.read).length

  const handleMarkRead = async (id: string) => {
    try {
      await markMemberNotificationRead(id)
      await refetch()
    } catch {
      // Non-critical — the notification still navigates even if marking read failed.
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <PageHeader title="Notifications" subtitle="Loading…" />
        <div className="space-y-2" aria-label="Loading notifications">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageHeader title="Notifications" subtitle="" />
        <EmptyState icon={AlertTriangle} title="Couldn't load notifications" description={error} />
      </PageTransition>
    )
  }

  if (notifications.length === 0) {
    return (
      <PageTransition>
        <PageHeader title="Notifications" subtitle="All caught up" />
        <EmptyState icon={Bell} title="No notifications yet" description="You'll see updates about your orders, sessions, and borrowings here." />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
      />

      <div className="space-y-2">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            onClick={() => { handleMarkRead(n.id) }}
            aria-label={`View details for: ${n.title}`}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:border-w-500 ${
              n.read ? 'bg-white border-w-300' : 'bg-form-highlight border-w-400'
            }`}
          >
            <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-cinzel text-sm font-semibold ${n.read ? 'text-w-700' : 'text-w-950'}`}>
                  {n.title}
                  {!n.read && <span className="ml-2 inline-block w-2 h-2 bg-w-600 rounded-full align-middle" />}
                </p>
                <span className="font-lato text-xs text-w-600 whitespace-nowrap shrink-0">{new Date(n.time).toLocaleDateString()}</span>
              </div>
              <p className="font-lato text-sm text-w-700 mt-0.5">{n.message}</p>
            </div>
            <ChevronRight size={18} className="text-w-400 shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </PageTransition>
  )
}
