import type { Highlight } from '@/app/member/_shared/highlight-data'
import { highlightColorTokens } from '@/app/member/_shared/highlight-data'

interface HighlightedParagraphProps {
  /** This paragraph's text. */
  text: string
  /** This paragraph's starting offset within the full chapter body — highlight offsets are chapter-relative, not paragraph-relative. */
  paragraphStart: number
  highlights: Highlight[]
}

/**
 * Renders one paragraph, splicing in `<mark>`-styled spans for any
 * highlight whose [startOffset, endOffset) range overlaps this
 * paragraph. Highlight offsets are stored relative to the whole chapter
 * body string (see highlight-data.ts), so each paragraph re-derives its
 * own local slice points by subtracting `paragraphStart`.
 */
export function HighlightedParagraph({ text, paragraphStart, highlights }: HighlightedParagraphProps) {
  const paragraphEnd = paragraphStart + text.length
  const overlapping = highlights
    .filter((h) => h.startOffset < paragraphEnd && h.endOffset > paragraphStart)
    .map((h) => ({
      highlight: h,
      start: Math.max(0, h.startOffset - paragraphStart),
      end: Math.min(text.length, h.endOffset - paragraphStart),
    }))
    .sort((a, b) => a.start - b.start)

  if (overlapping.length === 0) {
    return <p data-paragraph-start={paragraphStart} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)' }}>{text}</p>
  }

  const segments: React.ReactNode[] = []
  let cursor = 0
  overlapping.forEach(({ highlight, start, end }, i) => {
    if (start > cursor) segments.push(<span key={`plain-${i}`}>{text.slice(cursor, start)}</span>)
    const tokens = highlightColorTokens[highlight.color]
    segments.push(
      <mark
        key={highlight.id}
        style={{ background: tokens.background, borderBottom: `2px solid ${tokens.border}`, color: 'inherit', borderRadius: 2 }}
        title={highlightColorTokens[highlight.color].label}
      >
        {text.slice(start, end)}
      </mark>
    )
    cursor = Math.max(cursor, end)
  })
  if (cursor < text.length) segments.push(<span key="plain-end">{text.slice(cursor)}</span>)

  return <p data-paragraph-start={paragraphStart} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)' }}>{segments}</p>
}
