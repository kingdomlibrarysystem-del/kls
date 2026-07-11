'use client'

import { useState } from 'react'
import { SmilePlus } from 'lucide-react'
import { toggleReaction } from './use-messages'
import type { Message } from './types'

const QUICK_REACTIONS = ['👍', '❤️', '🙏', '😂']

interface MessageBubbleProps {
  message: Message
  isYou: boolean
  personName: string
}

/** One message: sender/timestamp, body, and real toggleable emoji reactions. */
export function MessageBubble({ message, isYou, personName }: MessageBubbleProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleReact = (emoji: string) => {
    toggleReaction(message.id, emoji, personName)
    setPickerOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isYou ? 'flex-end' : 'flex-start', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{message.senderName}</span>
        <span>{new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div
        style={{
          maxWidth: '80%', padding: '7px 11px', borderRadius: 10, fontSize: 12,
          background: isYou ? 'var(--gold)' : 'var(--bg-section)',
          color: isYou ? '#fff' : 'var(--text-primary)',
        }}
      >
        {message.body}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
        {message.reactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => handleReact(r.emoji)}
            aria-pressed={r.reactedBy.includes(personName)}
            aria-label={`React with ${r.emoji}, ${r.reactedBy.length} reacted`}
            style={{
              display: 'flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 10, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${r.reactedBy.includes(personName) ? 'var(--gold)' : 'var(--border)'}`,
              background: r.reactedBy.includes(personName) ? 'rgba(212,168,67,0.15)' : 'var(--bg-card)',
            }}
          >
            {r.emoji} <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.reactedBy.length}</span>
          </button>
        ))}

        <button
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Add reaction"
          style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <SmilePlus size={11} />
        </button>

        {pickerOpen && (
          <div style={{ position: 'absolute', top: 22, left: 0, display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, zIndex: 10 }}>
            {QUICK_REACTIONS.map((emoji) => (
              <button key={emoji} onClick={() => handleReact(emoji)} aria-label={`React with ${emoji}`} style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
