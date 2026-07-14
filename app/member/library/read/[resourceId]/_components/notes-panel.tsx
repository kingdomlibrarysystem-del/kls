'use client'

import { useState } from 'react'
import { StickyNote, Trash2, Plus } from 'lucide-react'
import { useNotes, addNote, removeNote } from '@/app/member/_shared/use-notes'
import type { Highlight } from '@/app/member/_shared/highlight-data'

interface NotesPanelProps {
  resourceId: string
  chapterId: string
  /** When set, restricts this panel to notes attached to one specific highlight rather than the whole chapter — the "per-highlight" attachment mode. */
  highlight?: Highlight
  onClose?: () => void
}

/**
 * Free-text notes for a chapter, or (when `highlight` is passed) for one
 * specific highlighted passage within it — the two attachment shapes the
 * phase spec calls for. Mirrors the highlight color-picker's floating-
 * popover pattern when scoped to a highlight; renders inline under the
 * chapter body when general.
 */
export function NotesPanel({ resourceId, chapterId, highlight, onClose }: NotesPanelProps) {
  const [draft, setDraft] = useState('')
  const allNotes = useNotes()
  const notes = allNotes.filter((n) =>
    n.resourceId === resourceId && n.chapterId === chapterId && (highlight ? n.highlightId === highlight.id : !n.highlightId)
  )

  const handleAdd = () => {
    if (!draft.trim()) return
    addNote({ resourceId, chapterId, highlightId: highlight?.id, text: draft.trim() })
    setDraft('')
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <StickyNote size={13} color="var(--gold)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          {highlight ? `Note on "${highlight.text.slice(0, 40)}${highlight.text.length > 40 ? '…' : ''}"` : 'Chapter Notes'}
        </span>
        {onClose && (
          <button onClick={onClose} aria-label="Close notes" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>
            Close
          </button>
        )}
      </div>

      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {notes.map((note) => (
            <div key={note.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg-section)', borderRadius: 6, padding: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>{note.text}</p>
              <button onClick={() => removeNote(note.id)} aria-label="Delete note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-light)', flexShrink: 0 }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={highlight ? 'Add a note on this highlight…' : 'Add a note on this chapter…'}
          rows={2}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 12, resize: 'vertical', outline: 'none' }}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          aria-label="Add note"
          style={{ padding: '0 12px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', cursor: draft.trim() ? 'pointer' : 'not-allowed', opacity: draft.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center' }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
