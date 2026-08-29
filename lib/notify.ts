import prisma from '@/prisma/client'
import { sendMail } from '@/lib/mailer'
import { broadcast } from '@/lib/sse-hub'

type NotificationType = 'BORROW' | 'RESERVATION' | 'COURSE' | 'PUBLICATION' | 'DUE' | 'SYSTEM'

/**
 * Fine-grained email category — independent of `NotificationType` (the
 * coarse bucket the in-app Notification row/list still uses unchanged).
 * This is the real per-category gate notification-preferences-section.tsx
 * toggles against, so "session approved" and "session unavailable" (both
 * would otherwise collapse into one SESSION bucket) can be turned on/off
 * independently. Keep this list in sync with
 * app/member/profile/_components/notification-preferences-data.ts.
 */
export type NotificationCategory =
  | 'borrow-approved' | 'borrow-rejected' | 'borrow-returned'
  | 'reservation-created' | 'reservation-ready'
  | 'course-enrollment' | 'course-payment-success' | 'course-payment-failed'
  | 'publication-submitted' | 'publication-approved' | 'publication-rejected'
  | 'session-approved' | 'session-rejected' | 'session-unavailable' | 'session-reminder'
  | 'certificate-issued'
  | 'order-payment-success' | 'order-payment-failed'
  | 'assessment-graded'

interface NotifyUserInput {
  userId: string
  type: NotificationType
  /** Which real event this is, for per-category email preference filtering — see NotificationCategory's docstring. */
  category: NotificationCategory
  title: string
  message: string
  href: string
  /** Optional transactional email to send alongside the in-app notification — omitted for events that don't warrant one. */
  email?: { subject: string; html: string }
}

/**
 * Creates a real, per-person Notification row (recipientId set, so
 * app-topbar.tsx / the notifications list can eventually scope to "mine"
 * — see notifications-store.ts's recipientId filter) and, if `email` is
 * given, sends a real transactional email too. A missing/opted-out email
 * preference or an email-send failure never blocks the notification row
 * from being created, and never blocks the caller's real business action
 * (approving a session, marking an order paid, etc.) — this is always
 * called after that action has already succeeded, same fire-and-forget
 * posture as the existing logAuditEvent pattern.
 */
export async function notifyUser(input: NotifyUserInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, role: { select: { name: true } }, notificationPreferences: true },
  }).catch(() => null)

  if (!user) return

  await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      recipientRole: user.role?.name ?? 'Member',
      recipientId: input.userId,
    },
  }).catch((error) => {
    console.error('Failed to create notification:', error)
  })

  broadcast(input.userId, { type: 'notification' })

  if (!input.email) return

  // An explicit per-category preference wins; if this category was
  // never set, fall back to the old coarse `email` flag (so preference
  // data saved before per-category filtering existed keeps working);
  // if neither exists, default to enabled.
  const prefs = user.notificationPreferences as Partial<Record<NotificationCategory, boolean>> & { email?: boolean } | null
  const emailEnabled = prefs?.[input.category] ?? prefs?.email ?? true
  if (!emailEnabled) return

  try {
    await sendMail(user.email, input.email.subject, input.email.html)
  } catch (error) {
    console.error('Failed to send notification email:', error)
  }
}

const STAFF_ROLE_NAMES = ['Admin', 'Manager', 'Staff']

/**
 * Broadcasts one notification to every real admin/manager/staff user —
 * the only multi-recipient path in this codebase; every other
 * notification is single-recipient. Reused wherever an event needs
 * staff attention rather than one specific person's (e.g. a new
 * publication submitted for review).
 */
export async function notifyAllStaff(input: Omit<NotifyUserInput, 'userId'>): Promise<void> {
  const staff = await prisma.user.findMany({
    where: { role: { name: { in: STAFF_ROLE_NAMES } } },
    select: { id: true },
  }).catch(() => [])

  await Promise.all(staff.map((s) => notifyUser({ ...input, userId: s.id })))
}
