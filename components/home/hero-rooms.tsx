'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookHeart, BookOpen, RotateCw } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import { localDateKey, type TodayVerse } from '@/lib/daily-wisdom-shared'
import { cn } from '@/lib/utils'
import { WisdomReactionsBar } from './wisdom-reactions'

export interface HeroBook {
  id: string
  title: string
  author?: string
  cover: string
}

/**
 * The three places in the stack: in front, peeking out up-left, peeking out
 * up-right (the back two a little smaller, tilted and darker).
 */
const SLOTS = [
  'translate(0, 0) rotate(0deg) scale(1)',
  'translate(-18%, -16%) rotate(-9deg) scale(0.86)',
  'translate(18%, -10%) rotate(8deg) scale(0.9)',
] as const

/** Time each card stays in front before the stack shuffles (long enough to read the wisdom). */
const TURN_MS = 4000

type Item = { kind: 'book'; book: HeroBook } | { kind: 'wisdom' } | { kind: 'library' }

/** Today's wisdom for the reader's local date (same rule as the header's Daily Wisdom). undefined = loading, null = none. */
function useTodayWisdom(lang: string) {
  const [dateKey] = useState(() => localDateKey())
  const [verse, setVerse] = useState<TodayVerse | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    fetch(`/api/daily-wisdom?date=${dateKey}&lang=${lang}`)
      .then((r) => r.json())
      .then((json) => { if (alive) setVerse(json?.code === 'success' ? json.data : null) })
      .catch(() => { if (alive) setVerse(null) })
    return () => { alive = false }
  }, [dateKey, lang])
  return { verse, dateKey }
}

/**
 * Hero card stack: three equal, book-shaped cards — today's Daily Wisdom and
 * the two NEWEST books — one in front, two peeking out behind. Every few
 * seconds the stack shuffles (the front card goes to the back). Tapping a
 * back card brings it to the front. Tapping the front BOOK opens its page
 * (/library/[id], where the member can read it); tapping the front WISDOM
 * turns it over in 3D to its likes and comments. Any tap stops the shuffle;
 * pointing at it pauses it; "reduce motion" turns it off.
 *
 * Two separate movements on two elements, so they never fight: the outer
 * wrapper moves between places (1.1 s), the inner card flips (0.9 s).
 */
