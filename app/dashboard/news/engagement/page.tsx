import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage } from '@/lib/server/page-session'
import { getAdminComments, getArticleEngagementStats } from '@/lib/data/news-engagement'
import { toPlain } from '@/lib/server/to-plain'
import { EngagementView } from './_components/engagement-view'
import type { AdminComment, ArticleEngagementStat } from '@/lib/data/news-engagement'

/** Admin moderation of reader comments and likes/dislikes on news articles. Data loaded server-side (PERFORMANCE.md Rule 15). */
export default async function NewsEngagementPage() {
  await requireStaffPage()
  const [comments, stats] = await Promise.all([getAdminComments(), getArticleEngagementStats()])
  return (
    <div>
      <PageHeader title="Comments & Reactions" subtitle="Moderate reader comments and review likes and dislikes on news articles" />
      <EngagementView initialComments={toPlain<AdminComment[]>(comments)} initialStats={toPlain<ArticleEngagementStat[]>(stats)} />
    </div>
  )
}
