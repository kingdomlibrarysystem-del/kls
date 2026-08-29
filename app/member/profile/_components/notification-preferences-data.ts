/**
 * Real notification categories a member can toggle email for — kept in
 * sync with NotificationCategory in lib/notify.ts (that's the type-level
 * source of truth this list must match; add here whenever a new category
 * is added there). Grouped for display only, not a new data structure.
 */
export interface NotificationCategoryOption {
  id: string
  label: string
  description: string
  /** True only for "due-reminders" — real category slot, but no event in this app triggers it yet (no overdue-detection job exists), so it's shown honestly rather than silently faked as active. */
  notYetTriggered?: boolean
}

export interface NotificationCategoryGroup {
  section: string
  categories: NotificationCategoryOption[]
}

export const notificationCategoryGroups: NotificationCategoryGroup[] = [
  {
    section: 'Borrowing',
    categories: [
      { id: 'borrow-approved', label: 'Borrow Approved', description: 'When a librarian approves your borrow request' },
      { id: 'borrow-rejected', label: 'Borrow Rejected', description: 'When a librarian declines your borrow request' },
      { id: 'borrow-returned', label: 'Borrow Returned', description: 'Confirmation when your return is recorded' },
      { id: 'due-reminders', label: 'Due Reminders', description: 'Reminders before a borrowed item is due back', notYetTriggered: true },
    ],
  },
  {
    section: 'Reservations',
    categories: [
      { id: 'reservation-created', label: 'Reservation Placed', description: 'Confirmation when you place a reservation' },
      { id: 'reservation-ready', label: 'Reservation Ready', description: 'When a reserved item becomes available for pickup' },
    ],
  },
  {
    section: 'Courses & Sessions',
    categories: [
      { id: 'course-enrollment', label: 'Course Enrollment', description: 'Confirmation when you enroll in a course' },
      { id: 'course-payment-success', label: 'Course Payment Success', description: 'Confirmation for a successful course payment' },
      { id: 'course-payment-failed', label: 'Course Payment Failed', description: 'Alerts when a course payment fails' },
      { id: 'session-approved', label: 'Session Approved', description: 'When a live session request is approved' },
      { id: 'session-rejected', label: 'Session Rejected', description: 'When a live session request is not approved' },
      { id: 'session-unavailable', label: 'Session Unavailable', description: 'When a pending session request lapses or is marked unavailable' },
      { id: 'session-reminder', label: 'Session Reminders', description: 'Reminders about an upcoming approved session' },
      { id: 'certificate-issued', label: 'Certificate Issued', description: 'When you earn a course certificate' },
      { id: 'assessment-graded', label: 'Assessment Graded', description: 'When an assessment you submitted is graded' },
    ],
  },
  {
    section: 'Publications',
    categories: [
      { id: 'publication-submitted', label: 'Submission Received', description: 'Confirmation that your submission is under review' },
      { id: 'publication-approved', label: 'Publication Approved', description: 'When your submission is approved and published' },
      { id: 'publication-rejected', label: 'Publication Rejected', description: 'When your submission is not approved' },
    ],
  },
  {
    section: 'Payments',
    categories: [
      { id: 'order-payment-success', label: 'Order Payment Success', description: 'Confirmation for a successful resource purchase' },
      { id: 'order-payment-failed', label: 'Order Payment Failed', description: 'Alerts when a resource purchase payment fails' },
    ],
  },
]

export const notificationCategories: NotificationCategoryOption[] = notificationCategoryGroups.flatMap((g) => g.categories)

/** Default enabled state — all categories on by default. */
export const defaultEnabledCategories: Record<string, boolean> = Object.fromEntries(
  notificationCategories.map((c) => [c.id, true])
)
