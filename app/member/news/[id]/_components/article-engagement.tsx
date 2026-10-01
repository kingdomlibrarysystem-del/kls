'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThumbsUp, ThumbsDown, MessageSquare, Send, Trash2, LogIn, UserPlus, Loader2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LocalDate } from '@/components/ui/local-date'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { COMMENT_MAX_LENGTH, type ArticleComment, type ArticleEngagement, type ReactionType } from '@/lib/news-engagement-shared'

/** Reads an API response safely: a non-JSON reply (e.g. an HTML error page) becomes a readable error instead of "Unexpected token '<'". */
async function readJson<T>(res: Response): Promise<{ data?: T; message?: string } | null> {
  return res.json().catch(() => null)
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'M'
}

/** Session-storage key for a comment typed before signing in, so it survives the trip to the login/register page. */
const draftKey = (articleId: string) => `kls-news-comment-draft:${articleId}`

/**
 * Shown only AFTER a signed-out reader tries to post a comment or like/dislike
 * (never up front): commenting and reacting need an account. Both links carry
 * `redirect` so the reader lands back on this article's comments.
 */
function SignInPrompt({ redirect, reason }: { redirect: string; reason: string }) {
  const q = `?redirect=${encodeURIComponent(redirect)}`
  return (
    <div role="status" className="flex flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Sign in to continue</p>
        <p className="text-xs text-muted-foreground">{reason}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/auth/login${q}`} className={cn(buttonVariants({ variant: 'default' }), 'h-9 px-4')}>
          <LogIn /> Sign in
        </Link>
        <Link href={`/auth/register${q}`} className={cn(buttonVariants({ variant: 'outline' }), 'h-9 px-4')}>
          <UserPlus /> Create account
        </Link>
      </div>
    </div>
  )
}

/**
 * Likes / dislikes and comments under a news article (public /news/[id] and
 * member /member/news/[id]). Everyone can read, and everyone sees the
 * like/dislike buttons and the comment box. Signed-out readers are only asked
 * to sign in (or create an account) at the moment they click like/dislike or
 * submit a comment; they are then sent back to this section, and the comment
 * they typed is restored from sessionStorage. Initial data is rendered on the
 * server (see lib/server/news-article-page.ts).
 */
export function ArticleEngagementSection({ articleId, initial, loadFailed = false }: { articleId: string; initial: ArticleEngagement; loadFailed?: boolean }) {
  const { user, isAuthenticated } = useAuth()
  const pathname = usePathname() ?? '/news'
  const [counts, setCounts] = useState({ likes: initial.likes, dislikes: initial.dislikes })
  const [myReaction, setMyReaction] = useState<ReactionType | null>(initial.myReaction)
  const [comments, setComments] = useState<ArticleComment[]>(initial.comments)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [reacting, setReacting] = useState(false)
  const [error, setError] = useState('')
  /** Which action a signed-out reader just attempted — drives where the sign-in prompt appears. Null until they try. */
  const [authPrompt, setAuthPrompt] = useState<'react' | 'comment' | null>(null)
  // Come back to the comments section (anchor) after signing in.
  const redirect = `${pathname}#comments`

  // Restore a comment typed before signing in. Deferred to a frame so the
  // first client render matches the server HTML (empty box).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = window.sessionStorage.getItem(draftKey(articleId))
        if (saved) setDraft(saved)
      } catch { /* storage unavailable (private mode) — nothing to restore */ }
    })
    return () => cancelAnimationFrame(frame)
  }, [articleId])

  const updateDraft = (value: string) => {
    const next = value.slice(0, COMMENT_MAX_LENGTH)
    setDraft(next)
    try {
      if (next) window.sessionStorage.setItem(draftKey(articleId), next)
      else window.sessionStorage.removeItem(draftKey(articleId))
    } catch { /* ignore */ }
  }

  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff'

  const react = async (type: ReactionType) => {
    if (!isAuthenticated) { setAuthPrompt('react'); return }
    if (reacting) return
    const next = myReaction === type ? null : type
    // Optimistic update, rolled back if the request fails.
    const prev = { counts, myReaction }
    setCounts((c) => ({
      likes: c.likes + (next === 'LIKE' ? 1 : 0) - (myReaction === 'LIKE' ? 1 : 0),
      dislikes: c.dislikes + (next === 'DISLIKE' ? 1 : 0) - (myReaction === 'DISLIKE' ? 1 : 0),
    }))
    setMyReaction(next)
    setReacting(true)
    setError('')
    try {
      const res = await fetch('/api/news/reactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, type: next }),
      })
      const json = await readJson<{ likes: number; dislikes: number; myReaction: ReactionType | null }>(res)
      if (!res.ok || !json?.data) throw new Error(json?.message ?? 'Could not save your reaction')
      setCounts({ likes: json.data.likes, dislikes: json.data.dislikes })
      setMyReaction(json.data.myReaction)
    } catch (e) {
      setCounts(prev.counts)
      setMyReaction(prev.myReaction)
      setError(e instanceof Error ? e.message : 'Could not save your reaction')
    } finally {
      setReacting(false)
    }
  }

  const postComment = async () => {
    const body = draft.trim()
    if (!body || posting) return
    // Signed out: keep the text (already saved by updateDraft) and ask to sign in now.
    if (!isAuthenticated) { setAuthPrompt('comment'); return }
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/api/news/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, body }),
      })
      const json = await readJson<ArticleComment>(res)
      if (!res.ok || !json?.data) throw new Error(json?.message ?? 'Could not post your comment')
      const created = json.data
      setComments((c) => [created, ...c])
      updateDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post your comment')
    } finally {
      setPosting(false)
    }
  }

  const deleteComment = async (id: string) => {
    if (!window.confirm('Delete this comment?')) return
    setError('')
    const res = await fetch(`/api/news/comments/${id}`, { method: 'DELETE' })
    if (res.ok) setComments((c) => c.filter((x) => x.id !== id))
    else setError((await readJson<unknown>(res))?.message ?? 'Could not delete this comment')
  }

  const reactBtn = (type: ReactionType, count: number) => {
    const active = myReaction === type
    const Icon = type === 'LIKE' ? ThumbsUp : ThumbsDown
    return (
      <Button
        type="button"
        variant={active ? 'default' : 'outline'}
        aria-pressed={active}
        aria-label={`${type === 'LIKE' ? 'Like' : 'Dislike'} this article (${count})`}
        onClick={() => react(type)}
        className="h-9 gap-2 px-4"
      >
        <Icon className={cn(active && 'fill-current')} />
        <span suppressHydrationWarning className="font-semibold tabular-nums">{count.toLocaleString()}</span>
      </Button>
    )
  }

  return (
    <section id="comments" aria-label="Reactions and comments" className="scroll-mt-24 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      {/* Reactions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">What did you think of this article?</p>
        <div className="flex flex-wrap gap-2">
          {reactBtn('LIKE', counts.likes)}
          {reactBtn('DISLIKE', counts.dislikes)}
        </div>
      </div>
      {authPrompt === 'react' && !isAuthenticated && (
        <SignInPrompt redirect={redirect} reason="You need an account to like or dislike an article. Sign in or create one — you'll come right back here." />
      )}

      <div className="h-px bg-border" />

      {/* Comments */}
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">
          Comments <span className="font-normal text-muted-foreground">({comments.length})</span>
        </h2>
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => { e.preventDefault(); postComment() }}
      >
        <Textarea
          value={draft}
          onChange={(e) => updateDraft(e.target.value)}
          placeholder="Share your thoughts on this article…"
          rows={3}
          aria-label="Write a comment"
          className="min-h-20 resize-y text-sm"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{draft.length}/{COMMENT_MAX_LENGTH}</span>
          <Button type="submit" disabled={!draft.trim() || posting} className="h-9 px-4">
            {posting ? <Loader2 className="animate-spin" /> : <Send />} Post comment
          </Button>
        </div>
      </form>
      {authPrompt === 'comment' && !isAuthenticated && (
        <SignInPrompt redirect={redirect} reason="You need an account to post your comment. Sign in or create one — your text is saved and will be waiting here when you come back." />
      )}

      {loadFailed && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Existing comments and reactions couldn&apos;t be loaded right now. Please refresh in a moment.
        </p>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No comments yet — be the first to share your thoughts.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {comments.map((c) => {
            const canDelete = user?.id === c.userId || isStaff
            return (
              <li key={c.id} className="flex gap-3 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initials(c.authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-sm font-semibold text-foreground">{c.authorName}</span>
                    <LocalDate value={c.createdAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} className="text-xs text-muted-foreground" />
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </div>
                {canDelete && (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete comment" onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
