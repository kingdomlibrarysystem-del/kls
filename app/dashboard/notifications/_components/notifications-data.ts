import type { UserRole } from '@/contexts/auth-context'

export type NotificationType = 'borrow' | 'reservation' | 'course' | 'publication' | 'due' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
  /** Real already-built destination page for this notification's underlying entity. */
  href: string
  /**
   * Who this notification is addressed to. Role-level only, no separate
   * recipientName field — this mock system has exactly one live persona
   * per role (CURRENT_MEMBER_NAME "John Doe", LECTURER_NAME "Dr. Elias
   * Nkubito", CONTRIBUTOR_NAME "Pastor Emmanuel Rugamba", one admin), the
   * same simplification those constants already make. If this app ever
   * grows multiple real users per role, this field would need to become
   * (or gain) a recipientName/recipientId to disambiguate.
   */
  recipientRole: UserRole
}

/**
 * Mock notifications. Each `href` points at a page that genuinely contains
 * the referenced entity — verified against borrowings-data.ts,
 * reservations-data.ts, enrollments-data.ts, and publishing/catalog-data.ts
 * so no link is fabricated. The "course" and "publication" message text
 * below was adjusted to reference titles that actually exist in those
 * datasets (the originals — "Introduction to Research Methods" and
 * "Rwanda Digital Future" — matched nothing real). All 5 are addressed to
 * "admin" — each describes an event an admin/staff member reviews
 * (borrow/publication approval, an enrollment) on /dashboard/* pages.
 */
export const mockNotifications: Notification[] = [
  { id: '1', type: 'borrow',      title: 'Borrow Approved',       message: 'Your borrow request for "Digital Transformation" has been approved.',  time: '2 hours ago', read: false, href: '/dashboard/library/borrowings', recipientRole: 'admin' },
  { id: '2', type: 'due',         title: 'Book Due Soon',         message: '"The Pursuit of Knowledge" is due in 3 days. Consider renewing.',       time: '5 hours ago', read: false, href: '/dashboard/library/borrowings', recipientRole: 'admin' },
  { id: '3', type: 'reservation', title: 'Reservation Available', message: '"Ancient Civilizations" is now available. Claim it within 48 hours.',   time: '1 day ago',   read: true,  href: '/dashboard/reservations',       recipientRole: 'admin' },
  { id: '4', type: 'course',      title: 'Course Enrollment',     message: 'Amina Uwimana has enrolled in "Digital Discipleship".',                 time: '2 days ago',  read: true,  href: '/dashboard/e-learning/enrollments', recipientRole: 'admin' },
  { id: '5', type: 'publication', title: 'Publication Approved',  message: '"Voices of the Revival" has been approved for publishing.',             time: '3 days ago',  read: true,  href: '/dashboard/publishing/catalog', recipientRole: 'admin' },
]
