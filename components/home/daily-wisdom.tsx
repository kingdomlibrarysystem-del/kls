'use client'

import { useEffect, useRef, useState } from 'react'
import { BookHeart, MousePointerClick, Pause, Play } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const SHOW_MS = 10_000
const HIDE_MS = 60 * 60 * 1000
const FADE_MS = 400
const TICK_MS = 100
/** First-ever marker: the auto-show fires once per browser, not on every refresh. */
const SEEN_KEY = 'kcs-daily-wisdom-seen'

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}

function nextMidnight() {
  const next = new Date()
  next.setHours(24, 0, 0, 0)
  return next
}

/**
 * Daily Wisdom — a well-designed WHITE card that lives in the main header
 * between the search box and the language switcher. It only shows the word
 * "DAILY WISDOM" (cinzel letter-spaced) plus a small icon — no verse
 * reference, keeping the header tidy. Clicking it opens the full verse as an
 * absolutely-positioned overlay modal (centered, in front of everything,
 * above the sticky header). The modal has NO close affordance at all —
 * clicking the dimmed backdrop does nothing, so it never disappears
 * unexpectedly. A thin gold progress line across its bottom fills as the
 * 10-second preview counts down; after 10 seconds the modal hides on its
 * own. A centered pause button lets the reader stop the countdown and read
 * carefully; pressing it again resumes from where it left off.
 *
 * When it opens on its own: ONLY the very first time the app is opened in
 * this browser (a `kcs-daily-wisdom-seen` localStorage marker), so a plain
 * refresh never pops it again. After that the 10-second preview returns
 * once per hour while the page stays open (HIDE_MS), and the header button
 * opens it any time. One verse lasts 24 hours — it only changes at local
 * 12:00 AM.
 */
export function DailyWisdom() {
  const { t } = useLanguage()
  const verses = [
    { text: t('daily_wisdom.verse_1'), ref: t('daily_wisdom.ref_1') },
    { text: t('daily_wisdom.verse_2'), ref: t('daily_wisdom.ref_2') },
    { text: t('daily_wisdom.verse_3'), ref: t('daily_wisdom.ref_3') },
  ]
  const [today, setToday] = useState(() => new Date())
  const [visible, setVisible] = useState(false)
  const [tour, setTour] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const prevVisible = useRef(false)

  useEffect(() => {
    const id = setTimeout(() => setToday(new Date()), nextMidnight().getTime() - Date.now())
    return () => clearTimeout(id)
  }, [today])

  // First-ever app open in this browser: show the verse once (per the design
  // this session) AND arm the blue "where to click" bubble next to the header
  // button, so a brand-new visitor learns the button exists. A refresh or
  // later return must not show either again — the marker gates everything.
  const openFromHeader = () => {
    setTour(false)
    setVisible(true)
  }

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(SEEN_KEY)) {
        window.localStorage.setItem(SEEN_KEY, String(Date.now()))
        setVisible(true)
        setTour(true)
      }
    } catch {
      // Storage unavailable (private mode etc.) — stay closed rather than
      // annoying the reader on every load.
    }
  }, [])

  // Hourly re-show when the modal is hidden.
  useEffect(() => {
    if (visible) return
    const id = setTimeout(() => setVisible(true), HIDE_MS)
    return () => clearTimeout(id)
  }, [visible])

  // Countdown clock while shown (stops when paused).
  useEffect(() => {
    if (!visible || paused) return
    const id = setInterval(() => setElapsed((e) => e + TICK_MS), TICK_MS)
    return () => clearInterval(id)
  }, [visible, paused])

  // Hide once the 10 seconds elapse.
  useEffect(() => {
    if (visible && !paused && elapsed >= SHOW_MS) setVisible(false)
  }, [visible, paused, elapsed])

  // Each time a new show begins, reset the clock and unpause.
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setElapsed(0)
      setPaused(false)
    }
    prevVisible.current = visible
  }, [visible])

  const index = ((dayOfYear(today) % verses.length) + verses.length) % verses.length
  const { text, ref } = verses[index]
  const progress = Math.min(100, (elapsed / SHOW_MS) * 100)

  return (
    <>
      <style>{`
        @keyframes kcs-dw-tour-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .kcs-dw-tour { animation: kcs-dw-tour-bob 1.6s ease-in-out infinite; }
      `}</style>
      <span className="relative inline-flex flex-shrink-0">
        <button
          type="button"
          onClick={openFromHeader}
          className="flex items-center gap-2 rounded-lg bg-white dark:bg-white shadow-sm border border-w-300 dark:border-w-300 px-3 py-1.5 hover:shadow-md hover:border-w-600 dark:hover:border-w-500 transition cursor-pointer whitespace-nowrap"
        >
          <span className="font-cinzel text-[11px] font-bold uppercase tracking-widest text-w-950">
            {t('daily_wisdom.label')}
          </span>
        </button>

        {tour && (
          <button
            type="button"
            onClick={openFromHeader}
            className="kcs-dw-tour group absolute right-0 top-full z-[80] mt-3 flex items-center gap-2 rounded-lg bg-sky-600 text-white shadow-xl cursor-pointer text-left max-w-[240px]"
          >
            <span className="absolute -top-2 right-6 h-0 w-0 border-x-8 border-x-transparent border-b-8 border-b-sky-600" />
            <MousePointerClick size={14} className="ml-2 shrink-0" />
            <span className="py-2 pr-3 font-lato text-[11px] font-semibold leading-snug">
              {t('daily_wisdom.tour')}
            </span>
            <span className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[9px] font-bold">
              x
            </span>
          </button>
        )}
      </span>

      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease`, pointerEvents: visible ? 'auto' : 'none' }}
        aria-hidden={!visible}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-w-200 dark:border-gray-700 bg-white dark:bg-[#121726] p-6 pb-16 shadow-2xl text-center">
          <div className="mx-auto flex w-11 h-11 items-center justify-center rounded-full bg-w-100 dark:bg-gray-800">
            <BookHeart size={20} className="text-w-600 dark:text-amber-500/70" />
          </div>
          <h3 className="mt-3 font-cinzel text-sm font-bold uppercase tracking-[0.25em] text-w-950 dark:text-gray-100">
            {t('daily_wisdom.label')}
          </h3>
          <div className="mx-auto mt-2 mb-4 h-px w-16 bg-w-600 dark:bg-amber-500/70" />
          <p className="font-cormorant italic text-lg leading-relaxed text-w-950 dark:text-gray-100">
            « {text} »
          </p>
          <span className="mt-3 block font-cinzel text-xs tracking-widest text-w-600 dark:text-amber-500/70">
            {ref}
          </span>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-w-100/70 dark:bg-gray-800/70">
            <div
              className="h-full"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6b5020, #d4a843)' }}
            />
          </div>

          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume daily wisdom' : 'Pause daily wisdom'}
              title={paused ? t('daily_wisdom.label') : t('daily_wisdom.label')}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-white dark:bg-[#121726] border border-w-300 dark:border-gray-600 text-w-700 dark:text-gray-200 shadow-sm hover:border-w-500 dark:hover:border-amber-500/60 hover:text-w-950 dark:hover:text-white transition cursor-pointer"
            >
              {paused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}