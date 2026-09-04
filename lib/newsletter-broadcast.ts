import prisma from '@/prisma/client'
import { appBaseUrl, sendMail } from '@/lib/mailer'

interface NewsletterUpdate {
  subject: string
  title: string
  message: string
  href: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}

/** Sends the same product update to anonymous homepage newsletter subscribers. */
export async function broadcastNewsletterUpdate(update: NewsletterUpdate): Promise<void> {
  const subscribers = await prisma.newsletterSubscriber.findMany({ select: { email: true } }).catch(() => [])
  const title = escapeHtml(update.title)
  const message = escapeHtml(update.message)
  const href = `${appBaseUrl()}${update.href}`
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#29231d"><h2>${title}</h2><p>${message}</p><p><a href="${href}">Open Kingdom Library</a></p><p style="font-size:12px;color:#766b60">You received this because you subscribed to Kingdom Library updates.</p></div>`

  await Promise.all(subscribers.map(async ({ email }) => {
    try {
      await sendMail(email, update.subject, html)
    } catch (error) {
      console.error(`Failed to send newsletter update to ${email}:`, error)
    }
  }))
}