export function HeroRooms({ books }: { books: HeroBook[] }) {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const { verse, dateKey } = useTodayWisdom(lang)
  const [front, setFront] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [auto, setAuto] = useState(true)
  const [hover, setHover] = useState(false)

  // Wisdom, then the two newest books; a missing book becomes a "Library" card.
  const items: Item[] = [{ kind: 'wisdom' }, ...books.slice(0, 2).map((book): Item => ({ kind: 'book', book }))]
  while (items.length < 3) items.push({ kind: 'library' })

  useEffect(() => {
    if (!auto || hover) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => { setFront((f) => (f + 1) % 3); setFlipped(false) }, TURN_MS)
    return () => clearInterval(id)
  }, [auto, hover])

  const tap = (i: number, slot: number) => {
    setAuto(false)
    const item = items[i]
    if (slot !== 0) { setFront(i); setFlipped(false); return }
    // Front card: a book opens its page; the wisdom turns over to its likes and comments.
    if (item.kind === 'book') router.push(`/library/${item.book.id}`)
    else if (item.kind === 'library') router.push('/library')
    else setFlipped((f) => !f)
  }
  const frontItem = items[front]

  return (
    <div className="flex flex-col items-center gap-5" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* Room around the stack so the tilted back cards are not cut off. */}
      <div className="box-content w-full max-w-[300px] px-12 pt-16 [perspective:1400px] sm:max-w-[320px] sm:px-16 sm:pt-20">
        <div className="relative aspect-[3/4] w-full">
          {items.map((item, i) => {
            const slot = (i - front + 3) % 3
            // Only the wisdom card has a back.
            const showBack = slot === 0 && flipped && item.kind === 'wisdom'
            const label = item.kind === 'book' ? item.book.title : item.kind === 'wisdom' ? t('hero.verse_of_day') : t('hero.library_tag')
            return (
              <div
                key={i}
                className={cn('absolute transition-[transform,filter] duration-[1100ms] ease-[cubic-bezier(.45,.05,.25,1)]', item.kind === 'wisdom' ? '-inset-x-[7%] inset-y-0' : 'inset-0')}
                style={{ zIndex: 3 - slot, transform: SLOTS[slot], filter: slot === 0 ? 'none' : 'brightness(0.78)' }}
              >
                <div
                  className="absolute inset-0 rounded-[18px] transition-transform duration-[900ms] ease-[cubic-bezier(.3,.7,.2,1)] [transform-style:preserve-3d]"
                  style={{ transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  {/* Front face: the whole card is the button (back card → to front, front card → flip). */}
                  <button
                    type="button"
                    onClick={() => tap(i, slot)}
                    aria-label={slot !== 0 ? `${t('hero.card_show')}: ${label}` : item.kind === 'wisdom' ? `${label}: ${t('hero.card_flip')}` : `${t('hero.book_open')}: ${label}`}
                    className="absolute inset-0 overflow-hidden rounded-[18px] text-left shadow-[0_40px_80px_-28px_rgba(0,0,0,0.75)] [backface-visibility:hidden]"
                  >
                    {item.kind === 'book' && <BookFront book={item.book} />}
                    {item.kind === 'wisdom' && <WisdomFront verse={verse} label={t('hero.verse_of_day')} fallbackText={t('hero.bible_verse')} fallbackRef={t('hero.bible_ref')} hint={t('hero.wisdom_flip_hint')} />}
                    {item.kind === 'library' && <LibraryFront label={t('hero.library_tag')} />}
                  </button>
                  {/* Back face — only the wisdom card turns over (to its likes and comments). */}
                  {item.kind === 'wisdom' && (
                    <div className="absolute inset-0 overflow-hidden rounded-[18px] shadow-[0_40px_80px_-28px_rgba(0,0,0,0.75)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <WisdomBack verse={verse} dateKey={dateKey} label={t('hero.verse_of_day')} onFlip={() => setFlipped(false)} flipLabel={t('hero.card_front')} active={showBack} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex min-h-10 items-center gap-3">
        {frontItem.kind === 'wisdom' ? (
          <button
            type="button"
            onClick={() => { setAuto(false); setFlipped((f) => !f) }}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#f6efe0]/30 bg-white/5 px-4 text-sm font-semibold text-[#f6efe0] transition hover:bg-white/10"
          >
            <RotateCw className="size-4" /> {flipped ? t('hero.card_front') : t('hero.wisdom_react')}
          </button>
        ) : null}
        <div className="flex gap-1.5" role="group" aria-label={t('hero.books_pick')}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setAuto(false); setFront(i); setFlipped(false) }}
              aria-label={`${i + 1}`}
              aria-current={i === front}
              className={cn('h-1.5 rounded-full transition-all', i === front ? 'w-6 bg-primary' : 'w-1.5 bg-[#f6efe0]/40 hover:bg-[#f6efe0]/70')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Card faces ─────────────────────────────────────────────────────────── */

function BookFront({ book }: { book: HeroBook }) {
  return (
    <span className="relative block size-full bg-[#1a3d5c]">
      <RemoteImage src={book.cover} alt={book.title} fill sizes="320px" className="object-cover" fallback={<span className="flex size-full items-center justify-center p-4 text-center font-cinzel text-lg text-[#f6efe0]">{book.title}</span>} />
      {/* Spine and gloss, so it reads as a real book. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[8%] bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
      <span aria-hidden className="absolute inset-y-0 left-[8%] w-px bg-white/25" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/15" />
    </span>
  )
}

const NAVY_CARD = 'bg-[#245582] text-[#f6efe0]'
/** A lighter blue than the hero (so the card stands out), with a soft gold glow at the top (one background-image, so neither layer hides the other). */
const NAVY_GLOW = { backgroundImage: 'radial-gradient(ellipse at top, rgba(212,168,67,0.22), transparent 60%), linear-gradient(135deg, #2f6796, #245582 50%, #1c4569)' }

/** Font size that lets the whole wisdom fit on the card. */
function wisdomTextSize(length: number) {
  if (length > 650) return 'text-[13px]'
  if (length > 480) return 'text-sm'
  if (length > 320) return 'text-[15px]'
  if (length > 180) return 'text-lg'
  return 'text-xl'
}

function WisdomFront({ verse, label, fallbackText, fallbackRef, hint }: { verse: TodayVerse | null | undefined; label: string; fallbackText: string; fallbackRef: string; hint: string }) {
  const text = verse ? verse.text : fallbackText
  const reference = verse ? verse.reference : fallbackRef.replace(/^[—–-]s*/, '')
  return (
    <span className={cn('relative flex size-full flex-col p-5 sm:p-6', NAVY_CARD)} style={NAVY_GLOW}>
      <span aria-hidden className="absolute inset-2.5 rounded-[12px] border border-primary/30" />
      <span className="relative flex shrink-0 items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        <BookHeart className="size-4" /> {label}
      </span>
      <span aria-hidden className="relative mx-auto mt-2 h-px w-12 shrink-0 bg-primary/60" />
      {verse === undefined ? (
        <span className="relative mt-6 space-y-2.5">
          <span className="block h-4 animate-pulse rounded bg-white/10" />
          <span className="block h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <span className="block h-4 w-4/6 animate-pulse rounded bg-white/10" />
        </span>
      ) : (
        // The whole wisdom is shown; only an unusually long one scrolls inside the card.
        <span className="relative my-auto flex min-h-0 flex-col items-center overflow-y-auto py-3 text-center [scrollbar-width:thin]">
          <span className={cn('font-cormorant italic leading-snug text-[#f6efe0]', wisdomTextSize(text.length))}>“{text}”</span>
          <span className="mt-3 font-cinzel text-xs font-bold tracking-wider text-primary">{reference}</span>
        </span>
      )}
      <span className="relative shrink-0 pt-1 text-center text-[11px] text-[#f6efe0]/55">{hint}</span>
    </span>
  )
}

function WisdomBack({ verse, dateKey, label, onFlip, flipLabel, active }: { verse: TodayVerse | null | undefined; dateKey: string; label: string; onFlip: () => void; flipLabel: string; active: boolean }) {
  return (
    <div className={cn('relative flex size-full flex-col p-5', NAVY_CARD)} style={NAVY_GLOW}>
      <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        <BookHeart className="size-4" /> {label}
      </p>
      {verse && <p className="mt-2 line-clamp-3 text-center font-cormorant text-sm italic leading-snug text-[#f6efe0]/85">“{verse.text}”</p>}
      {/* Likes and comments — only mounted on the card that is turned over, so it loads when needed. */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-white/10 pt-2">
        {verse && active ? <WisdomReactionsBar verseId={verse.id} dateKey={verse.date || dateKey} tone="dark" /> : null}
      </div>
      <button type="button" onClick={onFlip} tabIndex={active ? 0 : -1} className="mt-2 self-center text-xs font-semibold text-[#f6efe0]/60 hover:text-[#f6efe0]">{flipLabel}</button>
    </div>
  )
}

function LibraryFront({ label }: { label: string }) {
  return (
    <span className="relative flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a3d5c] via-[#12304a] to-[#0b2136] text-[#f6efe0]">
      <BookOpen className="size-10 text-primary" />
      <span className="font-cinzel text-base font-bold">{label}</span>
    </span>
  )
}
