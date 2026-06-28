'use client'

import { Bell, BookOpen, CalendarClock, GraduationCap, BookCopy, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface Notification {
  id: string
  type: 'borrow' | 'reservation' | 'course' | 'publication' | 'due' | 'system'
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'borrow',      title: 'Borrow Approved',         message: 'Your borrow request for "Digital Transformation" has been approved.',    time: '2 hours ago',   read: false },
  { id: '2', type: 'due',         title: 'Book Due Soon',           message: '"The Pursuit of Knowledge" is due in 3 days. Consider renewing.',         time: '5 hours ago',   read: false },
  { id: '3', type: 'reservation', title: 'Reservation Available',   message: '"Ancient Civilizations" is now available. Claim it within 48 hours.',    time: '1 day ago',     read: true },
  { id: '4', type: 'course',      title: 'Course Enrollment',       message: 'You have successfully enrolled in "Introduction to Research Methods".',    time: '2 days ago',    read: true },
  { id: '5', type: 'publication', title: 'Publication Approved',    message: 'Your submission "Rwanda Digital Future" has been approved for publishing.', time: '3 days ago',   read: true },
]

const iconMap = {
  borrow:      <BookOpen size={16} className="text-green-600" />,
  reservation: <CalendarClock size={16} className="text-blue-600" />,
  course:      <GraduationCap size={16} className="text-purple-600" />,
  publication: <BookCopy size={16} className="text-w-600" />,
  due:         <AlertCircle size={16} className="text-orange-500" />,
  system:      <Bell size={16} className="text-w-700" />,
}

export default function NotificationsPage() {
  const unread = mockNotifications.filter((n) => !n.read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
      />

      <div className="space-y-2">
        {mockNotifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
            n.read ? 'bg-white border-w-300' : 'bg-form-highlight border-w-400'
          }`}>
            <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-cinzel text-sm font-semibold ${n.read ? 'text-w-700' : 'text-w-950'}`}>
                  {n.title}
                  {!n.read && <span className="ml-2 inline-block w-2 h-2 bg-w-600 rounded-full align-middle" />}
                </p>
                <span className="font-lato text-xs text-w-600 whitespace-nowrap">{n.time}</span>
              </div>
              <p className="font-lato text-sm text-w-700 mt-0.5">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
