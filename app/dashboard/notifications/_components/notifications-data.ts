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

