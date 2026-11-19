'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import type { WisdomReactions } from '@/lib/data/daily-wisdom-reactions'

interface WisdomReactionsBarProps {
  verseId: string
  /** The reader's local day "YYYY-MM-DD" — likes and comments belong to this day only. */
  dateKey: string
  /** 'dark' on the navy home card, 'light' in the header pop-up. */
  tone?: 'dark' | 'light'
  /** Called when the reader starts interacting (the header pop-up pauses its countdown). */
  onInteract?: () => void
}

const EMPTY: WisdomReactions = { likes: 0, liked: false, comments: [] }

/**
 * Like + comments on today's Daily Wisdom. Everyone sees the counts and
 * comments; signed-in readers like / comment / delete their own comment.
 * Everything here is deleted at the end of the day (server rule in
 * lib/data/daily-wisdom-reactions.ts) — the note under the comments says so.
 */
export function WisdomReactionsBar({ verseId, dateKey, tone = 'light', onInteract }: WisdomReactionsBarProps) {
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<WisdomReactions>(EMPTY)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<'like' | 'comment' | string | null>(null)
  const [error, setError] = useState('')
  const dark = tone === 'dark'

  useEffect(() => {
    let alive = true
    fetch(`/api/daily-wisdom/reactions?verseId=${verseId}&date=${dateKey}`)
      .then((r) => r.json())
      .then((j) => { if (alive && j?.code === 'success') setData(j.data) })
      .catch(() => {})
    return () => { alive = false }
  }, [verseId, dateKey])

  const send = async (key: string, url: string, init: RequestInit) => {
    setBusy(key)
    setError('')
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Something went wrong')
      setData(json.data)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      return false
    } finally {
      setBusy(null)
    }
  }

  const like = () => {
    onInteract?.()
    // Show the change at once; the server's answer then confirms the real count.
    setData((d) => ({ ...d, liked: !d.liked, likes: d.likes + (d.liked ? -1 : 1) }))
    void send('like', '/api/daily-wisdom/reactions/like', { method: 'POST', body: JSON.stringify({ verseId, date: dateKey }) })
  }
  const post = async () => {
    if (!text.trim()) return
    onInteract?.()
    if (await send('comment', '/api/daily-wisdom/reactions/comments', { method: 'POST', body: JSON.stringify({ verseId, date: dateKey, text }) })) setText('')
  }
  const remove = (id: string) => send(id, `/api/daily-wisdom/reactions/comments/${id}`, { method: 'DELETE' })

  const pill = cn(
    'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors',
    dark ? 'text-[#f6efe0]/85 hover:bg-white/10' : 'text-w-700 hover:bg-w-100 dark:text-gray-300 dark:hover:bg-white/10',
  )

  return (
    <div className="text-left">
      <div className="flex flex-wrap items-center gap-1">
        {isAuthenticated ? (
          <button type="button" onClick={like} aria-pressed={data.liked} aria-label={data.liked ? t('daily_wisdom.unlike') : t('daily_wisdom.like')} className={pill}>
            <Heart className={cn('size-[18px] transition-transform', data.liked && 'scale-110')} fill={data.liked ? '#e0245e' : 'none'} color={data.liked ? '#e0245e' : 'currentColor'} />
            {data.likes}
          </button>
        ) : (
          <Link href="/auth/login" className={pill} aria-label={t('daily_wisdom.sign_in_to_react')}>
            <Heart className="size-[18px]" /> {data.likes}
          </Link>
        )}
        <button type="button" onClick={() => { setOpen((o) => !o); onInteract?.() }} aria-expanded={open} className={pill}>
          <MessageCircle className="size-[18px]" /> {data.comments.length}
          <span className="sr-only">{t('daily_wisdom.comments')}</span>
        </button>
      </div>

      {open && (
        <div className={cn('mt-2 rounded-lg p-3', dark ? 'bg-black/20' : 'bg-w-50 dark:bg-white/5')}>
          {isAuthenticated ? (
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={onInteract}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void post() } }}
                rows={2}
                maxLength={500}
                placeholder={t('daily_wisdom.write_comment')}
                className={cn(
                  'min-h-10 flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40',
                  dark ? 'border-white/15 bg-white/10 text-[#f6efe0] placeholder:text-[#f6efe0]/50' : 'border-w-300 bg-white text-w-950 dark:border-gray-600 dark:bg-[#0f1424] dark:text-gray-100',
                )}
              />
              <button type="button" onClick={() => void post()} disabled={!text.trim() || busy === 'comment'} aria-label={t('daily_wisdom.post')} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                {busy === 'comment' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="text-sm font-semibold text-primary hover:underline">{t('daily_wisdom.sign_in_to_react')}</Link>
          )}
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {data.comments.length === 0 && <li className={cn('text-xs', dark ? 'text-[#f6efe0]/60' : 'text-w-600 dark:text-gray-400')}>{t('daily_wisdom.no_comments')}</li>}
            {data.comments.map((c) => (
              <li key={c.id} className={cn('rounded-lg px-3 py-2 text-sm', dark ? 'bg-white/5' : 'bg-white dark:bg-[#0f1424]')}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-xs font-bold', dark ? 'text-primary' : 'text-w-950 dark:text-gray-100')}>{c.userName}</span>
                  {c.mine && (
                    <button type="button" onClick={() => void remove(c.id)} disabled={busy === c.id} aria-label={t('daily_wisdom.delete_comment')} className={cn('rounded p-1 transition', dark ? 'text-[#f6efe0]/50 hover:text-red-300' : 'text-w-500 hover:text-red-600')}>
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className={cn('mt-0.5 whitespace-pre-wrap break-words', dark ? 'text-[#f6efe0]/90' : 'text-w-800 dark:text-gray-200')}>{c.text}</p>
              </li>
            ))}
          </ul>
          <p className={cn('mt-2 text-[11px]', dark ? 'text-[#f6efe0]/50' : 'text-w-500 dark:text-gray-500')}>{t('daily_wisdom.gone_note')}</p>
        </div>
      )}
    </div>
  )
}
