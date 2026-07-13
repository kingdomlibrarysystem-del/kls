/** Notification category, per kls-product-spec Phase 10 (Notification System). */
export interface NotificationCategory {
  id: string
  label: string
  description: string
}

export const notificationCategories: NotificationCategory[] = [
  { id: 'borrow-approved', label: 'Borrow Approved', description: 'When a librarian approves your borrow request' },
  { id: 'due-reminders', label: 'Due Reminders', description: 'Reminders before a borrowed item is due back' },
  { id: 'reservation-available', label: 'Reservation Available', description: 'When a reserved item becomes available for pickup' },
  { id: 'course-enrollment', label: 'Course Enrollment', description: 'Confirmations and updates for course enrollments' },
  { id: 'publication-approval', label: 'Publication Approval', description: 'Updates on your submitted publications' },
  { id: 'payment-success', label: 'Payment Success', description: 'Confirmations for successful payments' },
]

/** Default enabled state — all categories on by default. */
export const defaultEnabledCategories: Record<string, boolean> = Object.fromEntries(
  notificationCategories.map((c) => [c.id, true])
)
