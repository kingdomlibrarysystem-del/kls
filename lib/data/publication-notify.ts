import { notifyUser, notifyAllStaff } from '@/lib/notify'
import { publicationSubmittedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

/** Tells the publisher their book was received and every staff member that a book awaits review. */
export async function notifySubmitted(contributorId: string, contributorName: string, title: string) {
  await notifyUser({
    userId: contributorId,
    type: 'PUBLICATION',
    category: 'publication-submitted',
    title: 'Submission received',
    message: `Your book "${title}" has been received and is now awaiting review.`,
    href: '/dashboard/publishing/my',
    email: { subject: 'Your submission is under review', html: publicationSubmittedEmailHtml(contributorName, title, `${appBaseUrl()}/dashboard/publishing/my`) },
  })
  await notifyAllStaff({
    type: 'PUBLICATION',
    category: 'publication-submitted',
    title: 'New book for review',
    message: `${contributorName} submitted "${title}" for review.`,
    href: '/dashboard/publishing/review',
  })
}
