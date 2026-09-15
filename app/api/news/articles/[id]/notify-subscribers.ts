import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { sendMail, appBaseUrl } from '@/lib/mailer'
import { broadcastToSubscribers } from '@/lib/newsletter-broadcast'

export async function notifyPublishSubscribers(article: { id: string; title: string; summary: string; category: string }) {
  const base = appBaseUrl()

  // 1. In-app + email notification to logged-in NewsSubscription users
  const subscribers = await prisma.newsSubscription.findMany({
    where: { OR: [{ category: article.category }, { category: null }] },
    select: { userId: true },
  })

  await Promise.all(subscribers.map((s) => notifyUser({
    userId: s.userId,
    type: 'NEWS',
    category: 'news-article-published',
    title: 'New article published',
    message: `"${article.title}" was just published in ${article.category}.`,
    href: `/member/news/${article.id}`,
    email: {
      subject: `New Article: ${article.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#2c2416">New Article Published</h2>
          <h3 style="margin:0">${article.title}</h3>
          <p style="color:#666">${article.summary}</p>
          <p style="color:#888;font-size:12px">Category: ${article.category}</p>
          <p style="margin-top:16px"><a href="${base}/member/news/${article.id}" style="background:#8a6d3b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">Read Article</a></p>
        </div>`,
    },
  })))

  // 2. Broadcast to public newsletter subscribers (no account required)
  await broadcastToSubscribers({
    type: 'article_published',
    title: article.title,
    summary: article.summary,
    category: article.category,
    id: article.id,
  })
}
