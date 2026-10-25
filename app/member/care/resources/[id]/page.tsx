import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, HeartHandshake } from 'lucide-react'
import { requirePageAuth } from '@/lib/server/page-session'
import { openResource } from '@/lib/care/data'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { buttonVariants } from '@/components/ui/button'
import { youtubeId } from '@/lib/media-embed'

/** One reading / audio / video. YouTube links play embedded; uploaded audio and video play in the page. */
export default async function CareResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAuth()
  const r = await openResource((await params).id)
  if (!r) notFound()
  const yt = r.mediaUrl ? youtubeId(r.mediaUrl) : null

  return (
    <article className="space-y-5">
      <Link href="/member/care/resources" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All readings &amp; recordings</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{r.kind === 'AUDIO' ? 'Listen' : r.kind === 'VIDEO' ? 'Watch' : 'Read'} · {r.topic}</p>
        <h2 className="mt-1 font-cinzel text-2xl font-bold leading-tight text-foreground">{r.title}</h2>
        <p className="mt-2 text-base text-muted-foreground">{r.summary}</p>
        {r.durationMins && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> {r.durationMins} min</p>}
      </header>

      {r.kind === 'AUDIO' && r.mediaUrl && (
        <audio controls preload="metadata" src={r.mediaUrl} className="w-full">Your browser cannot play this audio.</audio>
      )}
      {r.kind === 'VIDEO' && r.mediaUrl && (yt ? (
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
          <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={r.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full" />
        </div>
      ) : (
        <video controls preload="metadata" src={r.mediaUrl} className="w-full rounded-xl border border-border bg-black">Your browser cannot play this video.</video>
      ))}

      {r.body && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <MarkdownContent markdown={r.body} />
        </div>
      )}

      <aside className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <HeartHandshake className="size-6 text-primary" />
        <p className="flex-1 text-sm text-muted-foreground">Would it help to talk this through with someone?</p>
        <Link href="/member/care/counseling" className={buttonVariants({ size: 'sm' })}>Talk to a counselor</Link>
      </aside>
    </article>
  )
}
