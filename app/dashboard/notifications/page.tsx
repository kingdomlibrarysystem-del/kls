'use client'

import Link from 'next/link'
import { Bell, BookOpen, CalendarClock, GraduationCap, BookCopy, AlertCircle, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { useAuth } from '@/contexts/auth-context'
import type { NotificationType } from './_components/notifications-data'
import { useNotifications, markNotificationRead } from './_components/use-notifications'

const iconMap: Record<NotificationType, React.ReactNode> = {
  borrow:      <BookOpen size={16} className="text-green-600" />,
  reservation: <CalendarClock size={16} className="text-blue-600" />,
  course:      <GraduationCap size={16} className="text-purple-600" />,
  publication: <BookCopy size={16} className="text-w-600" />,
  due:         <AlertCircle size={16} className="text-orange-500" />,
  system:      <Bell size={16} className="text-w-700" />,
}

/**
 * Each notification links to the real, already-built page containing its
 * underlying entity (a borrowing, reservation, enrollment, or publication)
 * — see notifications-data.ts for which titles were verified against real
 * mock data before being wired up.
 */
export default function NotificationsPage() {
  const { user } = useAuth()
  const notifications = useNotifications(user?.role)
  const unread = notifications.filter((n) => !n.read).length

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
            onClick={() => markNotificationRead(n.id)}
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
                <span className="font-lato text-xs text-w-600 whitespace-nowrap shrink-0">{n.time}</span>
              </div>
              <p className="font-lato text-sm text-w-700 mt-0.5">{n.message}</p>
            </div>
            <ChevronRight size={16} className="text-w-400 shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </PageTransition>
  )
}
