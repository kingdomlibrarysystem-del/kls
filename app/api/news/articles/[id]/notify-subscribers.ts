import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'

/**
 * Fans out a real Notification (+ optional email, per each recipient's own
 * preferences) to every NewsSubscription matching this article's category
 * or subscribed to "all categories" (category: null) — extracted from
 * [id]/route.ts's PATCH handler to keep that file under the 200-line cap,
 * same pattern create-borrow.ts/transition.ts establish elsewhere.
 */
export async function notifyPublishSubscribers(article: { id: string; title: string; category: string }) {
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
  })))
}
