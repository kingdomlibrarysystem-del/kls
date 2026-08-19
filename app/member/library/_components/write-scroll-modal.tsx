'use client'

import { useState } from 'react'
import { Feather } from 'lucide-react'

interface WriteScrollModalProps {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

const SCROLL_TYPES = ['Act', 'Epistle', 'Revelation'] as const

/**
 * Lets a member draft their own scroll (Act/Epistle/Revelation) — this is
 * personal reflective writing, distinct from the contributor-only
 * publishing submission flow. Fully mocked: submitting just confirms and
 * closes, since there is no "My Scrolls" list page yet to append to.
 */
export function WriteScrollModal({ open, onClose, onSubmitted }: WriteScrollModalProps) {
  const [type, setType] = useState<(typeof SCROLL_TYPES)[number]>('Act')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  if (!open) return null

  const canSubmit = title.trim().length > 0 && body.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    setTitle('')
    setBody('')
    setType('Act')
    onSubmitted()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Write Your Scroll" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 20, width: '100%', maxWidth: 440, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Feather size={20} color="var(--gold)" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', fontFamily: "'Cinzel',serif" }}>Write Your Scroll</h2>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {SCROLL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: type === t ? 'var(--gold)' : 'transparent', color: type === t ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your scroll a title..."
          aria-label="Scroll title"
          style={{ width: '100%', padding: '9px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 10, outline: 'none' }}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your story..."
          aria-label="Scroll content"
          rows={5}
          style={{ width: '100%', padding: '9px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 14, outline: 'none', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : 0.5 }}
          >
            Submit Scroll
          </button>
        </div>
      </div>
    </div>
  )
}
