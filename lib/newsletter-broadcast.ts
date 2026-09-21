import prisma from '@/prisma/client'
import { sendMail, appBaseUrl } from '@/lib/mailer'

export type BroadcastEvent =
  | { type: 'new_resource';  title: string; author: string; id: string }
  | { type: 'new_course';    title: string; category: string; id: string }
  | { type: 'new_lesson';    title: string; courseTitle: string; courseId: string }
  | { type: 'article_published'; title: string; summary: string; category: string; id: string }

function buildEmail(event: BroadcastEvent, base: string): { subject: string; html: string } {
  switch (event.type) {
    case 'new_resource':
      return {
        subject: `New Book Added: ${event.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#2c2416">New Book in the Library</h2>
            <h3 style="margin:0">${event.title}</h3>
            <p style="color:#666">by ${event.author}</p>
            <p style="margin-top:16px"><a href="${base}/library/${event.id}" style="background:#8a6d3b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">View Book</a></p>
            <p style="margin-top:24px;font-size:12px;color:#888">You're receiving this because you subscribed to Kingdom Library updates.</p>
          </div>`,
      }
    case 'new_course':
      return {
        subject: `New Course: ${event.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#2c2416">New Course Available</h2>
            <h3 style="margin:0">${event.title}</h3>
            <p style="color:#666">Category: ${event.category}</p>
            <p style="margin-top:16px"><a href="${base}/courses/${event.id}" style="background:#8a6d3b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">View Course</a></p>
            <p style="margin-top:24px;font-size:12px;color:#888">You're receiving this because you subscribed to Kingdom Library updates.</p>
          </div>`,
      }
    case 'new_lesson':
      return {
        subject: `New Lesson: ${event.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#2c2416">New Lesson Added</h2>
            <h3 style="margin:0">${event.title}</h3>
            <p style="color:#666">In course: ${event.courseTitle}</p>
            <p style="margin-top:16px"><a href="${base}/courses/${event.courseId}" style="background:#8a6d3b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">Go to Course</a></p>
            <p style="margin-top:24px;font-size:12px;color:#888">You're receiving this because you subscribed to Kingdom Library updates.</p>
          </div>`,
      }
    case 'article_published':
      return {
        subject: `New Article: ${event.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#2c2416">New Article Published</h2>
            <h3 style="margin:0">${event.title}</h3>
            <p style="color:#666">${event.summary}</p>
            <p style="color:#888;font-size:12px">Category: ${event.category}</p>
            <p style="margin-top:16px"><a href="${base}/news/${event.id}" style="background:#8a6d3b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">Read Article</a></p>
            <p style="margin-top:24px;font-size:12px;color:#888">You're receiving this because you subscribed to Kingdom Library updates.</p>
          </div>`,
      }
  }
}

/**
 * Sends a broadcast email to all active NewsletterSubscribers.
 * Fire-and-forget — never throws, never blocks the caller's real action.
 */
export async function broadcastToSubscribers(event: BroadcastEvent): Promise<void> {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { active: true },
      select: { email: true },
    })
    if (subscribers.length === 0) return

    const base = appBaseUrl()
    const { subject, html } = buildEmail(event, base)

    // Send in batches of 10 to avoid overwhelming the SMTP connection
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10)
      await Promise.allSettled(batch.map((s) => sendMail(s.email, subject, html)))
    }
  } catch (error) {
    console.error('[broadcastToSubscribers] failed:', error)
  }
}
