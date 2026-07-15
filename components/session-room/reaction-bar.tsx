'use client'

import { sendSessionReaction } from './use-session-reactions'

interface ReactionBarProps {
  sessionId: string
  senderName: string
}

const QUICK_REACTIONS = ['👍', '🎉', '❤️', '😂', '👏', '🙌']

/** Quick-reaction buttons — sends a real, transient reaction into the shared room-scoped store, ambient over the video grid via ReactionBurst rather than posted as a chat message. */
export function ReactionBar({ sessionId, senderName }: ReactionBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '4px 0' }}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendSessionReaction(sessionId, senderName, emoji)}
          aria-label={`React with ${emoji}`}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
            background: 'var(--bg-card)', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
