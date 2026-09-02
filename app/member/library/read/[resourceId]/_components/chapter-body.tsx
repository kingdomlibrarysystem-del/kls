'use client'

import { MarkdownContent } from '@/components/ui/markdown-content'

interface ChapterBodyProps {
  body: string
}

/**
 * Renders a chapter's real markdown body through the same MarkdownContent
 * renderer E-Learning lessons use — headings/bold/quotes/lists now render
 * correctly instead of showing literal `##`/`>` characters as plain text.
 *
 * This replaced an earlier plain-text-with-paragraph-offsets renderer that
 * the click-to-highlight feature depended on (see HighlightedParagraph,
 * now unused) — MdPreview renders opaque HTML with no offset-mapping API,
 * so a text selection inside it can't be converted back to a chapter-
 * relative character offset the way the old renderer's `[data-paragraph-
 * start]` elements allowed. Highlighting/notes-on-a-passage is disabled
 * for the chapter body as a result (deliberate tradeoff, not an oversight
 * — see reader-view.tsx) until a markdown-aware highlighting approach
 * exists.
 */
export function ChapterBody({ body }: ChapterBodyProps) {
  return <MarkdownContent markdown={body ?? ''} />
}
