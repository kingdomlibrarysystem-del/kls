import { useState, useCallback } from 'react'

export interface PendingSelection {
  /** Chapter-relative character offsets, computed from paragraph index + intra-paragraph offset. */
  startOffset: number
  endOffset: number
  text: string
  position: { top: number; left: number }
}

/**
 * Captures a real browser text selection made inside a chapter body
 * (one container of sibling `data-paragraph-index`/`data-paragraph-start`
 * elements, per HighlightedParagraph) and converts it into chapter-
 * relative character offsets — offsets are stored relative to the whole
 * chapter body string (see highlight-data.ts), not per-paragraph, so a
 * highlight's position stays meaningful regardless of how paragraphs are
 * split for rendering.
 */
export function useChapterSelection() {
  const [pending, setPending] = useState<PendingSelection | null>(null)

  const captureSelection = useCallback((containerEl: HTMLElement | null) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !containerEl) {
      setPending(null)
      return
    }
    const rawText = selection.toString()
    const text = rawText.trim()
    if (!text) {
      setPending(null)
      return
    }
    /** Leading whitespace trimmed off the raw selection — shifts startOffset forward so stored offsets match `text` exactly, not the untrimmed selection. */
    const leadingTrim = rawText.length - rawText.trimStart().length

    const range = selection.getRangeAt(0)
    const paragraphEls = Array.from(containerEl.querySelectorAll<HTMLElement>('[data-paragraph-start]'))
    const startParagraph = paragraphEls.find((el) => el.contains(range.startContainer))
    if (!startParagraph) {
      setPending(null)
      return
    }
    const paragraphStart = Number(startParagraph.dataset.paragraphStart)

    // Sum plain-text length of nodes before the selection start within this paragraph.
    let offsetWithinParagraph = 0
    const walker = document.createTreeWalker(startParagraph, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      if (node === range.startContainer) {
        offsetWithinParagraph += range.startOffset
        break
      }
      offsetWithinParagraph += node.textContent?.length ?? 0
      node = walker.nextNode()
    }

    const startOffset = paragraphStart + offsetWithinParagraph + leadingTrim
    const endOffset = startOffset + text.length
    const rect = range.getBoundingClientRect()

    setPending({ startOffset, endOffset, text, position: { top: rect.top, left: rect.left + rect.width / 2 } })
  }, [])

  const clearSelection = useCallback(() => {
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  return { pending, captureSelection, clearSelection }
}
