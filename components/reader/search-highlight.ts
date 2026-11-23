'use client'

import { useEffect, useMemo } from 'react'
import { searchWords, wordsRegex } from '@/lib/search/text'

/**
 * Highlights the words of a site search (?q=…) inside the reader, so someone
 * who opens a book from a search result sees where the words are.
 *  - PDF pages: `usePdfSearchHighlighter` gives react-pdf a text renderer that
 *    wraps the words in <mark class="kls-search-hit"> in the page's text layer.
 *  - Chapter text: `useTextSearchHighlight` uses the browser's CSS Custom
 *    Highlight API (styled by ::highlight(kls-search) in globals.css), which
 *    marks the words without changing the page's HTML.
 * Matching is the same as the search: a word also marks its longer forms
 * ("corrupt" → "corruption").
 */

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** react-pdf `customTextRenderer` for the searched words, or undefined when there is no search. */
export function usePdfSearchHighlighter(query: string | undefined) {
  return useMemo(() => {
    const words = searchWords(query ?? '')
    if (words.length === 0) return undefined
    return ({ str }: { str: string }) => {
      const re = wordsRegex(words)!
      return escapeHtml(str).replace(re, (m) => `<mark class="kls-search-hit">${m}</mark>`)
    }
  }, [query])
}

/** Waits for the first highlighted word on a PDF page to be drawn, then scrolls it to the middle of the screen. */
export function scrollToFirstPdfHit(pageNumber: number, tries = 30): void {
  const hit = document.querySelector<HTMLElement>(`#pdf-page-${pageNumber} mark.kls-search-hit`)
  if (hit) { hit.scrollIntoView({ block: 'center' }); return }
  if (tries > 0) setTimeout(() => scrollToFirstPdfHit(pageNumber, tries - 1), 200)
}

/** The ::highlight() colour (gold). Added here because the app's CSS build cannot parse ::highlight(). */
function addHighlightStyle() {
  if (document.getElementById('kls-search-highlight-style')) return
  const style = document.createElement('style')
  style.id = 'kls-search-highlight-style'
  style.textContent = '::highlight(kls-search) { background-color: rgba(212, 168, 67, 0.45); color: inherit; }'
  document.head.appendChild(style)
}

type HighlightRegistry ={ set(name: string, h: unknown): void; delete(name: string): void }
type HighlightCtor = new (...ranges: Range[]) => unknown

/**
 * Marks the searched words inside `container` (re-run when `deps` change,
 * e.g. another chapter is shown). Scrolls to the first one when `scrollToFirst`.
 * Does nothing in browsers without the Highlight API.
 */
export function useTextSearchHighlight(container: HTMLElement | null, query: string | undefined, deps: unknown[] = [], scrollToFirst = false) {
  useEffect(() => {
    const registry = (globalThis.CSS as unknown as { highlights?: HighlightRegistry } | undefined)?.highlights
    const Highlight = (globalThis as unknown as { Highlight?: HighlightCtor }).Highlight
    const words = searchWords(query ?? '')
    if (!container || !registry || !Highlight || words.length === 0) return
    const ranges: Range[] = []
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ''
      for (const m of text.matchAll(wordsRegex(words)!)) {
        const range = document.createRange()
        range.setStart(node, m.index!)
        range.setEnd(node, m.index! + m[0].length)
        ranges.push(range)
      }
    }
    if (ranges.length === 0) return
    addHighlightStyle()
    registry.set('kls-search', new Highlight(...ranges))
    if (scrollToFirst) ranges[0].startContainer.parentElement?.scrollIntoView({ block: 'center' })
    return () => registry.delete('kls-search')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, query, scrollToFirst, ...deps])
}
