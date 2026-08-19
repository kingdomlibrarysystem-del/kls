'use client'

import { AlignLeft, FileText, BookOpen } from 'lucide-react'
import type { PdfViewMode } from '@/app/member/_shared/use-pdf-view-mode'

const OPTIONS: { mode: PdfViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'scroll', label: 'Scroll', icon: <AlignLeft size={15} /> },
  { mode: 'single', label: 'Single Page', icon: <FileText size={15} /> },
  { mode: 'spread', label: 'Two-Page Spread', icon: <BookOpen size={15} /> },
]

interface PdfViewModeToggleProps {
  mode: PdfViewMode
  onChange: (mode: PdfViewMode) => void
}

/** Segmented control for switching between the PDF reader's 3 view modes. */
export function PdfViewModeToggle({ mode, onChange }: PdfViewModeToggleProps) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-section)', borderRadius: 8, padding: 3 }} role="radiogroup" aria-label="Reading view mode">
      {OPTIONS.map((opt) => (
        <button
          key={opt.mode}
          role="radio"
          aria-checked={mode === opt.mode}
          onClick={() => onChange(opt.mode)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, border: 'none',
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: mode === opt.mode ? 'var(--gold)' : 'transparent',
            color: mode === opt.mode ? '#1a1a2e' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  )
}
