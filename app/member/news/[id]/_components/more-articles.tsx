import Link from 'next/link'
import { Newspaper, ArrowRight } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { LocalDate } from '@/components/ui/local-date'
import { ArticleStatsRow } from '@/components/news/article-stats'
import type { MoreArticleItem } from '@/lib/data/news-articles'

/**
 * "More articles" rail beside the article reader (left column on wide
 * screens, below the article on small ones). Items come from the server
 * (getMoreArticles) — latest published articles, excluding the current one.
 */
export function MoreArticles({ items, basePath }: { items: MoreArticleItem[]; basePath: string }) {
  return (
    <section aria-label="More articles" className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
    

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">No other articles yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`${basePath}/${a.id}`} className="group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {a.coverImage ? (
                    <RemoteImage
                      src={a.coverImage}
                      alt=""
                      fill
                      sizes="56px"
                      style={{ objectFit: 'cover' }}
                      fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><Newspaper className="size-5" /></div>}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground"><Newspaper className="size-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">{a.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wide text-primary/80">{a.isEdition ? 'Edition' : a.category}</span>
                    {a.publishedAt && (
                      <>
                        <span aria-hidden>·</span>
                        <LocalDate value={a.publishedAt} options={{ dateStyle: 'medium' }} />
                      </>
                    )}
                  </p>
                  <ArticleStatsRow stats={a.stats} iconSize={11} className="mt-1 text-[11px] text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
