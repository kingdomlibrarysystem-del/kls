import prisma from '@/prisma/client'
import { sendMail } from '@/lib/mailer'

type NotificationType = 'BORROW' | 'RESERVATION' | 'COURSE' | 'PUBLICATION' | 'DUE' | 'SYSTEM'

interface NotifyUserInput {
  userId: string
  type: NotificationType
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

  if (!input.email) return

  const prefs = user.notificationPreferences as { email?: boolean } | null
  const emailEnabled = prefs?.email !== false
  if (!emailEnabled) return

  try {
    await sendMail(user.email, input.email.subject, input.email.html)
  } catch (error) {
    console.error('Failed to send notification email:', error)
  }
}
