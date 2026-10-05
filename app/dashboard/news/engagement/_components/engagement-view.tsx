'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, EyeOff, Eye, Trash2, ThumbsUp, ThumbsDown, RotateCcw, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataTable, type Column } from '@/components/ui/data-table'
import { LocalDate } from '@/components/ui/local-date'
import { cn } from '@/lib/utils'
import type { AdminComment, ArticleEngagementStat } from '@/lib/data/news-engagement'

type StatusFilter = 'ALL' | 'VISIBLE' | 'HIDDEN'

function Kpi({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <Card className="gap-0 rounded-xl border border-border bg-card px-4 py-4 shadow-xs ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex size-8 items-center justify-center rounded-lg [&_svg]:size-4', tone)}>{icon}</span>
      </div>
      <p suppressHydrationWarning className="mt-3 font-cinzel text-2xl font-bold leading-none text-foreground">{value.toLocaleString()}</p>
    </Card>
  )
}

/**
 * Two tabs: Comments (hide / show / delete, filter by status, search) and
 * Article reactions (likes / dislikes / comment counts per article, reset
 * reactions). Starts from server-loaded data; each action updates the row
 * in place after the API confirms.
 */
export function EngagementView({ initialComments, initialStats }: { initialComments: AdminComment[]; initialStats: ArticleEngagementStat[] }) {
  const [comments, setComments] = useState(initialComments)
  const [stats, setStats] = useState(initialStats)
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const flash = (kind: 'ok' | 'error', text: string) => {
    setToast({ kind, text })
    setTimeout(() => setToast(null), 3500)
  }

  const totals = useMemo(() => ({
    comments: comments.length,
    hidden: comments.filter((c) => c.status === 'HIDDEN').length,
    views: stats.reduce((s, a) => s + a.views, 0),
    likes: stats.reduce((s, a) => s + a.likes, 0),
    dislikes: stats.reduce((s, a) => s + a.dislikes, 0),
  }), [comments, stats])

  const filtered = status === 'ALL' ? comments : comments.filter((c) => c.status === status)

  /** Keep the per-article comment counts in sync after moderating a comment. */
  const adjustStat = (articleId: string, delta: { comments?: number; hidden?: number }) => {
    setStats((rows) => rows.map((r) => r.articleId === articleId
      ? { ...r, comments: r.comments + (delta.comments ?? 0), hiddenComments: r.hiddenComments + (delta.hidden ?? 0) }
      : r))
  }

  const setCommentStatus = async (c: AdminComment, next: 'VISIBLE' | 'HIDDEN') => {
    setBusyId(c.id)
    try {
      const res = await fetch(`/api/news/comments/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this comment')
      setComments((rows) => rows.map((r) => (r.id === c.id ? { ...r, status: next } : r)))
      adjustStat(c.articleId, { hidden: next === 'HIDDEN' ? 1 : -1 })
      flash('ok', json?.message ?? 'Comment updated')
    } catch (e) {
      flash('error', e instanceof Error ? e.message : 'Could not update this comment')
    } finally {
      setBusyId(null)
    }
  }

  const deleteComment = async (c: AdminComment) => {
    if (!window.confirm(`Delete this comment by ${c.authorName}? This cannot be undone.`)) return
    setBusyId(c.id)
    try {
      const res = await fetch(`/api/news/comments/${c.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message ?? 'Could not delete this comment')
      setComments((rows) => rows.filter((r) => r.id !== c.id))
      adjustStat(c.articleId, { comments: -1, hidden: c.status === 'HIDDEN' ? -1 : 0 })
      flash('ok', 'Comment deleted')
    } catch (e) {
      flash('error', e instanceof Error ? e.message : 'Could not delete this comment')
    } finally {
      setBusyId(null)
    }
  }

  const resetReactions = async (a: ArticleEngagementStat) => {
    if (!window.confirm(`Remove all ${a.likes + a.dislikes} likes/dislikes on "${a.title}"?`)) return
    setBusyId(a.articleId)
    try {
      const res = await fetch(`/api/news/reactions?articleId=${encodeURIComponent(a.articleId)}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message ?? 'Could not reset reactions')
      setStats((rows) => rows.map((r) => (r.articleId === a.articleId ? { ...r, likes: 0, dislikes: 0 } : r)))
      flash('ok', json?.message ?? 'Reactions reset')
    } catch (e) {
      flash('error', e instanceof Error ? e.message : 'Could not reset reactions')
    } finally {
      setBusyId(null)
    }
  }

  const commentColumns: Column<AdminComment>[] = [
    {
      key: 'body',
      label: 'Comment',
      render: (c) => (
        <div className="min-w-[240px] max-w-[420px]">
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-foreground">{c.body}</p>
        </div>
      ),
    },
    { key: 'authorName', label: 'Author', sortable: true, render: (c) => <span className="font-medium">{c.authorName}</span> },
    {
      key: 'articleTitle',
      label: 'Article',
      sortable: true,
      render: (c) => (
        <Link href={`/dashboard/news/articles/${c.articleId}`} className="line-clamp-2 max-w-[220px] text-primary hover:underline">{c.articleTitle}</Link>
      ),
    },
    {
      key: 'createdAt',
      label: 'Posted',
      sortable: true,
      render: (c) => <LocalDate value={c.createdAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} className="whitespace-nowrap text-muted-foreground" />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (c) => (
        <Badge variant="outline" className={c.status === 'VISIBLE' ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-muted text-muted-foreground'}>
          {c.status === 'VISIBLE' ? 'Visible' : 'Hidden'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <div className="flex gap-1.5">
          {c.status === 'VISIBLE' ? (
            <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => setCommentStatus(c, 'HIDDEN')}><EyeOff /> Hide</Button>
          ) : (
            <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => setCommentStatus(c, 'VISIBLE')}><Eye /> Show</Button>
          )}
          <Button variant="destructive" size="sm" disabled={busyId === c.id} onClick={() => deleteComment(c)} aria-label="Delete comment"><Trash2 /></Button>
        </div>
      ),
    },
  ]

  const statColumns: Column<ArticleEngagementStat>[] = [
    {
      key: 'title',
      label: 'Article',
      sortable: true,
      render: (a) => (
        <div className="flex min-w-[220px] items-center gap-2">
          <Link href={`/dashboard/news/articles/${a.articleId}`} className="font-medium text-foreground hover:text-primary hover:underline">{a.title}</Link>
          {a.status === 'PUBLISHED' && (
            <Link href={`/news/${a.articleId}`} target="_blank" aria-label="Open public article" className="text-muted-foreground hover:text-primary"><ExternalLink className="size-3.5" /></Link>
          )}
        </div>
      ),
    },
    { key: 'views', label: 'Views', sortable: true, render: (a) => <span suppressHydrationWarning className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Eye className="size-3.5 text-muted-foreground" /> {a.views.toLocaleString()}</span> },
    { key: 'likes', label: 'Likes', render: (a) => <span className="inline-flex items-center gap-1.5 font-semibold text-success"><ThumbsUp className="size-3.5" /> {a.likes}</span> },
    { key: 'dislikes', label: 'Dislikes', render: (a) => <span className="inline-flex items-center gap-1.5 font-semibold text-destructive"><ThumbsDown className="size-3.5" /> {a.dislikes}</span> },
    {
      key: 'comments',
      label: 'Comments',
      render: (a) => (
        <span className="text-foreground">{a.comments}{a.hiddenComments > 0 && <span className="text-muted-foreground"> ({a.hiddenComments} hidden)</span>}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (a) => (
        <Button variant="outline" size="sm" disabled={busyId === a.articleId || a.likes + a.dislikes === 0} onClick={() => resetReactions(a)}>
          <RotateCcw /> Reset reactions
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" aria-label="Engagement totals">
        <Kpi label="Article views" value={totals.views} icon={<Eye />} tone="bg-info/10 text-info" />
        <Kpi label="Comments" value={totals.comments} icon={<MessageSquare />} tone="bg-primary/10 text-primary" />
        <Kpi label="Hidden comments" value={totals.hidden} icon={<EyeOff />} tone="bg-muted text-muted-foreground" />
        <Kpi label="Likes" value={totals.likes} icon={<ThumbsUp />} tone="bg-success/10 text-success" />
        <Kpi label="Dislikes" value={totals.dislikes} icon={<ThumbsDown />} tone="bg-destructive/10 text-destructive" />
      </section>

      {toast && (
        <div role="status" className={cn('rounded-lg border px-4 py-2.5 text-sm', toast.kind === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
          {toast.text}
        </div>
      )}

      <Tabs defaultValue="comments" className="gap-4">
        <TabsList className="h-10">
          <TabsTrigger value="comments" className="px-4"><MessageSquare /> Comments</TabsTrigger>
          <TabsTrigger value="reactions" className="px-4"><ThumbsUp /> Article reactions</TabsTrigger>
        </TabsList>

        <TabsContent value="comments">
          <DataTable
            data={filtered}
            columns={commentColumns}
            rowKey={(c) => c.id}
            searchPlaceholder="Search comments, authors or articles…"
            searchFilter={(c, q) => c.body.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q) || c.articleTitle.toLowerCase().includes(q)}
            filters={
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="h-9 rounded-lg border border-input bg-background px-3 font-lato text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="ALL">All statuses</option>
                <option value="VISIBLE">Visible</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            }
            emptyMessage="No comments yet. Reader comments on published articles appear here."
          />
        </TabsContent>

        <TabsContent value="reactions">
          <DataTable
            data={stats}
            columns={statColumns}
            rowKey={(a) => a.articleId}
            searchPlaceholder="Search articles…"
            searchFilter={(a, q) => a.title.toLowerCase().includes(q)}
            emptyMessage="No likes, dislikes or comments on any article yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
