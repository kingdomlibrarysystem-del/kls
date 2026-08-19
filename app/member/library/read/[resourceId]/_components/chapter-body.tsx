'use client'

import type { RefObject } from 'react'
import type { Highlight } from '@/app/member/_shared/highlight-data'
import { HighlightedParagraph } from './highlighted-paragraph'

interface ChapterBodyProps {
  body: string
  bodyRef: RefObject<HTMLDivElement | null>
  highlights: Highlight[]
  onMouseUp: () => void
  onHighlightClick: (highlight: Highlight) => void
}

/** Extracted from reader-view.tsx to keep it under the 200-line ceiling — splits a chapter's body into paragraphs with chapter-absolute offsets for highlight anchoring, then renders each as a HighlightedParagraph. */
export function ChapterBody({ body, bodyRef, highlights, onMouseUp, onHighlightClick }: ChapterBodyProps) {
  const paragraphs = body?.split('\n\n') ?? []
  let runningOffset = 0
  const paragraphsWithOffsets = paragraphs.map((text) => {
    const paragraphStart = runningOffset
    runningOffset += text.length + 2 // account for the '\n\n' joiner stripped by split()
    return { text, paragraphStart }
  })

  return (
    <div ref={bodyRef} onMouseUp={onMouseUp} style={{ display: 'flex', flexDirection: 'column', gap: 14, userSelect: 'text' }}>
      {paragraphsWithOffsets.map(({ text, paragraphStart }, i) => (
        <HighlightedParagraph key={i} text={text} paragraphStart={paragraphStart} highlights={highlights} onHighlightClick={onHighlightClick} />
      ))}
    </div>
  )
}
