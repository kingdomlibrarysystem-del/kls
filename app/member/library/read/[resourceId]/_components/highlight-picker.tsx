'use client'

import { Highlighter, X } from 'lucide-react'
import { highlightColorTokens, type HighlightColor } from '@/app/member/_shared/highlight-data'

interface HighlightPickerProps {
  /** Viewport position to anchor the popover — computed from the selection's bounding rect. */
  position: { top: number; left: number }
  onPick: (color: HighlightColor) => void
  onClose: () => void
}

/** Small floating color picker shown after a member selects text in the reader. */
export function HighlightPicker({ position, onPick, onClose }: HighlightPickerProps) {
  return (
    <div
      style={{
        position: 'fixed', top: position.top, left: position.left, transform: 'translate(-50%, -100%)',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 6,
        display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 70,
      }}
    >
      <Highlighter size={12} color="var(--text-muted)" style={{ marginRight: 2 }} />
      {(Object.keys(highlightColorTokens) as HighlightColor[]).map((color) => (
        <button
          key={color}
          onClick={() => onPick(color)}
          aria-label={`Highlight in ${highlightColorTokens[color].label}`}
          style={{
            width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
            background: highlightColorTokens[color].background, border: `2px solid ${highlightColorTokens[color].border}`,
          }}
        />
      ))}
      <button onClick={onClose} aria-label="Cancel highlight" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', marginLeft: 2 }}>
        <X size={14} />
      </button>
    </div>
  )
}
