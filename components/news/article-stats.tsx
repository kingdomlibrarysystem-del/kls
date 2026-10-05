import { Eye, ThumbsUp, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ArticleStats } from '@/lib/news-engagement-shared'

/**
 * The views / likes / comments numbers shown next to a news article wherever
 * it is listed (landing page, /news, /member/news, "more articles", admin
 * tables). Inherits the surrounding text color and size, so it fits both the
 * shadcn-token surfaces and the member portal's own styles in light and dark
 * mode. Renders nothing when no stats were loaded.
 */
export function ArticleStatsRow({ stats, className, iconSize = 12 }: { stats?: ArticleStats | null; className?: string; iconSize?: number }) {
  if (!stats) return null
  const items = [
    { key: 'views', icon: Eye, value: stats.views, label: stats.views === 1 ? 'view' : 'views' },
    { key: 'likes', icon: ThumbsUp, value: stats.likes, label: stats.likes === 1 ? 'like' : 'likes' },
    { key: 'comments', icon: MessageCircle, value: stats.comments, label: stats.comments === 1 ? 'comment' : 'comments' },
  ]
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      {items.map(({ key, icon: Icon, value, label }) => (
        <span key={key} className="inline-flex items-center gap-1" title={`${value} ${label}`}>
          <Icon size={iconSize} aria-hidden />
          <span suppressHydrationWarning>{value.toLocaleString()}</span>
          <span className="sr-only">{label}</span>
        </span>
      ))}
    </span>
  )
}
